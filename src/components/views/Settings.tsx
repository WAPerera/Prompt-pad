import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { DownloadIcon, UploadIcon } from "../icons";

type SettingsProps = {
  onExport: () => Promise<void>;
  onImport: () => Promise<void>;
  onClose: () => void;
};

type UpdateStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "latest" }
  | { kind: "available"; update: Update }
  | { kind: "installing"; progress: number | null }
  | { kind: "error"; message: string };

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const BUTTON_CLASS =
  "flex h-8 items-center gap-1.5 rounded-lg bg-zinc-800/90 px-3 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-zinc-800/90 disabled:hover:text-zinc-200";

/** Settings view: backup tools and the update check. */
export function Settings({ onExport, onImport, onClose }: SettingsProps) {
  const [busyAction, setBusyAction] = useState<"export" | "import" | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ kind: "idle" });

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
    setUpdateStatus({ kind: "checking" });
    try {
      const update = await check();
      setUpdateStatus(update ? { kind: "available", update } : { kind: "latest" });
    } catch (error) {
      setUpdateStatus({ kind: "error", message: errorText(error) });
    }
  }

  async function handleInstallUpdate() {
    if (updateStatus.kind !== "available") return;

    const { update } = updateStatus;
    setUpdateStatus({ kind: "installing", progress: null });

    try {
      let totalBytes = 0;
      let receivedBytes = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          totalBytes = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          receivedBytes += event.data.chunkLength;
          setUpdateStatus({
            kind: "installing",
            progress:
              totalBytes > 0
                ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100))
                : null,
          });
        } else {
          setUpdateStatus({ kind: "installing", progress: 100 });
        }
      });

      await relaunch();
    } catch (error) {
      setUpdateStatus({ kind: "error", message: errorText(error) });
    }
  }

  const updateBusy = updateStatus.kind === "checking" || updateStatus.kind === "installing";

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
            {updateStatus.kind === "checking" ? "Checking…" : "Check for updates"}
          </button>
          {updateStatus.kind === "available" ? (
            <button type="button" onClick={() => void handleInstallUpdate()} className={BUTTON_CLASS}>
              Install {updateStatus.update.version}
            </button>
          ) : null}
        </div>

        <p aria-live="polite" className="mt-2.5 text-[11px] leading-relaxed">
          {updateStatus.kind === "latest" ? (
            <span className="text-zinc-500">You are up to date.</span>
          ) : updateStatus.kind === "available" ? (
            <span className="text-teal-300/90">
              Version {updateStatus.update.version} is available.
            </span>
          ) : updateStatus.kind === "installing" ? (
            <span className="text-zinc-500">
              {updateStatus.progress === null
                ? "Downloading update…"
                : `Downloading update… ${updateStatus.progress}%`}
            </span>
          ) : updateStatus.kind === "error" ? (
            <span className="text-red-400/90">{updateStatus.message}</span>
          ) : (
            <span className="text-zinc-600">Updates are signed and verified automatically.</span>
          )}
        </p>
      </div>
    </div>
  );
}
