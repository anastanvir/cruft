import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { cleanup, render } from "ink-testing-library";
import { ItemsPane } from "../../src/components/items-pane.tsx";
import type { Item } from "../../src/scanners/types.ts";
import { createCruftStore } from "../../src/state/store.ts";

function makeItem(id: string, sizeBytes: number, overrides: Partial<Item> = {}): Item {
  return {
    id,
    source: "apps",
    name: `Test ${id}`,
    sizeBytes,
    riskLevel: "safe",
    removeStrategy: { kind: "trash", paths: ["/tmp/test"] },
    ...overrides,
  };
}

describe("ItemsPane", () => {
  let store: ReturnType<typeof createCruftStore>;

  beforeEach(() => {
    store = createCruftStore();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows items title", () => {
    const { lastFrame } = render(<ItemsPane store={store} />);
    expect(lastFrame()).toContain("ITEMS");
  });

  it("shows empty count", () => {
    const { lastFrame } = render(<ItemsPane store={store} />);
    expect(lastFrame()).toContain("0 total");
  });

  it("shows item count", () => {
    store.getState().addItem(makeItem("a", 1_000));
    store.getState().addItem(makeItem("b", 2_000));
    const { lastFrame } = render(<ItemsPane store={store} />);
    expect(lastFrame()).toContain("2 total");
  });

  it("shows item name and size", () => {
    store.getState().addItem(makeItem("foo", 1_500_000_000));
    const { lastFrame } = render(<ItemsPane store={store} />);
    expect(lastFrame()).toContain("Test foo");
    expect(lastFrame()).toContain("GB");
  });

  it("shows selection indicator", () => {
    store.getState().addItem(makeItem("a", 1_000));
    store.getState().toggleSelect("a");
    const { lastFrame } = render(<ItemsPane store={store} />);
    expect(lastFrame()).toContain("Test a");
  });

  it("shows sort indicator", () => {
    store.getState().setSort({ key: "name" });
    store.getState().addItem(makeItem("a", 1_000));
    const { lastFrame } = render(<ItemsPane store={store} />);
    expect(lastFrame()).toContain("name");
  });
});
