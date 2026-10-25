import type { Window } from "@tauri-apps/api/window";
import { isTauri } from "./tauri";

async function withAppWindow(action: (appWindow: Window) => Promise<void>): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await action(getCurrentWindow());
}

export function minimizeWindow(): Promise<void> {
  return withAppWindow((appWindow) => appWindow.minimize());
}

export function closeWindow(): Promise<void> {
  return withAppWindow((appWindow) => appWindow.close());
}
