import { describe, expect, it } from "bun:test";
import { npmGlobalScanner } from "../../src/scanners/npm-global.ts";

describe("npm-global scanner", () => {
  it("has correct id and displayName", () => {
    expect(npmGlobalScanner.id).toBe("npm-global");
    expect(npmGlobalScanner.displayName).toBe("npm Globals");
  });

  it("returns availability without throwing", async () => {
    const available = await npmGlobalScanner.available();
    expect(typeof available).toBe("boolean");
  });

  it("scans without crashing", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await npmGlobalScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(Array.isArray(items)).toBe(true);
  });

  it("emits valid items when available", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await npmGlobalScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    for (const item of items) {
      expect(typeof item.id).toBe("string");
      expect(item.id.startsWith("npm-global:")).toBe(true);
      expect(item.source).toBe("npm-global");
      expect(typeof item.name).toBe("string");
      expect(typeof item.sizeBytes).toBe("number");
      expect(item.removeStrategy.kind).toBe("exec");
    }
  });

  it("respects abort signal", async () => {
    const items: any[] = [];
    const controller = new AbortController();
    controller.abort();

    await npmGlobalScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(items.length).toBeLessThanOrEqual(1);
  });
});
