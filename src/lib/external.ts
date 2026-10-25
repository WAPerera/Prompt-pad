import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "./tauri";

const HTTP_URL = /^https?:\/\//i;

/**
 * Opens a link in the system browser. Only http(s) links are allowed, and the
 * backend re-checks the scheme before handing it to the OS.
 */
export async function openExternal(url: string): Promise<void> {
  if (!HTTP_URL.test(url)) {
    throw new Error("Only http(s) links can be opened.");
  }

  if (isTauri()) {
    await invoke("open_external", { url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export const KOFI_URL = "https://ko-fi.com/arjxnp";
