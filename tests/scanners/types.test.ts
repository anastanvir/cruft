import { describe, expect, it } from "bun:test";
import { ALL_SOURCES, SOURCE_LABELS } from "../../src/scanners/types.ts";

describe("scanner types", () => {
  it("has all expected sources", () => {
    expect(ALL_SOURCES).toContain("apps");
    expect(ALL_SOURCES).toContain("homebrew");
    expect(ALL_SOURCES).toContain("mas");
    expect(ALL_SOURCES).toContain("npm-global");
    expect(ALL_SOURCES).toContain("docker");
    expect(ALL_SOURCES).toContain("xcode");
    expect(ALL_SOURCES).toContain("node-modules");
    expect(ALL_SOURCES).toContain("version-managers");
    expect(ALL_SOURCES).toContain("caches");
    expect(ALL_SOURCES.length).toBe(9);
  });

  it("has labels for all sources", () => {
    for (const source of ALL_SOURCES) {
      expect(SOURCE_LABELS[source]).toBeDefined();
      expect(typeof SOURCE_LABELS[source]).toBe("string");
    }
  });
});
