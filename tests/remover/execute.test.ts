import { describe, expect, it } from "bun:test";
import { executeRemoval } from "../../src/remover/execute.ts";
import type { RemovalStep } from "../../src/remover/plan.ts";

describe("removal execution", () => {
  it("returns results for each step", async () => {
    const steps: RemovalStep[] = [
      { itemId: "test:a", strategy: { kind: "trash", paths: [] } },
      { itemId: "test:b", strategy: { kind: "trash", paths: [] } },
    ];

    const results = await executeRemoval(steps);
    expect(results.length).toBe(2);
  });

  it("handles empty steps", async () => {
    const results = await executeRemoval([]);
    expect(results.length).toBe(0);
  });

  it("handles exec strategy gracefully", async () => {
    const steps: RemovalStep[] = [
      {
        itemId: "test:exec",
        strategy: {
          kind: "exec",
          argv: ["echo", "test"],
        },
      },
    ];

    const results = await executeRemoval(steps);
    expect(results.length).toBe(1);
    expect(results[0]?.itemId).toBe("test:exec");
  });

  it("handles exec failure gracefully", async () => {
    const steps: RemovalStep[] = [
      {
        itemId: "test:fail",
        strategy: {
          kind: "exec",
          argv: ["nonexistent-command-12345"],
          cwd: "/nonexistent",
        },
      },
    ];

    const results = await executeRemoval(steps);
    expect(results.length).toBe(1);
    expect(results[0]?.success).toBe(false);
    expect(results[0]?.error).toBeDefined();
  });

  it("handles composite strategy", async () => {
    const steps: RemovalStep[] = [
      {
        itemId: "test:composite",
        strategy: {
          kind: "composite",
          steps: [
            { kind: "trash", paths: [] },
            { kind: "trash", paths: [] },
          ],
        },
      },
    ];

    const results = await executeRemoval(steps);
    expect(results.length).toBe(1);
    expect(results[0]?.success).toBe(true);
  });

  it("refuses exec outside allowlist", async () => {
    const steps: RemovalStep[] = [
      { itemId: "test:bad", strategy: { kind: "exec", argv: ["rm", "-rf", "/"] } },
    ];
    const results = await executeRemoval(steps);
    expect(results[0]?.success).toBe(false);
    expect(results[0]?.error).toContain("allowlist");
  });

  it("refuses exec with shell metachars", async () => {
    const steps: RemovalStep[] = [
      { itemId: "test:meta", strategy: { kind: "exec", argv: ["brew", "uninstall;rm -rf ~"] } },
    ];
    const results = await executeRemoval(steps);
    expect(results[0]?.success).toBe(false);
    expect(results[0]?.error).toContain("metachar");
  });
});
