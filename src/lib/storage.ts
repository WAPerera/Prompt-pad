import type { Folder, Prompt, PromptPadData } from "../types";

const STORAGE_KEY = "prompt-pad:data:v1";

/** Snapshot taken right before an import replaces the current data. */
export const BACKUP_STORAGE_KEY = "prompt-pad:backup:v1";

export function isFolder(value: unknown): value is Folder {
  if (typeof value !== "object" || value === null) return false;
  const folder = value as Record<string, unknown>;
  return typeof folder.id === "string" && typeof folder.name === "string";
}

export function isPrompt(value: unknown): value is Prompt {
  if (typeof value !== "object" || value === null) return false;
  const prompt = value as Record<string, unknown>;
  return (
    typeof prompt.id === "string" &&
    (prompt.folderId === null || typeof prompt.folderId === "string") &&
    typeof prompt.title === "string" &&
    typeof prompt.body === "string" &&
    (prompt.quick === undefined || typeof prompt.quick === "boolean")
  );
}

/**
 * Reads saved folders/prompts. Returns null when nothing is stored yet (first run)
 * or when the payload is unreadable, so the caller can fall back to seed data.
 */
export function loadData(): PromptPadData | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const { folders, prompts } = parsed as Record<string, unknown>;
    if (!Array.isArray(folders) || !Array.isArray(prompts)) return null;

    const validFolders = folders.filter(isFolder);
    const folderIds = new Set(validFolders.map((folder) => folder.id));

    // Prompts whose folder disappeared become Quick prompts instead of vanishing.
    const validPrompts = prompts
      .filter(isPrompt)
      .map((prompt) =>
        prompt.folderId && !folderIds.has(prompt.folderId)
          ? { ...prompt, folderId: null }
          : prompt,
      );

    return { folders: validFolders, prompts: validPrompts };
  } catch {
    return null;
  }
}

export function saveData(data: PromptPadData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage can be unavailable (private mode, quota); the app keeps working in memory.
  }
}

/** Keeps a copy of the data that an import is about to replace. */
export function saveImportBackup(data: PromptPadData): void {
  try {
    window.localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Best effort: the import still proceeds if the snapshot cannot be stored.
  }
}
