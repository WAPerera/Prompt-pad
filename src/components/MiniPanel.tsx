import { useEffect, useRef, useState } from "react";
import { copyText } from "../lib/clipboard";
import { closeWindow } from "../lib/window";
import type { Prompt } from "../types";
import { CheckIcon, CloseIcon, CopyIcon, ExpandIcon, PromptPadMark, ZapIcon } from "./icons";

type MiniPanelProps = {
  /** Quick prompts to list in the panel. */
  prompts: Prompt[];
  /** Brings back the full window. */
  onExpand: () => void;
};

/**
 * Always-on-top panel that replaces the main window while the app is
 * minimized. Clicking a prompt copies it; the panel fades while idle and comes
 * back to full strength on hover or focus.
 */
export function MiniPanel({ prompts, onExpand }: MiniPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy(prompt: Prompt) {
    if (!(await copyText(prompt.body))) return;

    setCopiedId(prompt.id);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopiedId(null), 1400);
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0f]/95 font-sans text-zinc-300 opacity-60 shadow-2xl antialiased transition-opacity duration-200 hover:opacity-100 focus-within:opacity-100 selection:bg-teal-400/25 selection:text-white">
      <header
        data-tauri-drag-region
        className="flex h-10 shrink-0 cursor-grab items-center gap-2 border-b border-white/5 pl-3 pr-1.5 active:cursor-grabbing"
      >
        <PromptPadMark className="pointer-events-none h-4 w-4 shrink-0 text-teal-400" />
        <div className="pointer-events-none flex min-w-0 flex-col leading-tight">
          <span className="text-[11px] font-semibold tracking-wide text-zinc-200">
            Prompt Pad
          </span>
          <span className="text-[10px] text-zinc-500">Click a prompt to copy</span>
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={onExpand}
            aria-label="Open Prompt Pad"
            title="Open Prompt Pad"
            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-100"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void closeWindow()}
            aria-label="Close Prompt Pad"
            title="Close Prompt Pad"
            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-red-500/90 hover:text-white"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {prompts.length === 0 ? (
          <p className="px-3 py-8 text-center text-[11px] leading-relaxed text-zinc-500">
            No quick prompts yet.
            <br />
            Star prompts in the main window to pin them here.
          </p>
        ) : (
          prompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              onClick={() => void handleCopy(prompt)}
              title={prompt.title || "Untitled prompt"}
              className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-zinc-800/70 focus-visible:bg-zinc-800/70 focus-visible:outline-none"
            >
              <ZapIcon className="h-3 w-3 shrink-0 text-amber-300/70" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-zinc-200">
                  {prompt.title || "Untitled prompt"}
                </span>
                <span className="block truncate text-[10px] text-zinc-500">
                  {prompt.body.trim() || "Empty prompt"}
                </span>
              </span>
              {copiedId === prompt.id ? (
                <CheckIcon className="h-3.5 w-3.5 shrink-0 text-teal-400" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5 shrink-0 text-zinc-600 transition group-hover:text-zinc-300" />
              )}
            </button>
          ))
        )}
      </div>

      <footer className="shrink-0 border-t border-white/5 px-3 py-1.5 text-[10px] text-zinc-600">
        Drag the header to move the panel
      </footer>
    </div>
  );
}
