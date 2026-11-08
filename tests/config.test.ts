import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { readServerConfig, projectRoot } from "../server/config.ts";
import { DEFAULTS, validateSettings } from "../src/settings.ts";
import { SAMPLE_NAMES } from "../src/draw.ts";

test("default setup has the exact 31-team event roster without uploaded images or guarantees", () => {
  assert.equal(SAMPLE_NAMES.length, 31);
  assert.equal(SAMPLE_NAMES[0], "ITZ  ESPORTS(ITZ) 🇲🇦");
  assert.equal(SAMPLE_NAMES[30], "DNA GIRLS");
  assert.ok(SAMPLE_NAMES.includes("MIDINGHT SPECTRE SQUAD (MSS) 2🇩🇿"));
  assert.ok(SAMPLE_NAMES.includes("Z1 ESPORTS  🇪🇬(z1)"));
  assert.deepEqual(validateSettings(DEFAULTS).names, SAMPLE_NAMES);
  assert.deepEqual(DEFAULTS.logos, {});
  assert.deepEqual(DEFAULTS.guaranteed, []);
});

test("server environment config supports custom listener, paths, hosts, and exact origins", () => {
  const config = readServerConfig({
    HOST: "0.0.0.0",
    PORT: "9000",
    DATABASE_PATH: "data/custom.sqlite",
    DIST_PATH: "build",
    ALLOWED_HOSTS: "api.example.com, localhost",
    ALLOWED_ORIGINS: "https://draw.example.com/,http://localhost:3000",
  });
  assert.equal(config.port, 9000);
  assert.equal(config.host, "0.0.0.0");
  assert.equal(config.databasePath, join(projectRoot, "data/custom.sqlite"));
  assert.equal(config.distPath, join(projectRoot, "build"));
  assert.ok(config.allowedHosts.has("api.example.com"));
  assert.deepEqual(config.allowedOrigins, [
    "https://draw.example.com",
    "http://localhost:3000",
  ]);
  assert.equal(readServerConfig({}).port, 8787);
});

test("invalid configuration fails clearly instead of silently selecting unsafe defaults", () => {
  for (const PORT of ["0", "65536", "abc", "1.5"])
    assert.throws(() => readServerConfig({ PORT }), /PORT/);
  for (const ALLOWED_ORIGINS of [
    "*",
    "null",
    "https://example.com/path",
    "https://user:pass@example.com",
    "file:///tmp",
  ])
    assert.throws(
      () => readServerConfig({ ALLOWED_ORIGINS }),
      /ALLOWED_ORIGINS/,
    );
  assert.throws(
    () => readServerConfig({ HOST: "http://localhost:8787" }),
    /HOST/,
  );
  assert.throws(
    () => readServerConfig({ ALLOWED_HOSTS: "*.example.com" }),
    /ALLOWED_HOSTS/,
  );
});
