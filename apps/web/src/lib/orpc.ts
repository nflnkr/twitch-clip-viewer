import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";

import { orpcRouter } from "@repo/api";

const getORPCClient = createIsomorphicFn()
    .server(() =>
        createRouterClient(orpcRouter, {
            context: () => ({}),
        }),
    )
    .client((): RouterClient<typeof orpcRouter> => {
        const link = new RPCLink({
            url: `${window.location.origin}/api/rpc`,
        });

        return createORPCClient(link);
    });

export const orpcClient: RouterClient<typeof orpcRouter> = getORPCClient();

export const orpc = createTanstackQueryUtils(orpcClient);
