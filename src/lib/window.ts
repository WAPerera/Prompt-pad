import type { PhysicalPosition, PhysicalSize, Window } from "@tauri-apps/api/window";
import { isTauri } from "./tauri";

/** Compact panel footprint in logical pixels; mirrors the MiniPanel layout. */
const PANEL_WIDTH = 304;
const PANEL_HEIGHT = 300;
const PANEL_MARGIN = 24;

/** Minimum size the full window is allowed to shrink to. */
const FULL_MIN_WIDTH = 520;
const FULL_MIN_HEIGHT = 380;

type WindowGeometry = {
  size: PhysicalSize;
  position: PhysicalPosition;
  maximized: boolean;
};

/** Full-window geometry captured when the app collapses into the floating panel. */
let fullGeometry: WindowGeometry | null = null;

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

/**
 * Shrinks the window into a small always-on-top panel anchored to the bottom
 * right of the current monitor. The previous geometry is remembered so
 * {@link restoreFromPanel} can put everything back.
 */
export async function collapseToPanel(): Promise<void> {
  if (!isTauri()) return;

  const { getCurrentWindow, PhysicalPosition, PhysicalSize, currentMonitor } = await import(
    "@tauri-apps/api/window"
  );
  const appWindow = getCurrentWindow();

  if (!fullGeometry) {
    const [size, position, maximized] = await Promise.all([
      appWindow.innerSize(),
      appWindow.outerPosition(),
      appWindow.isMaximized().catch(() => false),
    ]);
    fullGeometry = { size, position, maximized };
  }

  const monitor = await currentMonitor();
  const scale = monitor?.scaleFactor ?? (await appWindow.scaleFactor());
  const width = Math.round(PANEL_WIDTH * scale);
  const height = Math.round(PANEL_HEIGHT * scale);

  // Drop the full-window minimum size first, or the panel gets clamped.
  await appWindow.setSizeConstraints(null);
  await appWindow.setResizable(false);
  await appWindow.setSize(new PhysicalSize(width, height));

  if (monitor) {
    const margin = Math.round(PANEL_MARGIN * scale);
    const x = monitor.workArea.position.x + monitor.workArea.size.width - width - margin;
    const y = monitor.workArea.position.y + monitor.workArea.size.height - height - margin;
    await appWindow.setPosition(new PhysicalPosition(x, y));
  }

  await appWindow.setAlwaysOnTop(true);
  // Keep the panel out of the taskbar so it reads as an overlay, not a second app.
  await appWindow.setSkipTaskbar(true).catch(() => {});
}

/** Restores the full window geometry and drops the always-on-top panel state. */
export async function restoreFromPanel(): Promise<void> {
  if (!isTauri()) return;

  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const appWindow = getCurrentWindow();

  const geometry = fullGeometry;
  fullGeometry = null;

  await appWindow.setAlwaysOnTop(false);
  await appWindow.setSkipTaskbar(false).catch(() => {});
  await appWindow.setResizable(true);
  await appWindow.setSizeConstraints({
    minWidth: FULL_MIN_WIDTH,
    minHeight: FULL_MIN_HEIGHT,
  });

  if (geometry) {
    await appWindow.setSize(geometry.size);
    await appWindow.setPosition(geometry.position);
    if (geometry.maximized) await appWindow.maximize().catch(() => {});
  }

  await appWindow.setFocus().catch(() => {});
}
