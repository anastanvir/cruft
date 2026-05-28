import type tty from "node:tty";
import { defineCommand, runMain } from "citty";
import { render } from "ink";
import { App } from "./app.tsx";
import { configCommand } from "./commands/config.ts";
import { doctorCommand } from "./commands/doctor.ts";
import { scanJSONCommand } from "./commands/scan-json.ts";
import { undoCommand } from "./commands/undo.ts";
import { assertMacOS } from "./lib/platform.ts";
import { createCruftStore } from "./state/store.ts";

const noopStdin = {
  isTTY: false,
  on: () => noopStdin,
  once: () => noopStdin,
  off: () => noopStdin,
  removeListener: () => noopStdin,
  addListener: () => noopStdin,
  emit: () => false,
  setRawMode: () => {},
  read: () => null,
  pause: () => noopStdin,
  resume: () => noopStdin,
  destroy: () => noopStdin,
} as unknown as NodeJS.ReadStream;

const main = defineCommand({
  meta: {
    name: "cruft",
    description: "Find and clean gigabytes of developer cruft on your Mac. Terminal-native. Safe by default.",
    version: "0.1.0",
  },
  args: {
    json: { type: "boolean", description: "Output scan results as JSON", alias: "j" },
    "no-color": { type: "boolean", description: "Disable ANSI colors" },
    "no-cache": { type: "boolean", description: "Skip size cache" },
  },
  subCommands: {
    undo: defineCommand({
      meta: { name: "undo", description: "Restore the most recent delete session" },
      run: async () => {
        assertMacOS();
        await undoCommand();
        process.exit(0);
      },
    }),
    doctor: defineCommand({
      meta: { name: "doctor", description: "Diagnose missing optional tools" },
      run: async () => {
        assertMacOS();
        await doctorCommand();
        process.exit(0);
      },
    }),
    config: configCommand,
  },
  run: async ({ args }) => {
    assertMacOS();

    if (args["no-cache"]) {
      process.env.CRUFT_NO_CACHE = "1";
    }

    if (args.json) {
      await scanJSONCommand();
      process.exit(0);
    }

    const origError = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("Maximum update depth exceeded")) {
        return;
      }
      origError(...args);
    };

    const store = createCruftStore();
    const altScreenOn = "\u001b[?1049h";
    const altScreenOff = "\u001b[?1049l";

    if (process.stdout.isTTY) {
      process.stdout.write(altScreenOn);
    }

    let rawMode = false;
    try {
      const stdin = process.stdin as unknown as tty.ReadStream;
      if (stdin.isTTY) {
        stdin.setRawMode(true);
        rawMode = true;
      }
    } catch {
      // stdin echoing can't be disabled in this runtime
    }

    function restoreScreen() {
      try {
        if (rawMode) {
          const stdin = process.stdin as unknown as tty.ReadStream;
          stdin.setRawMode(false);
        }
        if (process.stdout.isTTY) {
          process.stdout.write(altScreenOff);
        }
      } catch {}
    }

    const { waitUntilExit } = render(<App store={store} />, {
      stdin: noopStdin,
    });

    process.on("SIGINT", () => {
      restoreScreen();
      process.exit(0);
    });

    process.on("exit", restoreScreen);

    await waitUntilExit();
    restoreScreen();
  },
});

runMain(main);
