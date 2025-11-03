import { createContext } from "react";

import type { TwitchGame } from "~/model/twitch";
import { createDataLoaderQueryOptions } from "../dataloader-query";
import { getGamesServerFn } from "./api";

export const GamesLoaderContext = createContext<ReturnType<typeof createGamesLoader>>(null!);

export const { queryOptions: gameOptions, createDataLoader: createGamesLoader } =
    createDataLoaderQueryOptions<string, TwitchGame | null>({
        queryKey: "games",
        defaultQueryOptions: { staleTime: Infinity },
        batchDelay: 1000,
        maxBatchSize: 100,
        batchLoadFn: async (gameIds) => {
            const results = await getGamesServerFn({ data: { gameIds: gameIds.filter(Boolean) } });

            return gameIds.map((gameId) => results.find((game) => game.id === gameId) ?? null);
        },
    });
