import { defineConfig } from "vite";

export default defineConfig({
  // server: {
  //   hmr: false,
  //   watch: {
  //     usePolling: true, // Ensures HMR works reliably
  //   },
  // },
  build: {
    sourcemap: true, // Helps debugging without refreshing
    minify: "esbuild", // Keeps builds fast
  },
  base:"/map-rendering"
});
