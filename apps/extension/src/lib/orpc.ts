import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { orpcRouter } from "@repo/api";

import { env } from "~/env";

const link = new RPCLink({
    url: `${env.VITE_BASE_URL}/api/rpc`,
});

export const orpcClient: RouterClient<typeof orpcRouter> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(orpcClient);
