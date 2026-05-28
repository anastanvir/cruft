# Design

cruft is a terminal-native system inventory and cleanup tool for macOS developers.

## Core Design Decisions

- **Terminal-native TUI** — Built with Ink (React for CLIs) to provide a `lazygit`/`k9s`-inspired multi-pane layout
- **Streaming results** — Scanners push items into the store as they discover them; the UI updates within one frame
- **Safe by default** — All removals go to macOS Trash; nothing is pre-selected; confirmation required before any action
- **Keyboard-driven** — Full keyboard navigation with vim-style bindings, no mouse required
- **Parallel scanning** — Scanners run concurrently with bounded concurrency via `p-map`
- **Performance-first** — mtime-keyed size caches, virtualized item lists, debounced search

## Layout (120×40 default)

```
┌─ Header (version, totals) ──────────────────────────────────────────────┐
│ Disk: 487 GB used  •  Cruft: 42.8 GB  •  Selected: 8.4 GB (23 items)   │
├──────────┬───────────────────────────────────┬──────────────────────────┤
│ Sources  │ Items                     size age │ Details                   │
│ ▶ Apps 12│ ● Xcode DerivedData  18.2G  3d    │ Xcode DerivedData         │
│   Brew 47│ ○ node_modules (12)   4.8G 90d+   │ Size: 18.2 GB / Last: 3d │
│   npm  23│                                    │ Safe: Yes                 │
├──────────┴───────────────────────────────────┴──────────────────────────┤
│ ↑↓ nav  ←→ pane  ␣ select  d delete  f filter  s sort  / search  ? q  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. `bun src/index.tsx` → citty parses args → renders `<App/>`
2. `ScannerRegistry` runs all scanners in parallel with AbortSignal
3. Each scanner calls `onItem(item)` → Zustand store appends → React re-renders
4. User keyboard input → `handleKey()` in `<App/>` → store actions
5. 'd' → `buildRemovalPlan()` → `executeRemoval()` → Trash → `writeHistory()`

## Key Technology Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Runtime | Bun | Single-binary compile, fast startup, built-in test runner |
| TUI | Ink + React 18 | Component model, clean state management |
| State | Zustand | Minimal boilerplate, selector-based re-renders |
| CLI | citty | Lightweight, type-safe arg parsing |
| Trash | trash npm package | Native macOS Trash integration |
| Linter | Biome | Fast, zero-config, TypeScript-native |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full component diagram and [SPEC.md](../SPEC.md) for the build specification.
