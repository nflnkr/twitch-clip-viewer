import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
    server: {
        TWITCH_API_CLIENT_ID: z.string(),
        TWITCH_API_CLIENT_SECRET: z.string(),
        LOGTAIL_SOURCE_TOKEN: z.string(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
