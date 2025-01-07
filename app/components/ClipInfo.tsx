import { Calendar, ExternalLink, Eye, User } from "lucide-react";
import { TwitchClipMetadata } from "~/model/twitch";
import { Button } from "./ui/button";
import { cn, formatSeconds } from "~/lib/utils";

interface Props {
    currentClipIndex: number;
    clipsLength: number;
    currentClip: TwitchClipMetadata;
}

export default function ClipInfo({ clipsLength, currentClip, currentClipIndex }: Props) {
    const vodOffset = currentClip.vod_offset ? currentClip.vod_offset : null;
    const vodOffsetString = vodOffset ? formatSeconds(vodOffset) : null;
    const vodLink =
        vodOffsetString && currentClip.video_id
            ? `https://twitch.tv/videos/${currentClip.video_id}?t=${vodOffsetString}`
            : null;

    return (
        <div className="flex flex-col gap-2 px-4">
            <div className="flex justify-between gap-2">
                <Button
                    variant="link"
                    className="h-auto p-0 tracking-tight text-purple-600 hover:underline"
                    asChild
                >
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        color="secondary"
                        href={`https://twitch.tv/${currentClip.broadcaster_name.toLowerCase()}`}
                    >
                        {currentClip.broadcaster_name}
                    </a>
                </Button>
                <p className="text-sm">{`${currentClipIndex + 1}/${clipsLength}`}</p>
            </div>
            <p
                title={currentClip.title}
                className="truncate text-2xl font-semibold tracking-tighter"
            >
                {currentClip.title}
            </p>
            <div className="flex flex-wrap justify-around gap-2">
                <p className="flex items-center gap-1 text-sm tracking-tight">
                    <Eye size={20} />
                    {currentClip.view_count}
                </p>
                <p className="flex items-center gap-1 text-sm tracking-tight">
                    <User size={20} />
                    {currentClip.creator_name}
                </p>
                <p className="flex items-center gap-1 text-sm tracking-tight">
                    <Calendar size={20} />
                    {new Date(currentClip.created_at).toLocaleString()}
                </p>
            </div>
            <div className="flex">
                <Button
                    variant="outline"
                    className={cn("grow", vodLink && "rounded-r-none")}
                    size="sm"
                    asChild
                >
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        color="secondary"
                        href={currentClip.url}
                    >
                        Open clip
                        <ExternalLink />
                    </a>
                </Button>
                {vodLink && (
                    <Button
                        variant="outline"
                        className="grow rounded-l-none border-l-0"
                        size="sm"
                        asChild
                    >
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            color="secondary"
                            href={vodLink}
                        >
                            Open VOD
                            <ExternalLink />
                        </a>
                    </Button>
                )}
            </div>
        </div>
    );
}