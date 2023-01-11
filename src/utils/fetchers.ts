import { ChannelnameToIds, TwitchClipMetadata, TwitchUserMetadata } from "../types";

const authToken = "w284j6uxmrrrqnpt713p99075571i2";
const clientId = "sl7qzvmvjfha998253d5d6muxxtglg";

interface GetClipsParams {
    channelIds: number[];
    start: string;
    end: string;
    minViewCount: number;
    signal: AbortSignal;
}

export async function getClips({ channelIds, start, end, minViewCount, signal }: GetClipsParams) {
    if (!channelIds.length) return null;

    const clips: TwitchClipMetadata[] = [];
    try {
        await Promise.all(channelIds.map(async channelId => {
            const newClips = await getClipsForBroadcasterId(channelId, start, end, minViewCount, signal);
            clips.push(...newClips);
        }));
    } catch (e) {
        console.log("Error", e);
        return null;
    }
    clips.sort((a, b) => b.view_count - a.view_count);
    return clips;
}

async function getClipsForBroadcasterId(broadcasterId: number, start: string, end: string, minViewCount: number, signal: AbortSignal, cursor?: string) {
    let url = `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}&first=${100}&started_at=${start}&ended_at=${end}`;
    if (cursor) url += `&after=${cursor}`;
    const response = await fetch(url, {
        headers: {
            "Authorization": "Bearer " + authToken,
            "Client-Id": clientId,
        },
        signal
    });
    const json = await response.json();
    const clips: TwitchClipMetadata[] = [...json.data];
    const newCursor = json.pagination?.cursor;
    if (newCursor && clips.length && clips.at(-1)!.view_count >= minViewCount) {
        const newClips = await getClipsForBroadcasterId(broadcasterId, start, end, minViewCount, signal, newCursor);
        clips.push(...newClips);
    }
    return clips;
}

export async function getBroadcasterIds(usernames: string[]) {
    if (!usernames.length) return null;

    let url = "https://api.twitch.tv/helix/users?";
    usernames.slice(0, 100).forEach((username, index) => {
        if (index !== 0) url += "&";
        url += `login=${username}`;
    });
    const response = await fetch(url, {
        headers: {
            "Authorization": "Bearer " + authToken,
            "Client-Id": clientId
        }
    });
    const json = await response.json() as { data: TwitchUserMetadata[]; };
    if (!json.data) return null;
    const channelToIds: ChannelnameToIds = {};
    json.data.forEach(userMetaData => {
        const id = Number(userMetaData.id);
        if (isNaN(id)) {
            console.error(`Cannot parse id: ${id}`);
            throw new Error("Cannot parse id");
        }
        channelToIds[userMetaData.login] = id;
    });
    return channelToIds;
}