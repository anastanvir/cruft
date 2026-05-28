import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { exec } from "../lib/exec.ts";
import { getFolderSize } from "../lib/fs-size.ts";
import type { Item, Scanner } from "./types.ts";

async function scanNVM(onItem: (item: Item) => void, signal: AbortSignal): Promise<void> {
  const nvmDir = join(process.env.HOME ?? "", ".nvm");
  if (!existsSync(nvmDir)) {
    return;
  }

  const result = await exec(["bash", "-lc", "source ~/.nvm/nvm.sh && nvm ls --no-alias"]);
  if (result.exitCode !== 0) {
    return;
  }

  const lines = result.stdout.trim().split("\n");
  let currentVersion: string | undefined;
  const installedVersions: string[] = [];

  for (const line of lines) {
    if (signal.aborted) {
      return;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith("->")) {
      currentVersion = trimmed
        .replace("->", "")
        .trim()
        .replace(/\s*\(.*\)/, "");
    } else if (trimmed.startsWith("*")) {
      currentVersion = trimmed
        .replace("*", "")
        .trim()
        .replace(/\s*\(.*\)/, "");
    } else if (trimmed.match(/^v?\d/)) {
      const v = trimmed.replace(/\s*\(.*\)/, "").trim();
      installedVersions.push(v);
    }
  }

  for (const v of installedVersions) {
    if (signal.aborted) {
      return;
    }
    if (v === currentVersion) {
      continue;
    }
    const verPath = join(nvmDir, "versions", "node", v);
    if (!existsSync(verPath)) {
      continue;
    }
    const sizeBytes = await getFolderSize(verPath);
    const item: Item = {
      id: `nvm:${v}`,
      source: "version-managers",
      name: `Node ${v} (nvm)`,
      path: verPath,
      sizeBytes,
      riskLevel: "low",
      reason: currentVersion ? `Current: ${currentVersion}` : "Non-default version",
      removeStrategy: { kind: "trash", paths: [verPath] },
    };
    onItem(item);
  }
}

async function scanPyenv(onItem: (item: Item) => void, signal: AbortSignal): Promise<void> {
  const pyenvRoot = join(process.env.HOME ?? "", ".pyenv");
  if (!existsSync(pyenvRoot)) {
    return;
  }

  const versionsDir = join(pyenvRoot, "versions");
  if (!existsSync(versionsDir)) {
    return;
  }

  const currentResult = await exec(["pyenv", "version"]);
  const currentVersion = currentResult.exitCode === 0 ? currentResult.stdout.trim().split(/\s+/)[0] : undefined;

  try {
    const entries = readdirSync(versionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (signal.aborted) {
        return;
      }
      if (!entry.isDirectory()) {
        continue;
      }
      if (entry.name === currentVersion) {
        continue;
      }
      const verPath = join(versionsDir, entry.name);
      const sizeBytes = await getFolderSize(verPath);
      const item: Item = {
        id: `pyenv:${entry.name}`,
        source: "version-managers",
        name: `Python ${entry.name} (pyenv)`,
        path: verPath,
        sizeBytes,
        riskLevel: "low",
        reason: currentVersion ? `Current: ${currentVersion}` : "Non-default version",
        removeStrategy: {
          kind: "exec",
          argv: ["pyenv", "uninstall", entry.name],
        },
      };
      onItem(item);
    }
  } catch {
    // permission
  }
}

async function scanRbenv(onItem: (item: Item) => void, signal: AbortSignal): Promise<void> {
  const rbenvRoot = join(process.env.HOME ?? "", ".rbenv");
  if (!existsSync(rbenvRoot)) {
    return;
  }

  const versionsDir = join(rbenvRoot, "versions");
  if (!existsSync(versionsDir)) {
    return;
  }

  const currentResult = await exec(["rbenv", "version"]);
  const currentVersion = currentResult.exitCode === 0 ? currentResult.stdout.trim().split(/\s+/)[0] : undefined;

  try {
    const entries = readdirSync(versionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (signal.aborted) {
        return;
      }
      if (!entry.isDirectory()) {
        continue;
      }
      if (entry.name === currentVersion) {
        continue;
      }
      const verPath = join(versionsDir, entry.name);
      const sizeBytes = await getFolderSize(verPath);
      const item: Item = {
        id: `rbenv:${entry.name}`,
        source: "version-managers",
        name: `Ruby ${entry.name} (rbenv)`,
        path: verPath,
        sizeBytes,
        riskLevel: "low",
        reason: currentVersion ? `Current: ${currentVersion}` : "Non-default version",
        removeStrategy: {
          kind: "exec",
          argv: ["rbenv", "uninstall", entry.name],
        },
      };
      onItem(item);
    }
  } catch {
    // permission
  }
}

export const versionManagersScanner: Scanner = {
  id: "version-managers",
  displayName: "Version Managers",

  async available(): Promise<boolean> {
    return true;
  },

  async scan({ onItem, signal }): Promise<void> {
    await scanNVM(onItem, signal);
    if (signal.aborted) {
      return;
    }
    await scanPyenv(onItem, signal);
    if (signal.aborted) {
      return;
    }
    await scanRbenv(onItem, signal);
  },
};
