import { beforeEach, describe, expect, it } from "bun:test";
import type { Item } from "../../src/scanners/types.ts";
import { createCruftStore } from "../../src/state/store.ts";

function makeTestItem(id: string, overrides: Partial<Item> = {}): Item {
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

describe("store", () => {
  let store: ReturnType<typeof createCruftStore>;

  beforeEach(() => {
    store = createCruftStore();
  });

  it("starts empty", () => {
    const state = store.getState();
    expect(state.items.size).toBe(0);
    expect(state.selection.size).toBe(0);
    expect(state.modal).toBeNull();
    expect(state.density).toBe("compact");
  });

  it("adds items", () => {
    const item = makeTestItem("test:1");
    store.getState().addItem(item);

    const state = store.getState();
    expect(state.items.size).toBe(1);
    expect(state.items.get("test:1")).toEqual(item);
  });

  it("indexes items by source", () => {
    const item1 = makeTestItem("test:1", { source: "apps" });
    const item2 = makeTestItem("test:2", { source: "homebrew" });
    const item3 = makeTestItem("test:3", { source: "apps" });

    store.getState().addItem(item1);
    store.getState().addItem(item2);
    store.getState().addItem(item3);

    const state = store.getState();
    expect(state.itemsBySource.get("apps")?.length).toBe(2);
    expect(state.itemsBySource.get("homebrew")?.length).toBe(1);
  });

  it("toggles selection", () => {
    const item = makeTestItem("test:1");
    store.getState().addItem(item);

    store.getState().toggleSelect("test:1");
    expect(store.getState().selection.has("test:1")).toBe(true);

    store.getState().toggleSelect("test:1");
    expect(store.getState().selection.has("test:1")).toBe(false);
  });

  it("selects visible items", () => {
    store.getState().selectVisible(["a", "b", "c"]);
    expect(store.getState().selection.size).toBe(3);
  });

  it("clears selection", () => {
    store.getState().selectVisible(["a", "b"]);
    store.getState().clearSelection();
    expect(store.getState().selection.size).toBe(0);
  });

  it("inverts selection", () => {
    const item1 = makeTestItem("a", { source: "apps" });
    const item2 = makeTestItem("b", { source: "apps" });
    const item3 = makeTestItem("c", { source: "apps" });
    store.getState().addItem(item1);
    store.getState().addItem(item2);
    store.getState().addItem(item3);

    store.getState().toggleSelect("a");
    store.getState().invertSelection(["a", "b", "c"]);

    expect(store.getState().selection.has("a")).toBe(false);
    expect(store.getState().selection.has("b")).toBe(true);
    expect(store.getState().selection.has("c")).toBe(true);
  });

  it("sets sort", () => {
    store.getState().setSort({ key: "name" });
    expect(store.getState().sort.key).toBe("name");
    expect(store.getState().sort.dir).toBe("desc");

    store.getState().setSort({ dir: "asc" });
    expect(store.getState().sort.key).toBe("name");
    expect(store.getState().sort.dir).toBe("asc");
  });

  it("sets filter", () => {
    store.getState().setFilter({ staleDays: 90 });
    expect(store.getState().filter.staleDays).toBe(90);
  });

  it("manages scanner status", () => {
    store.getState().setScannerStatus("apps", "running");
    expect(store.getState().scannerStatus.apps).toBe("running");
  });

  it("manages modal state", () => {
    expect(store.getState().modal).toBeNull();
    store.getState().setModal("confirm");
    expect(store.getState().modal).toBe("confirm");
    store.getState().setModal(null);
    expect(store.getState().modal).toBeNull();
  });

  it("resets state", () => {
    store.getState().addItem(makeTestItem("test:1"));
    store.getState().toggleSelect("test:1");
    store.getState().setModal("help");

    store.getState().reset();
    const state = store.getState();
    expect(state.items.size).toBe(0);
    expect(state.selection.size).toBe(0);
    expect(state.modal).toBeNull();
  });

  it("pushes and dismisses toasts", () => {
    store.getState().pushToast("info", "Test message");
    expect(store.getState().toasts.length).toBe(1);

    const toastId = store.getState().toasts[0]?.id;
    store.getState().dismissToast(toastId);
    expect(store.getState().toasts.length).toBe(0);
  });
});
