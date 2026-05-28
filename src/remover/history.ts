import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface HistoryEntry {
  itemId: string;
  name: string;
  source: string;
  sizeBytes: number;
  status: "removed" | "failed" | "unrecoverable";
  error?: string;
  timestamp: string;
}

export interface HistorySession {
  id: string;
  createdAt: string;
  entries: HistoryEntry[];
}

const HISTORY_DIR = join(homedir(), ".cruft", "history");

function ensureDir(): void {
  mkdirSync(HISTORY_DIR, { recursive: true });
}

export function writeHistory(entries: HistoryEntry[]): string {
  ensureDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${timestamp}.json`;

  const session: HistorySession = {
    id: timestamp,
    createdAt: new Date().toISOString(),
    entries,
  };

  writeFileSync(join(HISTORY_DIR, filename), JSON.stringify(session, null, 2), "utf-8");
  return filename;
}

export function getMostRecentSession(): HistorySession | undefined {
  ensureDir();

  try {
    const files = readdirSync(HISTORY_DIR);
    const jsonFiles = files
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();

    if (jsonFiles.length === 0) {
      return undefined;
    }

    const latest = jsonFiles[0];
    if (!latest) {
      return undefined;
    }

    const data = readFileSync(join(HISTORY_DIR, latest), "utf-8");
    return JSON.parse(data) as HistorySession;
  } catch {
    return undefined;
  }
}

export function listHistorySessions(): HistorySession[] {
  ensureDir();

  try {
    const files = readdirSync(HISTORY_DIR);
    const jsonFiles = files
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();

    return jsonFiles
      .map((f) => {
        try {
          const data = readFileSync(join(HISTORY_DIR, f), "utf-8");
          return JSON.parse(data) as HistorySession;
        } catch {
          return null;
        }
      })
      .filter((s): s is HistorySession => s !== null);
  } catch {
    return [];
  }
}
