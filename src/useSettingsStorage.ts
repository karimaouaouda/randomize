import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DEFAULTS, readLocalSettings, validateSettings } from "./settings";
import type { Settings } from "./settings";

type Mode = "local" | "server";
const backendUrl = (import.meta.env.VITE_BACKEND_URL || "")
  .trim()
  .replace(/\/+$/, "");
async function requestSettings(method = "GET", body?: unknown) {
  let response: Response;
  try {
    response = await fetch(`${backendUrl}/api/settings`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error(
      "Cannot reach SQLite storage. Run npm run server (or npm run dev:full), then retry.",
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Storage API is unavailable. Run npm run server (or npm run dev:full), then retry.",
    );
  }
  if (!response.ok) throw new Error(data.error || "Server storage failed.");
  if (!Number.isSafeInteger(data.revision) || data.revision < 0)
    throw new Error("Invalid storage server response.");
  return {
    settings: data.settings === null ? null : validateSettings(data.settings),
    revision: data.revision as number,
  };
}

export function useSettingsStorage() {
  const [mode, setMode] = useState<Mode>(() => {
    try {
      return (localStorage.getItem("dropzone-storage-mode") ||
        import.meta.env.VITE_DEFAULT_STORAGE_MODE) === "server"
        ? "server"
        : "local";
    } catch {
      return "local";
    }
  });
  const [settings, setSettings] = useState(readLocalSettings);
  const [loading, setLoading] = useState(mode === "server");
  const [ready, setReady] = useState(mode === "local");
  const [error, setError] = useState("");
  const [status, setStatus] = useState(
    mode === "server" ? "Connecting to SQLite…" : "Saved in this browser",
  );
  const revision = useRef(0);
  const current = useRef(settings);
  const currentMode = useRef(mode);
  const lastSaved = useRef<Settings | null>(null);
  const queue = useRef(Promise.resolve());
  const initialMode = useRef(mode);
  useLayoutEffect(() => {
    current.current = settings;
    currentMode.current = mode;
  }, [settings, mode]);

  function saveServer(snapshot: Settings) {
    setStatus("Saving to SQLite…");
    const operation = queue.current.then(async () => {
      const result = await requestSettings("PUT", {
        settings: snapshot,
        revision: revision.current,
      });
      revision.current = result.revision;
      if (currentMode.current === "server" && current.current === snapshot) {
        lastSaved.current = snapshot;
        setError("");
        setStatus("Saved to SQLite");
      }
    });
    queue.current = operation.catch((error) => {
      if (currentMode.current === "server") {
        setError((error as Error).message);
        setStatus("Not saved — retry required");
      }
    });
    return operation;
  }

  async function connectServer(isCancelled = () => false) {
    await queue.current;
    const result = await requestSettings();
    if (isCancelled()) return;
    let snapshot = result.settings;
    let nextRevision = result.revision;
    if (!snapshot) {
      snapshot = DEFAULTS;
      const initialized = await requestSettings("PUT", {
        settings: snapshot,
        revision: nextRevision,
      });
      nextRevision = initialized.revision;
    }
    if (isCancelled()) return;
    revision.current = nextRevision;
    lastSaved.current = snapshot;
    setSettings(snapshot);
    setReady(true);
    setError("");
    setStatus("Saved to SQLite");
  }

  useEffect(() => {
    if (initialMode.current !== "server") return;
    let cancelled = false;
    void connectServer(() => cancelled)
      .catch((error) => {
        if (!cancelled) {
          setError((error as Error).message);
          setStatus("Server unavailable");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Only load at startup; switching is handled explicitly below to avoid overwriting edits.
  }, []);

  useEffect(() => {
    if (loading || !ready) return;
    if (mode === "local") {
      try {
        localStorage.setItem("dropzone-settings", JSON.stringify(settings));
      } catch {
        // oxlint-disable-next-line react/set-state-in-effect -- Surface a browser storage failure.
        setError(
          "Browser storage is unavailable or full. Your current setup is only in memory.",
        );
      }
      return;
    }
    if (settings === lastSaved.current) return;
    const timer = setTimeout(() => {
      void saveServer(settings).catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, [settings, mode, loading, ready]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (
        currentMode.current === "server" &&
        ready &&
        current.current !== lastSaved.current
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [ready]);

  async function changeMode(next: Mode) {
    if (loading || next === mode) return;
    setLoading(true);
    setError("");
    try {
      if (next === "server") await connectServer();
      else {
        localStorage.setItem(
          "dropzone-settings",
          JSON.stringify(current.current),
        );
        setReady(true);
        setStatus("Saved in this browser");
      }
      try {
        localStorage.setItem("dropzone-storage-mode", next);
      } catch {
        setError(
          "Storage mode works for this session, but the browser could not remember your preference.",
        );
      }
      setMode(next);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function retry() {
    if (loading) return;
    setLoading(true);
    try {
      if (mode === "server") {
        if (ready) await saveServer(current.current);
        else await connectServer();
      } else {
        localStorage.setItem(
          "dropzone-settings",
          JSON.stringify(current.current),
        );
        setError("");
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    if (loading) return;
    setLoading(true);
    try {
      if (mode === "server") {
        if (!ready)
          throw new Error("Connect to the server before resetting its data.");
        await queue.current;
        const result = await requestSettings("DELETE", {
          revision: revision.current,
        });
        revision.current = result.revision;
        lastSaved.current = current.current;
      } else {
        localStorage.removeItem("dropzone-settings");
        localStorage.removeItem("dropzone-storage-mode");
      }
      window.location.reload();
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
    }
  }

  return {
    settings,
    setSettings,
    mode,
    loading,
    ready,
    error,
    status,
    changeMode,
    retry,
    reset,
  };
}
