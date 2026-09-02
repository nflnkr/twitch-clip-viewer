import { z } from "zod";

export const twitchClipMetadataSchema = z.object({
    broadcaster_id: z.string(),
    broadcaster_name: z.string(),
    created_at: z.string(),
    creator_id: z.string(),
    creator_name: z.string(),
    duration: z.number(),
    embed_url: z.string(),
    game_id: z.string(),
    id: z.string(),
    language: z.string(),
    thumbnail_url: z.string(),
    title: z.string(),
    url: z.string(),
    video_id: z.string(),
    view_count: z.number(),
    vod_offset: z.number().nullable(),
    pagination: z.any().optional(),
    cursor: z.string().optional(),
});

export const twitchClipMetadataArraySchema = z.array(twitchClipMetadataSchema);

export type TwitchClipMetadata = z.infer<typeof twitchClipMetadataSchema>;

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
