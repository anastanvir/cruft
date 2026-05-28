# Safety

cruft is built around seven hard principles:

1. **The tool never decides what to delete.** The user always pulls the trigger.
2. **Nothing is pre-selected.** Selection starts empty on every launch.
3. **Dry-run by default.** Even after the user selects items, the first action shows what *would* be removed unless the explicit confirmation step is completed.
4. **Trash, not delete.** Every removal goes to macOS Trash and is recoverable for at least 30 days.
5. **Undo log.** Every removal session is journaled to `~/.cruft/history/<iso-timestamp>.json` and is restorable via `cruft undo`.
6. **Read-only by default.** Scanners must not mutate state. Tests must enforce this.
7. **No telemetry without opt-in.** No network calls unless the user opts in via `cruft config set telemetry true`.
