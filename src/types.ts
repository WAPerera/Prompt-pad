export type Folder = {
  id: string;
  name: string;
};

export type Prompt = {
  id: string;
  folderId: string | null;
  title: string;
  body: string;
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
