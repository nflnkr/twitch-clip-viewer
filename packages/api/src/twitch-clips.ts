import axios from "axios";

import type { TwitchClipMetadata } from "./twitch-model";
import { twitchAuthToken } from "./twitch-auth-token";
import { twitchUserId } from "./twitch-user-id";

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
        console.error("Error fetching broadcaster clips", err);

        return null;
    }
}

export async function fetchClipById(clipId: string) {
    if (!clipId) return null;

    const url = new URL("https://api.twitch.tv/helix/clips");

    url.searchParams.set("id", clipId);

    try {
        const authData = await twitchAuthToken.getAuthData();

        const response = await axios<{
            data: TwitchClipMetadata[];
        }>(url.toString(), {
            headers: {
                Authorization: "Bearer " + authData.authToken,
                "Client-Id": authData.clientId,
            },
        });

        const clip = response.data.data[0];

        return clip ?? null;
    } catch (err) {
        console.error("Error fetching clip by id", err);

        return null;
    }
}
