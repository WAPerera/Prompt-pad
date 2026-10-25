import { confirm } from "@tauri-apps/plugin-dialog";
import { isTauri } from "./tauri";

/** Asks for confirmation, using the native dialog in Tauri and the browser prompt elsewhere. */
export async function confirmAction(message: string, title = "Confirm"): Promise<boolean> {
  if (isTauri()) {
    try {
      return await confirm(message, {
        title,
        kind: "warning",
        okLabel: "Delete",
        cancelLabel: "Cancel",
      });
    } catch {
      // Fall through to the web implementation if the dialog cannot be opened.
    }
  }

  return typeof window !== "undefined" ? window.confirm(message) : false;
}
