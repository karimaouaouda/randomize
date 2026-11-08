import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { readServerConfig } from "./server/config.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const api = readServerConfig(env);
  const address =
    api.host === "0.0.0.0" ? "127.0.0.1" : api.host === "::" ? "::1" : api.host;
  const target =
    env.BACKEND_URL ||
    `http://${address.includes(":") ? `[${address}]` : address}:${api.port}`;
  for (const [key, value] of [
    ["BACKEND_URL", target],
    ["VITE_BACKEND_URL", env.VITE_BACKEND_URL],
  ]) {
    if (!value) continue;
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error(
        `${key} must be a complete http:// or https:// backend origin.`,
      );
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error(
        `${key} must be a backend origin without a path, credentials, query or fragment.`,
      );
  }
  const frontendPort = Number(env.FRONTEND_PORT || 5173);
  const previewPort = Number(env.PREVIEW_PORT || 4173);
  for (const [key, value] of [
    ["FRONTEND_PORT", frontendPort],
    ["PREVIEW_PORT", previewPort],
  ] as const) {
    if (!Number.isInteger(value) || value < 1 || value > 65535)
      throw new Error(`${key} must be a whole number from 1 to 65535.`);
  }
  if (
    env.VITE_DEFAULT_STORAGE_MODE &&
    !["local", "server"].includes(env.VITE_DEFAULT_STORAGE_MODE)
  )
    throw new Error("VITE_DEFAULT_STORAGE_MODE must be local or server.");
  const proxy = { "/api": { target, changeOrigin: false } };
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: env.FRONTEND_HOST || "127.0.0.1",
      port: frontendPort,
      proxy,
      allowedHosts: [...api.allowedHosts],
    },
    preview: {
      host: env.FRONTEND_HOST || "127.0.0.1",
      port: previewPort,
      proxy,
      allowedHosts: [...api.allowedHosts],
    },
  };
});
