import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

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
