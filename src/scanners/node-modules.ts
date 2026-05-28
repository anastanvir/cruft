import { statSync } from "node:fs";
import { dirname, join } from "node:path";
import fastGlob from "fast-glob";
import { getFolderSize } from "../lib/fs-size.ts";
import type { Item, Scanner } from "./types.ts";

export const nodeModulesScanner: Scanner = {
  id: "node-modules",
  displayName: "node_modules",

  async available(): Promise<boolean> {
    return true;
  },

  async scan({ onItem, signal }): Promise<void> {
    const home = process.env.HOME ?? "";
    const staleDays = 90;
    const cutoffMs = Date.now() - staleDays * 24 * 60 * 60 * 1000;

    const paths = await fastGlob("**/node_modules", {
      cwd: home,
      deep: 8,
      onlyDirectories: true,
      ignore: [".Trash/**", "Library/**"],
    });

    if (signal.aborted) {
      return;
    }

    const stalePaths: Array<{ path: string; sizeBytes: number }> = [];

    for (const nmPath of paths) {
      if (signal.aborted) {
        return;
      }

      const fullPath = join(home, nmPath);
      const parentDir = dirname(nmPath);
      const parentFull = join(home, parentDir);

      try {
        const parentStat = statSync(parentFull);
        if (parentStat.mtimeMs > cutoffMs) {
          continue;
        }
      } catch {
        continue;
      }

      const sizeBytes = await getFolderSize(fullPath);
      if (sizeBytes > 0) {
        stalePaths.push({ path: fullPath, sizeBytes });
      }
    }

    if (stalePaths.length > 0) {
      const totalSize = stalePaths.reduce((sum, p) => sum + p.sizeBytes, 0);
      const item: Item = {
        id: "node-modules:stale",
        source: "node-modules",
        name: `node_modules (${stalePaths.length} stale)`,
        sizeBytes: totalSize,
        riskLevel: "safe",
        reason: `Unused ${staleDays}+ days`,
        removeStrategy: {
          kind: "trash",
          paths: stalePaths.map((p) => p.path),
        },
      };
      onItem(item);
    }
  },
};
