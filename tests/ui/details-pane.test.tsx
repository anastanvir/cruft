import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { cleanup, render } from "ink-testing-library";
import { DetailsPane } from "../../src/components/details-pane.tsx";
import type { Item } from "../../src/scanners/types.ts";
import { createCruftStore } from "../../src/state/store.ts";

function makeItem(id: string, overrides: Partial<Item> = {}): Item {
  return {
    id,
    source: "apps",
    name: "TestApp",
    sizeBytes: 1_000_000,
    riskLevel: "safe",
    removeStrategy: { kind: "trash", paths: ["/tmp/test"] },
    ...overrides,
  };
}

describe("DetailsPane", () => {
  let store: ReturnType<typeof createCruftStore>;

  beforeEach(() => {
    store = createCruftStore();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows placeholder when no item selected", () => {
    const { lastFrame } = render(<DetailsPane store={store} />);
    expect(lastFrame()).toContain("DETAILS");
    expect(lastFrame()).toContain("No item selected");
  });

  it("shows item details when cursor is set", () => {
    store
      .getState()
      .addItem(makeItem("test:1", { path: "/tmp/test", sizeBytes: 1_000_000, lastUsed: new Date("2024-01-01") }));
    store.getState().setCursor("test:1");

    const { lastFrame } = render(<DetailsPane store={store} />);
    expect(lastFrame()).toContain("TestApp");
    expect(lastFrame()).toContain("KB");
    expect(lastFrame()).toContain("/tmp/test");
    expect(lastFrame()).toContain("trash");
  });

  it("shows reason when present", () => {
    store.getState().addItem(makeItem("test:1", { reason: "Unused 180d" }));
    store.getState().setCursor("test:1");

    const { lastFrame } = render(<DetailsPane store={store} />);
    expect(lastFrame()).toContain("Unused 180d");
  });

  it("shows risk level", () => {
    store.getState().addItem(makeItem("test:1", { riskLevel: "safe" }));
    store.getState().setCursor("test:1");

    const { lastFrame } = render(<DetailsPane store={store} />);
    expect(lastFrame()).toContain("Safe");
  });

  it("shows high risk warning", () => {
    store.getState().addItem(makeItem("test:1", { riskLevel: "high" }));
    store.getState().setCursor("test:1");

    const { lastFrame } = render(<DetailsPane store={store} />);
    expect(lastFrame()).toContain("Unsafe");
  });
});
