import { CloseIcon, MinimizeIcon } from "./icons";
import { closeWindow, minimizeWindow } from "../lib/window";

type WindowControlsProps = {
  /** Replaces the OS minimize with the floating panel (defaults to minimizing). */
  onMinimize?: () => void;
};

/** Custom window chrome, since the Tauri window runs without decorations. */
export function WindowControls({ onMinimize }: WindowControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => (onMinimize ? onMinimize() : void minimizeWindow())}
        aria-label="Minimize to floating panel"
        title="Minimize to floating panel"
        className="flex h-7 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-200"
      >
        <MinimizeIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => void closeWindow()}
        aria-label="Close window"
        className="flex h-7 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-red-500/90 hover:text-white"
      >
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
