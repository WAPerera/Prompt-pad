import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/** Isolated test sandbox: jsdom, no Tauri APIs, no tailwind processing. */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
