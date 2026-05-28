import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { cleanup, render } from "ink-testing-library";
import { Footer } from "../../src/components/footer.tsx";
import { createCruftStore } from "../../src/state/store.ts";

describe("Footer", () => {
  let store: ReturnType<typeof createCruftStore>;

  beforeEach(() => {
    store = createCruftStore();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows keybinding hints", () => {
    const { lastFrame } = render(<Footer store={store} />);
    expect(lastFrame()).toContain("nav");
    expect(lastFrame()).toContain("select");
    expect(lastFrame()).toContain("delete");
    expect(lastFrame()).toContain("quit");
  });

  it("hides footer when modal is open", () => {
    store.getState().setModal("help");
    const { lastFrame } = render(<Footer store={store} />);
    expect(lastFrame()).toBe("");
  });
});
