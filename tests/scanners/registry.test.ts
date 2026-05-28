import { describe, expect, it } from "bun:test";
import { ScannerRegistry } from "../../src/scanners/registry.ts";
import type { Item, Scanner } from "../../src/scanners/types.ts";

const mockScanner: Scanner = {
  id: "apps",
  displayName: "Apps",
  async available() {
    return true;
  },
  async scan({ onItem }) {
    onItem({
      id: "apps:test",
      source: "apps",
      name: "Test App",
      sizeBytes: 1000,
      riskLevel: "safe",
      removeStrategy: { kind: "trash", paths: ["/tmp/test"] },
    });
  },
};

describe("ScannerRegistry", () => {
  it("registers and retrieves scanners", () => {
    const registry = new ScannerRegistry();
    registry.register(mockScanner);

    const retrieved = registry.get("apps");
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe("apps");
  });

  it("getAll returns all registered scanners", () => {
    const registry = new ScannerRegistry();
    registry.register(mockScanner);

    const all = registry.getAll();
    expect(all.length).toBe(1);
  });

  it("getAvailable filters unavailable scanners", async () => {
    const unavailable: Scanner = {
      ...mockScanner,
      id: "docker",
      displayName: "Docker",
      async available() {
        return false;
      },
    };

    const registry = new ScannerRegistry();
    registry.register(mockScanner);
    registry.register(unavailable);

    const available = await registry.getAvailable();
    expect(available.length).toBe(1);
    expect(available[0]?.id).toBe("apps");
  });

  it("runAll calls scan on available scanners", async () => {
    const registry = new ScannerRegistry();
    registry.register(mockScanner);

    const items: Item[] = [];
    const controller = new AbortController();

    await registry.runAll((item) => items.push(item), controller.signal);

    expect(items.length).toBe(1);
    expect(items[0]?.id).toBe("apps:test");
  });

  it("runAll respects abort signal", async () => {
    const registry = new ScannerRegistry();
    registry.register(mockScanner);

    const items: Item[] = [];
    const controller = new AbortController();
    controller.abort();

    await registry.runAll((item) => items.push(item), controller.signal);

    expect(items.length).toBe(0);
  });
});
