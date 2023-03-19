import { TwitchClipMetadata } from "../model/clips";
import { TwitchUserMetadata } from "../model/user";


const authToken = "lc7ofzrycacy9fw5zceo6z6j7cfrs1";
const clientId = "sl7qzvmvjfha998253d5d6muxxtglg";

export async function getClips({ channels, start, end, minViewCount, signal }: {
    channels: string[];
    start: string;
    end: string;
    minViewCount: number;
    signal: AbortSignal;
}) {
    if (!channels.length) return null;

    const clips: TwitchClipMetadata[] = [];
    try {
        await Promise.all(channels.map(async channel => {
            const broadcasterId = await getBroadcasterId(channel, signal);
            if (!broadcasterId) return;

            const newClips = await getClipsForBroadcasterId({ broadcasterId, start, end, minViewCount, signal });
            clips.push(...newClips);
        }));
    } catch (e) {
        return null;
    }
    clips.sort((a, b) => b.view_count - a.view_count);
    return clips;
}

async function getClipsForBroadcasterId({ broadcasterId, start, end, minViewCount, signal, cursor }: {
    broadcasterId: number;
    start: string;
    end: string;
    minViewCount: number;
    signal: AbortSignal;
    cursor?: string;
}) {
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
        const newClips = await getClipsForBroadcasterId({ broadcasterId, start, end, minViewCount, signal, cursor: newCursor });
        clips.push(...newClips);
    }
    return clips;
}

async function getBroadcasterId(username: string, signal: AbortSignal): Promise<number | null> {
    let url = `https://api.twitch.tv/helix/users?login=${username}`;

    const response = await fetch(url, {
        headers: {
            "Authorization": "Bearer " + authToken,
            "Client-Id": clientId
        },
        signal,
    });
    const json = await response.json() as { data: TwitchUserMetadata[]; };
    if (!json.data) return null;

    const id = Number(json.data[0].id);
    if (!id) return null;

    return id;
}