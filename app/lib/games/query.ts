import { hashKey, QueryClient } from "@tanstack/query-core";
import { useQueries } from "@tanstack/react-query";
import DataLoader from "dataloader";
import { createContext, use } from "react";

import type { TwitchGame } from "~/model/twitch";
import { combineQueries } from "../utils/combine-queries";
import { getGamesServerFn } from "./api";

export const GamesLoaderContext = createContext<ReturnType<typeof createGamesLoader>>(null!);

const gamesQueryKey = "games";
const DELAY = 500;

export function createGamesLoader(queryClient: QueryClient) {
    return new DataLoader<{ gameId: string }, TwitchGame, string>(
        async (keys) => {
            const results = await getGamesServerFn({
                data: { gameIds: keys.map((key) => key.gameId) },
            });

            return keys.map(
                (key) =>
                    results.find((game) => game.id === key.gameId) ||
                    new Error(`Game with id "${key.gameId}" not found`),
            );
        },
        {
            batchScheduleFn: (callback) => setTimeout(callback, DELAY),
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
        queries: gameIds.filter(Boolean).map((gameId) => ({
            queryKey: [gamesQueryKey, { gameId }],
            queryFn: () => gamesLoader.load({ gameId }),
        })),
        combine: combineQueries,
    });
}
