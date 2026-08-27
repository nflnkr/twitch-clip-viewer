import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

export const reactConfig = defineConfig(
    {
        files: ["**/*.ts", "**/*.tsx"],
        ...reactPlugin.configs.flat.recommended,
        ...reactPlugin.configs.flat["jsx-runtime"],
        rules: {
            "react/jsx-curly-brace-presence": [
                "warn",
                { props: "never", children: "never", propElementValues: "always" },
            ],
        },
        languageOptions: {
            ...reactPlugin.configs.flat.recommended?.languageOptions,
            ...reactPlugin.configs.flat["jsx-runtime"]?.languageOptions,
            globals: {
                React: "writable",
            },
        },
    },
    reactHooks.configs.flat["recommended-latest"],
);
