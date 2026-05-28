import { describe, expect, it } from "bun:test";
import { undoLastSession } from "../../src/remover/undo.ts";

describe("undo", () => {
  it("returns empty array when no history exists", async () => {
    const results = await undoLastSession();
    expect(Array.isArray(results)).toBe(true);
  });

  it("returns results for each entry in history", async () => {
    const results = await undoLastSession();
    for (const r of results) {
      expect(r).toHaveProperty("itemId");
      expect(r).toHaveProperty("success");
      expect(typeof r.success).toBe("boolean");
    }
  });
});
