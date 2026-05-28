import { realpathSync } from "node:fs";
import { join, resolve } from "node:path";

const HARD_BLOCKED_PATHS = ["/", "/System", "/Library", "/Users", "/Applications", "/usr", "/bin", "/sbin", "/etc", "/var", "/private"];

export function getHardBlockedPaths(): string[] {
  return [...HARD_BLOCKED_PATHS];
}

function normalize(path: string): string {
  if (path === "/" || path === "") return "/";
  try {
    return realpathSync(path);
  } catch {
    return resolve(path).replace(/\/+$/, "") || "/";
  }
}

export function isHardBlocked(path: string): boolean {
  if (path.includes("..") || path.includes("\0")) {
    return true;
  }

  const resolved = normalize(path);

  if (HARD_BLOCKED_PATHS.includes(resolved)) {
    return true;
  }

  const home = process.env.HOME ?? "";
  const userBlocked = [
    home,
    join(home, "Library"),
    join(home, "Desktop"),
    join(home, "Documents"),
    join(home, "Downloads"),
    join(home, "Pictures"),
    join(home, "Movies"),
    join(home, "Music"),
  ];

  for (const blocked of userBlocked) {
    if (resolved === blocked) {
      return true;
    }
  }

  return false;
}

export function filterBlocked(paths: string[]): string[] {
  return paths.filter((p) => !isHardBlocked(p));
}
