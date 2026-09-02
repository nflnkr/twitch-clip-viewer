import * as clips from "./clips";

export const orpcRouter = {
    ...clips,
};

export { twitchAuthToken, TwitchAuthToken } from "./twitch-auth-token";
export { twitchUserId, TwitchUserId } from "./twitch-user-id";
export { fetchBroadcasterClips, fetchClipById } from "./twitch-clips";
export {
    twitchClipMetadataSchema,
    twitchClipMetadataArraySchema,
} from "./twitch-model";
export type { TwitchClipMetadata, TwitchUserMetadata } from "./twitch-model";
