import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { SettingsIcon } from "./components/icons";
import { UpdateBubble } from "./components/UpdateBubble";
import { WindowControls } from "./components/WindowControls";
import { EmptyState } from "./components/views/EmptyState";
import { NewPrompt } from "./components/views/NewPrompt";
import { PromptDetail } from "./components/views/PromptDetail";
import { Settings } from "./components/views/Settings";
import { createInitialData } from "./lib/data";
import { exportData, importData } from "./lib/backup";
import { confirmAction } from "./lib/dialog";
import { moveFolder } from "./lib/folders";
import { isQuickPrompt } from "./lib/prompts";
import { loadData, saveData } from "./lib/storage";
import { useUpdater } from "./lib/updates";
import { createId, cx } from "./lib/utils";
import type { Folder, FolderEntry, Prompt, PromptPadData } from "./types";

type Draft = {
  /** Folder the draft will be saved into; null means Quick prompts. */
  folderId: string | null;
};

export default function App() {
  const [data, setData] = useState<PromptPadData>(() => loadData() ?? createInitialData());
  const [query, setQuery] = useState("");
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const updater = useUpdater();

  useEffect(() => {
    saveData(data);
  }, [data]);

  const selectedPrompt = data.prompts.find((prompt) => prompt.id === selectedPromptId) ?? null;

  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery = (prompt: Prompt) =>
    normalizedQuery.length === 0 || prompt.title.toLowerCase().includes(normalizedQuery);

  const quickPrompts = data.prompts.filter(
    (prompt) => isQuickPrompt(prompt) && matchesQuery(prompt),
  );

  const folderEntries: FolderEntry[] = data.folders
    .map((folder) => {
      const prompts = data.prompts.filter(
        (prompt) => prompt.folderId === folder.id && matchesQuery(prompt),
      );

      return {
        folder,
        prompts,
        // While searching, open any folder that still has matching prompts.
        expanded: normalizedQuery.length > 0 ? prompts.length > 0 : expandedFolderIds.includes(folder.id),
      };
    })
    .filter(
      ({ folder, prompts }) =>
        normalizedQuery.length === 0 ||
        folder.name.toLowerCase().includes(normalizedQuery) ||
        prompts.length > 0,
    );

  function expandFolder(folderId: string) {
    setExpandedFolderIds((ids) => (ids.includes(folderId) ? ids : [...ids, folderId]));
  }

  function resetDraft() {
    setDraft(null);
    setIsCreatingFolder(false);
    setNewFolderName("");
  }

  function handleStartPrompt(folderId: string | null) {
    resetDraft();
    setSettingsOpen(false);
    setDraft({ folderId });
    setSelectedPromptId(null);
    if (folderId) expandFolder(folderId);
  }

  function handleStartFolder() {
    resetDraft();
    setSettingsOpen(false);
    setDraft({ folderId: null });
    setSelectedPromptId(null);
    setIsCreatingFolder(true);
  }

  function handleCommitFolder() {
    const name = newFolderName.trim();
    if (!name) return;

    const folder: Folder = { id: createId(), name };
    setData((current) => ({ ...current, folders: [...current.folders, folder] }));
    expandFolder(folder.id);
    setIsCreatingFolder(false);
    setNewFolderName("");
    setDraft({ folderId: folder.id });
  }

  function handleCancelFolder() {
    resetDraft();
    setSelectedPromptId(null);
  }

  function handleSavePrompt(title: string, body: string) {
    if (!draft) return;

    let folders = data.folders;
    let folderId = draft.folderId;

    // Saving the prompt while naming a folder creates that folder first.
    if (isCreatingFolder) {
      const folder: Folder = {
        id: createId(),
        name: newFolderName.trim() || "Untitled folder",
      };
      folders = [...folders, folder];
      folderId = folder.id;
    }

    const targetFolderId = folderId;
    const prompt: Prompt = {
      id: createId(),
      folderId: targetFolderId,
      title: title.trim(),
      body,
    };

    setData((current) => ({ folders, prompts: [...current.prompts, prompt] }));
    resetDraft();
    setSelectedPromptId(prompt.id);
    if (targetFolderId) expandFolder(targetFolderId);
  }

  function handleUpdatePrompt(patch: Partial<Pick<Prompt, "title" | "body">>) {
    if (!selectedPromptId) return;

    setData((current) => ({
      ...current,
      prompts: current.prompts.map((prompt) =>
        prompt.id === selectedPromptId ? { ...prompt, ...patch } : prompt,
      ),
    }));
  }

  function handleDeletePrompt() {
    if (!selectedPromptId) return;

    setData((current) => ({
      ...current,
      prompts: current.prompts.filter((prompt) => prompt.id !== selectedPromptId),
    }));
    setSelectedPromptId(null);
  }

  function handleDeletePromptById(promptId: string) {
    setData((current) => ({
      ...current,
      prompts: current.prompts.filter((prompt) => prompt.id !== promptId),
    }));
    if (selectedPromptId === promptId) setSelectedPromptId(null);
  }

  function handleRenamePrompt(promptId: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;

    setData((current) => ({
      ...current,
      prompts: current.prompts.map((prompt) =>
        prompt.id === promptId ? { ...prompt, title: trimmed } : prompt,
      ),
    }));
  }

  function handleToggleQuick(promptId: string) {
    setData((current) => ({
      ...current,
      prompts: current.prompts.map((prompt) =>
        prompt.id === promptId ? { ...prompt, quick: !prompt.quick } : prompt,
      ),
    }));
  }

  function handleMovePromptToFolder(promptId: string, folderId: string) {
    const prompt = data.prompts.find((entry) => entry.id === promptId);
    if (!prompt || prompt.folderId === folderId) return;

    setData((current) => ({
      ...current,
      prompts: current.prompts.map((entry) =>
        entry.id === promptId ? { ...entry, folderId, quick: false } : entry,
      ),
    }));
    expandFolder(folderId);
  }

  function handleRenameFolder(folderId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    setData((current) => ({
      ...current,
      folders: current.folders.map((folder) =>
        folder.id === folderId ? { ...folder, name: trimmed } : folder,
      ),
    }));
  }

  async function handleDeleteFolder(folderId: string) {
    const folder = data.folders.find((entry) => entry.id === folderId);
    if (!folder) return;

    const confirmed = await confirmAction(
      `Delete “${folder.name}”?\n\nIts prompts will be moved to Quick prompts, so nothing is lost.`,
      "Delete folder",
    );
    if (!confirmed) return;

    setData((current) => ({
      folders: current.folders.filter((entry) => entry.id !== folderId),
      prompts: current.prompts.map((prompt) =>
        prompt.folderId === folderId ? { ...prompt, folderId: null } : prompt,
      ),
    }));
    setExpandedFolderIds((ids) => ids.filter((id) => id !== folderId));
  }

  function handleMoveFolder(draggedId: string, targetId: string, before: boolean) {
    setData((current) => {
      const folders = moveFolder(current.folders, draggedId, targetId, before);
      return folders === current.folders ? current : { ...current, folders };
    });
  }

  function handleSelectPrompt(prompt: Prompt) {
    resetDraft();
    setSettingsOpen(false);
    setSelectedPromptId(prompt.id);
    if (prompt.folderId) expandFolder(prompt.folderId);
  }

  function handleSelectFolder(folder: Folder) {
    setSettingsOpen(false);
    const isExpanded = expandedFolderIds.includes(folder.id);

    if (isExpanded) {
      setExpandedFolderIds((ids) => ids.filter((id) => id !== folder.id));
      return;
    }

    setExpandedFolderIds((ids) => [...ids, folder.id]);

    // Don't yank the user out of an unsaved draft.
    if (draft) return;

    const openPromptIsInFolder = data.prompts.some(
      (prompt) => prompt.id === selectedPromptId && prompt.folderId === folder.id,
    );
    if (openPromptIsInFolder) return;

    const firstPrompt = data.prompts.find((prompt) => prompt.folderId === folder.id);
    setSelectedPromptId(firstPrompt ? firstPrompt.id : null);
  }

  function handleOpenSettings() {
    resetDraft();
    setSelectedPromptId(null);
    setSettingsOpen(true);
  }

  async function handleExport() {
    await exportData(data);
  }

  async function handleImport() {
    const result = await importData(data);
    if (result.status !== "imported") return;

    // Imported ids replace the old ones, so drop any selection pointing at them.
    setData(result.data);
    setSelectedPromptId(null);
    setExpandedFolderIds([]);
    resetDraft();
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden rounded-[20px] bg-[#0d0d0f] font-sans text-zinc-300 antialiased selection:bg-teal-400/25 selection:text-white">
      <Sidebar
        query={query}
        onQueryChange={setQuery}
        quickPrompts={quickPrompts}
        folders={folderEntries}
        selectedPromptId={selectedPromptId}
        isCreatingFolder={isCreatingFolder}
        newFolderName={newFolderName}
        onNewFolderNameChange={setNewFolderName}
        onCommitNewFolder={handleCommitFolder}
        onCancelNewFolder={handleCancelFolder}
        onAddPrompt={handleStartPrompt}
        onAddFolder={handleStartFolder}
        onSelectPrompt={handleSelectPrompt}
        onSelectFolder={handleSelectFolder}
        onRenamePrompt={handleRenamePrompt}
        onDeletePrompt={handleDeletePromptById}
        onToggleQuick={handleToggleQuick}
        onMovePromptToFolder={handleMovePromptToFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveFolder={handleMoveFolder}
      />

      <UpdateBubble updater={updater} onOpenSettings={handleOpenSettings} />

      <main className="flex h-full min-w-0 flex-1 flex-col">
        <div
          data-tauri-drag-region
          className="flex h-14 shrink-0 items-center justify-end gap-1 px-2"
        >
          <button
            type="button"
            onClick={() => (settingsOpen ? setSettingsOpen(false) : handleOpenSettings())}
            aria-label="Settings"
            aria-pressed={settingsOpen}
            title="Settings"
            className={cx(
              "flex h-7 w-8 items-center justify-center rounded-md transition",
              settingsOpen
                ? "bg-zinc-800/80 text-zinc-100"
                : "text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200",
            )}
          >
            <SettingsIcon className="h-3.5 w-3.5" />
          </button>
          <div className="mx-1 h-4 w-px bg-zinc-800" />
          <WindowControls />
        </div>

        <div className="min-h-0 flex-1">
          {settingsOpen ? (
            <Settings
              updater={updater}
              onExport={handleExport}
              onImport={handleImport}
              onClose={() => setSettingsOpen(false)}
            />
          ) : draft ? (
            <NewPrompt
              autoFocusTitle={!isCreatingFolder}
              onSave={handleSavePrompt}
              onCancel={resetDraft}
            />
          ) : selectedPrompt ? (
            <PromptDetail
              prompt={selectedPrompt}
              onChange={handleUpdatePrompt}
              onDelete={handleDeletePrompt}
            />
          ) : (
            <EmptyState
              onCreatePrompt={() => handleStartPrompt(null)}
              onCreateFolder={handleStartFolder}
            />
          )}
        </div>
      </main>
    </div>
  );
}
