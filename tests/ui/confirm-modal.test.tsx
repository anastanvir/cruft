import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Box } from "ink";
import { cleanup, render } from "ink-testing-library";
import { ConfirmModal } from "../../src/components/confirm-modal.tsx";
import type { Item } from "../../src/scanners/types.ts";
import { createCruftStore } from "../../src/state/store.ts";

function makeItem(id: string, sizeBytes: number): Item {
  return {
    id,
    source: "apps",
    name: `Test ${id}`,
    sizeBytes,
    riskLevel: "safe",
    removeStrategy: { kind: "trash", paths: ["/tmp/test"] },
  };
}

describe("ConfirmModal", () => {
  let store: ReturnType<typeof createCruftStore>;

  beforeEach(() => {
    store = createCruftStore();
  });

  afterEach(() => {
    cleanup();
  });

  function renderWrapped() {
    return render(
      <Box width={100} height={40}>
        <ConfirmModal store={store} />
      </Box>,
    );
  }

  it("shows selected count and size", () => {
    store.getState().addItem(makeItem("a", 1_500_000_000));
    store.getState().addItem(makeItem("b", 500_000_000));
    store.getState().toggleSelect("a");
    store.getState().toggleSelect("b");

    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("2 items");
    expect(lastFrame()).toContain("GB");
    expect(lastFrame()).toContain("to confirm");
    expect(lastFrame()).toContain("to cancel");
  });

  it("shows zero items when nothing selected", () => {
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("0 items");
    expect(lastFrame()).toContain("0 B");
  });
});
