export function isMacOS(): boolean {
  return typeof process !== "undefined" && process.platform === "darwin";
}

export function assertMacOS(): void {
  if (!isMacOS()) {
    console.error("cruft only supports macOS. Found:", process.platform);
    process.exit(1);
  }
}

export function getHomeDir(): string {
  return process.env.HOME ?? process.env.USERPROFILE ?? "/Users/unknown";
}
