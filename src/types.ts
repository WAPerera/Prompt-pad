export type Folder = {
  id: string;
  name: string;
};

export type Prompt = {
  id: string;
  folderId: string | null;
  title: string;
  body: string;
  /** Starred folder prompts are also listed under Quick prompts. */
  quick?: boolean;
};

export type PromptPadData = {
  folders: Folder[];
  prompts: Prompt[];
};

export type FolderEntry = {
  folder: Folder;
  prompts: Prompt[];
  expanded: boolean;
};
