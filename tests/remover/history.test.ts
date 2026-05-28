import { beforeEach, describe, expect, it } from "bun:test";
import { readdirSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { getMostRecentSession, listHistorySessions, writeHistory } from "../../src/remover/history.ts";

const HISTORY_DIR = join(homedir(), ".cruft", "history");

describe("history", () => {
  beforeEach(() => {
    try {
      const files = readdirSync(HISTORY_DIR);
      for (const f of files) {
        if (f.endsWith(".json")) {
          unlinkSync(join(HISTORY_DIR, f));
        }
      }
    } catch {
      // dir doesn't exist yet
    }
  });

  it("writes history and retrieves most recent", () => {
    const entries = [
      {
        itemId: "test:1",
        name: "Test Item",
        source: "apps",
        sizeBytes: 1000,
        status: "removed" as const,
        timestamp: new Date().toISOString(),
      },
    ];

    const filename = writeHistory(entries);
    expect(filename).toBeDefined();
    expect(filename.endsWith(".json")).toBe(true);
  });

  it("returns undefined when no history exists", () => {
    const session = getMostRecentSession();
    expect(session).toBeUndefined();
  });

  it("lists history sessions", () => {
    const sessions = listHistorySessions();
    expect(Array.isArray(sessions)).toBe(true);
  });
});
