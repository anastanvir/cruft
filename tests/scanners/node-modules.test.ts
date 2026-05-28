import { describe, expect, it } from "bun:test";
import { nodeModulesScanner } from "../../src/scanners/node-modules.ts";

describe("node-modules scanner", () => {
  it("has correct id and displayName", () => {
    expect(nodeModulesScanner.id).toBe("node-modules");
    expect(nodeModulesScanner.displayName).toBe("node_modules");
  });

  it("is always available", async () => {
    const available = await nodeModulesScanner.available();
    expect(available).toBe(true);
  });

  it("scans without crashing", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await nodeModulesScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(Array.isArray(items)).toBe(true);
  });

  it("emits valid items when found", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await nodeModulesScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    for (const item of items) {
      expect(item.id).toBe("node-modules:stale");
      expect(item.source).toBe("node-modules");
      expect(item.name).toMatch(/node_modules/);
      expect(typeof item.sizeBytes).toBe("number");
      expect(item.sizeBytes).toBeGreaterThanOrEqual(0);
      expect(item.removeStrategy.kind).toBe("trash");
      expect(Array.isArray(item.removeStrategy.paths)).toBe(true);
    }
  });

  it("respects abort signal", async () => {
    const items: any[] = [];
    const controller = new AbortController();
    controller.abort();

    await nodeModulesScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(items.length).toBeLessThanOrEqual(1);
  });
});
