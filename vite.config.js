import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("framer-motion")) return "motion";
          if (
            id.includes("ethers") ||
            id.includes("web3") ||
            id.includes("web3modal")
          ) {
            return "web3";
          }
          if (id.includes("react-dom") || id.includes("/react/")) return "react";
        },
      },
      onwarn(warning, warn) {
        // ethers v5-style imports surface as noisy Rollup warnings; keep CI green
        if (warning.code === "UNUSED_EXTERNAL_IMPORT") return;
        if (
          warning.message &&
          warning.message.includes("is not exported by") &&
          warning.message.includes("ethers")
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
});
