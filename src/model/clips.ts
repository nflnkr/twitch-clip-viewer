

export interface TwitchClipMetadata {
    broadcaster_id: string;
    broadcaster_name: string;
    created_at: string;
    creator_id: string;
    creator_name: string;
    duration: number;
    embed_url: string;
    game_id: string;
    id: string;
    language: string;
    thumbnail_url: string;
    title: string;
    url: string;
    video_id: string;
    view_count: number;
    vod_offset: number | null;
    pagination?: any;
    cursor?: string;
}
