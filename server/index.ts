import { createServer } from "node:http";
import type { IncomingMessage } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULTS, validateSettings } from "../src/settings.ts";
import { projectRoot, readServerConfig } from "./config.ts";

const MAX_BODY = 26 * 1024 * 1024;
class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function readBody(request: IncomingMessage): Promise<unknown> {
  if (!/^application\/json(?:;|$)/i.test(request.headers["content-type"] || ""))
    throw new HttpError(415, "Send application/json.");
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        chunks.length = 0;
        reject(new HttpError(413, "Settings exceed the 26 MB limit."));
      } else chunks.push(chunk);
    });
    request.on("end", () => {
      if (size > MAX_BODY) return;
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new HttpError(400, "Invalid JSON."));
      }
    });
    request.on("error", reject);
    request.on("aborted", () =>
      reject(new HttpError(400, "Request interrupted.")),
    );
  });
}

export function createAppServer(
  databasePath: string,
  distPath = resolve(projectRoot, "dist"),
  config = readServerConfig({}),
) {
  if (databasePath !== ":memory:")
    mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT, revision INTEGER NOT NULL DEFAULT 0);
    `);
  db.prepare(
    "INSERT OR IGNORE INTO app_state (id, payload, revision) VALUES (1, ?, 0)",
  ).run(JSON.stringify(DEFAULTS));
  db.prepare(
    "UPDATE app_state SET payload = ? WHERE id = 1 AND payload IS NULL",
  ).run(JSON.stringify(DEFAULTS));
  const read = db.prepare(
    "SELECT payload, revision FROM app_state WHERE id = 1",
  );
  const write = db.prepare(
    "UPDATE app_state SET payload = ?, revision = revision + 1 WHERE id = 1 AND revision = ?",
  );
  const mime: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
  };
  const server = createServer(async (request, response) => {
    const json = (status: number, body: unknown) => {
      response.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(JSON.stringify(body));
    };
    try {
      const url = new URL(request.url || "/", `http://${request.headers.host}`);
      const origin = request.headers.origin;
      const permittedOrigin =
        origin &&
        (origin === `http://${request.headers.host}` ||
          origin === `https://${request.headers.host}` ||
          config.allowedOrigins.includes(origin));
      if (
        !config.allowedHosts.has(
          url.hostname.toLowerCase().replace(/^\[|\]$/g, ""),
        ) ||
        (origin && !permittedOrigin) ||
        (!origin && request.headers["sec-fetch-site"] === "cross-site")
      )
        throw new HttpError(
          403,
          "Host or origin is not allowed. Check ALLOWED_HOSTS and ALLOWED_ORIGINS.",
        );
      if (permittedOrigin) {
        response.setHeader("Access-Control-Allow-Origin", origin);
        response.setHeader("Vary", "Origin");
      }
      if (url.pathname === "/api/settings") {
        if (request.method === "OPTIONS") {
          response.writeHead(204, {
            "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "600",
          });
          response.end();
          return;
        }
        if (request.method === "GET") {
          const row = read.get()!;
          json(200, {
            settings:
              row.payload === null ? null : JSON.parse(String(row.payload)),
            revision: Number(row.revision),
          });
        } else if (request.method === "PUT" || request.method === "DELETE") {
          const body = (await readBody(request)) as {
            settings?: unknown;
            revision?: unknown;
          } | null;
          if (
            !body ||
            !Number.isSafeInteger(body.revision) ||
            Number(body.revision) < 0
          )
            throw new HttpError(400, "A valid revision is required.");
          let settings;
          try {
            settings =
              request.method === "DELETE"
                ? DEFAULTS
                : validateSettings(body.settings);
          } catch (error) {
            throw new HttpError(400, (error as Error).message);
          }
          if (
            !write.run(JSON.stringify(settings), Number(body.revision)).changes
          )
            throw new HttpError(
              409,
              "The server setup changed in another window. Reload to load the latest version before editing again.",
            );
          json(200, { settings, revision: Number(body.revision) + 1 });
        } else {
          response.setHeader("Allow", "GET, PUT, DELETE");
          throw new HttpError(405, "Method not allowed.");
        }
        return;
      }
      if (url.pathname.startsWith("/api/"))
        throw new HttpError(404, "API route not found.");
      if (request.method !== "GET" && request.method !== "HEAD")
        throw new HttpError(405, "Method not allowed.");
      let path = resolve(distPath, "." + decodeURIComponent(url.pathname));
      const location = relative(distPath, path);
      if (location.startsWith("..") || isAbsolute(location))
        throw new HttpError(403, "Invalid path.");
      if (!extname(path)) path = resolve(distPath, "index.html");
      let content;
      try {
        content = await readFile(path);
      } catch {
        throw new HttpError(
          404,
          "File not found. Run npm run build to create the app.",
        );
      }
      response.writeHead(200, {
        "Content-Type": mime[extname(path)] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
      });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch (error) {
      if (!(error instanceof HttpError)) console.error(error);
      if (!response.headersSent)
        json(error instanceof HttpError ? error.status : 500, {
          error:
            error instanceof HttpError
              ? error.message
              : "Server storage failed. Your previous data is unchanged.",
        });
      else response.end();
    }
  });
  server.requestTimeout = 15000;
  server.on("close", () => db.close());
  return server;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const config = readServerConfig();
  const { port, host, databasePath, distPath } = config;
  const server = createAppServer(databasePath, distPath, config);
  server.on("error", (error) => {
    console.error("Could not start DROPZONE:", error.message);
    process.exitCode = 1;
  });
  server.listen(port, host, () =>
    console.log(
      `DROPZONE: http://${host.includes(":") ? `[${host}]` : host}:${port}\nSQLite: ${databasePath}`,
    ),
  );
  const shutdown = () => server.close();
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
