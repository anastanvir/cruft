import { describe, expect, it } from "bun:test";
import { cachesScanner } from "../../src/scanners/caches.ts";

describe("caches scanner", () => {
  it("has correct id and displayName", () => {
    expect(cachesScanner.id).toBe("caches");
    expect(cachesScanner.displayName).toBe("Caches");
  });

  it("is always available", async () => {
    const available = await cachesScanner.available();
    expect(available).toBe(true);
  });

  it("scans without crashing", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await cachesScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(Array.isArray(items)).toBe(true);
  });

  it("emits valid items when found", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await cachesScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    for (const item of items) {
      expect(typeof item.id).toBe("string");
      expect(item.id.startsWith("caches:")).toBe(true);
      expect(item.source).toBe("caches");
      expect(typeof item.name).toBe("string");
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

    await cachesScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(items.length).toBeLessThanOrEqual(1);
  });
});
