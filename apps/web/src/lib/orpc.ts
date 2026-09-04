import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RetryAfterPlugin } from "@orpc/client/plugins";
import type { RouterClient } from "@orpc/server";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";

import { orpcRouter } from "@repo/api";

const getORPCClient = createIsomorphicFn()
    .server(() =>
        createRouterClient(orpcRouter, {
            context: () => ({ ip: "ssr" }),
        }),
    )
    .client((): RouterClient<typeof orpcRouter> => {
        const link = new RPCLink({
            url: `${window.location.origin}/api/rpc`,
            plugins: [
                new RetryAfterPlugin({
                    maxAttempts: 3,
                    timeout: 5 * 60 * 1000,
                }),
            ],
        });

        return createORPCClient(link);
    });

export const orpcClient: RouterClient<typeof orpcRouter> = getORPCClient();

export const orpc = createTanstackQueryUtils(orpcClient);
