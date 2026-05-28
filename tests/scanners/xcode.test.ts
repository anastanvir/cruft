import { describe, expect, it } from "bun:test";
import { xcodeScanner } from "../../src/scanners/xcode.ts";

describe("xcode scanner", () => {
  it("has correct id and displayName", () => {
    expect(xcodeScanner.id).toBe("xcode");
    expect(xcodeScanner.displayName).toBe("Xcode");
  });

  it("returns availability without throwing", async () => {
    const available = await xcodeScanner.available();
    expect(typeof available).toBe("boolean");
  });

  it("scans without crashing", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await xcodeScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(Array.isArray(items)).toBe(true);
  });

  it("emits valid items when available", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await xcodeScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    for (const item of items) {
      expect(typeof item.id).toBe("string");
      expect(item.id.startsWith("xcode:")).toBe(true);
      expect(item.source).toBe("xcode");
      expect(typeof item.name).toBe("string");
      expect(typeof item.sizeBytes).toBe("number");
      expect(item.sizeBytes).toBeGreaterThanOrEqual(0);
      expect(["trash", "exec", "composite"]).toContain(item.removeStrategy.kind);
    }
  });

  it("respects abort signal", async () => {
    const items: any[] = [];
    const controller = new AbortController();
    controller.abort();

    await xcodeScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(items.length).toBeLessThanOrEqual(1);
  });
});
