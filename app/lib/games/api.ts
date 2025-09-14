import { createServerFn } from "@tanstack/start";
import axios from "axios";
import { z } from "zod";

import type { TwitchGame } from "~/model/twitch";
import { logger } from "../logger";
import { twitchAuthToken } from "../twitch-auth-token";

export const getGamesServerFn = createServerFn({ method: "GET" })
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

            const response = await axios<{ data: TwitchGame[] }>(url.toString(), {
                headers: {
                    Authorization: "Bearer " + authData.authToken,
                    "Client-Id": authData.clientId,
                },
            });

            return response.data.data;
        } catch (err) {
            logger.error(err, "Error fetching broadcaster clips");

            throw err;
        }
    });
