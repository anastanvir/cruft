import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BINARY = join(import.meta.dirname, "..", "..", "dist", "cruft");

interface CruftJSON {
  scannedAt: string;
  totalItems: number;
  items: Array<{
    id: string;
    source: string;
    name: string;
    sizeBytes: number;
    riskLevel: string;
    removeStrategy: { kind: string };
  }>;
}

function run(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const result = Bun.spawnSync([BINARY, ...args], {
    env: { ...process.env, CRUFT_NO_CACHE: "1" },
    timeout: 30000,
  });
  return {
    stdout: result.stdout.toString().trim(),
    stderr: result.stderr.toString().trim(),
    exitCode: result.exitCode,
  };
}

describe("E2E", () => {
  it("--version prints version", () => {
    const { stdout, exitCode } = run(["--version"]);
    expect(exitCode).toBe(0);
    expect(stdout).toBe("0.1.0");
  });

  it("--json returns valid JSON with items", { timeout: 30000 }, () => {
    const { stdout, exitCode } = run(["--json"]);
    expect(exitCode).toBe(0);

    const data = JSON.parse(stdout) as CruftJSON;
    expect(data).toHaveProperty("scannedAt");
    expect(data).toHaveProperty("totalItems");
    expect(Array.isArray(data.items)).toBe(true);

    if (data.items.length > 0) {
      const item = data.items[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("source");
      expect(item).toHaveProperty("name");
      expect(typeof item.sizeBytes).toBe("number");
      expect(typeof item.riskLevel).toBe("string");
      expect(item.removeStrategy).toHaveProperty("kind");
    }
  });

  it("--json items have valid source", { timeout: 30000 }, () => {
    const { stdout, exitCode } = run(["--json"]);
    expect(exitCode).toBe(0);

    const data = JSON.parse(stdout) as CruftJSON;
    const validSources = [
      "apps",
      "homebrew",
      "mas",
      "npm-global",
      "docker",
      "xcode",
      "node-modules",
      "version-managers",
      "caches",
    ];

    for (const item of data.items) {
      expect(validSources).toContain(item.source);
    }
  });

  it("--json items have non-negative size", { timeout: 30000 }, () => {
    const { stdout, exitCode } = run(["--json"]);
    expect(exitCode).toBe(0);

    const data = JSON.parse(stdout) as CruftJSON;
    for (const item of data.items) {
      expect(item.sizeBytes).toBeGreaterThanOrEqual(0);
    }
  });

  it("doctor exits successfully", () => {
    const { exitCode } = run(["doctor"]);
    expect(exitCode).toBe(0);
  });

  it("config --path prints config file path", () => {
    const { stdout, exitCode } = run(["config", "--path"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain(".config/cruft/config.toml");
  });

  it("config --get returns value for known key", () => {
    const { stdout, exitCode } = run(["config", "--get", "ui.density"]);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/^(compact|comfortable|\(undefined\))$/);
  });

  it("config --get returns (undefined) for unknown key", () => {
    const { stdout, exitCode } = run(["config", "--get", "nonexistent.key"]);
    expect(exitCode).toBe(0);
    expect(stdout).toBe("(undefined)");
  });

  it("config --set changes a value", () => {
    const configDir = join(homedir(), ".config", "cruft");
    const configPath = join(configDir, "config.toml");

    const backup = existsSync(configPath) ? readFileSync(configPath, "utf-8") : null;

    try {
      const { stdout, exitCode } = run(["config", "--set", "ui.density=comfortable"]);
      expect(exitCode).toBe(0);
      expect(stdout).toContain("comfortable");

      const verify = run(["config", "--get", "ui.density"]);
      expect(verify.stdout).toBe("comfortable");
    } finally {
      if (backup !== null) {
        writeFileSync(configPath, backup, "utf-8");
      } else if (existsSync(configPath)) {
        rmSync(configPath);
      }
    }
  });

  it("undo with no history prints message", () => {
    const { stdout, exitCode } = run(["undo"]);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/no recent|No history|restored/i);
  });
});
