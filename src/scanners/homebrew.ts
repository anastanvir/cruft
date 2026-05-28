import { execa } from "execa";
import { exec } from "../lib/exec.ts";
import type { Item, Scanner } from "./types.ts";

interface BrewFormula {
  name: string;
  full_name: string;
  installed: Array<{
    version: string;
    installed_on_request: boolean;
    installed_kegs: string[];
    installed_as_dependency: boolean;
    installed_options: string[];
    installed_kegs_info: Array<{
      name: string;
      version: string;
      installed_keg_size_kb: number;
      installed_on_request: boolean;
      installed_as_dependency: boolean;
    }>;
  }>;
}

interface BrewCask {
  name: string;
  full_name: string;
  installed: string;
}

interface BrewJSON {
  formulae: BrewFormula[];
  casks: BrewCask[];
}

export const homebrewScanner: Scanner = {
  id: "homebrew",
  displayName: "Homebrew",

  async available(): Promise<boolean> {
    try {
      const result = await exec(["which", "brew"]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  },

  async scan({ onItem, signal }): Promise<void> {
    const formulaResult = await exec(["brew", "list", "--formula", "--json=v2"]);
    if (formulaResult.exitCode !== 0) {
      return;
    }

    const caskResult = await exec(["brew", "list", "--cask", "--json=v2"]);
    if (signal.aborted) {
      return;
    }

    try {
      const brewData: BrewJSON = {
        formulae: JSON.parse(formulaResult.stdout).formulae ?? [],
        casks: [],
      };

      if (caskResult.exitCode === 0) {
        brewData.casks = JSON.parse(caskResult.stdout).casks ?? [];
      }

      for (const formula of brewData.formulae) {
        if (signal.aborted) {
          return;
        }
        const installedInfo = formula.installed?.[0];
        if (!installedInfo) {
          continue;
        }
        const kegInfo = installedInfo.installed_kegs_info?.[0];
        const sizeBytes = kegInfo?.installed_keg_size_kb ? kegInfo.installed_keg_size_kb * 1024 : 0;

        const item: Item = {
          id: `homebrew:${formula.name}`,
          source: "homebrew",
          name: formula.name,
          sizeBytes,
          riskLevel: installedInfo.installed_on_request ? "medium" : "low",
          reason: installedInfo.installed_on_request
            ? "Explicitly installed — review before removing"
            : installedInfo.installed_as_dependency
              ? "Installed as dependency"
              : undefined,
          removeStrategy: {
            kind: "exec",
            argv: ["brew", "uninstall", formula.name],
          },
        };

        onItem(item);
      }

      for (const cask of brewData.casks) {
        if (signal.aborted) {
          return;
        }
        const appPath = `/Applications/${cask.name}.app`;
        let sizeBytes = 0;
        try {
          const sizeResult = await execa("du", ["-sk", appPath], { reject: false });
          const match = sizeResult.stdout?.match(/^(\d+)/);
          if (match?.[1]) {
            sizeBytes = Number.parseInt(match[1], 10) * 1024;
          }
        } catch {
          // app not in /Applications
        }

        const item: Item = {
          id: `homebrew-cask:${cask.name}`,
          source: "homebrew",
          name: cask.name,
          path: appPath,
          sizeBytes,
          installSource: "homebrew cask",
          riskLevel: "low",
          removeStrategy: {
            kind: "exec",
            argv: ["brew", "uninstall", "--cask", cask.name],
          },
        };

        onItem(item);
      }
    } catch {
      // JSON parse error, skip
    }
  },
};
