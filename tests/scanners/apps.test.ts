import { describe, expect, it, mock } from "bun:test";
import { appsScanner } from "../../src/scanners/apps.ts";

describe("apps scanner", () => {
  it("has correct id and displayName", () => {
    expect(appsScanner.id).toBe("apps");
    expect(appsScanner.displayName).toBe("Apps");
  });

  it("is always available", async () => {
    const available = await appsScanner.available();
    expect(available).toBe(true);
  });

  it("scans without crashing", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await appsScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(Array.isArray(items)).toBe(true);
    for (const item of items) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("source", "apps");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("riskLevel");
      expect(item).toHaveProperty("removeStrategy");
    }
  });

  it("emits valid items", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await appsScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    for (const item of items) {
      expect(typeof item.id).toBe("string");
      expect(item.id.startsWith("apps:")).toBe(true);
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

    await appsScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(items.length).toBeLessThanOrEqual(1);
  });
});
