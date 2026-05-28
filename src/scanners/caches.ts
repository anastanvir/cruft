import { existsSync, readdirSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getFolderSize } from "../lib/fs-size.ts";
import type { Item, Scanner } from "./types.ts";

function resolveAppName(bundleId: string): string {
  const _home = process.env.HOME ?? "";
  const appsDir = "/Applications";
  if (!existsSync(appsDir)) {
    return bundleId;
  }
  try {
    const entries = readdirSync(appsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.name.endsWith(".app")) {
        continue;
      }
      const infoPlist = join(appsDir, entry.name, "Contents", "Info.plist");
      if (!existsSync(infoPlist)) {
        continue;
      }
      const content = readFileSync(infoPlist, "utf-8");
      const match = content.match(/CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
      if (match?.[1] === bundleId) {
        return entry.name.replace(/\.app$/, "");
      }
    }
  } catch {
    // permission
  }
  return bundleId;
}

export const cachesScanner: Scanner = {
  id: "caches",
  displayName: "Caches",

  async available(): Promise<boolean> {
    return true;
  },

  async scan({ onItem, signal }): Promise<void> {
    const home = process.env.HOME ?? "";
    const cachesDir = join(home, "Library", "Caches");

    if (!existsSync(cachesDir)) {
      return;
    }

    const MIN_SIZE = 50 * 1024 * 1024;

    try {
      const entries = readdirSync(cachesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (signal.aborted) {
          return;
        }
        if (!entry.isDirectory()) {
          continue;
        }
        if (entry.name === "." || entry.name === "..") {
          continue;
        }
        const fullPath = join(cachesDir, entry.name);
        const sizeBytes = await getFolderSize(fullPath);
        if (sizeBytes < MIN_SIZE) {
          continue;
        }
        const appName = resolveAppName(entry.name);

        const item: Item = {
          id: `caches:${entry.name}`,
          source: "caches",
          name: `${appName} cache`,
          path: fullPath,
          sizeBytes,
          riskLevel: "safe",
          reason: "App cache >50 MB",
          removeStrategy: { kind: "trash", paths: [fullPath] },
        };

        onItem(item);
      }
    } catch {
      // permission
    }
  },
};
