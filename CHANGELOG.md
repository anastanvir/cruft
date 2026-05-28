# Changelog

## [0.1.0] - 2025-01-01

### Added

- Initial release of cruft
- Interactive TUI with multi-pane layout (sources, items, details)
- 9 scanners: Apps, Homebrew, Mac App Store, npm Globals, Docker, Xcode, node_modules, Version Managers, Caches
- Safe-by-design removal via macOS Trash with full undo history
- Streaming scanner results — items appear as they're discovered
- mtime-keyed size cache for sub-second rescans
- Keyboard-driven navigation with selection, filter, sort, and search
- `cruft --json` for non-interactive output
- `cruft undo` to restore the most recent delete session
- `cruft doctor` to diagnose missing optional tools
- `cruft config` for configuration management
- MIT License
