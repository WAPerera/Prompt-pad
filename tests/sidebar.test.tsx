import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { Sidebar } from "../src/components/Sidebar";
import type { FolderEntry } from "../src/types";

afterEach(cleanup);

function createFolders(): FolderEntry[] {
  return ["Alpha", "Beta", "Gamma"].map((name) => ({
    folder: { id: name.toLowerCase(), name },
    prompts: [],
    expanded: false,
  }));
}

function renderSidebar(overrides: Partial<ComponentProps<typeof Sidebar>> = {}) {
  const onMoveFolder = vi.fn();

  const props: ComponentProps<typeof Sidebar> = {
    query: "",
    onQueryChange: vi.fn(),
    quickPrompts: [],
    folders: createFolders(),
    selectedPromptId: null,
    isCreatingFolder: false,
    newFolderName: "",
    onNewFolderNameChange: vi.fn(),
    onCommitNewFolder: vi.fn(),
    onCancelNewFolder: vi.fn(),
    onAddPrompt: vi.fn(),
    onAddFolder: vi.fn(),
    onSelectPrompt: vi.fn(),
    onSelectFolder: vi.fn(),
    onRenamePrompt: vi.fn(),
    onDeletePrompt: vi.fn(),
    onToggleQuick: vi.fn(),
    onMovePromptToFolder: vi.fn(),
    onRenameFolder: vi.fn(),
    onDeleteFolder: vi.fn(),
    onMoveFolder,
    ...overrides,
  };

  render(<Sidebar {...props} />);
  return { onMoveFolder };
}

function folderRow(name: string): HTMLElement {
  const row = screen.getByText(name).closest<HTMLElement>("[data-folder-row]");
  if (!row) throw new Error(`Folder row not found: ${name}`);
  return row;
}

/** jsdom reports a zero-size rect, so give rows a known height for hit testing. */
function withRect(element: HTMLElement, top: number, height: number) {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      top,
      height,
      bottom: top + height,
      left: 0,
      right: 200,
      width: 200,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }),
  });
}

function createDataTransfer(): DataTransfer {
  return {
    dropEffect: "none",
    effectAllowed: "all",
    types: [],
    setData: vi.fn(),
    getData: vi.fn(() => ""),
    setDragImage: vi.fn(),
    clearData: vi.fn(),
  } as unknown as DataTransfer;
}

/**
 * React Testing Library's drag helpers don't forward MouseEvent coordinates in
 * jsdom, so dispatch a real MouseEvent and attach the data transfer manually.
 */
function fireDragOver(element: HTMLElement, dataTransfer: DataTransfer, clientY: number) {
  const event = new MouseEvent("dragover", { bubbles: true, cancelable: true, clientY });
  Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
  fireEvent(element, event);
}

describe("Sidebar folder arrangement", () => {
  it("moves a folder after the target when dropped on its lower half", () => {
    const { onMoveFolder } = renderSidebar();
    const source = folderRow("Alpha");
    const target = folderRow("Beta");
    withRect(target, 0, 20);
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(source, { dataTransfer });
    fireDragOver(target, dataTransfer, 18);
    fireEvent.drop(target, { dataTransfer });

    expect(onMoveFolder).toHaveBeenCalledWith("alpha", "beta", false);
  });

  it("moves a folder before the target when dropped on its upper half", () => {
    const { onMoveFolder } = renderSidebar();
    const source = folderRow("Gamma");
    const target = folderRow("Alpha");
    withRect(target, 0, 20);
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(source, { dataTransfer });
    fireDragOver(target, dataTransfer, 2);
    fireEvent.drop(target, { dataTransfer });

    expect(onMoveFolder).toHaveBeenCalledWith("gamma", "alpha", true);
  });

  it("does not move a folder onto itself", () => {
    const { onMoveFolder } = renderSidebar();
    const source = folderRow("Alpha");
    withRect(source, 0, 20);
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(source, { dataTransfer });
    fireDragOver(source, dataTransfer, 18);
    fireEvent.drop(source, { dataTransfer });

    expect(onMoveFolder).not.toHaveBeenCalled();
  });

  it("disables dragging while a search filter is active", () => {
    renderSidebar({ query: "a" });

    expect(folderRow("Alpha").getAttribute("draggable")).not.toBe("true");
  });
});

describe("Sidebar quick prompts", () => {
  it("stars a folder prompt as a quick prompt", () => {
    const onToggleQuick = vi.fn();
    renderSidebar({
      onToggleQuick,
      folders: [
        {
          folder: { id: "alpha", name: "Alpha" },
          prompts: [{ id: "p1", folderId: "alpha", title: "Nested prompt", body: "" }],
          expanded: true,
        },
      ],
    });

    fireEvent.click(screen.getByLabelText("Mark as quick prompt"));

    expect(onToggleQuick).toHaveBeenCalledWith("p1");
  });

  it("moves a quick prompt into a folder", () => {
    const onMovePromptToFolder = vi.fn();
    renderSidebar({
      onMovePromptToFolder,
      quickPrompts: [{ id: "p1", folderId: null, title: "Loose prompt", body: "" }],
    });

    fireEvent.click(screen.getByLabelText("More options for Loose prompt"));

    const menu = screen.getByRole("menu");
    fireEvent.click(within(menu).getByText("Move to folder"));
    fireEvent.click(within(menu).getByText("Alpha"));

    expect(onMovePromptToFolder).toHaveBeenCalledWith("p1", "alpha");
  });
});
