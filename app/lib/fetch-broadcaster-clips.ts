import axios from "axios";
import { TwitchClipMetadata } from "~/model/twitch";
import { logger } from "./logger";
import { twitchAuthToken } from "./twitch-auth-token";
import { twitchUserId } from "./twitch-user-Id";

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
