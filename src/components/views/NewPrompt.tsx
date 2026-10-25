import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

type NewPromptProps = {
  /** State 3 focuses the sidebar folder name first. */
  autoFocusTitle?: boolean;
  onSave: (title: string, body: string) => void;
  onCancel: () => void;
};

/** State 2 / State 3: draft prompt, committed only when Save is clicked. */
export function NewPrompt({ autoFocusTitle = true, onSave, onCancel }: NewPromptProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const canSave = title.trim().length > 0;

  useEffect(() => {
    // Also runs after the folder name is committed, handing focus to the heading.
    if (autoFocusTitle) titleRef.current?.focus();
  }, [autoFocusTitle]);

  function handleSave() {
    if (!canSave) return;
    onSave(title, body);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col" onKeyDown={handleKeyDown}>
      <div className="px-5 pt-4">
        <input
          ref={titleRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a heading"
          spellCheck={false}
          className="w-full bg-transparent text-lg font-semibold tracking-tight text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
      </div>

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Type your prompt here..."
        spellCheck={false}
        className="mt-3 min-h-0 w-full flex-1 resize-none bg-transparent px-5 pb-2 text-[13px] leading-relaxed text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
      />

      <div className="flex shrink-0 justify-end px-4 pb-4 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="flex h-8 items-center rounded-lg bg-zinc-800 px-4 text-[13px] font-medium text-zinc-100 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-zinc-600"
        >
          Save
        </button>
      </div>
    </div>
  );
}
