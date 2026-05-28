# CRUFT — Build Specification (v1.0, ship-ready)

> A single-source-of-truth spec for building **cruft**: a developer-focused, terminal-native system inventory + cleanup TUI for macOS.
> This document is designed to be handed to an autonomous coding agent (opencode / Claude Code / Codex) and produce a launch-ready open-source project end-to-end.
>
> **Audience reading this file:** the implementing AI agent.
> **Tone:** prescriptive. Where a choice exists, the choice is made. Where freedom is allowed, it is marked `[FREEDOM]`.

---

## 0. Mission

Build a **single binary**, **single command** terminal application called `cruft` that:

1. Scans a macOS developer machine and surfaces every removable item: GUI apps, Homebrew packages, npm/pip/cargo/gem globals, Mac App Store apps, Docker images and volumes, Xcode DerivedData and simulators, stale `node_modules`, unused language-version installs, orphaned `~/Library` support files, dead launch agents, app caches.
2. Presents the results in a **beautiful, multi-pane TUI** styled like `lazygit` / `k9s` / `ncdu` but more modern.
3. Lets the user **navigate, filter, sort, search, and multi-select** items with the keyboard.
4. Lets the user **delete only what they explicitly selected**, via Trash (never `rm -rf`), with a confirmation modal and a full undo log.
5. Ships to `npm` (`npx cruft`) and a Homebrew tap (`brew install <handle>/tap/cruft`) with prebuilt single-binary macOS arm64 + x86_64 releases.

### Hard product principles (non-negotiable)

- **The tool never decides what to delete.** The user always pulls the trigger.
- **Nothing is pre-selected.** Selection starts empty on every launch.
- **Dry-run by default.** Even after the user selects items, the first action shows what *would* be removed unless the explicit confirmation step is completed.
- **Trash, not delete.** Every removal goes to macOS Trash and is recoverable for at least 30 days.
- **Undo log.** Every removal session is journaled to `~/.cruft/history/<iso-timestamp>.json` and is restorable via `cruft undo`.
- **Read-only by default.** Scanners must not mutate state. Tests must enforce this.
- **No telemetry without opt-in.** No network calls unless the user opts in via `cruft config set telemetry true`.

---

## 1. User Story (golden path)

```
$ cruft
[loads beautiful TUI in <300ms; scanners stream results in within 3-8s]

User sees:
  - Header bar with total disk, cruft found, currently selected total
  - Left pane: source groups with counts (Apps, Brew, npm, Docker, Xcode, ...)
  - Middle pane: scrollable item list, sorted by size desc by default
  - Right pane: details for highlighted item
  - Footer: keybinding hints

User presses:
  ↓ ↓ ↓             navigate items
  Space             toggle select
  f                 open filter chooser, picks "Unused 90 days+"
  s                 sort menu, picks "Size desc"
  a                 select all currently visible
  d                 open delete confirmation modal
                    modal shows: "Move 23 items (8.4 GB) to Trash?"
  y                 confirm

cruft moves items to Trash with a progress bar, writes a history file, and
returns to the dashboard with a success toast: "Freed 8.4 GB. Press u to undo."
```

---

## 2. Tech Stack (locked)

| Layer                | Choice                  | Version / Notes |
|----------------------|-------------------------|------------------|
| Runtime              | **Bun**                 | `>=1.2.0`. Single-binary compile via `bun build --compile`. |
| Language             | TypeScript              | `>=5.6`, strict mode, `noUncheckedIndexedAccess: true` |
| TUI framework        | **Ink**                 | `^5.0.0` (React 18 for CLIs) |
| Ink helpers          | `ink-text-input`, `ink-spinner`, `ink-gradient`, `ink-big-text` | latest |
| State                | **Zustand**             | `^5.0.0` |
| CLI args             | **citty**               | `^0.1.6` |
| Shell-outs           | **execa**               | `^9.0.0` |
| Concurrency          | `p-map`, `p-limit`      | latest |
| Filesystem walk      | **fast-glob**           | `^3.3.0` |
| Folder size          | **fast-folder-size** + native fallback | latest |
| Trash                | **trash**               | `^9.0.0` |
| Fuzzy search         | **fuse.js**             | `^7.0.0` |
| Schema validation    | **zod**                 | `^3.23.0` |
| Config (TOML)        | **smol-toml**           | `^1.3.0` |
| Date utils           | **dayjs**               | `^1.11.0` |
| Logging              | **consola**             | `^3.2.0` |
| Linter + formatter   | **Biome**               | `^1.9.0` |
| Tests                | `bun:test` (built-in)   | n/a |
| Demo recording       | **vhs** (charmbracelet) | for README GIF |
| Distribution         | npm + Homebrew tap      | via GitHub Releases |

> If a library above is unmaintained at build time, swap to the closest actively maintained equivalent and note it in `CHANGELOG.md`. Do not silently substitute.

---

## 3. Repo Layout (create exactly this)

```
cruft/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # bun test + bun build --compile on PR
│       └── release.yml             # tag-triggered release: builds binaries, publishes npm, updates tap
├── .vscode/
│   └── settings.json               # Biome as formatter
├── homebrew/
│   └── cruft.rb.template           # Homebrew formula template (sha256 placeholders)
├── scripts/
│   ├── build-binaries.ts           # cross-compile for arm64 + x86_64
│   ├── update-tap.ts               # bumps the Homebrew tap formula
│   └── record-demo.tape            # vhs script for README GIF
├── src/
│   ├── index.tsx                   # Bun entry. Parses args via citty, then renders <App/>
│   ├── app.tsx                     # Ink root: layout, global keybindings, modals
│   ├── theme/
│   │   ├── colors.ts               # palette (see § 5)
│   │   ├── typography.ts           # font weights, sizes (Ink uses bold/dim)
│   │   ├── spacing.ts              # paddings, margins, gutters
│   │   └── icons.ts                # unicode glyphs (no emoji)
│   ├── components/
│   │   ├── header.tsx              # totals bar (disk used, cruft found, selected)
│   │   ├── sources-pane.tsx        # left pane: source groups with counts + sizes
│   │   ├── items-pane.tsx          # middle pane: virtualized scrollable list
│   │   ├── details-pane.tsx        # right pane: item detail card
│   │   ├── footer.tsx              # keybinding hints, contextual
│   │   ├── confirm-modal.tsx       # delete confirmation overlay
│   │   ├── filter-modal.tsx        # filter chooser overlay
│   │   ├── sort-menu.tsx           # sort chooser overlay
│   │   ├── search-input.tsx        # / search overlay
│   │   ├── help-overlay.tsx        # ? help overlay
│   │   ├── toast.tsx               # success/error toasts (auto-dismiss)
│   │   ├── progress-bar.tsx        # smooth animated progress
│   │   ├── spinner.tsx             # branded spinner
│   │   └── splash.tsx              # 250ms launch splash (logo + version)
│   ├── state/
│   │   ├── store.ts                # zustand: items, selection, filters, sort, focus
│   │   ├── selectors.ts            # derived state (visible items, totals)
│   │   ├── keys.ts                 # keybinding map + handler registry
│   │   └── focus.ts                # focus ring across panes/modals
│   ├── scanners/
│   │   ├── types.ts                # Scanner interface, Item, Source enum
│   │   ├── registry.ts             # registers + parallel-runs scanners
│   │   ├── apps.ts
│   │   ├── homebrew.ts
│   │   ├── mas.ts
│   │   ├── npm-global.ts
│   │   ├── docker.ts
│   │   ├── xcode.ts
│   │   ├── node-modules.ts
│   │   ├── version-managers.ts
│   │   └── caches.ts
│   ├── remover/
│   │   ├── plan.ts                 # build a removal plan from selected items
│   │   ├── execute.ts              # send to Trash + per-scanner uninstall hook
│   │   ├── history.ts              # journal writer/reader
│   │   └── undo.ts                 # restore from Trash + replay history
│   ├── lib/
│   │   ├── exec.ts                 # execa wrapper: timeout, JSON parse, zod-validated
│   │   ├── fs-size.ts              # disk size with mtime-keyed cache
│   │   ├── last-used.ts            # mdls + atime fallback
│   │   ├── fuzzy.ts                # fuse.js wrapper
│   │   ├── format.ts               # bytes, dates, names, truncate
│   │   ├── log.ts                  # consola wrapper, level by env
│   │   └── platform.ts             # macOS detection + warnings
│   ├── commands/
│   │   ├── undo.ts                 # `cruft undo` CLI subcommand
│   │   ├── doctor.ts               # `cruft doctor` detects missing optional tools
│   │   ├── scan-json.ts            # `cruft --json` non-interactive output
│   │   └── config.ts               # `cruft config get/set/path`
│   └── config.ts                   # load/merge ~/.config/cruft/config.toml
├── tests/
│   ├── scanners/                   # per-scanner unit tests with mocked exec
│   ├── remover/                    # safe-delete in tmpdir
│   ├── ui/                         # ink-testing-library snapshots
│   └── e2e/                        # spawn binary, assert TTY output
├── docs/
│   ├── DESIGN.md                   # links to this spec
│   ├── ARCHITECTURE.md             # high-level diagram in mermaid
│   ├── CONTRIBUTING.md
│   └── SAFETY.md                   # the seven hard principles, expanded
├── README.md                       # demo GIF, install, usage
├── LICENSE                         # MIT
├── package.json
├── tsconfig.json                   # strict, noUncheckedIndexedAccess
├── biome.json
├── .gitignore
├── .nvmrc                          # optional, bun-only ok
└── CHANGELOG.md
```

---

## 4. Architecture

### Data flow

```
                ┌────────────────────────────────────────┐
                │            bun src/index.tsx           │
                └──────────────────┬─────────────────────┘
                                   │ citty parses args
                                   ▼
                        ┌──────────────────────┐
                        │   render <App/> ink  │
                        └─────────┬────────────┘
                                  │
                  scanner-registry kicks off in parallel
                                  │
        ┌─────────┬─────────┬─────┴─────┬─────────┬─────────┐
        ▼         ▼         ▼           ▼         ▼         ▼
      apps      brew      npm       docker     xcode     node-modules
        │         │         │           │         │         │
        └─────────┴─────────┴─────┬─────┴─────────┴─────────┘
                                  │ each scanner streams Items
                                  ▼
                        ┌──────────────────────┐
                        │  zustand store       │
                        │  - items[]           │
                        │  - selection: Set    │
                        │  - filter, sort      │
                        │  - focus, modal      │
                        └──────────┬───────────┘
                                   │ React re-renders panes
                                   ▼
              ┌────────────┬─────────────┬───────────────┐
              │ sources    │ items       │ details       │
              └────────────┴─────────────┴───────────────┘

User presses 'd' → confirm-modal → remover.execute() → trash → history.write()
```

### Scanner contract

```ts
// src/scanners/types.ts
export type Source =
  | "apps" | "homebrew" | "mas" | "npm-global"
  | "docker" | "xcode" | "node-modules" | "version-managers" | "caches";

export interface Item {
  id: string;                  // stable, used as selection key
  source: Source;
  name: string;                // display name
  path?: string;               // filesystem path if applicable
  sizeBytes: number;
  lastUsed?: Date;             // mdls kMDItemLastUsedDate or atime
  installSource?: string;      // "homebrew cask", "mas", "App Store", etc.
  dependents?: string[];       // for brew: things that depend on this
  safeToRemove: boolean;       // false if removing would break the OS
  reason?: string;             // why it's surfaced ("unused 180d", "dangling")
  removeStrategy: RemoveStrategy;
}

export type RemoveStrategy =
  | { kind: "trash"; paths: string[] }
  | { kind: "exec"; argv: string[]; cwd?: string }      // e.g. brew uninstall
  | { kind: "composite"; steps: RemoveStrategy[] };

export interface Scanner {
  id: Source;
  displayName: string;
  available(): Promise<boolean>;                         // is the underlying tool present?
  scan(opts: { onItem: (item: Item) => void; signal: AbortSignal }): Promise<void>;
}
```

### Why streaming results

Scanners may take 5-30s on a packed dev Mac. The TUI must show items as they arrive, not block on a global Promise.all. Each scanner calls `onItem(item)` and the store appends; React re-renders the items pane on each batch.

### Why mtime-keyed size cache

`du`-style size computation on `~/Library/Developer/Xcode/DerivedData` can take 5+ seconds. We persist sizes keyed by `(path, mtime)` to `~/.cache/cruft/sizes.json` so repeat scans return in <100ms.

---

## 5. Premium Color System & Theme

### Palette (24-bit truecolor, Catppuccin Mocha-inspired with custom accents)

| Token         | Hex       | Use |
|---------------|-----------|-----|
| `bg`          | `#11111B` | Default background |
| `bgElevated`  | `#181825` | Modals, header, footer |
| `bgSelected`  | `#313244` | Selected row |
| `bgHover`     | `#1E1E2E` | Focused row |
| `border`      | `#45475A` | Pane borders |
| `borderFocus` | `#89B4FA` | Focused pane border |
| `text`        | `#CDD6F4` | Default text |
| `textMuted`   | `#7F849C` | Hints, secondary |
| `textDim`     | `#585B70` | Tertiary |
| `accent`      | `#89B4FA` | Primary accent (cool blue) |
| `accentAlt`   | `#B4BEFE` | Hover accent (lavender) |
| `success`     | `#A6E3A1` | Selected count, success toasts |
| `warning`     | `#F9E2AF` | "Unused 90d+" badges |
| `danger`      | `#F38BA8` | Delete actions, destructive |
| `info`        | `#94E2D5` | Info toasts |
| `sizeXL`      | `#EBA0AC` | Items >5 GB |
| `sizeL`       | `#FAB387` | Items >1 GB |
| `sizeM`       | `#F9E2AF` | Items >100 MB |
| `sizeS`       | `#A6E3A1` | Items <100 MB |

`src/theme/colors.ts` exports each as a named constant. Ink consumes via the `color` prop on `<Text>`.

### Typography (Ink doesn't render fonts; emulate hierarchy via weight + color)

- **Display** (header logo): `ink-big-text` font `"tiny"`, gradient `accent → accentAlt`
- **H1** (pane titles): `bold` + `accent`
- **H2** (group headers): `bold` + `text`
- **Body**: default `text`
- **Caption**: `dim` + `textMuted`
- **Code/path**: `textMuted`, no truncation in details pane

### Spacing

- Pane gutters: 1 column
- Pane padding: 1 row, 2 columns
- Modal padding: 2 rows, 4 columns
- Item row height: 1 row (compact); 2 rows (comfortable, opt-in via `c`)

### Iconography (unicode only, no emoji)

| Concept   | Glyph |
|-----------|-------|
| Folder    | `▸` collapsed, `▾` expanded |
| Selected  | `●` |
| Unselected| `○` |
| Focused   | `▶` |
| Warning   | `▲` |
| Danger    | `✖` |
| Success   | `✔` |
| Sort asc  | `↑` |
| Sort desc | `↓` |
| Divider   | `│` `─` `┌` `┐` `└` `┘` `├` `┤` `┬` `┴` `┼` |

### Motion

- Splash: fade-in via interpolated dim → full over 200ms
- Spinner: braille dots `⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏` at 80ms/frame
- Toasts: slide-in from top, auto-dismiss after 3s
- Progress bar: smooth via partial blocks `▏▎▍▌▋▊▉█`

### Layout (default 120×40 terminal)

```
┌─ cruft v0.1.0 ──────────────────────────────────────────────────────────────────┐
│ Disk: 487 GB used  •  Cruft: 42.8 GB  •  Selected: 8.4 GB (23 items)            │
├──────────────┬──────────────────────────────────────────────┬───────────────────┤
│ SOURCES      │ ITEMS                              size  age │ DETAILS           │
│              │                                              │                   │
│ ▶ Apps    12 │ ● Xcode DerivedData              18.2G  3d   │ Xcode DerivedData │
│   Brew    47 │ ○ Old Node v16.20.0               2.1G  -    │                   │
│   npm     23 │ ● node_modules (12 paths)         4.8G  90d+ │ Path: ~/Library/  │
│   Docker   8 │ ○ Docker dangling images          6.3G  -    │ ...DerivedData    │
│   Xcode    4 │ ○ Slack.app                       1.4G  2h   │                   │
│   Cache   18 │ ● Postman.app                     890M  180d │ Size:    18.2 GB  │
│              │ ○ React Native dev cache          540M  60d  │ Last:    3 days   │
│              │                                              │ Source:  Xcode    │
│              │                                              │ Safe:    Yes      │
├──────────────┴──────────────────────────────────────────────┴───────────────────┤
│ ↑↓ nav  ←→ pane  ␣ select  d delete  f filter  s sort  / search  ? help  q     │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Keybinding Map (authoritative)

| Key         | Action                                  | Context |
|-------------|-----------------------------------------|---------|
| `↑` `↓`     | Navigate items                          | items pane |
| `←` `→`     | Switch focused pane                     | global |
| `PgUp` `PgDn` | Page through items                    | items pane |
| `Home` `End`| First / last item                       | items pane |
| `Space`     | Toggle selection of current item        | items pane |
| `a`         | Select all currently visible            | items pane |
| `A`         | Clear all selections                    | items pane |
| `i`         | Invert selection                        | items pane |
| `s`         | Open sort menu                          | global |
| `f`         | Open filter menu                        | global |
| `/`         | Open fuzzy search                       | global |
| `r`         | Rescan everything                       | global |
| `c`         | Toggle compact / comfortable density    | global |
| `d`         | Delete selected (opens confirm modal)   | requires ≥1 selection |
| `u`         | Undo last delete session                | global |
| `?`         | Toggle help overlay                     | global |
| `Esc`       | Close any modal / clear search          | modal |
| `q`         | Quit                                    | global |
| `Ctrl+C`    | Force quit                              | global |

All keybindings are remappable via `~/.config/cruft/config.toml [keybindings]`.

---

## 7. Ultra-Fast Engineering Techniques

This is a TUI on a developer's machine — it must feel **instant**. Budget:

| Operation                             | Budget |
|---------------------------------------|--------|
| Cold-start to first paint             | <300 ms |
| Cold-start to first item streamed     | <800 ms |
| Full rescan on warm cache             | <2 s |
| Full rescan on cold cache             | <10 s |
| Keyboard input → screen update        | <16 ms (60 fps) |
| Toggle selection on a 10k-item list   | <16 ms |
| Trash a 5 GB folder                   | <1 s (it's a `mv` to Trash) |

### Techniques

1. **Streaming scanners.** No `Promise.all`. Each scanner pushes items into the store as it discovers them. UI reflects new items within one frame.

2. **mtime-keyed size cache.** `~/.cache/cruft/sizes.json` stores `{ path, mtime, sizeBytes }` per directory. Skip recomputation when mtime unchanged.

3. **Parallel scanners with bounded concurrency.** `p-map` with `concurrency: navigator.hardwareConcurrency ?? 8`. CPU-bound work (folder walks) shares the pool with shell-outs.

4. **Lazy folder walks.** For `~/Library`, use `fast-glob` with `onlyDirectories: true` and `deep: 2` first; only recurse deeper for items the user expands.

5. **Virtualized item list.** Only render the items visible in the viewport. Use a windowed list — if Ink doesn't provide one, build a 30-line visible window with manual scroll offset.

6. **Memoized selectors.** Zustand selectors with shallow-equality so toggling selection doesn't re-render the sources or details panes.

7. **Debounced search.** `/` search debounces at 80 ms; fuse.js index is rebuilt only when item count changes (not on selection changes).

8. **Single-process shell-outs.** `brew list --formula --json=v2` returns everything in one call — never loop `brew info` per package.

9. **AbortController on rescan.** Pressing `r` aborts all in-flight scanners before starting new ones to avoid duplicate work.

10. **Native bytes formatting.** Avoid `Intl.NumberFormat` per row — precompute formatted size strings when items arrive.

11. **No layout thrash.** Pane widths are fixed percentages of terminal width; recomputed only on `SIGWINCH`.

12. **Bun-specific wins.** Use `Bun.file()` for cache I/O (faster than `fs.promises`). Use `Bun.spawn()` instead of execa where possible for low-overhead shell-outs (keep execa for the streaming-JSON cases).

13. **Pre-warm scanner availability.** On startup, kick off `available()` for all scanners in parallel before rendering — by the time the user sees the dashboard, we know which sources to hide.

14. **Compile-time tree-shake.** `bun build --compile --minify --target=bun` strips unused Ink components from the bundle.

---

## 8. Scanner Specifications

Each scanner lives in `src/scanners/<id>.ts`, implements the `Scanner` interface, and ships with unit tests in `tests/scanners/<id>.test.ts`. Below is the contract per scanner.

### 8.1 `apps`

- Walks `/Applications` and `~/Applications` for `*.app` bundles (1 level deep).
- Size = bundle on-disk size (`Bun.spawn(["du","-sk", path])` or native walk; cache by mtime).
- `lastUsed` = `mdls -name kMDItemLastUsedDate "<path>"` (parse plist date; fallback to atime).
- `installSource` = `"App Store"` if `_MASReceipt` exists in bundle, else `"Drag-installed"`.
- `safeToRemove` = `true` unless path matches an OS-shipped app blocklist (Safari.app, FaceTime.app, Mail.app, Messages.app, ...). Maintain blocklist in `src/scanners/apps.blocklist.ts`.
- `removeStrategy` = `{ kind: "trash", paths: [appPath, supportPaths...] }` where supportPaths are sibling files in `~/Library/Application Support/<BundleID>`, `~/Library/Preferences/<BundleID>.plist`, `~/Library/Caches/<BundleID>`. Resolve BundleID via `defaults read "<path>/Contents/Info" CFBundleIdentifier`.

### 8.2 `homebrew`

- `available()` = `which brew` succeeds.
- Run `brew list --formula --json=v2` and `brew list --cask --json=v2` in parallel.
- Run `brew uses --installed <name>` lazily on demand (when user opens details) to populate `dependents`.
- Size = `installed.installed_size_kb * 1024` from the JSON.
- `safeToRemove` = `dependents.length === 0` (downgrade to warning, not hard block — user can override).
- `removeStrategy` = `{ kind: "exec", argv: ["brew", "uninstall", name] }` for formulae, `["brew", "uninstall", "--cask", name]` for casks.

### 8.3 `mas`

- `available()` = `which mas` succeeds.
- `mas list` returns `<id> <name> (<version>)`.
- For each, find the `.app` in `/Applications` and inherit size + lastUsed from the `apps` scanner cache.
- `removeStrategy` = `{ kind: "exec", argv: ["mas", "uninstall", id] }` (falls back to trashing the .app if `mas uninstall` is unavailable).

### 8.4 `npm-global`

- `npm root -g` to find prefix.
- `npm ls -g --json --depth=0` for the list.
- Size = directory size of each package under the prefix.
- `removeStrategy` = `{ kind: "exec", argv: ["npm", "uninstall", "-g", name] }`.

### 8.5 `docker`

- `available()` = `which docker` and `docker info` exits 0.
- `docker system df --format json` for top-level usage.
- `docker images --format json` to find dangling images (`<none>:<none>` or `dangling=true`).
- `docker volume ls --filter dangling=true --format json` for unused volumes.
- Group as composite items: "Docker dangling images (12)", "Docker unused volumes (4)".
- `removeStrategy` for dangling images: `{ kind: "exec", argv: ["docker", "image", "prune", "-f"] }`. For volumes: `["docker", "volume", "rm", ...ids]`.

### 8.6 `xcode`

- Detect by `xcode-select -p` exit 0.
- DerivedData: `~/Library/Developer/Xcode/DerivedData/*` — each subdir is a separate item.
- Archives: `~/Library/Developer/Xcode/Archives/**`
- Simulators: parse `xcrun simctl list --json devices` to find unavailable / shutdown old simulators; group "Unused Xcode simulators".
- DeviceSupport: `~/Library/Developer/Xcode/iOS DeviceSupport/*` — group by iOS version, surface only versions > N (e.g. >3) old.
- `removeStrategy` = `{ kind: "trash", paths: [...] }` for filesystem; `{ kind: "exec", argv: ["xcrun","simctl","delete",udid] }` for simulators.

### 8.7 `node-modules`

- `fast-glob('**/node_modules', { cwd: HOME, deep: 8, onlyDirectories: true, ignore: [".Trash/**","Library/**"] })`.
- For each, get size + parent package.json mtime.
- Filter: surface only `node_modules` whose parent dir hasn't been touched in 90 days (configurable via `--stale-days`).
- Group into a single composite item: "node_modules (N stale)" with expand-to-see-paths in details pane.
- `removeStrategy` = `{ kind: "trash", paths: [...] }`.

### 8.8 `version-managers`

- Detect installed managers: `nvm` (presence of `~/.nvm`), `pyenv` (`~/.pyenv`), `rbenv` (`~/.rbenv`).
- For each, list installed versions (`nvm ls`, `pyenv versions`, `rbenv versions`).
- Detect "current" / "default" version (from `~/.nvmrc`, `pyenv version`, `rbenv version`).
- Surface non-default versions as removable items, with size + `lastUsed = atime` of the version's `bin/` directory.
- `removeStrategy` = `{ kind: "exec", argv: ["nvm", "uninstall", v] }` etc., or `trash` of the version directory as fallback.

### 8.9 `caches`

- `~/Library/Caches/*` directories grouped by parent app (resolve BundleID → app name via `apps` scanner cache).
- Only surface caches >50 MB.
- `removeStrategy` = `{ kind: "trash", paths: [...] }`.

---

## 9. State Shape (Zustand)

```ts
// src/state/store.ts
interface CruftState {
  // Data
  items: Map<string, Item>;          // id → item
  itemsBySource: Map<Source, string[]>;
  scannerStatus: Record<Source, "idle" | "running" | "done" | "unavailable" | "error">;
  scanErrors: Record<Source, string | undefined>;

  // View
  focus: "sources" | "items" | "details" | "modal";
  modal: null | "confirm" | "filter" | "sort" | "search" | "help";
  activeSource: Source | "all";
  sort: { key: "size" | "name" | "lastUsed"; dir: "asc" | "desc" };
  filter: { minSize?: number; staleDays?: number; sources?: Source[] };
  search: string;
  cursor: string | null;             // currently highlighted item id
  density: "compact" | "comfortable";

  // Selection
  selection: Set<string>;            // item ids

  // Toasts
  toasts: Array<{ id: string; kind: "info" | "success" | "warning" | "error"; message: string; expiresAt: number }>;

  // Actions
  addItem(item: Item): void;
  toggleSelect(id: string): void;
  selectVisible(): void;
  clearSelection(): void;
  setSort(s: CruftState["sort"]): void;
  setFilter(f: Partial<CruftState["filter"]>): void;
  setSearch(s: string): void;
  setCursor(id: string | null): void;
  setFocus(f: CruftState["focus"]): void;
  setModal(m: CruftState["modal"]): void;
  pushToast(t: Omit<CruftState["toasts"][number], "id" | "expiresAt">): void;
  reset(): void;
}
```

Selectors in `src/state/selectors.ts`:

- `getVisibleItems(state)` — apply filter + search + sort, returns ordered `Item[]`.
- `getSelectionTotals(state)` — `{ count, sizeBytes }`.
- `getSourceCounts(state)` — `Record<Source, { count, sizeBytes }>`.

---

## 10. Safety, Permissions, Failure Modes

### Path safety

- The remover **must** refuse to delete any of these paths (hard blocklist in `src/remover/blocklist.ts`):
  - `/`, `/System`, `/Library`, `/Users`, `/Applications` itself, `$HOME`, `$HOME/Library`, `$HOME/Desktop`, `$HOME/Documents`, `$HOME/Downloads`, `$HOME/Pictures`, `$HOME/Movies`, `$HOME/Music`.
  - Any path with `..` or symlink resolving outside an allowed root.
- Unit tests in `tests/remover/blocklist.test.ts` must enforce this.

### Permissions

- If a path requires admin (e.g. some `/Applications` items installed via pkg), the remover surfaces a toast: "Postman.app requires admin. Run `sudo cruft undo` is not supported — please remove manually." Never auto-`sudo`.

### Failure handling

- If `trash` fails on an item, log to history with `status: "failed"` and continue with the rest. Show a per-item error summary at the end.
- If a shell-out times out (10s default), abort and surface error.

### Undo

- `cruft undo` reads the most recent file in `~/.cruft/history/`, finds each item in Trash by name + original size + timestamp, and restores via `osascript` Finder commands or `mv` from Trash.
- If an item was emptied from Trash, mark it `unrecoverable` and skip.

---

## 11. Testing Strategy

### Unit tests (`tests/scanners/*.test.ts`)

- Mock `execa` / `Bun.spawn` outputs from canned fixtures in `tests/fixtures/`.
- Mock filesystem with `memfs` for walk-based scanners.
- Assert: `Item` shape is valid (zod), sizes are non-zero, `removeStrategy` is correct.

### Integration tests (`tests/remover/*.test.ts`)

- Use a real `tmp/` directory inside `os.tmpdir()`.
- Create fake `node_modules` and dummy `.app` bundles.
- Run the remover, assert items moved to Trash, history written, undo restores.

### UI tests (`tests/ui/*.test.tsx`)

- Use `ink-testing-library` to snapshot pane output at known store states.
- Test keybinding handlers: dispatch keypress events, assert store mutations.

### E2E tests (`tests/e2e/*.test.ts`)

- Spawn the compiled binary with `--json` mode, parse stdout, assert known structure.
- Spawn with `--script` mode (drive with a scripted keystroke sequence) — implement a `--script` testing entry that disables raw TTY and consumes keys from stdin.

### Coverage target

- 80%+ line coverage across `src/scanners`, `src/remover`, `src/state`. UI components exempt (visual).

---

## 12. CLI Surface (citty)

```
cruft                    Open the interactive TUI (default)
cruft --json             Run all scanners, print JSON to stdout, exit 0
cruft --version
cruft --no-color         Disable ANSI colors
cruft --no-cache         Skip size cache
cruft undo               Restore the most recent delete session
cruft doctor             Diagnose missing optional tools (mas, docker, brew, ...)
cruft config get <key>
cruft config set <key> <value>
cruft config path        Print path to config file
```

### Config file (`~/.config/cruft/config.toml`)

```toml
[ui]
density = "compact"               # or "comfortable"
theme = "mocha"                   # only "mocha" in v0.1

[scanners]
enabled = ["apps","homebrew","npm-global","docker","xcode","node-modules","version-managers","caches","mas"]

[scanners.node-modules]
stale-days = 90
ignore = ["Library/**","**/Pods/**"]

[keybindings]
delete = "d"
quit = "q"
# (full remap supported)

[telemetry]
enabled = false
```

---

## 13. Distribution

### npm

- `package.json` with `"bin": { "cruft": "./dist/cruft.js" }`.
- `npm publish --access public` from CI on tag push.
- Users install via `npx cruft` or `bun x cruft` — no native binary required since `cruft.js` is a Bun-built bundle that runs via the installed Bun runtime. If user has no Bun, fall back to a shim that prints "install Bun or download the binary from <releases>".

### Homebrew tap

- Separate repo: `<your-handle>/homebrew-tap`, contains `Formula/cruft.rb`.
- `release.yml` builds macOS arm64 + x86_64 binaries via `bun build --compile --target=bun-darwin-arm64` and `--target=bun-darwin-x64`.
- After release, runs `scripts/update-tap.ts` to bump the formula version, swap SHA256s, and commit + push to the tap repo via a deploy key (stored as `TAP_DEPLOY_KEY` secret).
- Users install via `brew install <your-handle>/tap/cruft`.

### Versioning

- Semver. `0.1.0` for first launch. Pre-1.0 means any minor can change UX.

---

## 14. README Requirements

The README must include, in order:

1. **One-line tagline** (e.g. "Find and clean gigabytes of developer cruft on your Mac. Terminal-native. Safe by default.")
2. **Demo GIF** (recorded with vhs, `scripts/record-demo.tape`).
3. **Install** (Homebrew first, then npx).
4. **Usage** (single `cruft` command, key bindings table).
5. **Safety** (the seven principles, condensed).
6. **What it scans** (table of sources).
7. **Roadmap** (Linux, plugins, scheduled cleans).
8. **Contributing** link.
9. **License** (MIT).
10. **Sponsor / lead-gen footer** — GitHub Sponsors button and a one-line "Built by [name]" with website link.

---

## 15. Launch Checklist (must all be true before tagging v0.1.0)

- [ ] `bun test` passes with 80%+ coverage on `scanners`, `remover`, `state`.
- [ ] `bun build --compile` produces working binaries for `bun-darwin-arm64` and `bun-darwin-x64`.
- [ ] Cold-start to first paint <300 ms on M1.
- [ ] Full warm-cache rescan <2 s on a dev Mac with 50+ apps.
- [ ] Demo recording shows: scan → filter to "unused 90d+" → select 5 items → delete → undo → exit.
- [ ] README renders on GitHub with the demo GIF playing.
- [ ] `npx cruft@latest` works on a clean Mac with only Bun installed.
- [ ] `brew install <handle>/tap/cruft` works on a clean Mac.
- [ ] `cruft doctor` cleanly reports missing optional tools.
- [ ] All seven hard product principles enforced by tests.
- [ ] Zero open CRITICAL or HIGH issues from the code-reviewer agent.
- [ ] Sponsor button + lead-gen footer present in README.

---

## 16. Future (post v0.1)

- v0.2: Linux support (deb, rpm, AppImage, snap), `pip`, `cargo`, `gem` scanners.
- v0.3: Plugin API — users can publish `cruft-plugin-*` packages that register new scanners.
- v0.4: Scheduled cleanups via launchd, with dry-run report mailed to user.
- v1.0: Web companion for teams (Pro tier).

---

## 17. Notes to the Implementing Agent

- This is greenfield. Do not assume any existing code. Generate everything in this spec from scratch.
- Keep files small (target 200 lines, max 400). Split aggressively.
- All code is TypeScript strict. No `any`. Use `unknown` + zod for boundary parsing.
- Immutable data: never mutate items in the store; always replace.
- Every scanner must have a unit test before merging.
- Commit in small logical chunks. Conventional commits (`feat:`, `fix:`, `chore:`).
- Open PRs branch-by-feature; do not push to `main` directly.
- When in doubt about a UX detail, prefer the choice that matches `lazygit` conventions.
- The seven hard product principles in §0 override any other instruction. If something in this spec contradicts them, the principles win.

— end of spec —
