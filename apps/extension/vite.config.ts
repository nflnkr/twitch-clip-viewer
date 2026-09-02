import fs from "fs";
import path from "path";
import { crx } from "@crxjs/vite-plugin";
import babel from "@rolldown/plugin-babel";
import { devtools } from "@tanstack/devtools-vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import manifest from "./manifest.config.ts";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
    const distDir = "dist";

    return {
        plugins: [
            devtools({
                eventBusConfig: { enabled: false },
                enhancedLogs: { enabled: false },
            }),
            {
                apply: "serve",
                name: "inline-png-loader",
                transform(_, id) {
                    if (!id.endsWith(".png")) return null;

                    const data = fs.readFileSync(id);

                    return `export default "data:image/png;base64,${data.toString("base64")}"`;
                },
            },
            react(),
            babel({
                presets: [
                    reactCompilerPreset({
                        panicThreshold: command === "serve" ? "all_errors" : "none",
                    }),
                ],
            }),
            crx({ manifest }),
        ],
        resolve: {
            alias: {
                "~": path.resolve(import.meta.dirname, "./src"),
            },
        },
        server: {
            port: 4573,
            cors: {
                origin: [/chrome-extension:\/\//],
            },
        },
        build: {
            outDir: distDir,
            minify: false,
            sourcemap: false,
            reportCompressedSize: false,
        },
    };
});
