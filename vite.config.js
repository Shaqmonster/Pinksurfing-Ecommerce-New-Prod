import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Optional VITE_* variables the code reads but which may not be set in every
// environment. If code reads a variable Vite doesn't know, Vite inlines the
// WHOLE env object into the bundle (every VITE_* value). Giving each optional
// key an explicit `undefined` keeps every access a plain replacement.
const OPTIONAL_ENV_KEYS = [
  "VITE_ENABLE_AUTH_WALLET",
  "VITE_GIGHUB_DEMO_ORDER_ETH",
  "VITE_RPC_URL",
  "VITE_AUTH_URL",
  "VITE_ROUTER_ADDRESS",
  "VITE_ESCROW_RPC_URL",
  "VITE_ESCROW_CHAIN_ID",
  "VITE_ENV",
];

// Fails the build if any chunk still contains the inlined env object.
function noInlinedEnvObject() {
  return {
    name: "no-inlined-env-object",
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        const code = chunk.type === "chunk" ? chunk.code : "";
        if (/["']?VITE_SERVER_URL["']?\s*:/.test(code)) {
          this.error(
            `${fileName} contains the whole import.meta.env object. Add the missing VITE_* key to OPTIONAL_ENV_KEYS in vite.config.js.`
          );
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const define = {};
  for (const key of OPTIONAL_ENV_KEYS) {
    // Replaced with a bare `undefined`, exactly what the code saw before.
    if (env[key] === undefined) define[`import.meta.env.${key}`] = "undefined";
  }
  return {
  define,
  plugins: [react(), noInlinedEnvObject()],
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
  };
});
