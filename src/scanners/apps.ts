import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { getFolderSize } from "../lib/fs-size.ts";
import { getLastUsed } from "../lib/last-used.ts";
import { APP_BLOCKLIST } from "./apps.blocklist.ts";
import type { Item, Scanner } from "./types.ts";

interface AppInfo {
  path: string;
  name: string;
  bundleId?: string;
  isAppStore: boolean;
}

function getBundleId(appPath: string): string | undefined {
  const infoPlist = join(appPath, "Contents", "Info.plist");
  if (!existsSync(infoPlist)) {
    return undefined;
  }
  try {
    const content = readFileSync(infoPlist, "utf-8");
    const match = content.match(/CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
    return match?.[1];
  } catch {
    return undefined;
  }
}

function hasMASReceipt(appPath: string): boolean {
  return existsSync(join(appPath, "Contents", "_MASReceipt"));
}

function findApps(basePath: string): AppInfo[] {
  if (!existsSync(basePath)) {
    return [];
  }
  const results: AppInfo[] = [];
  try {
    const entries = readdirSync(basePath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.endsWith(".app")) {
        continue;
      }
      const appPath = join(basePath, entry.name);
      const bundleId = getBundleId(appPath);
      results.push({
        path: appPath,
        name: basename(entry.name, ".app"),
        bundleId,
        isAppStore: hasMASReceipt(appPath),
      });
    }
  } catch {
    // permission denied, skip
  }
  return results;
}

export const appsScanner: Scanner = {
  id: "apps",
  displayName: "Apps",

  async available(): Promise<boolean> {
    return true;
  },

  async scan({ onItem, signal }): Promise<void> {
    const appDirs = ["/Applications", join(process.env.HOME ?? "", "Applications")];

    for (const dir of appDirs) {
      if (signal.aborted) {
        return;
      }
      const apps = findApps(dir);
      for (const app of apps) {
        if (signal.aborted) {
          return;
        }

        const sizeBytes = await getFolderSize(app.path);
        const lastUsed = await getLastUsed(app.path);
        const isBlocked = APP_BLOCKLIST.includes(`${app.name}.app`);

        const supportPaths: string[] = [];
        if (app.bundleId) {
          const home = process.env.HOME ?? "";
          const lib = join(home, "Library");
          const candidate = join(lib, "Application Support", app.bundleId);
          if (existsSync(candidate)) {
            supportPaths.push(candidate);
          }
          const prefs = join(lib, "Preferences", `${app.bundleId}.plist`);
          if (existsSync(prefs)) {
            supportPaths.push(prefs);
          }
          const caches = join(lib, "Caches", app.bundleId);
          if (existsSync(caches)) {
            supportPaths.push(caches);
          }
        }

        const item: Item = {
          id: `apps:${app.path}`,
          source: "apps",
          name: app.name,
          path: app.path,
          sizeBytes,
          lastUsed,
          installSource: app.isAppStore ? "App Store" : "Drag-installed",
          riskLevel: isBlocked ? "high" : "low",
          reason: isBlocked ? "System app — removing may break macOS" : undefined,
          removeStrategy: { kind: "trash", paths: [app.path, ...supportPaths] },
        };

        onItem(item);
      }
    }
  },
};
