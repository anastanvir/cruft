import { describe, expect, it } from "bun:test";
import { dockerScanner } from "../../src/scanners/docker.ts";

describe("docker scanner", () => {
  it("has correct id and displayName", () => {
    expect(dockerScanner.id).toBe("docker");
    expect(dockerScanner.displayName).toBe("Docker");
  });

  it("returns availability without throwing", async () => {
    const available = await dockerScanner.available();
    expect(typeof available).toBe("boolean");
  });

  it("scans without crashing", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await dockerScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(Array.isArray(items)).toBe(true);
  });

  it("emits valid items when available", async () => {
    const items: any[] = [];
    const controller = new AbortController();

    await dockerScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    for (const item of items) {
      expect(typeof item.id).toBe("string");
      expect(item.id.startsWith("docker:")).toBe(true);
      expect(item.source).toBe("docker");
      expect(typeof item.name).toBe("string");
      expect(item.name).toMatch(/Docker\s/);
      expect(typeof item.sizeBytes).toBe("number");
      expect(item.removeStrategy.kind).toBe("exec");
    }
  });

  it("respects abort signal", async () => {
    const items: any[] = [];
    const controller = new AbortController();
    controller.abort();

    await dockerScanner.scan({
      onItem: (item) => items.push(item),
      signal: controller.signal,
    });

    expect(items.length).toBeLessThanOrEqual(1);
  });
});
