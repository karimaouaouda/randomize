import { useEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import { drawNames, parseNames, SAMPLE_NAMES } from "./draw";
import { prepareLogo, sanitizeLogos } from "./logos";
import { DEFAULTS } from "./settings";
import { useSettingsStorage } from "./useSettingsStorage";

function TeamLogo({ src, name }: { src?: string; name: string }) {
  return (
    <img
      className="team-logo"
      src={typeof src === "string" ? src : "/default-team.svg"}
      alt={`${name} logo`}
      aria-hidden="true"
      onError={(event) => {
        if (event.currentTarget.getAttribute("src") !== "/default-team.svg")
          event.currentTarget.src = "/default-team.svg";
      }}
    />
  );
}

type IconName =
  | "target"
  | "users"
  | "history"
  | "settings"
  | "arrow"
  | "plus"
  | "minus"
  | "close"
  | "check"
  | "search"
  | "edit"
  | "volume"
  | "muted"
  | "expand"
  | "copy"
  | "download"
  | "shuffle"
  | "chevron"
  | "parachute"
  | "trophy"
  | "reset";
function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    target: (
      <>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        <circle cx="9" cy="7" r="4" />
      </>
    ),
    history: <path d="M3 11a9 9 0 1 1 2.6 7M3 4v7h7m2-4v5l3 2" />,
    settings: (
      <>
        <path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 2-3-2-2 1-3-3-2-1-3Z" />
        <circle cx="10.5" cy="11.5" r="3" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    edit: <path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z" />,
    volume: (
      <path d="m11 4-6 5H2v6h3l6 5Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
    ),
    muted: <path d="m11 4-6 5H2v6h3l6 5Zm5 5 6 6m0-6-6 6" />,
    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V3H3v13h5" />
      </>
    ),
    download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
    shuffle: (
      <path d="m17 3 4 4-4 4m0 2 4 4-4 4M3 7h3c5 0 7 10 12 10h3M3 17h3c2 0 3-2 5-5m3-4c1-1 2-1 4-1h3" />
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
    parachute: (
      <>
        <path d="M3 11a9 9 0 0 1 18 0H3Zm0 0 8 9h2l8-9M12 2c-4 3-4 6-4 9m4-9c4 3 4 6 4 9m-8 0 3 9m5-9-3 9" />
        <path d="M10 20v2h4v-2" />
      </>
    ),
    trophy: (
      <path d="M8 3h8v7a4 4 0 0 1-8 0Zm0 2H3v3a4 4 0 0 0 5 4m8-7h5v3a4 4 0 0 1-5 4m-4 2v5m-5 2h10" />
    ),
    reset: <path d="M3 10a9 9 0 1 1 2 8M3 3v7h7" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

type DrawRecord = {
  id: string;
  time: string;
  title: string;
  winners: string[];
};

function Dialog({
  title,
  eyebrow,
  children,
  onClose,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      className="dialog"
      aria-labelledby="dialog-title"
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 id="dialog-title">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="icon-button"
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function App() {
  const storage = useSettingsStorage();
  const { settings, setSettings } = storage;
  const storageBlocked = storage.loading || !storage.ready;
  const [excluded, setExcluded] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"roster" | "settings" | null>(null);
  const [rosterDraft, setRosterDraft] = useState("");
  const [formError, setFormError] = useState("");
  const [phase, setPhase] = useState<"ready" | "drawing" | "complete">("ready");
  const [winners, setWinners] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [rolling, setRolling] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<DrawRecord[]>([]);
  const [tab, setTab] = useState<"arena" | "history">("arena");
  const [sound, setSound] = useState(false);
  const [broadcast, setBroadcast] = useState(false);
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const activeNames = settings.names.filter((name) => !excluded.includes(name));
  const busy = phase === "drawing";
  const count = settings.count;
  const drawError =
    activeNames.length === 0
      ? "Add at least one active player to begin."
      : !Number.isInteger(count) || count < 1 || count > activeNames.length
        ? `Choose between 1 and ${activeNames.length} players.`
        : settings.guaranteed.length > count
          ? "Increase the draw size to fit your setup selections."
          : "";

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      void audio.current?.close();
    },
    [],
  );
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setBroadcast(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function tone(frequency: number, duration = 0.08) {
    if (!sound) return;
    try {
      if (!audio.current) audio.current = new AudioContext();
      void audio.current.resume();
      const ctx = audio.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.045, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      /* Audio is optional when the browser blocks playback. */
    }
  }

  function beginDraw() {
    if (busy || storageBlocked || drawError) return;
    let result: string[];
    try {
      result = drawNames(activeNames, count, settings.guaranteed);
    } catch (error) {
      setToast((error as Error).message);
      return;
    }
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const spinDuration = reduced ? 500 : settings.cinematic ? 4500 : 1800;
    const revealDuration = reduced ? 500 : 2200;
    const start = performance.now();
    let lastRevealed = 0;
    let tick = 0;
    setWinners(result);
    setRevealed(0);
    setProgress(0);
    setPhase("drawing");
    setTab("arena");
    setRolling(
      Array.from(
        { length: count },
        (_, i) => activeNames[i % activeNames.length],
      ),
    );
    tone(220, 0.2);
    timer.current = setInterval(() => {
      const elapsed = performance.now() - start;
      tick++;
      setProgress(
        Math.min(100, (elapsed / (spinDuration + revealDuration)) * 100),
      );
      const currentRevealed =
        elapsed < spinDuration
          ? 0
          : Math.min(
              count,
              Math.floor((elapsed - spinDuration) / (revealDuration / count)) +
                1,
            );
      if (!reduced)
        setRolling(
          Array.from(
            { length: count },
            () => activeNames[Math.floor(Math.random() * activeNames.length)],
          ),
        );
      if (currentRevealed > lastRevealed) {
        lastRevealed = currentRevealed;
        setRevealed(currentRevealed);
        tone(440 + currentRevealed * 35, 0.2);
      } else if (tick % 3 === 0 && elapsed < spinDuration)
        tone(110 + Math.random() * 80, 0.035);
      if (elapsed >= spinDuration + revealDuration) {
        clearInterval(timer.current!);
        timer.current = null;
        setRevealed(count);
        setProgress(100);
        setPhase("complete");
        tone(660, 0.5);
        setHistory((previous) =>
          [
            {
              id: crypto.randomUUID(),
              time: new Date().toISOString(),
              title: settings.title,
              winners: result,
            },
            ...previous,
          ].slice(0, 20),
        );
      }
    }, 85);
  }

  function resetStage() {
    if (busy) return;
    setPhase("ready");
    setWinners([]);
    setRevealed(0);
    setProgress(0);
  }
  function changeCount(value: number) {
    setSettings((previous) => ({ ...previous, count: value }));
    resetStage();
  }
  function togglePlayer(name: string) {
    setExcluded((previous) =>
      previous.includes(name)
        ? previous.filter((item) => item !== name)
        : [...previous, name],
    );
    setSettings((previous) => ({
      ...previous,
      guaranteed: previous.guaranteed.filter((item) => item !== name),
    }));
    resetStage();
  }
  function saveRoster() {
    const names = parseNames(rosterDraft);
    if (!names.length) {
      setFormError("Enter at least one player name.");
      return;
    }
    if (names.length > 500 || names.some((name) => name.length > 64)) {
      setFormError(
        "Use up to 500 names, with a maximum of 64 characters per name.",
      );
      return;
    }
    setSettings((previous) => ({
      ...previous,
      names,
      logos: sanitizeLogos(previous.logos, names),
      count: Math.min(Math.max(1, previous.count), names.length),
      guaranteed: previous.guaranteed.filter((name) => names.includes(name)),
    }));
    setExcluded([]);
    setSearch("");
    resetStage();
    setModal(null);
    setToast(`${names.length} players deployed to your roster.`);
  }
  async function uploadLogo(name: string, file: File) {
    try {
      const logo = await prepareLogo(file);
      setSettings((previous) =>
        previous.names.includes(name)
          ? {
              ...previous,
              logos: { ...previous.logos, [name]: logo },
            }
          : previous,
      );
      setFormError("");
    } catch (error) {
      setFormError((error as Error).message);
    }
  }
  function exportResults(record = { title: settings.title, winners }) {
    const blob = new Blob(
      [
        `${record.title}\n${record.winners.map((name, i) => `${i + 1}. ${name}`).join("\n")}`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dropzone-results.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copyResults() {
    try {
      await navigator.clipboard.writeText(
        `${settings.title}\n${winners.map((name, i) => `${i + 1}. ${name}`).join("\n")}`,
      );
      setToast("Winners copied. Ready for your squad chat.");
    } catch {
      setToast(
        "Clipboard unavailable. Use Download results to save the winners.",
      );
    }
  }

  const visibleNames = settings.names.filter((name) =>
    name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  const cardCount =
    busy || phase === "complete"
      ? winners.length
      : Math.min(Math.max(Math.floor(count) || 1, 1), activeNames.length || 1);
  return (
    <div className={`app-shell ${broadcast ? "broadcast" : ""}`}>
      <header className="site-header">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setTab("arena");
          }}
          aria-label="Dropzone home"
        >
          <span className="brand-mark">
            <Icon name="parachute" size={27} />
          </span>
          <span>
            DROP<span className="text-orange">ZONE</span>
            <small>BUILT FOR THE BATTLEGROUNDS</small>
          </span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <button
            className={tab === "arena" ? "active" : ""}
            onClick={() => setTab("arena")}
          >
            <Icon name="target" size={17} />
            Draw arena
          </button>
          <button
            className={tab === "history" ? "active" : ""}
            onClick={() => setTab("history")}
          >
            <Icon name="history" size={17} />
            Draw history
            {history.length > 0 && (
              <span className="nav-count">{history.length}</span>
            )}
          </button>
        </nav>
        <div className="header-actions">
          <span className="system-status">
            <i />
            SYSTEM ONLINE
          </span>
          <span className="header-divider" />
          <button
            disabled={busy}
            className="icon-button"
            onClick={() => {
              setFormError("");
              setModal("settings");
            }}
            aria-label="Open operator setup"
            title="Operator setup"
          >
            <Icon name="settings" />
          </button>
        </div>
      </header>
      <main className="main-wrap">
        {(storage.error || storage.loading) && (
          <div className="draw-error" role={storage.error ? "alert" : "status"}>
            {storage.error || "Connecting to SQLite storage…"}{" "}
            {storage.error &&
              "Open operator settings to retry or change storage."}
          </div>
        )}
        <div className="page-intro">
          <div>
            <span className="eyebrow">THE LOBBY IS YOURS.</span>
            <h1>
              PLAYER DRAW <span>ARENA</span>
              <span className="heading-dot">.</span>
            </h1>
            <p>Your players. Their moment. Let the next drop decide.</p>
          </div>
          <button
            className="outline-button stage-view-button"
            onClick={() => {
              setTab("arena");
              setBroadcast((value) => !value);
            }}
          >
            <Icon name="expand" size={16} />
            {broadcast ? "Exit stage view" : "Stage view"}
            <span className="keycap">↗</span>
          </button>
        </div>
        {tab === "arena" ? (
          <div className="arena-layout">
            <aside className="roster-panel panel">
              <div className="panel-title">
                <div className="flex items-center gap-2.5">
                  <Icon name="users" size={18} />
                  <h2>THE ROSTER</h2>
                </div>
                <span className="small-count">
                  {String(settings.names.length).padStart(2, "0")}
                </span>
              </div>
              <div className="roster-tools">
                <p>Every legend starts in the lobby.</p>
                <button
                  disabled={busy || storageBlocked}
                  className="outline-button w-full justify-center"
                  onClick={() => {
                    setRosterDraft(settings.names.join("\n"));
                    setFormError("");
                    setModal("roster");
                  }}
                >
                  <Icon name="plus" size={17} />
                  Add / import players
                  <Icon name="edit" size={14} />
                </button>
                <label className="search-box">
                  <Icon name="search" size={16} />
                  <input
                    aria-label="Search players"
                    placeholder="Search players..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <span className="text-[10px]">⌕</span>
                </label>
              </div>
              <div className="roster-list">
                {visibleNames.map((name) => (
                  <label
                    className={`player-row ${excluded.includes(name) ? "excluded" : ""}`}
                    key={name}
                  >
                    <span
                      className={`avatar avatar-${settings.names.indexOf(name) % 5}`}
                    >
                      <TeamLogo src={settings.logos[name]} name={name} />
                    </span>
                    <span className="player-name">{name}</span>
                    <input
                      aria-label={`Include ${name}`}
                      type="checkbox"
                      checked={!excluded.includes(name)}
                      disabled={busy || storageBlocked}
                      onChange={() => togglePlayer(name)}
                    />
                    <span className="custom-check">
                      <Icon name="check" size={11} />
                    </span>
                  </label>
                ))}
                {visibleNames.length === 0 && (
                  <p className="empty-search">
                    No players found. Try another name.
                  </p>
                )}
              </div>
              <div className="roster-footer">
                <span>
                  <i className="status-dot" />
                  {activeNames.length} players ready to drop
                </span>
                <span className="mono">
                  {String(activeNames.length).padStart(2, "0")} /{" "}
                  {String(settings.names.length).padStart(2, "0")}
                </span>
              </div>
            </aside>
            <div className="arena-main">
              <section className="hero-banner" aria-label="PUBG community draw">
                <div className="hero-grain" />
                <div className="hero-content">
                  <span className="hero-label">
                    <span />
                    THE BATTLEGROUNDS ARE CALLING
                  </span>
                  <h2>
                    LUCK FAVORS
                    <br />
                    THE <span>BOLD.</span>
                  </h2>
                  <p>
                    Lock in the roster. Build the suspense.
                    <br />
                    Give your next squad a legendary entrance.
                  </p>
                </div>
                <div className="pubg-badge">
                  PUBG<span>BATTLEGROUNDS</span>
                </div>
                <div className="hero-coordinates">
                  35° 41′ 22.8″ N &nbsp; 51° 23′ 17.4″ E
                </div>
                <div className="hero-bottom">
                  <span>EST. FOR THE COMMUNITY</span>
                  <span>
                    DROP IN. STAND OUT. <Icon name="arrow" size={14} />
                  </span>
                </div>
              </section>
              <section
                className={`draw-panel panel ${busy ? "is-drawing" : ""}`}
              >
                <div className="draw-panel-heading">
                  <div>
                    <span className="eyebrow">{settings.title}</span>
                    <h2>
                      {phase === "complete"
                        ? "THE CHOSEN ONES"
                        : busy
                          ? "FINDING YOUR LEGENDS"
                          : "READY FOR THE DROP?"}
                    </h2>
                  </div>
                  <span className={`live-badge ${busy ? "running" : ""}`}>
                    <i />
                    {busy
                      ? "DRAW IN PROGRESS"
                      : phase === "complete"
                        ? "DRAW COMPLETE"
                        : "AWAITING DEPLOYMENT"}
                  </span>
                </div>
                <div className="draw-settings">
                  <div className="flex items-center gap-3">
                    <span className="setting-label">PLAYERS TO DRAW</span>
                    <div className="number-stepper">
                      <button
                        disabled={busy || storageBlocked || count <= 1}
                        onClick={() => changeCount(count - 1)}
                        aria-label="Draw fewer players"
                      >
                        <Icon name="minus" size={14} />
                      </button>
                      <input
                        aria-label="Number of players to draw"
                        type="number"
                        min="1"
                        max={activeNames.length}
                        value={count || ""}
                        disabled={busy || storageBlocked}
                        onChange={(event) =>
                          changeCount(Number(event.target.value))
                        }
                      />
                      <button
                        disabled={
                          busy || storageBlocked || count >= activeNames.length
                        }
                        onClick={() => changeCount(count + 1)}
                        aria-label="Draw more players"
                      >
                        <Icon name="plus" size={14} />
                      </button>
                    </div>
                    <span className="from-pool">
                      from {activeNames.length} players
                    </span>
                  </div>
                  <div className="stage-options">
                    <button
                      className="icon-button"
                      onClick={() => setSound((value) => !value)}
                      disabled={busy || storageBlocked}
                      aria-label={
                        sound ? "Mute draw sounds" : "Enable draw sounds"
                      }
                      title={sound ? "Sound on" : "Sound off"}
                    >
                      <Icon name={sound ? "volume" : "muted"} size={17} />
                    </button>
                    <span />
                    <button
                      className="icon-button"
                      disabled={busy || storageBlocked}
                      onClick={() => {
                        setFormError("");
                        setModal("settings");
                      }}
                      aria-label="Draw settings"
                      title="Draw settings"
                    >
                      <Icon name="settings" size={18} />
                    </button>
                  </div>
                </div>
                <div
                  className={`draw-stage ${cardCount > 8 ? "compact-stage" : ""}`}
                >
                  <div className="stage-grid" />
                  <div
                    className="winner-grid"
                    style={
                      { "--columns": Math.min(cardCount, 4) } as CSSProperties
                    }
                  >
                    {Array.from({ length: cardCount }, (_, index) => {
                      const isRevealed =
                        (busy || phase === "complete") && index < revealed;
                      return (
                        <div
                          key={index}
                          className={`winner-card ${busy && !isRevealed ? "shuffling" : ""} ${isRevealed ? "revealed" : ""}`}
                        >
                          <span className="card-corner top-left" />
                          <span className="card-corner top-right" />
                          <span className="card-corner bottom-left" />
                          <span className="card-corner bottom-right" />
                          <div className="slot-top">
                            <span>DROP SLOT</span>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                          </div>
                          <div className="slot-symbol">
                            {isRevealed || busy ? (
                              <TeamLogo
                                src={
                                  settings.logos[
                                    isRevealed ? winners[index] : rolling[index]
                                  ]
                                }
                                name={
                                  (isRevealed
                                    ? winners[index]
                                    : rolling[index]) || "Team"
                                }
                              />
                            ) : (
                              <Icon name="parachute" size={37} />
                            )}
                          </div>
                          <div className="slot-name">
                            {isRevealed ? (
                              winners[index]
                            ) : busy ? (
                              rolling[index]
                            ) : (
                              <span className="slot-placeholder">UNKNOWN</span>
                            )}
                          </div>
                          <span className="slot-subtitle">
                            {isRevealed
                              ? "READY TO MAKE HISTORY"
                              : busy
                                ? "SCANNING THE LOBBY"
                                : "WAITING FOR A LEGEND"}
                          </span>
                          <div className="slot-bottom">
                            <span>
                              {isRevealed
                                ? "LOCKED IN"
                                : busy
                                  ? "SELECTING"
                                  : "STANDBY"}
                            </span>
                            {isRevealed ? (
                              <Icon name="check" size={12} />
                            ) : (
                              <span className="slot-bars">▰ ▰ ▰</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="stage-caption">
                    <span className={busy ? "pulse" : ""} />
                    <span>
                      {busy
                        ? "HOLD YOUR BREATH. LEGENDS ARE LOADING."
                        : phase === "complete"
                          ? "SQUAD ASSEMBLED. SEE YOU ON THE BATTLEGROUNDS."
                          : "THE NEXT NAME COULD BE YOURS."}
                    </span>
                    <span />
                  </div>
                  {busy && (
                    <div
                      className="draw-progress"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </div>
                <div aria-live="polite" className="sr-only">
                  {busy
                    ? "Drawing players. Please wait."
                    : phase === "complete"
                      ? `Draw complete. Selected players: ${winners.join(", ")}`
                      : "Ready to draw."}
                </div>
                {drawError && (
                  <p className="draw-error" role="alert">
                    {drawError}
                  </p>
                )}
                <div className="draw-controls">
                  <div className="draw-meta">
                    <span className="small-target">
                      <Icon name="target" size={20} />
                    </span>
                    <div>
                      <strong>
                        {busy
                          ? "THE DROP IS IN MOTION"
                          : phase === "complete"
                            ? "WINNER WINNER."
                            : "ONE DRAW. ENDLESS POSSIBILITIES."}
                      </strong>
                      <span>
                        {busy
                          ? "Stay tuned for your squad reveal."
                          : phase === "complete"
                            ? `${winners.length} legends. One unforgettable squad.`
                            : "Unique picks. No duplicate players."}
                      </span>
                    </div>
                  </div>
                  <button
                    className="draw-button"
                    onClick={beginDraw}
                    disabled={busy || storageBlocked || !!drawError}
                  >
                    <Icon
                      name={busy ? "shuffle" : "parachute"}
                      size={21}
                      className={busy ? "spin" : ""}
                    />
                    {busy
                      ? "DROPPING IN..."
                      : phase === "complete"
                        ? "DRAW AGAIN"
                        : "INITIATE DRAW"}
                    <Icon name="arrow" size={19} />
                  </button>
                </div>
                {phase === "complete" && (
                  <div className="results-toolbar">
                    <button onClick={copyResults}>
                      <Icon name="copy" size={14} />
                      Copy winners
                    </button>
                    <button onClick={() => exportResults()}>
                      <Icon name="download" size={14} />
                      Download results
                    </button>
                    <button onClick={resetStage}>
                      <Icon name="reset" size={14} />
                      Reset stage
                    </button>
                  </div>
                )}
              </section>
              <div className="how-it-works">
                <div>
                  <span className="step-number">01</span>
                  <span>
                    <strong>BUILD THE LOBBY</strong>
                    <small>Add your players to the roster.</small>
                  </span>
                </div>
                <Icon name="chevron" size={14} />
                <div>
                  <span className="step-number">02</span>
                  <span>
                    <strong>SET THE DROP</strong>
                    <small>Choose how many make the cut.</small>
                  </span>
                </div>
                <Icon name="chevron" size={14} />
                <div>
                  <span className="step-number">03</span>
                  <span>
                    <strong>LET IT PLAY OUT</strong>
                    <small>Hit draw. Let the suspense build.</small>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <section className="history-panel panel">
            <div className="panel-title">
              <div className="flex items-center gap-3">
                <Icon name="history" />
                <h2>THE DROP LOG</h2>
              </div>
              <span className="eyebrow">
                THIS SESSION · {history.length} DRAWS
              </span>
            </div>
            {history.length === 0 ? (
              <div className="history-empty">
                <Icon name="parachute" size={55} />
                <h2>EVERY LEGEND HAS A FIRST DROP.</h2>
                <p>
                  Your completed draws will appear here. The log resets when you
                  refresh.
                </p>
                <button className="draw-button" onClick={() => setTab("arena")}>
                  ENTER THE ARENA
                  <Icon name="arrow" size={17} />
                </button>
              </div>
            ) : (
              <div className="history-list">
                {history.map((record, index) => (
                  <article className="history-item" key={record.id}>
                    <span className="history-number">
                      #{String(history.length - index).padStart(2, "0")}
                    </span>
                    <div className="history-content">
                      <span className="eyebrow">{record.title}</span>
                      <h3>{record.winners.length} LEGENDS DEPLOYED</h3>
                      <div className="history-winners">
                        {record.winners.map((name, i) => (
                          <span key={name}>
                            <small>{String(i + 1).padStart(2, "0")}</small>
                            <TeamLogo src={settings.logos[name]} name={name} />
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="history-actions">
                      <time dateTime={record.time}>
                        {new Date(record.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      <button
                        className="icon-button"
                        aria-label={`Download draw ${history.length - index}`}
                        onClick={() => exportResults(record)}
                      >
                        <Icon name="download" size={18} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        <footer className="site-footer">
          <span>
            <span className="footer-brand">DZ</span>MADE FOR THE MOMENTS BEFORE
            THE MATCH.
          </span>
          <span>
            COMMUNITY TOOL <i /> NOT AFFILIATED WITH KRAFTON{" "}
            <span className="version">V.1.0</span>
          </span>
        </footer>
      </main>
      {broadcast && (
        <button
          className="exit-broadcast outline-button"
          onClick={() => setBroadcast(false)}
        >
          <Icon name="expand" size={16} />
          Exit stage view <kbd>ESC</kbd>
        </button>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="target" size={18} />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
      {modal === "roster" && (
        <Dialog
          title="BUILD YOUR LOBBY"
          eyebrow="ROSTER MANAGEMENT"
          onClose={() => setModal(null)}
        >
          <p className="dialog-description">
            Paste your player names below. One per line, or separated by commas.
            We’ll take care of duplicates.
          </p>
          <label className="field-label" htmlFor="roster-input">
            PLAYER NAMES
            <span>{parseNames(rosterDraft).length} players detected</span>
          </label>
          <textarea
            id="roster-input"
            className="roster-textarea"
            value={rosterDraft}
            onChange={(event) => {
              setRosterDraft(event.target.value);
              setFormError("");
            }}
            placeholder={"GHOST\nNOVA\nVEXE"}
            spellCheck={false}
            maxLength={33000}
          />
          <div className="dialog-help">
            <span>Up to 500 players · 64 characters per name</span>
            <button
              className="text-button"
              onClick={() => setRosterDraft(SAMPLE_NAMES.join("\n"))}
            >
              Use demo roster
            </button>
          </div>
          <section className="logo-editor" aria-label="Team logos">
            <h3>TEAM LOGOS</h3>
            <p>
              Upload a logo for each saved name. PNG, JPG or WebP, up to 5 MB.
              Teams without a logo use the default badge. Logo changes save
              immediately.
            </p>
            <div className="logo-editor-list">
              {settings.names.map((name) => (
                <div className="logo-editor-row" key={name}>
                  <TeamLogo src={settings.logos[name]} name={name} />
                  <span className="logo-team-name">{name}</span>
                  <label className="outline-button logo-upload">
                    {Object.hasOwn(settings.logos, name) ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      aria-label={`Upload logo for ${name}`}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadLogo(name, file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {Object.hasOwn(settings.logos, name) && (
                    <button
                      className="icon-button"
                      aria-label={`Remove logo for ${name}`}
                      onClick={() =>
                        setSettings((previous) => ({
                          ...previous,
                          logos: Object.fromEntries(
                            Object.entries(previous.logos).filter(
                              ([key]) => key !== name,
                            ),
                          ),
                        }))
                      }
                    >
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="logo-editor-hint">
              Adding new teams? Save your roster first, then reopen this panel
              to upload their logos.
            </p>
          </section>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}
          <div className="dialog-footer">
            <button className="outline-button" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button className="draw-button" onClick={saveRoster}>
              SAVE ROSTER
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </Dialog>
      )}
      {modal === "settings" && (
        <Dialog
          title="SET UP YOUR DROP"
          eyebrow="OPERATOR CONTROLS"
          onClose={() => setModal(null)}
        >
          <section className="settings-section">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3>SQLITE SERVER STORAGE</h3>
                <p>
                  Use the server instead of this browser to save names, logos,
                  guaranteed picks and draw settings.
                </p>
              </div>
              <button
                className={`toggle ${storage.mode === "server" ? "on" : ""}`}
                role="switch"
                aria-label="SQLite server storage"
                aria-checked={storage.mode === "server"}
                disabled={busy || storage.loading}
                onClick={() =>
                  void storage.changeMode(
                    storage.mode === "server" ? "local" : "server",
                  )
                }
              >
                <span />
              </button>
            </div>
            <p>{storage.loading ? "Connecting…" : storage.status}</p>
            <p>
              New databases start with the 31-team event roster and no uploaded
              logos. Connecting loads the server's saved setup. Turning this off
              copies the current setup to browser storage.
            </p>
            {storage.error && (
              <>
                <p className="form-error" role="alert">
                  {storage.error}
                </p>
                <button
                  className="outline-button mt-3"
                  disabled={storage.loading}
                  onClick={() => void storage.retry()}
                >
                  Retry storage
                </button>
              </>
            )}
          </section>
          <label className="field-label" htmlFor="draw-title">
            EVENT TITLE
          </label>
          <input
            id="draw-title"
            disabled={storageBlocked}
            className="text-field"
            value={settings.title}
            maxLength={48}
            onChange={(event) => {
              setSettings((previous) => ({
                ...previous,
                title: event.target.value,
              }));
              resetStage();
            }}
          />
          <div className="settings-section">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3>CINEMATIC REVEAL</h3>
                <p>Build suspense with a longer shuffle.</p>
              </div>
              <button
                className={`toggle ${settings.cinematic ? "on" : ""}`}
                role="switch"
                aria-checked={settings.cinematic}
                aria-label="Cinematic reveal"
                disabled={storageBlocked}
                onClick={() =>
                  setSettings((previous) => ({
                    ...previous,
                    cinematic: !previous.cinematic,
                  }))
                }
              >
                <span />
              </button>
            </div>
          </div>
          <div className="settings-section">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3>GUARANTEED PLAYERS</h3>
                <p>
                  Include these players in the next draw. Remaining spots are
                  random. All reveals look identical.
                </p>
              </div>
              <span className="small-count">
                {settings.guaranteed.length} / {count || 0}
              </span>
            </div>
            <p className="operator-note">
              Visible only in this setup panel. Close it before sharing your
              screen. Saved in the selected storage; this is not a
              password-protected area.
            </p>
            <div className="guaranteed-list">
              {activeNames.map((name) => (
                <label key={name}>
                  <input
                    type="checkbox"
                    disabled={storageBlocked}
                    checked={settings.guaranteed.includes(name)}
                    onChange={() => {
                      setSettings((previous) => ({
                        ...previous,
                        guaranteed: previous.guaranteed.includes(name)
                          ? previous.guaranteed.filter((item) => item !== name)
                          : [...previous.guaranteed, name],
                      }));
                      resetStage();
                    }}
                  />
                  <TeamLogo src={settings.logos[name]} name={name} />
                  <span>{name}</span>
                  <span className="custom-check">
                    <Icon name="check" size={11} />
                  </span>
                </label>
              ))}
            </div>
            {settings.guaranteed.length > count && (
              <p className="form-error" role="alert">
                You’ve selected {settings.guaranteed.length} guaranteed players.
                Increase the draw size before starting.
              </p>
            )}
            {activeNames.length === 0 && (
              <p className="form-error">Enable players in the roster first.</p>
            )}
          </div>
          <div className="dialog-footer">
            <button
              className="text-button"
              disabled={storageBlocked}
              onClick={() => {
                setSettings((previous) => ({ ...previous, guaranteed: [] }));
                resetStage();
              }}
            >
              Clear guaranteed players
            </button>
            <button
              className="draw-button"
              onClick={() => {
                if (!settings.title.trim())
                  setSettings((previous) => ({
                    ...previous,
                    title: DEFAULTS.title,
                  }));
                setModal(null);
              }}
            >
              BACK TO ARENA
              <Icon name="arrow" size={17} />
            </button>
          </div>
          <section className="settings-section">
            <h3>START FRESH</h3>
            <p>
              Delete names, logos, guaranteed picks and settings from{" "}
              {storage.mode === "server"
                ? "the shared SQLite database"
                : "this browser"}
              , then reload with the default roster. This cannot be undone.
            </p>
            <button
              className="outline-button mt-3"
              disabled={storageBlocked}
              onClick={() => void storage.reset()}
            >
              <Icon name="reset" size={16} />
              Reset app &amp; refresh
            </button>
          </section>
        </Dialog>
      )}
    </div>
  );
}

export default App;
