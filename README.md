# cruft

> Find and clean gigabytes of developer cruft on your Mac. Terminal-native. Safe by default.

## Install

```bash
brew install anastanvir/tap/kruft
```

After tapping once you can use the short form:

```bash
brew tap anastanvir/tap
brew install kruft
```

> The Homebrew formula is named `kruft` to avoid a name conflict with the
> `cruft` Python project in homebrew-core. The binary you invoke is `kruft`.

## Usage

```bash
kruft                    # Open interactive TUI
kruft --json             # Scan and output JSON
kruft undo               # Restore last deletion
kruft doctor             # Check for optional tools
kruft config get <key>   # Read config
kruft config set <key> <value>
```

### Key bindings

| Key       | Action                |
|-----------|-----------------------|
| `↑` `↓`   | Navigate items        |
| `←` `→`   | Switch pane           |
| `Space`   | Toggle selection      |
| `a` / `A` | Select all / Clear    |
| `Enter`   | Delete selected       |
| `f` / `s` | Filter / Sort         |
| `/`       | Fuzzy search          |
| `u`       | Undo last delete      |
| `?`       | Help                  |

## Safety

- **Trash, not delete** — every removal goes to macOS Trash by default
- **Undo** — every session is logged and restorable via `kruft undo`
- **You decide** — nothing is pre-selected, no auto-clean
- **Path blocklist** — refuses to touch `/`, `/System`, `/Library`, `/usr`,
  `/Applications`, your home root, etc. — even via symlinks
- **No shell out** — external commands run through a strict argv allowlist
  with no shell interpolation

## What it scans

| Source            | What's checked                                                        |
|-------------------|-----------------------------------------------------------------------|
| Apps              | `/Applications`, `~/Applications` — size, last used                   |
| Homebrew          | All formulae and casks — size, dependency status                      |
| Mac App Store     | Apps installed via `mas`                                              |
| npm Globals       | Global npm packages                                                   |
| Docker            | Dangling images, unused volumes                                       |
| Xcode             | DerivedData, Archives, simulators, DeviceSupport                      |
| node_modules      | Stale `node_modules` (>90d untouched)                                 |
| Version Managers  | Non-current Node (nvm), Python (pyenv), Ruby (rbenv)                  |
| Caches            | `~/Library/Caches` >50 MB                                             |

## Building from source

Requires [Bun](https://bun.sh) ≥ 1.2.

```bash
git clone https://github.com/anastanvir/cruft.git
cd cruft
bun install
bun run dev          # Run in dev mode
bun run build        # Compile arm64 binary -> ./dist/cruft
bun test             # Run the test suite
```

## Roadmap

- **v0.2** — Linux support, pip/cargo/gem scanners
- **v0.3** — Plugin API
- **v0.4** — Scheduled cleanups via launchd
- **v1.0** — Web companion

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md).

## License

[MIT](./LICENSE) © Anas Tanvir
