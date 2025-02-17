import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [
        //topLevelAwait(),
        react(),
        // wasm(),
    ],
    build: {
        rollupOptions: {
            input: {
                main: "src/main.tsx", // Main app entry point
                sw: "src/service-worker.ts", // Service worker entry point
            },
            output: {
                entryFileNames: "[name].js", // Keeps separate entry files
            },
        },
        outDir: "dist", // Ensures everything is output in `dist`
    },
});
