import type { TwitchClipMetadata } from "../model/clips";
import type { TwitchUserMetadata } from "../model/user";


const authToken = "ou6mmxlniox5kze8v40x8xgxnn9vec";
const clientId = "sl7qzvmvjfha998253d5d6muxxtglg";

export function getClips({ channels, start, end, minViewCount, signal, onNewClips }: {
    channels: string[];
    start: string;
    end: string;
    minViewCount: number;
    signal: AbortSignal;
    onNewClips: (clips: TwitchClipMetadata[]) => void;
}) {
    return Promise.all(channels.map(async channel => {
        const broadcasterId = await getBroadcasterId(channel, signal);
        if (!broadcasterId) return;

        const clipsGenerator = generateClipsForBroadcasterId({ broadcasterId, start, end, minViewCount, signal });
        for await (const clips of clipsGenerator) {
            onNewClips(clips);
        }
    }));
}

async function* generateClipsForBroadcasterId({ broadcasterId, start, end, minViewCount, signal }: {
    broadcasterId: number;
    start: string;
    end: string;
    minViewCount: number;
    signal: AbortSignal;
}) {
    let baseUrl = `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}&first=${100}&started_at=${start}&ended_at=${end}`;
    let cursor: string | null = "";

    do {
        const url = cursor ? baseUrl + `&after=${cursor}` : baseUrl;
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + authToken,
                "Client-Id": clientId,
            },
            signal,
        });
        const json = await response.json() as any;
        const clips: TwitchClipMetadata[] = [...json.data];

        cursor = json.pagination?.cursor;
        if (!clips?.length || clips.at(-1)!.view_count < minViewCount) cursor = null;

        yield clips;
    } while (cursor);

    return null;
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
