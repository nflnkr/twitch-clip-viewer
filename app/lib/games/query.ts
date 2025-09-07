import { hashKey, QueryClient } from "@tanstack/query-core";
import { useQueries } from "@tanstack/react-query";
import type { TwitchGame } from "~/model/twitch";
import DataLoader from "dataloader";
import { createContext, use } from "react";
import { combineQueries } from "../utils/combine-queries";
import { getGamesServerFn } from "./api";

export const GamesLoaderContext = createContext<ReturnType<typeof createGamesLoader>>(null!);

const gamesQueryKey = "games";

export function createGamesLoader(queryClient: QueryClient, delay: number) {
    return new DataLoader<{ gameId: string }, TwitchGame, string>(
        (keys) => getGamesServerFn({ data: { gameIds: keys.map((key) => key.gameId) } }),
        {
            batchScheduleFn: (callback) => setTimeout(callback, delay),
            cacheMap: {
                clear: () => queryClient.removeQueries({ queryKey: [gamesQueryKey] }),
                delete: (key) => queryClient.removeQueries({ queryKey: JSON.parse(key) }),
                get: (key) => queryClient.getQueryData(JSON.parse(key)),
                set: async (key, value) => queryClient.setQueryData(JSON.parse(key), await value),
            },
            cacheKeyFn: (key) => hashKey([gamesQueryKey, key]),
        },
    );
}

export function useGames(gameIds: string[]) {
    const gamesLoader = use(GamesLoaderContext);

    return useQueries({
        queries: gameIds.map((gameId) => ({
            queryKey: [gamesQueryKey, { gameId }],
            queryFn: () => gamesLoader.load({ gameId }),
        })),
        combine: combineQueries,
    });
}
