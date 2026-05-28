const ALLOWED_BINARIES: ReadonlySet<string> = new Set([
  "brew",
  "mas",
  "npm",
  "pyenv",
  "rbenv",
  "docker",
  "xcrun",
]);

const SHELL_METACHARS = /[;&|`$()<>\n\r]/;

export function isExecAllowed(argv: readonly string[]): { ok: true } | { ok: false; reason: string } {
  if (argv.length === 0) {
    return { ok: false, reason: "empty argv" };
  }
  const bin = argv[0];
  if (!bin) {
    return { ok: false, reason: "missing binary" };
  }
  if (bin.includes("/")) {
    return { ok: false, reason: `absolute/relative path not allowed: ${bin}` };
  }
  if (!ALLOWED_BINARIES.has(bin)) {
    return { ok: false, reason: `binary not in allowlist: ${bin}` };
  }
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (typeof arg !== "string") {
      return { ok: false, reason: `non-string arg at index ${i}` };
    }
    if (SHELL_METACHARS.test(arg)) {
      return { ok: false, reason: `arg contains shell metachar: ${arg}` };
    }
  }
  return { ok: true };
}
