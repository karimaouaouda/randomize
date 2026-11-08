import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));

export function readServerConfig(env: NodeJS.ProcessEnv = process.env) {
  const port = Number(env.PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be a whole number from 1 to 65535.");
  const host = env.HOST?.trim() || "127.0.0.1";
  if (!/^[a-z0-9.:-]+$/i.test(host))
    throw new Error(
      "HOST must be a hostname or IP address, without a URL scheme or port.",
    );
  const allowedHosts = new Set(
    [
      "localhost",
      "127.0.0.1",
      "::1",
      host,
      ...(env.ALLOWED_HOSTS || "").split(","),
    ]
      .map((value) =>
        value
          .trim()
          .toLowerCase()
          .replace(/^\[|\]$/g, ""),
      )
      .filter(Boolean),
  );
  if ([...allowedHosts].some((value) => !/^[a-z0-9.:-]+$/i.test(value)))
    throw new Error(
      "ALLOWED_HOSTS must contain explicit hostnames or IP addresses, not URLs or wildcards.",
    );
  const allowedOrigins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  for (const origin of allowedOrigins) {
    let url;
    try {
      url = new URL(origin);
    } catch {
      throw new Error(
        "ALLOWED_ORIGINS must contain complete http:// or https:// origins.",
      );
    }
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== origin)
      throw new Error(
        "ALLOWED_ORIGINS must contain origins only, without paths, credentials or wildcards.",
      );
  }
  return {
    host,
    port,
    allowedHosts,
    allowedOrigins,
    databasePath:
      env.DATABASE_PATH === ":memory:"
        ? ":memory:"
        : resolve(projectRoot, env.DATABASE_PATH || "data/dropzone.sqlite"),
    distPath: resolve(projectRoot, env.DIST_PATH || "dist"),
  };
}
