import { createContext } from "react";

import type { TwitchGame } from "~/model/twitch";
import { createDataLoaderQueryOptions } from "../dataloader-query";
import { getGamesServerFn } from "./api";

export const GamesLoaderContext = createContext<ReturnType<typeof createGamesLoader>>(null!);

export const { queryOptions: gamesOptions, createDataLoader: createGamesLoader } =
    createDataLoaderQueryOptions<unknown, TwitchGame | null, string>({
        queryKey: "games",
        queryOptions: { staleTime: Infinity },
        batchDelay: 1000,
        maxBatchSize: 100,
        batchLoadFn: async (keys) => {
            const results = await getGamesServerFn({
                data: { gameIds: keys.map((key) => key.id) },
            });

            return keys.map((key) => results.find((game) => game.id === key.id) || null);
        },
    });
