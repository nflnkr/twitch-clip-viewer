import { createServerFn } from "@tanstack/start";
import axios from "axios";
import { endOfDay, parse, startOfDay } from "date-fns";
import { z } from "zod";
import { TwitchClipMetadata } from "~/model/twitch";
import { logger } from "./logger";
import { twitchAuthToken } from "./twitch-auth-token";
import { twitchUserId } from "./twitch-user-Id";

export const getClips = createServerFn({
    method: "POST",
})
    .validator(
        z.object({
            channels: z.string(),
            from: z.string().date(),
            to: z.string().date(),
            minViews: z.number(),
        }),
    )
    .handler(async (params) => {
        const { channels, from, to, minViews } = params.data;

        const fromTimestamp = parse(from, "yyyy-MM-dd", new Date());
        const toTimestamp = parse(to, "yyyy-MM-dd", new Date());
        const fromStartOfDay = startOfDay(fromTimestamp);
        const endOfToDay = endOfDay(toTimestamp);

        const broadcasterNameArray = channels.split(",");
        if (
            !broadcasterNameArray.length ||
            !broadcasterNameArray.every((s) => /^[a-zA-Z0-9][\w]{2,24}$/.test(s))
        ) {
            return null;
        }

        const clips = await Promise.all(
            broadcasterNameArray.map((broadcasterName) =>
                fetchAllBroadcasterClips({
                    broadcasterName,
                    fromTimestamp: fromStartOfDay.getTime(),
                    toTimestamp: endOfToDay.getTime(),
                    minViews,
                }),
            ),
        );

        return clips.flat(1).sort((a, b) => b.view_count - a.view_count);
    });

async function fetchAllBroadcasterClips({
    broadcasterName,
    fromTimestamp,
    toTimestamp,
    minViews,
}: {
    broadcasterName: string;
    fromTimestamp: number;
    toTimestamp: number;
    minViews: number;
}) {
    let cursor: string | null = "";
    const clips: TwitchClipMetadata[] = [];

    do {
        try {
            const response = await fetchBroadcasterClips({
                broadcasterName,
                fromTimestamp,
                toTimestamp,
                cursor,
            });
            if (!response?.clips.length) break;

            let minViewsMet = false;
            for (const clip of response.clips) {
                if (clip.view_count < minViews) {
                    minViewsMet = true;
                    break;
                }

                clips.push(clip);
            }
            if (minViewsMet) break;

            cursor = response.cursor;
        } catch (err) {
            logger.error(err, "Error fetching all broadcaster clips");

            break;
        }
    } while (cursor);

    return clips;
}

async function fetchBroadcasterClips({
    broadcasterName,
    fromTimestamp,
    toTimestamp,
    cursor,
}: {
    broadcasterName: string;
    fromTimestamp: number;
    toTimestamp: number;
    cursor?: string;
}) {
    if (!broadcasterName) return null;

    const broadcasterId = await twitchUserId.getIdByUsername(broadcasterName);
    if (!broadcasterId) return null;

    const searchParams = new URLSearchParams({
        first: "100",
        broadcaster_id: broadcasterId.toString(),
        started_at: new Date(fromTimestamp).toISOString(),
        ended_at: new Date(toTimestamp).toISOString(),
    });
    if (cursor) searchParams.append("after", cursor);
    const url = `https://api.twitch.tv/helix/clips?${searchParams}`;

    try {
        const authData = await twitchAuthToken.getAuthData();

        const response = await axios<{
            data: TwitchClipMetadata[];
            pagination?: { cursor: string | null };
        }>(url, {
            headers: {
                Authorization: "Bearer " + authData.authToken,
                "Client-Id": authData.clientId,
            },
        });

        return {
            clips: response.data.data,
            cursor: response.data.pagination?.cursor || null,
        };
    } catch (err) {
        logger.error(err, "Error fetching broadcaster clips");

        return null;
    }
}
