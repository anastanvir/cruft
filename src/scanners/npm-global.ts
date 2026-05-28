import { exec } from "../lib/exec.ts";
import { getFolderSize } from "../lib/fs-size.ts";
import type { Item, Scanner } from "./types.ts";

interface NPMPackage {
  name: string;
  version: string;
  resolved?: string;
  dependencies?: Record<string, unknown>;
}

interface NPMGlobalJSON {
  dependencies: Record<string, NPMPackage>;
}

export const npmGlobalScanner: Scanner = {
  id: "npm-global",
  displayName: "npm Globals",

  async available(): Promise<boolean> {
    try {
      const result = await exec(["which", "npm"]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  },

  async scan({ onItem, signal }): Promise<void> {
    const prefixResult = await exec(["npm", "root", "-g"]);
    if (prefixResult.exitCode !== 0) {
      return;
    }
    const globalPrefix = prefixResult.stdout.trim();

    const lsResult = await exec(["npm", "ls", "-g", "--json", "--depth=0"]);
    if (lsResult.exitCode !== 0) {
      return;
    }

    if (signal.aborted) {
      return;
    }

    try {
      const data: NPMGlobalJSON = JSON.parse(lsResult.stdout);
      const deps = data.dependencies ?? {};

      for (const [name, _pkg] of Object.entries(deps)) {
        if (signal.aborted) {
          return;
        }
        if (name === "cruft") {
          continue;
        }

        const pkgPath = `${globalPrefix}/${name}`;
        const sizeBytes = await getFolderSize(pkgPath);

        const item: Item = {
          id: `npm-global:${name}`,
          source: "npm-global",
          name: name,
          path: pkgPath,
          sizeBytes,
          installSource: "npm",
          riskLevel: "low",
          removeStrategy: {
            kind: "exec",
            argv: ["npm", "uninstall", "-g", name],
          },
        };

        onItem(item);
      }
    } catch {
      // JSON parse error
    }
  },
};
