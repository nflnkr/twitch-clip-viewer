import { defineManifest } from "@crxjs/vite-plugin";

import packageJson from "./package.json" with { type: "json" };

export default defineManifest(() => {
    const orpcBaseUrl = process.env.VITE_BASE_URL ?? "http://localhost:4135";
    const orpcOrigin = new URL(orpcBaseUrl).origin;

    const host_permissions = ["https://www.twitch.tv/*", `${orpcOrigin}/*`];

    return {
        name: "TTV Clip Viewer",
        short_name: "Clip Viewer",
        version: packageJson.version,
        manifest_version: 3,
        icons: {
            "48": "src/assets/icon.png",
            "128": "src/assets/icon.png",
        },
        host_permissions,
        content_scripts: [
            {
                matches: ["https://www.twitch.tv/*"],
                js: ["src/entrypoints/content-scripts/twitch/index.ts"],
            },
        ],
    };
});
