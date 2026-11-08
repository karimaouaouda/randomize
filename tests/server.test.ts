import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Server } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { createAppServer } from "../server/index.ts";
import { readServerConfig } from "../server/config.ts";
import { DEFAULTS, validateSettings } from "../src/settings.ts";

async function listen(server: Server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test port");
  return `http://127.0.0.1:${address.port}`;
}
async function close(server: Server) {
  if (server.listening)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
}
const setup = {
  ...DEFAULTS,
  names: ["Wolves", "Falcons", "Ravens"],
  count: 2,
  guaranteed: ["Wolves"],
  logos: { Wolves: "data:image/png;base64,iVBORw0KGgo=" },
  title: "SQLITE DROP",
};
const body = (method: string, value: unknown) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(value),
});

test("legacy empty SQLite configurations are seeded with the event roster at startup", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "dropzone-empty-"));
  const path = join(directory, "app.sqlite");
  const db = new DatabaseSync(path);
  db.exec(
    "CREATE TABLE app_state (id INTEGER PRIMARY KEY, payload TEXT, revision INTEGER NOT NULL DEFAULT 0); INSERT INTO app_state VALUES (1, NULL, 0);",
  );
  db.close();
  const server = createAppServer(path);
  t.after(async () => {
    await close(server);
    await rm(directory, { recursive: true, force: true });
  });
  const url = await listen(server);
  const data = await (await fetch(`${url}/api/settings`)).json();
  assert.deepEqual(data.settings, DEFAULTS);
  assert.equal(data.settings.names.length, 31);
  assert.deepEqual(data.settings.logos, {});
});

test("explicitly allowed cross-origin frontends can preflight, load and save; other origins remain blocked", async (t) => {
  const origin = "https://draw.example.com";
  const server = createAppServer(
    ":memory:",
    undefined,
    readServerConfig({ ALLOWED_ORIGINS: origin }),
  );
  t.after(() => close(server));
  const url = await listen(server);
  const headers = { Origin: origin, "Sec-Fetch-Site": "cross-site" };
  const preflight = await fetch(`${url}/api/settings`, {
    method: "OPTIONS",
    headers: {
      ...headers,
      "Access-Control-Request-Method": "PUT",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
  const response = await fetch(`${url}/api/settings`, {
    ...body("PUT", { settings: setup, revision: 0 }),
    headers: { ...headers, "Content-Type": "application/json" },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  const loaded = await fetch(`${url}/api/settings`, { headers });
  assert.deepEqual((await loaded.json()).settings, setup);
  const denied = await fetch(`${url}/api/settings`, {
    headers: { Origin: "https://other.example.com" },
  });
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("SQLite retains names, images, guarantees, and settings across restarts, and resets safely", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "dropzone-db-"));
  const path = join(directory, "app.sqlite");
  let server = createAppServer(path);
  t.after(async () => {
    await close(server);
    await rm(directory, { recursive: true, force: true });
  });
  let url = await listen(server);
  assert.deepEqual(await (await fetch(`${url}/api/settings`)).json(), {
    settings: DEFAULTS,
    revision: 0,
  });
  let response = await fetch(
    `${url}/api/settings`,
    body("PUT", { settings: setup, revision: 0 }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).settings, setup);
  await close(server);
  server = createAppServer(path);
  url = await listen(server);
  assert.deepEqual(await (await fetch(`${url}/api/settings`)).json(), {
    settings: setup,
    revision: 1,
  });
  response = await fetch(
    `${url}/api/settings`,
    body("DELETE", { revision: 0 }),
  );
  assert.equal(response.status, 409);
  response = await fetch(
    `${url}/api/settings`,
    body("DELETE", { revision: 1 }),
  );
  assert.deepEqual(await response.json(), { settings: DEFAULTS, revision: 2 });
  assert.deepEqual(await (await fetch(`${url}/api/settings`)).json(), {
    settings: DEFAULTS,
    revision: 2,
  });
});

test("rejects bad inputs and cross-site requests without changing stored data", async (t) => {
  const server = createAppServer(":memory:");
  t.after(() => close(server));
  const url = await listen(server);
  for (const settings of [
    null,
    { ...setup, names: ["Wolves", "wolves"] },
    { ...setup, guaranteed: ["Missing"] },
    { ...setup, logos: { Wolves: "javascript:alert(1)" } },
    { ...setup, count: 1.5 },
  ]) {
    assert.equal(
      (
        await fetch(
          `${url}/api/settings`,
          body("PUT", { settings, revision: 0 }),
        )
      ).status,
      400,
    );
  }
  assert.equal(
    (await fetch(`${url}/api/settings`, body("PUT", { settings: setup })))
      .status,
    400,
  );
  assert.equal(
    (await fetch(`${url}/api/settings`, { method: "PUT", body: "{}" })).status,
    415,
  );
  assert.equal(
    (
      await fetch(`${url}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "{",
      })
    ).status,
    400,
  );
  for (const origin of ["https://evil.example", "null"]) {
    assert.equal(
      (
        await fetch(`${url}/api/settings`, {
          ...body("PUT", { settings: setup, revision: 0 }),
          headers: { "Content-Type": "application/json", Origin: origin },
        })
      ).status,
      403,
    );
  }
  assert.equal(
    (
      await fetch(`${url}/api/settings`, {
        headers: { "Sec-Fetch-Site": "cross-site" },
      })
    ).status,
    403,
  );
  assert.equal(
    (await fetch(`${url}/api/settings`, { method: "POST" })).status,
    405,
  );
  assert.equal((await fetch(`${url}/api/unknown`)).status, 404);
  assert.deepEqual(await (await fetch(`${url}/api/settings`)).json(), {
    settings: DEFAULTS,
    revision: 0,
  });
});

test("concurrent saves never silently overwrite a newer revision", async (t) => {
  const server = createAppServer(":memory:");
  t.after(() => close(server));
  const url = await listen(server);
  const responses = await Promise.all(
    ["FIRST", "SECOND"].map((title) =>
      fetch(
        `${url}/api/settings`,
        body("PUT", { settings: { ...setup, title }, revision: 0 }),
      ),
    ),
  );
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 409],
  );
  const saved = await (await fetch(`${url}/api/settings`)).json();
  assert.equal(saved.revision, 1);
  assert.ok(["FIRST", "SECOND"].includes(saved.settings.title));
});

test("enforces payload limits and serves built files without exposing files outside dist", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "dropzone-static-"));
  const dist = join(directory, "dist");
  await mkdir(dist);
  await writeFile(join(dist, "index.html"), "<title>DROPZONE TEST</title>");
  await writeFile(join(directory, "secret.txt"), "PRIVATE");
  const server = createAppServer(":memory:", dist);
  t.after(async () => {
    await close(server);
    await rm(directory, { recursive: true, force: true });
  });
  const url = await listen(server);
  assert.match(await (await fetch(url)).text(), /DROPZONE TEST/);
  assert.equal((await fetch(`${url}/..%2fsecret.txt`)).status, 403);
  const response = await fetch(`${url}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: Buffer.alloc(26 * 1024 * 1024 + 1, 32),
  });
  assert.equal(response.status, 413);
  assert.deepEqual(await (await fetch(`${url}/api/settings`)).json(), {
    settings: DEFAULTS,
    revision: 0,
  });
});

test("draft settings allow temporary zero counts, blank titles, and guarantees larger than the draw", () => {
  assert.equal(validateSettings({ ...setup, count: 0, title: "" }).count, 0);
  assert.equal(
    validateSettings({ ...setup, count: 1, guaranteed: setup.names }).guaranteed
      .length,
    3,
  );
});
