import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Box } from "ink";
import { cleanup, render } from "ink-testing-library";
import { FilterModal } from "../../src/components/filter-modal.tsx";
import { createCruftStore } from "../../src/state/store.ts";

describe("FilterModal", () => {
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
        <FilterModal store={store} />
      </Box>,
    );
  }

  it("shows filter title", () => {
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("Filter");
  });

  it("shows none when no filters active", () => {
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("None (showing all)");
  });

  it("shows active stale filter", () => {
    store.getState().setFilter({ staleDays: 90 });
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("90+ days");
  });

  it("shows active min size filter", () => {
    store.getState().setFilter({ minSize: 100_000_000 });
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("100000000 bytes");
  });

  it("shows active source filters", () => {
    store.getState().setFilter({ sources: ["apps", "docker"] });
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("Apps");
    expect(lastFrame()).toContain("Docker");
  });

  it("shows all 9 sources", () => {
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("Apps");
    expect(lastFrame()).toContain("Homebrew");
    expect(lastFrame()).toContain("Docker");
    expect(lastFrame()).toContain("Xcode");
    expect(lastFrame()).toContain("Caches");
  });

  it("shows keyboard shortcuts", () => {
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("unused 90d+");
    expect(lastFrame()).toContain("large >100MB");
    expect(lastFrame()).toContain("toggle source");
  });
});
