import { defineConfig, loadEnv } from "vite";

// This ensures environment variables are loaded regardless of mode
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production)
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  
  return {
    base: "/map-rendering/",
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
    // Make sure envPrefix includes VITE to load environment variables properly
    envPrefix: ["VITE_"],
    // Print environment variables during build (for debugging)
    define: {
      'process.env.VITE_MAPBOX_ACCESS_TOKEN': JSON.stringify(process.env.VITE_MAPBOX_ACCESS_TOKEN),
    }
  };
});
