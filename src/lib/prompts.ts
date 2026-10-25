import type { Prompt } from "../types";

/**
 * A prompt shows under Quick prompts when it is unfiled, or when a prompt
 * inside a folder has been starred.
 */
export function isQuickPrompt(prompt: Prompt): boolean {
  return prompt.folderId === null || prompt.quick === true;
}
