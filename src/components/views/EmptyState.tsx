type EmptyStateProps = {
  onCreatePrompt: () => void;
  onCreateFolder: () => void;
};

export function EmptyState({ onCreatePrompt, onCreateFolder }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <h1 className="text-[15px] font-semibold tracking-tight text-zinc-200">
        Your Prompt Pad is empty
      </h1>
      <p className="mt-1.5 text-[13px] text-zinc-500">
        Create your first prompt or folder to get started.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={onCreatePrompt}
          className="h-8 rounded-lg bg-zinc-800/90 px-3.5 text-[13px] font-medium text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
        >
          Create Prompt
        </button>
        <button
          type="button"
          onClick={onCreateFolder}
          className="h-8 rounded-lg bg-zinc-800/90 px-3.5 text-[13px] font-medium text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
        >
          Create Folder
        </button>
      </div>
    </div>
  );
}
