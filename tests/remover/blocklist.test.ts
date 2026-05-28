import { describe, expect, it } from "bun:test";
import { filterBlocked, getHardBlockedPaths, isHardBlocked } from "../../src/remover/blocklist.ts";

describe("blocklist", () => {
  it("blocks system root", () => {
    expect(isHardBlocked("/")).toBe(true);
  });

  it("blocks /System", () => {
    expect(isHardBlocked("/System")).toBe(true);
  });

  it("blocks /Library", () => {
    expect(isHardBlocked("/Library")).toBe(true);
  });

  it("blocks /Applications", () => {
    expect(isHardBlocked("/Applications")).toBe(true);
  });

  it("blocks paths with ..", () => {
    expect(isHardBlocked("/Users/test/../../etc")).toBe(true);
  });

  it("does not block regular app paths", () => {
    expect(isHardBlocked("/Applications/MyApp.app")).toBe(false);
    expect(isHardBlocked("/Users/test/Applications/MyApp.app")).toBe(false);
  });

  it("does not block home paths for subdirectories", () => {
    const home = process.env.HOME ?? "";
    expect(isHardBlocked(`${home}/.config`)).toBe(false);
    expect(isHardBlocked(`${home}/.npm`)).toBe(false);
  });

  it("filters blocked paths from a list", () => {
    const home = process.env.HOME ?? "";
    const paths = ["/", "/Applications", "/Applications/MyApp.app", home];
    const filtered = filterBlocked(paths);
    expect(filtered).toEqual(["/Applications/MyApp.app"]);
  });

  it("returns hard blocked paths list", () => {
    const blocked = getHardBlockedPaths();
    expect(blocked).toContain("/");
    expect(blocked).toContain("/System");
    expect(blocked).toContain("/Applications");
  });
});
