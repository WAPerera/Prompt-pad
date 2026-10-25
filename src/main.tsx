import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { isTauri } from "./lib/tauri";
import "./index.css";

// Let the rounded app shell blend with the desktop instead of sitting on a
// square dark backdrop. Browsers keep the opaque background for dev previews.
if (isTauri()) document.documentElement.classList.add("tauri");

// Tauri's OS drag-drop handling is disabled in tauri.conf.json so HTML5 drag
// events work inside the webview. File drops now reach the page, so stop them
// from navigating the window away from the app.
function blockFileDrop(event: DragEvent) {
  if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
}
window.addEventListener("dragover", blockFileDrop);
window.addEventListener("drop", blockFileDrop);

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
