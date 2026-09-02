export {
    twitchClipMetadataArraySchema,
    twitchClipMetadataSchema,
} from "@repo/api";
export type { TwitchClipMetadata } from "@repo/api";

export interface TwitchUserMetadata {
    id: string;
    login: string;
    display_name: string;
    type: string;
    broadcaster_type: string;
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
    created_at: string;
}

export interface TwitchGame {
    id: string;
    name: string;
    box_art_url: string;
    igdb_id: string;
}
