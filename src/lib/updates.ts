import { useCallback, useEffect, useRef, useState } from "react";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { isTauri } from "./tauri";

export type UpdatePhase = "idle" | "checking" | "latest" | "available" | "installing" | "error";

export type Updater = {
  phase: UpdatePhase;
  update: Update | null;
  /** Download progress in percent, or null while the size is still unknown. */
  progress: number | null;
  error: string | null;
  /** The user closed the update bubble for the currently available version. */
  dismissed: boolean;
  checkForUpdates: (silent?: boolean) => Promise<void>;
  installUpdate: () => Promise<void>;
  dismiss: () => void;
};

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Owns the updater state so both the Settings view and the update bubble see
 * the same check/install in progress. A silent check runs once the desktop app
 * starts so the bubble can appear without opening Settings.
 */
export function useUpdater(): Updater {
  const [phase, setPhase] = useState<UpdatePhase>("idle");
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const checkingRef = useRef(false);

  const checkForUpdates = useCallback(async (silent = false) => {
    if (!isTauri()) {
      setError("Update checks are only available in the desktop app.");
      setPhase("error");
      return;
    }
    if (checkingRef.current) return;

    checkingRef.current = true;
    setPhase("checking");
    setError(null);
    setDismissed(false);

    try {
      const nextUpdate = await check();
      setUpdate(nextUpdate);
      setPhase(nextUpdate ? "available" : "latest");
    } catch (checkError) {
      if (silent) {
        // A failed background check (offline, rate limited) should stay quiet.
        setPhase("idle");
      } else {
        setError(errorText(checkError));
        setPhase("error");
      }
    } finally {
      checkingRef.current = false;
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!update) return;

    setPhase("installing");
    setProgress(null);
    setError(null);

    try {
      let totalBytes = 0;
      let receivedBytes = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          totalBytes = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          receivedBytes += event.data.chunkLength;
          setProgress(
            totalBytes > 0
              ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100))
              : null,
          );
        } else {
          setProgress(100);
        }
      });

      await relaunch();
    } catch (installError) {
      setError(errorText(installError));
      setPhase("error");
    }
  }, [update]);

  const dismiss = useCallback(() => setDismissed(true), []);

  useEffect(() => {
    if (!isTauri()) return;
    void checkForUpdates(true);
  }, [checkForUpdates]);

  return {
    phase,
    update,
    progress,
    error,
    dismissed,
    checkForUpdates,
    installUpdate,
    dismiss,
  };
}
