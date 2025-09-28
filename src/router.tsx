import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";

export const createRouter = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: Infinity,
            },
        },
    });

    const router = createTanstackRouter({
        routeTree,
        context: { queryClient },
        defaultPreload: "intent",
        defaultStaleTime: Infinity,
        defaultNotFoundComponent: () => <NotFound />,
    });

    setupRouterSsrQueryIntegration({ router, queryClient });

    return router;
};

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof createRouter>;
    }
}
