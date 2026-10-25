import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import type { Updater } from "../../lib/updates";
import { DownloadIcon, UploadIcon } from "../icons";

type SettingsProps = {
  updater: Updater;
  onExport: () => Promise<void>;
  onImport: () => Promise<void>;
  onClose: () => void;
};

const BUTTON_CLASS =
  "flex h-8 items-center gap-1.5 rounded-lg bg-zinc-800/90 px-3 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-zinc-800/90 disabled:hover:text-zinc-200";

/** Settings view: backup tools and the update check. */
export function Settings({ updater, onExport, onImport, onClose }: SettingsProps) {
  const [busyAction, setBusyAction] = useState<"export" | "import" | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getVersion()
      .then((version) => {
        if (active) setCurrentVersion(version);
      })
      .catch(() => {
        // The version is informational only; the rest of Settings still works.
      });
    return () => {
      active = false;
    };
  }, []);

  async function runAction(action: "export" | "import", run: () => Promise<void>) {
    if (busyAction) return;
    setBusyAction(action);
    try {
      await run();
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCheckForUpdates() {
    await updater.checkForUpdates();
  }

  async function handleInstallUpdate() {
    await updater.installUpdate();
  }

  const updateBusy = updater.phase === "checking" || updater.phase === "installing";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-5 pt-4">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Settings</h1>
        <button
          type="button"
          onClick={onClose}
          className="h-7 rounded-md px-2.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800/70 hover:text-zinc-100"
        >
          Done
        </button>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Data</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">
          Your prompts are stored on this device. Export a backup to a JSON file, or restore one
          you saved earlier.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() => void runAction("export", onExport)}
            className={BUTTON_CLASS}
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            {busyAction === "export" ? "Exporting…" : "Export backup"}
          </button>
          <button
            type="button"
            disabled={busyAction !== null}
            onClick={() => void runAction("import", onImport)}
            className={BUTTON_CLASS}
          >
            <UploadIcon className="h-3.5 w-3.5" />
            {busyAction === "import" ? "Importing…" : "Import backup"}
          </button>
        </div>

        <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-600">
          Importing replaces your current prompts and saves a copy of them on this device first.
        </p>

        <h2 className="mt-6 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Updates
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">
          {currentVersion ? `You are running version ${currentVersion}.` : "Checking your version…"}{" "}
          Updates are downloaded from GitHub Releases.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled={updateBusy}
            onClick={() => void handleCheckForUpdates()}
            className={BUTTON_CLASS}
          >
            {updater.phase === "checking" ? "Checking…" : "Check for updates"}
          </button>
          {updater.phase === "available" && updater.update ? (
            <button type="button" onClick={() => void handleInstallUpdate()} className={BUTTON_CLASS}>
              Install {updater.update.version}
            </button>
          ) : null}
        </div>

        <p aria-live="polite" className="mt-2.5 text-[11px] leading-relaxed">
          {updater.phase === "latest" ? (
            <span className="text-zinc-500">You are up to date.</span>
          ) : updater.phase === "available" && updater.update ? (
            <span className="text-teal-300/90">
              Version {updater.update.version} is available.
            </span>
          ) : updater.phase === "installing" ? (
            <span className="text-zinc-500">
              {updater.progress === null
                ? "Downloading update…"
                : `Downloading update… ${updater.progress}%`}
            </span>
          ) : updater.phase === "error" ? (
            <span className="text-red-400/90">{updater.error}</span>
          ) : (
            <span className="text-zinc-600">Updates are signed and verified automatically.</span>
          )}
        </p>
      </div>
    </div>
  );
}
