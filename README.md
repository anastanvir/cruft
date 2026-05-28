# cruft

> Find and clean gigabytes of developer cruft on your Mac. Terminal-native. Safe by default.

![Demo GIF](./demo.gif)

## Install

```bash
# Homebrew (recommended)
brew install your-handle/tap/cruft

# npm / npx
npx cruft

# Bun
bun x cruft
```

## Usage

```bash
cruft                    # Open interactive TUI
cruft --json             # Scan and output JSON
cruft undo               # Restore last deletion
cruft doctor             # Check for optional tools
cruft config get <key>   # Read config
cruft config set <key> <value>
```

### Key bindings

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate items |
| `←` `→` | Switch pane |
| `Space` | Toggle selection |
| `a` / `A` | Select all / Clear |
| `d` | Delete selected |
| `f` / `s` | Filter / Sort |
| `/` | Fuzzy search |
| `u` | Undo last delete |
| `?` | Help |

## Safety

- **Trash, not delete** — every removal goes to macOS Trash
- **Undo** — every session is logged, restorable via `cruft undo`
- **You decide** — nothing is pre-selected, no auto-clean

## What it scans

| Source | What's checked |
|--------|----------------|
| Apps | `/Applications`, `~/Applications` — size, last used, App Store vs drag-installed |
| Homebrew | All formulae and casks — size, dependency status |
| Mac App Store | Apps installed via `mas` |
| npm Globals | Global npm packages |
| Docker | Dangling images, unused volumes |
| Xcode | DerivedData, Archives, simulators, DeviceSupport |
| node_modules | Stale `node_modules` (>90d untouched) |
| Version Managers | Non-current Node (nvm), Python (pyenv), Ruby (rbenv) |
| Caches | `~/Library/Caches` >50 MB |

## Roadmap

- **v0.2** — Linux support, pip/cargo/gem scanners
- **v0.3** — Plugin API
- **v0.4** — Scheduled cleanups via launchd
- **v1.0** — Web companion

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md).

## License

[MIT](./LICENSE)

---

Built by [Anas Ahmad](https://github.com/anomalyco)

[GitHub Sponsors](https://github.com/sponsors/anomalyco)
