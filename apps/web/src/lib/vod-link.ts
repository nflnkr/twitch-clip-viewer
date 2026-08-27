import { formatSeconds } from "./utils";

export function getVodLink(vodOffset: number | null, videoId: string): string | null {
    const vodOffsetString = vodOffset ? formatSeconds(vodOffset) : null;
    const vodLink =
        vodOffsetString && videoId
            ? `https://twitch.tv/videos/${videoId}?t=${vodOffsetString}`
            : null;

    return vodLink;
}
