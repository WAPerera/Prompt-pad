import type { Updater } from "../lib/updates";
import { CloseIcon, DownloadIcon } from "./icons";

type UpdateBubbleProps = {
  updater: Updater;
  onOpenSettings: () => void;
};

/** Small floating notice that appears when a newer version was found. */
export function UpdateBubble({ updater, onOpenSettings }: UpdateBubbleProps) {
  const { phase, update, progress, dismissed } = updater;

  if (phase === "installing") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-14 right-3 z-40 w-64 rounded-xl border border-teal-500/25 bg-[#131316]/95 p-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur"
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-300">
            <DownloadIcon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-zinc-100">Installing update…</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
              {progress === null ? "Downloading the new version…" : `Downloading… ${progress}%`}
            </p>
          </div>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-teal-400 transition-[width] duration-300"
            style={{ width: `${progress ?? 12}%` }}
          />
        </div>
      </div>
    );
  }

  if (phase !== "available" || !update || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-14 right-3 z-40 w-64 rounded-xl border border-teal-500/25 bg-[#131316]/95 p-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-teal-300">
          <DownloadIcon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-zinc-100">Update {update.version} available</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
            A newer version of Prompt Pad is ready to install.
          </p>
        </div>
        <button
          type="button"
          onClick={updater.dismiss}
          aria-label="Dismiss update notification"
          className="-mr-1 -mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          <CloseIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void updater.installUpdate()}
          className="h-7 flex-1 rounded-md bg-teal-500/90 px-2 text-[11px] font-semibold text-[#06201d] transition hover:bg-teal-400"
        >
          Install now
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="h-7 rounded-md px-2 text-[11px] font-medium text-zinc-400 transition hover:bg-zinc-800/70 hover:text-zinc-200"
        >
          Details
        </button>
      </div>
    </div>
  );
}
