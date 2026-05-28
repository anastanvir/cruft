import { describe, expect, it } from "bun:test";
import { versionManagersScanner } from "../../src/scanners/version-managers.ts";

describe("version-managers scanner", () => {
  it("has correct id and displayName", () => {
    expect(versionManagersScanner.id).toBe("version-managers");
    expect(versionManagersScanner.displayName).toBe("Version Managers");
  });

  it("is always available", async () => {
    const available = await versionManagersScanner.available();
    expect(available).toBe(true);
  });

  it("scans without crashing", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await versionManagersScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(Array.isArray(items)).toBe(true);
  });

  it("emits valid items when found", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await versionManagersScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    for (const item of items) {
      expect(typeof item.id).toBe("string");
      expect(item.source).toBe("version-managers");
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

    await versionManagersScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(items.length).toBeLessThanOrEqual(1);
  });
});
