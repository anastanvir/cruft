import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { parse, stringify } from "smol-toml";
import { z } from "zod";

const ConfigSchema = z.object({
  ui: z
    .object({
      density: z.enum(["compact", "comfortable"]).default("compact"),
      theme: z.string().default("mocha"),
    })
    .default({}),
  scanners: z
    .object({
      enabled: z
        .array(z.string())
        .default([
          "apps",
          "homebrew",
          "npm-global",
          "docker",
          "xcode",
          "node-modules",
          "version-managers",
          "caches",
          "mas",
        ]),
      "node-modules": z
        .object({
          "stale-days": z.number().default(90),
          ignore: z.array(z.string()).default(["Library/**", "**/Pods/**"]),
        })
        .default({}),
    })
    .default({}),
  keybindings: z.record(z.string()).default({}),
  telemetry: z
    .object({
      enabled: z.boolean().default(false),
    })
    .default({}),
});

export type CruftConfig = z.infer<typeof ConfigSchema>;

const CONFIG_PATH = join(homedir(), ".config", "cruft", "config.toml");

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function loadConfig(): CruftConfig {
  try {
    if (!existsSync(CONFIG_PATH)) {
      return ConfigSchema.parse({});
    }
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const parsed = parse(raw);
    return ConfigSchema.parse(parsed);
  } catch {
    return ConfigSchema.parse({});
  }
}

export function saveConfig(config: CruftConfig): void {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  const toml = stringify(config as Record<string, unknown>);
  writeFileSync(CONFIG_PATH, toml, "utf-8");
}

export function getConfigValue(key: string): unknown {
  const config = loadConfig();
  const parts = key.split(".");
  let current: Record<string, unknown> = config as unknown as Record<string, unknown>;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      const val = current[part];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        current = val as Record<string, unknown>;
      } else {
        return val;
      }
    } else {
      return undefined;
    }
  }
  return current;
}
