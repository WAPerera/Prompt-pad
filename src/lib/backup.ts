import { confirm, message, open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { isFolder, isPrompt, loadData, saveImportBackup } from "./storage";
import type { Folder, Prompt, PromptPadData } from "../types";

const BACKUP_APP = "prompt-pad";
const BACKUP_VERSION = 1;

const JSON_FILTER = { name: "Prompt Pad backup", extensions: ["json"] };

export type ImportResult =
  | { status: "imported"; data: PromptPadData }
  | { status: "cancelled" };

function backupFileName(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `prompt-pad-backup-${date}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readFolders(value: unknown): Folder[] | null {
  if (!Array.isArray(value) || !value.every(isFolder)) return null;
  return value as Folder[];
}

function readPrompts(value: unknown): Prompt[] | null {
  if (!Array.isArray(value) || !value.every(isPrompt)) return null;
  return value as Prompt[];
}

/** Parses a backup file, throwing an Error with a message meant for the user. */
function parseBackup(raw: string): PromptPadData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(parsed) || parsed.app !== BACKUP_APP) {
    throw new Error('The selected file is not a Prompt Pad backup (missing "app": "prompt-pad").');
  }

  if (parsed.version !== BACKUP_VERSION) {
    throw new Error(
      `This backup uses version ${String(parsed.version)}, but this version of Prompt Pad can only import version ${BACKUP_VERSION} backups.`,
    );
  }

  if (!isRecord(parsed.data)) {
    throw new Error("The backup is missing its data section.");
  }

  const folders = readFolders(parsed.data.folders);
  if (!folders) {
    throw new Error("The backup's folder list is missing or contains invalid entries.");
  }

  const prompts = readPrompts(parsed.data.prompts);
  if (!prompts) {
    throw new Error("The backup's prompt list is missing or contains invalid entries.");
  }

  const folderIds = new Set(folders.map((folder) => folder.id));

  return {
    folders,
    // Prompts pointing at a missing folder become Quick prompts instead of breaking the app.
    prompts: prompts.map((prompt) =>
      prompt.folderId && !folderIds.has(prompt.folderId)
        ? { ...prompt, folderId: null }
        : prompt,
    ),
  };
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Asks where to save, then writes the current data as a backup file.
 * Returns false when the user cancels the dialog.
 */
export async function exportData(currentData: PromptPadData): Promise<boolean> {
  try {
    const path = await save({
      defaultPath: backupFileName(),
      filters: [JSON_FILTER],
    });
    if (!path) return false;

    const payload = {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: loadData() ?? currentData,
    };

    await writeTextFile(path, JSON.stringify(payload, null, 2), { create: true });
    return true;
  } catch (error) {
    await message(`Could not export your data.\n\n${errorText(error)}`, {
      title: "Export failed",
      kind: "error",
    });
    return false;
  }
}

/** Picks a backup file, validates it, then swaps it in after confirmation. */
export async function importData(currentData: PromptPadData): Promise<ImportResult> {
  try {
    const path = await open({
      multiple: false,
      directory: false,
      filters: [JSON_FILTER],
    });
    if (!path) return { status: "cancelled" };

    const data = parseBackup(await readTextFile(path));

    const promptCount = data.prompts.length;
    const folderCount = data.folders.length;
    const confirmed = await confirm(
      `This will replace your current data with ${promptCount} prompt${
        promptCount === 1 ? "" : "s"
      } in ${folderCount} folder${folderCount === 1 ? "" : "s"}.\n\n` +
        "A backup of your current data is saved automatically before importing.",
      { title: "Import backup", kind: "warning", okLabel: "Import", cancelLabel: "Cancel" },
    );
    if (!confirmed) return { status: "cancelled" };

    saveImportBackup(loadData() ?? currentData);
    return { status: "imported", data };
  } catch (error) {
    await message(`Could not import that file.\n\n${errorText(error)}`, {
      title: "Import failed",
      kind: "error",
    });
    return { status: "cancelled" };
  }
}
