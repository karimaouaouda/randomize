# DROPZONE — Player Draw Arena

A PUBG-inspired React + TypeScript app with Tailwind CSS and Vite. Paste a roster, choose how many players to draw, and reveal the winners through a cinematic shuffle.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).

```sh
npm test       # draw logic, guarantees, duplicate handling, validation
npm run lint
npm run build # production output in dist/
npm run preview
```

Use Node.js 24 or later (including for the built-in SQLite server). Local-storage mode can run on any static host. No account or API keys are needed. Use HTTPS or localhost for browser cryptography and clipboard support.

## Optional SQLite server

Start the API and Vite together during development:

```sh
npm run dev:full
```

Or run them in separate terminals:

```sh
npm run server # API at http://127.0.0.1:8787
npm run dev    # React app; /api requests proxy to port 8787
```

For a single server that builds and serves the finished app and API:

```sh
npm start
```

Open http://127.0.0.1:8787 after the build completes. `npm run server` also serves an existing `dist/` build. `npm run preview` proxies API calls to the separately running server.

In **operator settings**, turn on **SQLite server storage**. New databases (including a legacy database with an empty configuration) are seeded on server startup with the exact 31 names in `src/draw.ts`, no uploaded logos, and no guaranteed picks. Connecting loads that server configuration; it does not import the browser roster. If the database already contains a saved configuration, it is preserved. **Reset app & refresh** in server mode explicitly restores the 31-team defaults. Turning server storage off copies the displayed configuration back into this browser's local storage.

The SQLite file is created automatically at `data/dropzone.sqlite` (ignored by Git). One configuration is stored as JSON in the `app_state` table, including names, resized base64 images, guaranteed names, draw count, event title and cinematic preference. No additional npm database packages are needed. In server mode those settings are read and written through the API rather than mirrored to browser storage; only the selected storage mode is remembered in the browser.

Changes save automatically after a short debounce. API writes are serialized and revision-checked. If another browser saves first, the stale window's write is rejected instead of overwriting newer data. The app keeps unsaved edits on screen and shows an error; use browser storage to preserve those edits locally, or reload to load the latest server setup. Network failures offer **Retry storage**. Initial connection failures block editing and drawing until you reconnect or switch back to browser storage.

**Reset app & refresh** clears the selected store. In server mode this resets the shared database configuration, so every browser using it will load defaults on its next refresh. In local mode it removes this app's saved configuration and storage-mode preference. Unrelated browser storage is preserved.

The server binds to localhost by default and has no login system. Host checks and origin allowlists reject unapproved browser requests. Changing the bind address or allowing a frontend origin does not add authentication; protect the service before exposing shared guarantees or images publicly. For backups, stop the server and copy the configured SQLite file; do not delete it unless you intend to erase the server setup. Results, history, active-player exclusions and sound remain session-only in either storage mode.

API endpoints (same origin): `GET /api/settings` returns `{ settings, revision }`; `PUT /api/settings` accepts `{ settings, revision }`; `DELETE /api/settings` accepts `{ revision }` and restores defaults. Invalid data is rejected, request bodies are limited to 26 MB, and stale revisions return HTTP 409.

## Environment configuration

Copy `.env.example` to `.env` in this project. Both `npm run server` and `npm run dev:full` automatically load `.env` and optional `.env.local`; the latter overrides `.env`, and existing shell environment variables take priority. Vite loads these files for the frontend too. Restart after changes; **rebuild** after changing any `VITE_*` setting because those values are included in the browser bundle. Never put secrets in `VITE_*` variables. See [Vite's environment documentation](https://vite.dev/guide/env-and-mode).

| Variable                    | Default                        | Purpose                                                                                                                                               |
| --------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_BACKEND_URL`          | empty                          | Browser API origin, such as `http://127.0.0.1:9000`; empty uses `/api` on the app origin. Do not include `/api` in this value.                        |
| `VITE_DEFAULT_STORAGE_MODE` | `local`                        | `local` or `server` for browsers without an existing saved mode preference.                                                                           |
| `HOST`                      | `127.0.0.1`                    | Backend bind address; use `0.0.0.0` only if you intend to allow network connections.                                                                  |
| `PORT`                      | `8787`                         | Backend listener port.                                                                                                                                |
| `DATABASE_PATH`             | `data/dropzone.sqlite`         | SQLite file path, relative to the project or absolute. A new path creates a fresh 31-team database.                                                   |
| `DIST_PATH`                 | `dist`                         | Built frontend directory served by the backend. A custom directory must contain your built app.                                                       |
| `BACKEND_URL`               | derived from `HOST` and `PORT` | Vite dev/preview proxy target. Use when the API runs elsewhere.                                                                                       |
| `FRONTEND_HOST`             | `127.0.0.1`                    | Vite dev/preview bind address.                                                                                                                        |
| `FRONTEND_PORT`             | `5173`                         | Preferred Vite development port; Vite prints an alternate port if occupied.                                                                           |
| `PREVIEW_PORT`              | `4173`                         | Preferred Vite preview port.                                                                                                                          |
| `ALLOWED_HOSTS`             | empty                          | Additional explicit backend/dev-server hostnames, comma-separated, without a scheme or port. Loopback names and `HOST` are already allowed.           |
| `ALLOWED_ORIGINS`           | empty                          | Exact extra frontend origins allowed by the API, comma-separated. No wildcards, paths or credentials. Same-origin requests work without this setting. |

**Recommended single-origin setup:** leave `VITE_BACKEND_URL` and `BACKEND_URL` empty. Changing `PORT` updates the dev/preview proxy automatically. `npm start` serves both the app and API on that backend port.

**Direct frontend-to-backend setup**, for example a frontend on port 3000 and API on port 9000:

```dotenv
PORT=9000
FRONTEND_PORT=3000
VITE_BACKEND_URL=http://127.0.0.1:9000
ALLOWED_ORIGINS=http://127.0.0.1:3000
VITE_DEFAULT_STORAGE_MODE=server
```

Use the exact origin you open in the browser (`localhost` and `127.0.0.1` are different origins). If Vite chooses a different port, update `ALLOWED_ORIGINS` for direct connections. Cross-origin API access includes CORS preflight handling. Backend URL values must be complete HTTP(S) origins with no path. If your frontend is HTTPS, its backend URL must also use HTTPS to avoid mixed-content blocking.

Existing non-empty databases are never overwritten at startup. To replace an old roster deliberately, use the reset button in server mode or point `DATABASE_PATH` at a new file. Flags, spelling, punctuation and internal spacing in the provided team list are preserved. Teams without uploaded images display the default badge.

## Use the arena

1. **Add / import players** opens the roster editor. Paste names on separate lines, or separate them with commas or semicolons. Names are trimmed and duplicates are removed without regard to capitalization. Supports up to 500 names, 64 characters each.
2. Check or uncheck roster players to include or exclude them from the current session.
3. Set **Players to draw** and click **Initiate draw**. Each player can appear only once in a draw. A new draw starts from the same active roster; previous winners remain eligible.
4. Use the sound button for optional synthesized audio. **Stage view** hides the roster and setup controls for screen sharing. Press Escape to leave it.
5. Copy or download completed results. **Draw history** keeps the last 20 draws in the current session and resets on refresh.

## Team logos

Use **Add / import players** to save your team names, then reopen it and scroll to **Team logos**. Upload a PNG, JPG, or WebP for each team (up to 5 MB per file). Images are fitted into a transparent 128 × 128 square without cropping or stretching and saved to the selected storage. Logo uploads and removals save automatically, independently of edits to the names list.

Logos appear in the roster, animated shuffle, revealed winners, guaranteed-pick panel, and session history. Missing or unreadable logos use the included shield badge. **Remove** returns a team to that default. Saving a new roster keeps logos for exact matching names and drops logos for names removed from the roster. Existing saved rosters work without needing to be imported again.

Logos are included in SQLite saves when server storage is enabled; otherwise they remain in this browser. They are not included in text result exports. Browser storage capacity limits local saves; storage failures are shown without discarding the in-memory setup.

## Guaranteed picks

Open the gear in the header or beside the sound control. Under **Guaranteed players**, select the names that must appear. Set the draw size to at least the number of guaranteed players.

For example, for a draw of four with two guarantees, those two players are included, two others are sampled from the remaining active roster, and all four are shuffled into the reveal slots. The stage never distinguishes guaranteed picks. All players use the same animation and styling. Remaining selections and final ordering use `crypto.getRandomValues` with an unbiased Fisher–Yates shuffle; `Math.random` is used only for decorative cycling names and audio.

Guarantees remain active for future draws until cleared. Roster edits discard guarantees for removed names; excluding a player also removes their guarantee. Too many guarantees or invalid draw sizes block the draw with an explanation.

Roster, logos, event title, draw size, cinematic preference, and guarantees are saved in the selected storage. Active-player exclusions, audio preference, results, and history are session-only. If saving fails, the app retains the current setup in memory and displays an error.

The setup panel is discreet, **not access-controlled**: anyone using this browser, inspecting local storage, or accessing the local API/database can see the guarantees. Close the panel before sharing your screen. This is an operator-configurable entertainment draw, not an auditable lottery system.

The app respects reduced-motion preferences with a short, non-cycling reveal. Dialogs use native browser focus trapping and Escape handling; results have a screen-reader announcement.

## Artwork and typography

- PUBG library artwork: [Steam-hosted PUBG artwork](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/578080/library_hero.jpg), stored locally in `public/images/battlegrounds.jpg`. PUBG artwork and marks belong to KRAFTON. Confirm permission for your intended public or commercial use, or replace the background with your own artwork. This community tool is not affiliated with KRAFTON.
- Barlow and Barlow Condensed are loaded from Google Fonts, with system fallbacks when offline.
- Icons, stage graphics, grain, animations, and the DROPZONE identity are SVG/CSS, requiring no image service or animation dependency.
- Tailwind uses the [official Vite integration](https://tailwindcss.com/docs/installation/using-vite).

Optional replacement background prompt:

> Cinematic photorealistic esports battle royale key art, helmeted survivor in a dark tactical vest standing at center-right, a squad emerging from smoke behind them, abandoned transport plane wreckage and descending parachutes, dusty olive military palette, warm amber backlight, high contrast, realistic film grain. Leave the left third dark and uncluttered for typography. Wide 3:1 composition, no text, no logos, no watermarks.

The project was checked in Chromium at eight viewport widths from 360px to 1920px, including roster editing, guaranteed picks, animation, invalid-input blocking, history, clipboard, downloads, persistence, stage view, and reduced motion. Physical-device and cross-browser checks have not been performed.
