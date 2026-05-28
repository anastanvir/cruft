import { beforeEach, describe, expect, it } from "bun:test";
import type { Item } from "../../src/scanners/types.ts";
import { getHighlightedItem, getSelectionTotals, getSourceCounts, getVisibleItems } from "../../src/state/selectors.ts";
import { createCruftStore } from "../../src/state/store.ts";

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

describe("selectors", () => {
  let store: ReturnType<typeof createCruftStore>;

  beforeEach(() => {
    store = createCruftStore();
  });

  it("getVisibleItems returns all items when no filter", () => {
    store.getState().addItem(makeItem("a"));
    store.getState().addItem(makeItem("b"));
    const visible = getVisibleItems(store.getState());
    expect(visible.length).toBe(2);
  });

  it("getVisibleItems filters by source", () => {
    store.getState().addItem(makeItem("a", { source: "apps" }));
    store.getState().addItem(makeItem("b", { source: "homebrew" }));
    store.getState().setActiveSource("apps");
    const visible = getVisibleItems(store.getState());
    expect(visible.length).toBe(1);
    expect(visible[0]?.id).toBe("a");
  });

  it("getVisibleItems filters by staleDays", () => {
    const longAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    const recent = new Date();
    store.getState().addItem(makeItem("old", { lastUsed: longAgo }));
    store.getState().addItem(makeItem("new", { lastUsed: recent }));

    store.getState().setFilter({ staleDays: 90 });
    const visible = getVisibleItems(store.getState());
    expect(visible.length).toBe(1);
    expect(visible[0]?.id).toBe("old");
  });

  it("getVisibleItems sorts by size desc by default", () => {
    store.getState().addItem(makeItem("small", { sizeBytes: 100 }));
    store.getState().addItem(makeItem("large", { sizeBytes: 10000 }));
    store.getState().addItem(makeItem("medium", { sizeBytes: 1000 }));

    const visible = getVisibleItems(store.getState());
    expect(visible[0]?.id).toBe("large");
    expect(visible[1]?.id).toBe("medium");
    expect(visible[2]?.id).toBe("small");
  });

  it("getSelectionTotals returns correct counts", () => {
    store.getState().addItem(makeItem("a", { sizeBytes: 100 }));
    store.getState().addItem(makeItem("b", { sizeBytes: 200 }));
    store.getState().addItem(makeItem("c", { sizeBytes: 300 }));

    store.getState().toggleSelect("a");
    store.getState().toggleSelect("c");

    const totals = getSelectionTotals(store.getState());
    expect(totals.count).toBe(2);
    expect(totals.sizeBytes).toBe(400);
  });

  it("getSourceCounts returns per-source counts", () => {
    store.getState().addItem(makeItem("a", { source: "apps", sizeBytes: 100 }));
    store.getState().addItem(makeItem("b", { source: "apps", sizeBytes: 200 }));
    store.getState().addItem(makeItem("c", { source: "homebrew", sizeBytes: 300 }));

    const counts = getSourceCounts(store.getState());
    expect(counts.apps.count).toBe(2);
    expect(counts.apps.sizeBytes).toBe(300);
    expect(counts.homebrew.count).toBe(1);
    expect(counts.homebrew.sizeBytes).toBe(300);
  });

  it("getHighlightedItem returns the cursor item", () => {
    store.getState().addItem(makeItem("a"));
    store.getState().setCursor("a");

    const highlighted = getHighlightedItem(store.getState());
    expect(highlighted?.id).toBe("a");
  });

  it("getHighlightedItem returns undefined when no cursor", () => {
    const highlighted = getHighlightedItem(store.getState());
    expect(highlighted).toBeUndefined();
  });
});
