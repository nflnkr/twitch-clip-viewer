import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/start";
import axios from "axios";
import { z } from "zod";
import { logger } from "./logger";
import { twitchAuthToken } from "./twitch-auth-token";

export function getGamesOptions(params: Parameters<typeof getGames>[0]["data"]) {
    const uniqueGameIds = [...new Set(params.gameIds)].sort();
    params.gameIds = uniqueGameIds;

    return queryOptions({
        queryKey: ["games", params],
        queryFn: () => {
            if (params.gameIds.length === 0) return [];

            return getGames({ data: params });
        },
    });
}

const getGames = createServerFn({ method: "GET" })
    .validator(
        z.object({
            gameIds: z.array(z.string()),
        }),
    )
    .handler(async (params) => {
        const url = new URL("https://api.twitch.tv/helix/games");

        params.data.gameIds.forEach((id) => url.searchParams.append("id", id));

        try {
            const authData = await twitchAuthToken.getAuthData();

            const response = await axios<{
                data: {
                    id: string;
                    name: string;
                    box_art_url: string;
                    igdb_id: string;
                }[];
            }>(url.toString(), {
                headers: {
                    Authorization: "Bearer " + authData.authToken,
                    "Client-Id": authData.clientId,
                },
            });

            debugger;

            return response.data.data;
        } catch (err) {
            logger.error(err, "Error fetching broadcaster clips");

            throw err;
        }
    });
