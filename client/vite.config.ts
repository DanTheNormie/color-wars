import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          "babel-plugin-react-compiler",
          ["@babel/plugin-proposal-decorators", { version: "2023-11" }],
        ],
      },
    } as any),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@animation": path.resolve(__dirname, "./src/animation"),
      "@actions": path.resolve(__dirname, "./src/actions"),
    },
  },
  server: { host: true, strictPort: true },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "react";
            if (id.includes("pixi.js")) return "pixi";
          }
        },
        codeSplitting: true,
      },
    },
  },
});