import { homedir } from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import { getMostRecentSession } from "./history.ts";

export interface UndoResult {
  itemId: string;
  success: boolean;
  error?: string;
}

async function restoreFromTrash(originalName: string): Promise<boolean> {
  const trashDir = join(homedir(), ".Trash");
  const trashPath = join(trashDir, originalName);

  try {
    const result = await execa("test", ["-e", trashPath], { reject: false });
    if (result.exitCode !== 0) {
      return false;
    }

    await execa("osascript", ["-e", `tell app "Finder" to restore item POSIX file "${trashPath}"`], {
      reject: false,
    });
    return true;
  } catch {
    return false;
  }
}

export async function undoLastSession(): Promise<UndoResult[]> {
  const session = getMostRecentSession();
  if (!session) {
    return [];
  }

  const results: UndoResult[] = [];

  for (const entry of session.entries) {
    if (entry.status !== "removed") {
      results.push({
        itemId: entry.itemId,
        success: false,
        error: entry.status === "unrecoverable" ? "Item was emptied from Trash" : "Item was not successfully removed",
      });
      continue;
    }

    const restored = await restoreFromTrash(entry.name);
    if (restored) {
      results.push({ itemId: entry.itemId, success: true });
    } else {
      results.push({
        itemId: entry.itemId,
        success: false,
        error: "Not found in Trash — may have been emptied",
      });
    }
  }

  return results;
}
