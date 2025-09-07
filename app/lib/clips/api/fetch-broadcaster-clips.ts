import type { TwitchClipMetadata } from "~/model/twitch";
import axios from "axios";
import { logger } from "../../logger";
import { twitchAuthToken } from "../../twitch-auth-token";
import { twitchUserId } from "../../twitch-user-Id";

export async function fetchBroadcasterClips({
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

    const url = new URL("https://api.twitch.tv/helix/clips");

    url.searchParams.set("first", "100");
    url.searchParams.set("broadcaster_id", broadcasterId.toString());
    url.searchParams.set("started_at", new Date(fromTimestamp).toISOString());
    url.searchParams.set("ended_at", new Date(toTimestamp).toISOString());
    if (cursor) url.searchParams.set("after", cursor);

    try {
        const authData = await twitchAuthToken.getAuthData();

        const response = await axios<{
            data: TwitchClipMetadata[];
            pagination?: { cursor: string | null };
        }>(url.toString(), {
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
