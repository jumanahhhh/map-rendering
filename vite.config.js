import { defineConfig } from "vite";

export default defineConfig({
  base:"/map-rendering/",
  server: {
    hmr: false,
    watch: {
      usePolling: true, // Ensures HMR works reliably
    },
  },
  build: {
    sourcemap: true, // Helps debugging without refreshing
    minify: "esbuild", // Keeps builds fast
  },
  assetsInclude: ['**/*.wasm'],
});
