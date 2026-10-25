import { createId } from "./utils";
import type { PromptPadData } from "../types";

/** Seed content so the app never opens completely blank on first run. */
export function createInitialData(): PromptPadData {
  return {
    folders: [{ id: createId(), name: "Design prompts" }],
    prompts: [
      {
        id: createId(),
        folderId: null,
        title: "Summarize text",
        body: "Scan the design > Link\n-Generate new home screen\n-Do not hard code components\n-Read the design system",
      },
    ],
  };
}
