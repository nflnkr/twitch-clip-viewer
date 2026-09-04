import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RetryAfterPlugin } from "@orpc/client/plugins";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { orpcRouter } from "@repo/api";

import { env } from "~/env";

const link = new RPCLink({
    url: `${env.VITE_BASE_URL}/api/rpc`,
    plugins: [
        new RetryAfterPlugin({
            maxAttempts: 3,
            timeout: 5 * 60 * 1000,
        }),
    ],
});

export const orpcClient: RouterClient<typeof orpcRouter> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(orpcClient);
