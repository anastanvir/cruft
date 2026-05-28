import { describe, expect, it } from "bun:test";
import { buildRemovalPlan } from "../../src/remover/plan.ts";
import type { Item } from "../../src/scanners/types.ts";

function makeItem(id: string, overrides: Partial<Item> = {}): Item {
  return {
    id,
    source: "apps",
    name: `Test ${id}`,
    sizeBytes: 1000,
    riskLevel: "safe",
    removeStrategy: { kind: "trash", paths: ["/tmp/test"] },
    ...overrides,
  };
}

describe("removal plan", () => {
  it("builds a plan for safe items", () => {
    const items = [makeItem("a", { sizeBytes: 100 }), makeItem("b", { sizeBytes: 200 })];
    const plan = buildRemovalPlan(items);

    expect(plan.steps.length).toBe(2);
    expect(plan.blockedItems.length).toBe(0);
    expect(plan.totalSizeBytes).toBe(300);
    expect(plan.itemCount).toBe(2);
  });

  it("blocks high risk items", () => {
    const items = [
      makeItem("safe", { riskLevel: "safe" }),
      makeItem("unsafe", { riskLevel: "high", reason: "System app" }),
    ];
    const plan = buildRemovalPlan(items);

    expect(plan.steps.length).toBe(1);
    expect(plan.blockedItems.length).toBe(1);
    expect(plan.blockedItems[0]?.id).toBe("unsafe");
    expect(plan.blockedItems[0]?.reason).toBe("System app");
  });

  it("blocks paths that resolve to protected locations", () => {
    const items = [
      makeItem("a", {
        removeStrategy: { kind: "trash", paths: ["/"] },
      }),
    ];
    const plan = buildRemovalPlan(items);

    expect(plan.steps.length).toBe(0);
    expect(plan.blockedItems.length).toBe(1);
  });

  it("filters blocked paths from composite strategies", () => {
    const items = [
      makeItem("composite", {
        removeStrategy: {
          kind: "composite",
          steps: [
            { kind: "trash", paths: ["/tmp/safe"] },
            { kind: "trash", paths: ["/"] },
          ],
        },
      }),
    ];
    const plan = buildRemovalPlan(items);

    expect(plan.steps.length).toBe(1);
    expect(plan.steps[0]?.strategy.kind).toBe("composite");
    if (plan.steps[0]?.strategy.kind === "composite") {
      expect(plan.steps[0].strategy.steps.length).toBe(1);
    }
  });

  it("returns empty plan for empty input", () => {
    const plan = buildRemovalPlan([]);
    expect(plan.steps.length).toBe(0);
    expect(plan.blockedItems.length).toBe(0);
    expect(plan.totalSizeBytes).toBe(0);
    expect(plan.itemCount).toBe(0);
  });
});
