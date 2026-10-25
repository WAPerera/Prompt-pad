import { useEffect, useRef, useState } from "react";
import { copyText } from "../../lib/clipboard";
import type { Prompt } from "../../types";
import { CheckIcon, CopyIcon, TrashIcon } from "../icons";

type PromptDetailProps = {
  prompt: Prompt;
  onChange: (patch: Partial<Pick<Prompt, "title" | "body">>) => void;
  onDelete: () => void;
};

/** State 4: an opened prompt. Every keystroke writes straight to app state. */
export function PromptDetail({ prompt, onChange, onDelete }: PromptDetailProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setCopied(false);
  }, [prompt.id]);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy() {
    const success = await copyText(prompt.body);
    if (!success) return;

    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start gap-2 px-5 pt-4">
        <input
          value={prompt.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Untitled prompt"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-tight text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
        />
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete prompt"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800/70 hover:text-red-400"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <textarea
        value={prompt.body}
        onChange={(event) => onChange({ body: event.target.value })}
        placeholder="Type your prompt here..."
        spellCheck={false}
        className="mt-3 min-h-0 w-full flex-1 resize-none bg-transparent px-5 pb-2 text-[13px] leading-relaxed text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
      />

      <div className="flex shrink-0 justify-end px-4 pb-4 pt-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-7 items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-zinc-100"
        >
          {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
