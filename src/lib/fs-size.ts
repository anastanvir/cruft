import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execa } from "execa";

interface SizeCacheEntry {
  path: string;
  mtime: number;
  sizeBytes: number;
}

const CACHE_PATH = join(homedir(), ".cache", "cruft", "sizes.json");

function loadCache(): Map<string, SizeCacheEntry> {
  try {
    const data = readFileSync(CACHE_PATH, "utf-8");
    const entries: SizeCacheEntry[] = JSON.parse(data);
    return new Map(entries.map((e) => [e.path, e]));
  } catch {
    return new Map();
  }
}

function saveCache(cache: Map<string, SizeCacheEntry>): void {
  try {
    const dir = join(homedir(), ".cache", "cruft");
    mkdirSync(dir, { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify([...cache.values()], null, 2), "utf-8");
  } catch {
    // cache write failures are non-fatal
  }
}

export async function getFolderSize(path: string): Promise<number> {
  if (process.env.CRUFT_NO_CACHE === "1") {
    try {
      const result = await execa("du", ["-sk", path], { reject: false });
      const match = result.stdout?.match(/^(\d+)/);
      if (match?.[1]) {
        return Number.parseInt(match[1], 10) * 1024;
      }
    } catch {
      // fallback
    }
    return 0;
  }
  const cache = loadCache();
  let mtime = 0;
  try {
    mtime = statSync(path).mtimeMs;
  } catch {
    return 0;
  }

  const cached = cache.get(path);
  if (cached && cached.mtime === mtime) {
    return cached.sizeBytes;
  }

  try {
    const result = await execa("du", ["-sk", path], { reject: false });
    const match = result.stdout?.match(/^(\d+)/);
    if (match?.[1]) {
      const sizeBytes = Number.parseInt(match[1], 10) * 1024;
      cache.set(path, { path, mtime, sizeBytes });
      saveCache(cache);
      return sizeBytes;
    }
  } catch {
    // fallback
  }

  return 0;
}

export async function getFileSize(path: string): Promise<number> {
  return getFolderSize(path);
}
