import { defineCommand } from "citty";
import { getConfigPath, getConfigValue, loadConfig, saveConfig } from "../config.ts";

export const configCommand = defineCommand({
  meta: { name: "config", description: "Get/set configuration values" },
  args: {
    get: { type: "string", description: "Get a config value" },
    set: { type: "string", description: "Set a config value (format: key=value)" },
    path: { type: "boolean", description: "Print config file path" },
  },
  run: async ({ args }) => {
    if (args.path) {
      console.log(getConfigPath());
      process.exit(0);
    }
    if (args.get) {
      const val = getConfigValue(args.get);
      console.log(val ?? "(undefined)");
      process.exit(0);
    }
    if (typeof args.set === "string") {
      const eqIndex = args.set.indexOf("=");
      if (eqIndex === -1) {
        const parts = args.set.split(" ");
        if (parts.length >= 2) {
          applyConfig(parts[0], parts.slice(1).join(" "));
        } else {
          console.error("Usage: cruft config set <key>=<value> or cruft config set <key> <value>");
        }
      } else {
        const key = args.set.slice(0, eqIndex);
        const value = args.set.slice(eqIndex + 1);
        applyConfig(key, value);
      }
      process.exit(0);
    }
    console.log(getConfigPath());
    process.exit(0);
  },
});

function applyConfig(key: string, value: string): void {
  const config = loadConfig();
  const parts = key.split(".");
  let current: Record<string, unknown> = config as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (part === undefined) {
      break;
    }
    if (!(part in current) || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  const lastPart = parts[parts.length - 1];
  if (lastPart === undefined) {
    console.error("Empty config key");
    return;
  }
  const numValue = Number(value);
  if (!Number.isNaN(numValue) && value.includes(".") === numValue.toString().includes(".")) {
    current[lastPart] = numValue;
  } else if (value === "true") {
    current[lastPart] = true;
  } else if (value === "false") {
    current[lastPart] = false;
  } else {
    current[lastPart] = value;
  }
  saveConfig(config);
  console.log(`Set ${key} = ${value}`);
}
