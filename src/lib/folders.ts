import type { Folder } from "../types";

/**
 * Reorders `folders` by moving `draggedId` next to `targetId`.
 *
 * Returns the original array unchanged when the move cannot be performed, so
 * callers can use identity to skip unnecessary state updates.
 */
export function moveFolder(
  folders: Folder[],
  draggedId: string,
  targetId: string,
  before: boolean,
): Folder[] {
  if (draggedId === targetId) return folders;

  const from = folders.findIndex((folder) => folder.id === draggedId);
  const to = folders.findIndex((folder) => folder.id === targetId);
  if (from < 0 || to < 0) return folders;

  const reordered = [...folders];
  const [moved] = reordered.splice(from, 1);

  // Removing the dragged folder shifts later targets one slot to the left.
  let insertAt = to - (from < to ? 1 : 0);
  if (!before) insertAt += 1;

  reordered.splice(insertAt, 0, moved);
  return reordered;
}
