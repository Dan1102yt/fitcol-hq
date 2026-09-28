import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" + HashRouter: funciona en GitHub Pages con cualquier nombre de repo.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
