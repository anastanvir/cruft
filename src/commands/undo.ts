import { undoLastSession } from "../remover/undo.ts";

export async function undoCommand(): Promise<void> {
  const results = await undoLastSession();

  if (results.length === 0) {
    console.log("No recent delete sessions found in history.");
    return;
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`Undo complete: ${succeeded} restored, ${failed} failed.`);

  for (const r of results) {
    if (!r.success) {
      console.error(`  ${r.itemId}: ${r.error ?? "Unknown error"}`);
    }
  }
}
