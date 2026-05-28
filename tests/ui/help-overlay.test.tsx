import { afterEach, describe, expect, it } from "bun:test";
import { Box } from "ink";
import { cleanup, render } from "ink-testing-library";
import { HelpOverlay } from "../../src/components/help-overlay.tsx";

describe("HelpOverlay", () => {
  afterEach(() => {
    cleanup();
  });

  function renderWrapped() {
    return render(
      <Box width={100} height={40}>
        <HelpOverlay />
      </Box>,
    );
  }

  it("shows title", () => {
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("Help");
  });

  it("shows all keybindings", () => {
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("Navigation");
    expect(lastFrame()).toContain("Delete");
  });

  it("shows escape hint", () => {
    const { lastFrame } = renderWrapped();
    expect(lastFrame()).toContain("Esc");
    expect(lastFrame()).toContain("Enter");
    expect(lastFrame()).toContain("to close");
  });
});
