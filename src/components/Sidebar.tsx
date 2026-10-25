import type { ReactNode } from "react";
import type { Folder, FolderEntry, Prompt } from "../types";
import { cx } from "../lib/utils";
import {
  ChevronRightIcon,
  FolderIcon,
  PlusIcon,
  PromptPadMark,
  SearchIcon,
  SettingsIcon,
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
  settingsOpen: boolean;
  onOpenSettings: () => void;
};

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
  settingsOpen,
  onOpenSettings,
}: SidebarProps) {
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
          {folders.map((entry) => (
            <div key={entry.folder.id}>
              <div className="group flex items-center rounded-md transition hover:bg-zinc-800/40">
                <button
                  type="button"
                  onClick={() => onSelectFolder(entry.folder)}
                  className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 pl-1.5 pr-1 text-left text-[13px] text-zinc-400 transition hover:text-zinc-200"
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
                  className="mr-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-500 opacity-0 transition hover:bg-zinc-700/70 hover:text-zinc-200 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {entry.expanded ? (
                <div className="space-y-px pb-0.5">
                  {entry.prompts.map((prompt) => (
                    <PromptRow
                      key={prompt.id}
                      prompt={prompt}
                      selected={prompt.id === selectedPromptId}
                      nested
                      onSelect={onSelectPrompt}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </nav>

      <footer className="shrink-0 border-t border-zinc-800/70 p-2">
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
      </footer>
    </aside>
  );
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

function PromptRow({
  prompt,
  selected,
  nested,
  onSelect,
}: {
  prompt: Prompt;
  selected: boolean;
  nested: boolean;
  onSelect: (prompt: Prompt) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(prompt)}
      className={cx(
        "flex w-full items-center rounded-md py-1.5 pr-2 text-left text-[13px] transition",
        nested ? "pl-9" : "pl-6",
        selected
          ? "bg-zinc-800/80 text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200",
      )}
    >
      <span className="truncate">{prompt.title || "Untitled prompt"}</span>
    </button>
  );
}
