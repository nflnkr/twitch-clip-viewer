import { QueryClient } from "@tanstack/react-query";
import { milliseconds } from "date-fns";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: milliseconds({ minutes: 30 }),
            retry: 1,
            retryDelay: milliseconds({ seconds: 5 }),
        },
    },
});
