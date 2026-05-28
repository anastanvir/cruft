import { existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { exec } from "../lib/exec.ts";
import { getFolderSize } from "../lib/fs-size.ts";
import type { Item, Scanner } from "./types.ts";

interface SimDevice {
  udid: string;
  name: string;
  state: string;
  isAvailable: boolean;
}

interface SimJSON {
  devices: Record<string, SimDevice[]>;
}

export const xcodeScanner: Scanner = {
  id: "xcode",
  displayName: "Xcode",

  async available(): Promise<boolean> {
    try {
      const result = await exec(["xcode-select", "-p"]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  },

  async scan({ onItem, signal }): Promise<void> {
    const home = process.env.HOME ?? "";
    const xcodeLib = join(home, "Library", "Developer", "Xcode");

    // DerivedData
    const derivedData = join(xcodeLib, "DerivedData");
    if (existsSync(derivedData) && !signal.aborted) {
      try {
        const entries = readdirSync(derivedData, { withFileTypes: true });
        for (const entry of entries) {
          if (signal.aborted) {
            return;
          }
          if (!entry.isDirectory()) {
            continue;
          }
          const fullPath = join(derivedData, entry.name);
          const sizeBytes = await getFolderSize(fullPath);
          if (sizeBytes === 0) {
            continue;
          }
          const item: Item = {
            id: `xcode:deriveddata:${entry.name}`,
            source: "xcode",
            name: `DerivedData: ${entry.name}`,
            path: fullPath,
            sizeBytes,
            riskLevel: "safe",
            reason: "Xcode build cache — safe to delete, will be recreated",
            removeStrategy: { kind: "trash", paths: [fullPath] },
          };
          onItem(item);
        }
      } catch {
        // permission
      }
    }

    // Archives
    const archives = join(xcodeLib, "Archives");
    if (existsSync(archives) && !signal.aborted) {
      try {
        const years = readdirSync(archives, { withFileTypes: true });
        for (const year of years) {
          if (signal.aborted) {
            return;
          }
          if (!year.isDirectory()) {
            continue;
          }
          const yearPath = join(archives, year.name);
          const apps = readdirSync(yearPath, { withFileTypes: true });
          for (const app of apps) {
            if (signal.aborted) {
              return;
            }
            if (!app.isDirectory()) {
              continue;
            }
            const appPath = join(yearPath, app.name);
            const sizeBytes = await getFolderSize(appPath);
            if (sizeBytes === 0) {
              continue;
            }
            const item: Item = {
              id: `xcode:archive:${app.name}`,
              source: "xcode",
              name: `Archive: ${basename(app.name, ".xcarchive")}`,
              path: appPath,
              sizeBytes,
              riskLevel: "low",
              reason: "Xcode archive — safe to delete if build is deployed",
              removeStrategy: { kind: "trash", paths: [appPath] },
            };
            onItem(item);
          }
        }
      } catch {
        // permission
      }
    }

    // Simulators
    if (!signal.aborted) {
      const simResult = await exec(["xcrun", "simctl", "list", "--json", "devices"]);
      if (simResult.exitCode === 0) {
        try {
          const simData: SimJSON = JSON.parse(simResult.stdout);
          const shutdownUnavailable: SimDevice[] = [];
          for (const [, devices] of Object.entries(simData.devices)) {
            for (const dev of devices) {
              if (!dev.isAvailable || dev.state === "Shutdown") {
                shutdownUnavailable.push(dev);
              }
            }
          }

          if (shutdownUnavailable.length > 0) {
            const simSize = shutdownUnavailable.length * 500_000_000;
            const item: Item = {
              id: "xcode:simulators",
              source: "xcode",
              name: `Unused Xcode simulators (${shutdownUnavailable.length})`,
              sizeBytes: simSize,
              riskLevel: "low",
              reason: "Unavailable or shutdown simulators",
              removeStrategy: {
                kind: "composite",
                steps: shutdownUnavailable.map((dev) => ({
                  kind: "exec" as const,
                  argv: ["xcrun", "simctl", "delete", dev.udid],
                })),
              },
            };
            onItem(item);
          }
        } catch {
          // parse error
        }
      }
    }

    // DeviceSupport
    const deviceSupport = join(xcodeLib, "iOS DeviceSupport");
    if (existsSync(deviceSupport) && !signal.aborted) {
      try {
        const versions = readdirSync(deviceSupport, { withFileTypes: true });
        for (const version of versions) {
          if (signal.aborted) {
            return;
          }
          if (!version.isDirectory()) {
            continue;
          }
          const verPath = join(deviceSupport, version.name);
          const sizeBytes = await getFolderSize(verPath);
          if (sizeBytes === 0) {
            continue;
          }
          const item: Item = {
            id: `xcode:devicesupport:${version.name}`,
            source: "xcode",
            name: `iOS DeviceSupport: ${version.name}`,
            path: verPath,
            sizeBytes,
            riskLevel: "safe",
            reason: "Old device support files",
            removeStrategy: { kind: "trash", paths: [verPath] },
          };
          onItem(item);
        }
      } catch {
        // permission
      }
    }
  },
};
