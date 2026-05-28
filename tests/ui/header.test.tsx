import { beforeEach, describe, expect, it } from "bun:test";
import { render } from "ink-testing-library";
import { Header } from "../../src/components/header.tsx";
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

describe("Header", () => {
  let store: ReturnType<typeof createCruftStore>;

  beforeEach(() => {
    store = createCruftStore();
  });

  it("shows cruft version", () => {
    const { lastFrame } = render(<Header store={store} />);
    expect(lastFrame()).toContain("cruft v0.1.0");
  });

  it("shows zero state", () => {
    const { lastFrame } = render(<Header store={store} />);
    expect(lastFrame()).toContain("Cruft: 0 B (0 items)");
    expect(lastFrame()).toContain("Selected: 0 B (0 items)");
  });

  it("shows total cruft size", () => {
    store.getState().addItem(makeItem("a", 1_500_000_000));
    store.getState().addItem(makeItem("b", 500_000_000));
    const { lastFrame } = render(<Header store={store} />);
    expect(lastFrame()).toContain("Cruft:");
    expect(lastFrame()).toContain("2 items");
  });

  it("shows selected totals", () => {
    store.getState().addItem(makeItem("a", 1_000_000_000));
    store.getState().addItem(makeItem("b", 500_000_000));
    store.getState().toggleSelect("a");
    const { lastFrame } = render(<Header store={store} />);
    expect(lastFrame()).toContain("Selected:");
    expect(lastFrame()).toContain("1 items");
  });

  it("shows selection as muted when empty", () => {
    const { lastFrame } = render(<Header store={store} />);
    expect(lastFrame()).toContain("Selected: 0 B (0 items)");
  });
});
