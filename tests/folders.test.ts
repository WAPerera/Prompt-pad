import { describe, expect, it } from "vitest";
import { moveFolder } from "../src/lib/folders";
import type { Folder } from "../src/types";

const folders: Folder[] = ["a", "b", "c", "d"].map((id) => ({ id, name: id.toUpperCase() }));

function order(list: Folder[]): string {
  return list.map((folder) => folder.id).join("");
}

describe("moveFolder", () => {
  it("moves a folder before a lower target", () => {
    expect(order(moveFolder(folders, "a", "c", true))).toBe("bacd");
  });

  it("moves a folder after a lower target", () => {
    expect(order(moveFolder(folders, "a", "c", false))).toBe("bcad");
  });

  it("moves a folder upward", () => {
    expect(order(moveFolder(folders, "d", "b", true))).toBe("adbc");
    expect(order(moveFolder(folders, "d", "b", false))).toBe("abdc");
  });

  it("returns the same array for a no-op move", () => {
    expect(moveFolder(folders, "a", "a", true)).toBe(folders);
  });

  it("ignores unknown folder ids", () => {
    expect(moveFolder(folders, "missing", "b", true)).toBe(folders);
    expect(moveFolder(folders, "a", "missing", true)).toBe(folders);
  });

  it("does not mutate the input", () => {
    const reordered = moveFolder(folders, "d", "a", true);
    expect(order(folders)).toBe("abcd");
    expect(order(reordered)).toBe("dabc");
  });
});
