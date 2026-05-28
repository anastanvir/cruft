import { describe, expect, it } from "bun:test";
import { homebrewScanner } from "../../src/scanners/homebrew.ts";

describe("homebrew scanner", () => {
  it("has correct id and displayName", () => {
    expect(homebrewScanner.id).toBe("homebrew");
    expect(homebrewScanner.displayName).toBe("Homebrew");
  });

  it("returns availability without throwing", async () => {
    const available = await homebrewScanner.available();
    expect(typeof available).toBe("boolean");
  });

  it("scans without crashing", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await homebrewScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(Array.isArray(items)).toBe(true);
  });

  it("emits valid items when available", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await homebrewScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    for (const item of items) {
      expect(typeof item.id).toBe("string");
      expect(item.source).toBe("homebrew");
      expect(typeof item.name).toBe("string");
      expect(typeof item.sizeBytes).toBe("number");
      expect(item.sizeBytes).toBeGreaterThanOrEqual(0);
      expect(item.removeStrategy.kind).toBe("exec");
      expect(Array.isArray(item.removeStrategy.argv)).toBe(true);
    }
  });

  it("respects abort signal", async () => {
    const items: any[] = [];
    const controller = new AbortController();
    controller.abort();

    await homebrewScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(items.length).toBeLessThanOrEqual(1);
  });
});
