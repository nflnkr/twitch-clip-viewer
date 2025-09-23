import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
    plugins: [
        devtools(),
        viteTsConfigPaths({
            projects: ["./tsconfig.json"],
        }),
        tanstackStart({
            customViteReactPlugin: true,
            target: "node-server",
        }),
        viteReact(),
    ],
    server: {
        port: 4135,
    },
});

export default config;
