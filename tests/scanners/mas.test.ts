import { describe, expect, it } from "bun:test";
import { masScanner } from "../../src/scanners/mas.ts";

describe("mas scanner", () => {
  it("has correct id and displayName", () => {
    expect(masScanner.id).toBe("mas");
    expect(masScanner.displayName).toBe("Mac App Store");
  });

  it("returns availability without throwing", async () => {
    const available = await masScanner.available();
    expect(typeof available).toBe("boolean");
  });

  it("scans without crashing", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await masScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(Array.isArray(items)).toBe(true);
  });

  it("emits valid items when available", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await masScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    for (const item of items) {
      expect(typeof item.id).toBe("string");
      expect(item.id.startsWith("mas:")).toBe(true);
      expect(item.source).toBe("mas");
      expect(typeof item.name).toBe("string");
      expect(typeof item.sizeBytes).toBe("number");
      expect(item.sizeBytes).toBeGreaterThanOrEqual(0);
      expect(item.removeStrategy.kind).toBe("exec");
    }
  });

  it("respects abort signal", async () => {
    const items: any[] = [];
    const controller = new AbortController();
    controller.abort();

    await masScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(items.length).toBeLessThanOrEqual(1);
  });
});
