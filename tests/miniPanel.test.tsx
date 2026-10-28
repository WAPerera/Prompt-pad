import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MiniPanel } from "../src/components/MiniPanel";
import type { Prompt } from "../src/types";

const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

afterEach(() => {
  cleanup();
  delete (navigator as { clipboard?: unknown }).clipboard;
});

function createPrompt(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: "prompt-1",
    folderId: null,
    title: "Summarize",
    body: "Summarize this text.",
    ...overrides,
  };
}

describe("MiniPanel", () => {
  it("shows a hint when there are no quick prompts", () => {
    render(<MiniPanel prompts={[]} onExpand={vi.fn()} />);

    expect(screen.getByText("No quick prompts yet.", { exact: false })).toBeTruthy();
  });

  it("copies the prompt body when a row is clicked", async () => {
    const prompt = createPrompt();
    render(<MiniPanel prompts={[prompt]} onExpand={vi.fn()} />);

    fireEvent.click(screen.getByText("Summarize"));

    expect(writeText).toHaveBeenCalledWith(prompt.body);
  });

  it("restores the full window from the expand button", () => {
    const onExpand = vi.fn();
    render(<MiniPanel prompts={[createPrompt()]} onExpand={onExpand} />);

    fireEvent.click(screen.getByRole("button", { name: "Open Prompt Pad" }));

    expect(onExpand).toHaveBeenCalledTimes(1);
  });
});
