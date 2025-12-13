import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: Infinity,
            },
        },
    });

    const router = createRouter({
        routeTree,
        context: { queryClient },
        defaultPreload: "intent",
        defaultStaleTime: Infinity,
        defaultNotFoundComponent: () => <NotFound />,
        Wrap: (props: { children: React.ReactNode }) => {
            return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
        },
    });

    setupRouterSsrQueryIntegration({ router, queryClient });

    return router;
};
