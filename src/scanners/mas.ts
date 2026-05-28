import { exec } from "../lib/exec.ts";
import { getFolderSize } from "../lib/fs-size.ts";
import { getLastUsed } from "../lib/last-used.ts";
import type { Item, Scanner } from "./types.ts";

interface MASApp {
  id: string;
  name: string;
  version: string;
}

function parseMASList(output: string): MASApp[] {
  const apps: MASApp[] = [];
  const lines = output.trim().split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\d+)\s+(.+?)\s+\(([^)]+)\)$/);
    if (match) {
      apps.push({ id: match[1], name: match[2].trim(), version: match[3] });
    }
  }
  return apps;
}

export const masScanner: Scanner = {
  id: "mas",
  displayName: "Mac App Store",

  async available(): Promise<boolean> {
    try {
      const result = await exec(["which", "mas"]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  },

  async scan({ onItem, signal }): Promise<void> {
    const result = await exec(["mas", "list"]);
    if (result.exitCode !== 0) {
      return;
    }

    const apps = parseMASList(result.stdout);
    for (const app of apps) {
      if (signal.aborted) {
        return;
      }

      const appPath = `/Applications/${app.name}.app`;
      const sizeBytes = await getFolderSize(appPath);
      const lastUsed = await getLastUsed(appPath);

      const item: Item = {
        id: `mas:${app.id}`,
        source: "mas",
        name: app.name,
        path: appPath,
        sizeBytes,
        lastUsed,
        installSource: "Mac App Store",
        riskLevel: "low",
        removeStrategy: {
          kind: "exec",
          argv: ["mas", "uninstall", app.id],
        },
      };

      onItem(item);
    }
  },
};
