import { describe, expect, it } from "vitest";
import { isQuickPrompt } from "../src/lib/prompts";
import type { Prompt } from "../src/types";

function prompt(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: "p1",
    folderId: null,
    title: "Prompt",
    body: "",
    ...overrides,
  };
}

describe("isQuickPrompt", () => {
  it("treats unfiled prompts as quick prompts", () => {
    expect(isQuickPrompt(prompt())).toBe(true);
  });

  it("does not treat unstarred folder prompts as quick prompts", () => {
    expect(isQuickPrompt(prompt({ folderId: "folder-1" }))).toBe(false);
  });

  it("treats starred folder prompts as quick prompts", () => {
    expect(isQuickPrompt(prompt({ folderId: "folder-1", quick: true }))).toBe(true);
  });
});
