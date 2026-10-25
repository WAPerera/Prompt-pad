import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { WindowControls } from "./components/WindowControls";
import { EmptyState } from "./components/views/EmptyState";
import { NewPrompt } from "./components/views/NewPrompt";
import { PromptDetail } from "./components/views/PromptDetail";
import { Settings } from "./components/views/Settings";
import { createInitialData } from "./lib/data";
import { exportData, importData } from "./lib/backup";
import { loadData, saveData } from "./lib/storage";
import { createId } from "./lib/utils";
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

  useEffect(() => {
    saveData(data);
  }, [data]);

  const selectedPrompt = data.prompts.find((prompt) => prompt.id === selectedPromptId) ?? null;

  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery = (prompt: Prompt) =>
    normalizedQuery.length === 0 || prompt.title.toLowerCase().includes(normalizedQuery);

  const quickPrompts = data.prompts.filter(
    (prompt) => prompt.folderId === null && matchesQuery(prompt),
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0d0f] font-sans text-zinc-300 antialiased selection:bg-teal-400/25 selection:text-white">
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
        settingsOpen={settingsOpen}
        onOpenSettings={handleOpenSettings}
      />

      <main className="flex h-full min-w-0 flex-1 flex-col">
        <div
          data-tauri-drag-region
          className="flex h-14 shrink-0 items-center justify-end px-2"
        >
          <WindowControls />
        </div>

        <div className="min-h-0 flex-1">
          {settingsOpen ? (
            <Settings
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
