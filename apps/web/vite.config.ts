import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Allow importing the shared types package that lives outside this app's root.
const repoRoot = path.resolve(import.meta.dirname, "../..");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // scoped alias for the shared types package (matches @share-net/* naming),
    // so apps import it without climbing out with ../../../../.
    alias: {
      "@share-net/types": path.resolve(repoRoot, "packages/types"),
    },
  },
  server: {
    port: 5173,
    // During dev, proxy API calls to the Express server.
    proxy: {
      "/api": "http://localhost:8000",
    },
    fs: {
      allow: [repoRoot],
    },
  },
});
