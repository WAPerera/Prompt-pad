import { useEffect, useState } from "react";
import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import type { Folder, FolderEntry, Prompt } from "../types";
import { KOFI_URL, openExternal } from "../lib/external";
import { cx } from "../lib/utils";
import {
  ChevronRightIcon,
  CoffeeIcon,
  FolderIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  PromptPadMark,
  SearchIcon,
  SettingsIcon,
  TrashIcon,
  ZapIcon,
} from "./icons";

type SidebarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  quickPrompts: Prompt[];
  folders: FolderEntry[];
  selectedPromptId: string | null;
  isCreatingFolder: boolean;
  newFolderName: string;
  onNewFolderNameChange: (value: string) => void;
  onCommitNewFolder: () => void;
  onCancelNewFolder: () => void;
  onAddPrompt: (folderId: string | null) => void;
  onAddFolder: () => void;
  onSelectPrompt: (prompt: Prompt) => void;
  onSelectFolder: (folder: Folder) => void;
  onRenamePrompt: (promptId: string, title: string) => void;
  onDeletePrompt: (promptId: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveFolder: (draggedId: string, targetId: string, before: boolean) => void;
  settingsOpen: boolean;
  onOpenSettings: () => void;
};

type RowTarget = { kind: "prompt" | "folder"; id: string };

type DropTarget = { id: string; before: boolean };

export function Sidebar({
  query,
  onQueryChange,
  quickPrompts,
  folders,
  selectedPromptId,
  isCreatingFolder,
  newFolderName,
  onNewFolderNameChange,
  onCommitNewFolder,
  onCancelNewFolder,
  onAddPrompt,
  onAddFolder,
  onSelectPrompt,
  onSelectFolder,
  onRenamePrompt,
  onDeletePrompt,
  onRenameFolder,
  onDeleteFolder,
  onMoveFolder,
  settingsOpen,
  onOpenSettings,
}: SidebarProps) {
  const [menuTarget, setMenuTarget] = useState<RowTarget | null>(null);
  const [renaming, setRenaming] = useState<RowTarget | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const canReorder = query.trim().length === 0;

  useEffect(() => {
    if (!menuTarget) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-row-menu]")) return;
      setMenuTarget(null);
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setMenuTarget(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuTarget]);

  function isRenaming(kind: RowTarget["kind"], id: string) {
    return renaming?.kind === kind && renaming.id === id;
  }

  function startRename(kind: RowTarget["kind"], id: string, currentName: string) {
    setMenuTarget(null);
    setRenaming({ kind, id });
    setRenameValue(currentName);
  }

  function commitRename() {
    if (!renaming) return;

    const value = renameValue.trim();
    if (value) {
      if (renaming.kind === "prompt") onRenamePrompt(renaming.id, value);
      else onRenameFolder(renaming.id, value);
    }

    setRenaming(null);
    setRenameValue("");
  }

  function cancelRename() {
    setRenaming(null);
    setRenameValue("");
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, folderId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", folderId);
    setMenuTarget(null);
    setDraggedFolderId(folderId);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, folderId: string) {
    if (!draggedFolderId || draggedFolderId === folderId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const rect = event.currentTarget.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    setDropTarget((current) =>
      current?.id === folderId && current.before === before ? current : { id: folderId, before },
    );
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>, folderId: string) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDropTarget((current) => (current?.id === folderId ? null : current));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, folderId: string) {
    event.preventDefault();

    if (draggedFolderId && draggedFolderId !== folderId) {
      const before = dropTarget?.id === folderId ? dropTarget.before : true;
      onMoveFolder(draggedFolderId, folderId, before);
    }

    setDraggedFolderId(null);
    setDropTarget(null);
  }

  function handleDragEnd() {
    setDraggedFolderId(null);
    setDropTarget(null);
  }

  async function handleOpenCoffee() {
    try {
      await openExternal(KOFI_URL);
    } catch {
      // Opening the browser can fail if the OS handler is missing; nothing else to do.
    }
  }

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-zinc-800/70 bg-[#0b0b0d]">
      <header data-tauri-drag-region className="flex h-14 shrink-0 items-center gap-2.5 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-zinc-700/70 bg-zinc-900 text-teal-300 shadow-sm">
          <PromptPadMark className="h-4 w-4" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-zinc-100">Prompt Pad</span>
      </header>

      <div className="shrink-0 px-3 pt-1">
        <label className="flex h-9 items-center gap-2 rounded-lg bg-zinc-900/70 px-2.5 text-zinc-500 transition focus-within:bg-zinc-900 focus-within:text-zinc-400">
          <SearchIcon className="h-4 w-4 shrink-0" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="search"
            spellCheck={false}
            className="h-full w-full bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
          />
        </label>
      </div>

      <nav className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <SectionHeader
          icon={<ZapIcon className="h-3.5 w-3.5" />}
          label="Quick prompts"
          onAdd={() => onAddPrompt(null)}
        />

        <div className="mt-0.5 space-y-px">
          {quickPrompts.map((prompt) => (
            <PromptRow
              key={prompt.id}
              prompt={prompt}
              selected={prompt.id === selectedPromptId}
              nested={false}
              renaming={isRenaming("prompt", prompt.id)}
              renameValue={renameValue}
              onRenameValueChange={setRenameValue}
              onCommitRename={commitRename}
              onCancelRename={cancelRename}
              menuOpen={menuTarget?.kind === "prompt" && menuTarget.id === prompt.id}
              onToggleMenu={() =>
                setMenuTarget((current) =>
                  current?.kind === "prompt" && current.id === prompt.id
                    ? null
                    : { kind: "prompt", id: prompt.id },
                )
              }
              onStartRename={() => startRename("prompt", prompt.id, prompt.title)}
              onDelete={() => {
                setMenuTarget(null);
                onDeletePrompt(prompt.id);
              }}
              onSelect={onSelectPrompt}
            />
          ))}
        </div>

        <SectionHeader
          className="mt-5"
          icon={<FolderIcon className="h-3.5 w-3.5" />}
          label="Folders"
          onAdd={onAddFolder}
        />

        {isCreatingFolder ? (
          <div className="mt-1 px-1">
            <input
              autoFocus
              value={newFolderName}
              onChange={(event) => onNewFolderNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onCommitNewFolder();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  onCancelNewFolder();
                }
              }}
              placeholder="New folder"
              spellCheck={false}
              className="h-7 w-full rounded-md border border-zinc-700/70 bg-zinc-800/60 px-2 text-[13px] text-zinc-200 placeholder:text-zinc-500 focus:border-teal-500/50 focus:outline-none"
            />
          </div>
        ) : null}

        <div className="mt-0.5 space-y-px">
          {folders.map((entry) => {
            const renamingFolder = isRenaming("folder", entry.folder.id);
            const menuOpen = menuTarget?.kind === "folder" && menuTarget.id === entry.folder.id;
            const isDropTarget = dropTarget?.id === entry.folder.id && draggedFolderId !== entry.folder.id;

            return (
              <div key={entry.folder.id} className="relative">
                {renamingFolder ? (
                  <div className="flex items-center gap-1.5 py-1 pl-1.5 pr-1">
                    <ChevronRightIcon
                      className={cx(
                        "h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform duration-150",
                        entry.expanded && "rotate-90",
                      )}
                    />
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      onFocus={(event) => event.currentTarget.select()}
                      onBlur={commitRename}
                      onKeyDown={(event) => handleRenameKeys(event, commitRename, cancelRename)}
                      spellCheck={false}
                      aria-label={`Rename ${entry.folder.name}`}
                      className="h-7 min-w-0 flex-1 rounded-md border border-teal-500/50 bg-zinc-800/70 px-2 text-[13px] text-zinc-200 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div
                    data-folder-row={entry.folder.id}
                    draggable={canReorder}
                    onDragStart={(event) => handleDragStart(event, entry.folder.id)}
                    onDragOver={(event) => handleDragOver(event, entry.folder.id)}
                    onDragLeave={(event) => handleDragLeave(event, entry.folder.id)}
                    onDrop={(event) => handleDrop(event, entry.folder.id)}
                    onDragEnd={handleDragEnd}
                    className={cx(
                      "group relative flex items-center rounded-md transition",
                      draggedFolderId === entry.folder.id
                        ? "opacity-40"
                        : "hover:bg-zinc-800/40",
                      canReorder && "cursor-grab active:cursor-grabbing",
                    )}
                  >
                    <span
                      draggable={canReorder}
                      data-drag-handle
                      aria-hidden="true"
                      title={canReorder ? "Drag to reorder" : undefined}
                      className="ml-1 flex h-6 w-3 shrink-0 cursor-grab items-center justify-center text-zinc-700 opacity-70 transition group-hover:text-zinc-500 group-hover:opacity-100 active:cursor-grabbing"
                    >
                      <GripVerticalIcon className="h-3 w-3" />
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectFolder(entry.folder)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setMenuTarget({ kind: "folder", id: entry.folder.id });
                      }}
                      title={canReorder ? "Click to expand, drag to reorder" : undefined}
                      className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 pl-1 pr-1 text-left text-[13px] text-zinc-400 transition hover:text-zinc-200"
                    >
                      <ChevronRightIcon
                        className={cx(
                          "h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform duration-150",
                          entry.expanded && "rotate-90",
                        )}
                      />
                      <span className="truncate">{entry.folder.name}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAddPrompt(entry.folder.id)}
                      aria-label={`Add prompt to ${entry.folder.name}`}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-500 opacity-0 transition hover:bg-zinc-700/70 hover:text-zinc-200 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      data-row-menu
                      onClick={() =>
                        setMenuTarget((current) =>
                          current?.kind === "folder" && current.id === entry.folder.id
                            ? null
                            : { kind: "folder", id: entry.folder.id },
                        )
                      }
                      aria-label={`More options for ${entry.folder.name}`}
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                      className="mr-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-500 opacity-0 transition hover:bg-zinc-700/70 hover:text-zinc-200 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
                    >
                      <MoreHorizontalIcon className="h-3.5 w-3.5" />
                    </button>

                    {menuOpen ? (
                      <RowMenu
                        onRename={() =>
                          startRename("folder", entry.folder.id, entry.folder.name)
                        }
                        onDelete={() => {
                          setMenuTarget(null);
                          void onDeleteFolder(entry.folder.id);
                        }}
                      />
                    ) : null}

                    {isDropTarget ? (
                      <div
                        className={cx(
                          "pointer-events-none absolute inset-x-1 h-0.5 rounded-full bg-teal-400",
                          dropTarget.before ? "-top-1" : "-bottom-1",
                        )}
                      />
                    ) : null}
                  </div>
                )}

                {entry.expanded ? (
                  <div className="space-y-px pb-0.5">
                    {entry.prompts.map((prompt) => (
                      <PromptRow
                        key={prompt.id}
                        prompt={prompt}
                        selected={prompt.id === selectedPromptId}
                        nested
                        renaming={isRenaming("prompt", prompt.id)}
                        renameValue={renameValue}
                        onRenameValueChange={setRenameValue}
                        onCommitRename={commitRename}
                        onCancelRename={cancelRename}
                        menuOpen={menuTarget?.kind === "prompt" && menuTarget.id === prompt.id}
                        onToggleMenu={() =>
                          setMenuTarget((current) =>
                            current?.kind === "prompt" && current.id === prompt.id
                              ? null
                              : { kind: "prompt", id: prompt.id },
                          )
                        }
                        onStartRename={() => startRename("prompt", prompt.id, prompt.title)}
                        onDelete={() => {
                          setMenuTarget(null);
                          onDeletePrompt(prompt.id);
                        }}
                        onSelect={onSelectPrompt}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </nav>

      <footer className="shrink-0 space-y-px border-t border-zinc-800/70 p-2">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-current={settingsOpen ? "page" : undefined}
          className={cx(
            "flex h-8 w-full items-center gap-2 rounded-md px-2 text-[12px] transition",
            settingsOpen
              ? "bg-zinc-800/60 text-zinc-200"
              : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200",
          )}
        >
          <SettingsIcon className="h-3.5 w-3.5" />
          Settings
        </button>
        <button
          type="button"
          onClick={() => void handleOpenCoffee()}
          className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-[12px] text-zinc-500 transition hover:bg-amber-400/10 hover:text-amber-200"
        >
          <CoffeeIcon className="h-3.5 w-3.5" />
          Buy me a coffee
        </button>
      </footer>
    </aside>
  );
}

/** Shared Enter/Escape handling for the inline rename inputs. */
function handleRenameKeys(
  event: KeyboardEvent<HTMLInputElement>,
  commit: () => void,
  cancel: () => void,
) {
  if (event.key === "Enter") {
    event.preventDefault();
    commit();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    cancel();
  }
}

function SectionHeader({
  icon,
  label,
  onAdd,
  className,
}: {
  icon: ReactNode;
  label: string;
  onAdd: () => void;
  className?: string;
}) {
  return (
    <div className={cx("group flex h-8 items-center justify-between rounded-md pl-2 pr-1", className)}>
      <div className="flex items-center gap-2 text-[13px] font-medium text-zinc-500">
        {icon}
        <span>{label}</span>
      </div>
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add ${label.toLowerCase()}`}
        className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
      >
        <PlusIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function RowMenu({ onRename, onDelete }: { onRename: () => void; onDelete: () => void }) {
  return (
    <div
      data-row-menu
      role="menu"
      className="absolute right-1 top-full z-30 mt-1 w-36 overflow-hidden rounded-lg border border-zinc-700/70 bg-[#161619] p-1 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.9)]"
    >
      <button
        type="button"
        role="menuitem"
        onClick={onRename}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
      >
        <PencilIcon className="h-3.5 w-3.5 text-zinc-500" />
        Rename
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onDelete}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
      >
        <TrashIcon className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
}

type PromptRowProps = {
  prompt: Prompt;
  selected: boolean;
  nested: boolean;
  renaming: boolean;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onStartRename: () => void;
  onDelete: () => void;
  onSelect: (prompt: Prompt) => void;
};

function PromptRow({
  prompt,
  selected,
  nested,
  renaming,
  renameValue,
  onRenameValueChange,
  onCommitRename,
  onCancelRename,
  menuOpen,
  onToggleMenu,
  onStartRename,
  onDelete,
  onSelect,
}: PromptRowProps) {
  if (renaming) {
    return (
      <div className={cx("py-0.5 pr-1", nested ? "pl-8" : "pl-5")}>
        <input
          autoFocus
          value={renameValue}
          onChange={(event) => onRenameValueChange(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={onCommitRename}
          onKeyDown={(event) => handleRenameKeys(event, onCommitRename, onCancelRename)}
          spellCheck={false}
          aria-label={`Rename ${prompt.title || "prompt"}`}
          className="h-7 w-full rounded-md border border-teal-500/50 bg-zinc-800/70 px-2 text-[13px] text-zinc-200 focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onSelect(prompt)}
        onContextMenu={(event) => {
          event.preventDefault();
          if (!menuOpen) onToggleMenu();
        }}
        className={cx(
          "flex w-full items-center rounded-md py-1.5 pr-8 text-left text-[13px] transition",
          nested ? "pl-9" : "pl-6",
          selected
            ? "bg-zinc-800/80 text-zinc-100"
            : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200",
        )}
      >
        <span className="truncate">{prompt.title || "Untitled prompt"}</span>
      </button>

      <button
        type="button"
        data-row-menu
        onClick={onToggleMenu}
        aria-label={`More options for ${prompt.title || "prompt"}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-zinc-500 opacity-0 transition hover:bg-zinc-700/70 hover:text-zinc-200 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <MoreHorizontalIcon className="h-3.5 w-3.5" />
      </button>

      {menuOpen ? <RowMenu onRename={onStartRename} onDelete={onDelete} /> : null}
    </div>
  );
}
