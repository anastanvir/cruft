import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Box } from "ink";
import { cleanup, render } from "ink-testing-library";
import { SortMenu } from "../../src/components/sort-menu.tsx";
import { createCruftStore } from "../../src/state/store.ts";

describe("SortMenu", () => {
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
        <SortMenu store={store} />
      </Box>,
    );
  }

  it("shows sort options", () => {
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("Sort by");
    expect(lastFrame()).toContain("Size");
    expect(lastFrame()).toContain("Name");
    expect(lastFrame()).toContain("Last used");
  });

  it("highlights current sort key", () => {
    store.getState().setSort({ key: "name" });
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("Name");
  });

  it("shows toggle hint", () => {
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("toggle asc/desc");
  });
});
