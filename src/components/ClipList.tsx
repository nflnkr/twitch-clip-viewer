import { useVirtualizer } from "@tanstack/react-virtual";
import { useLiveQuery } from "dexie-react-hooks";
import { Check } from "lucide-react";
import { useEffect, useRef } from "react";

import { db } from "~/lib/db";
import { cn } from "~/lib/utils";
import type { TwitchClipMetadata } from "~/model/twitch";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface Props {
    clips?: TwitchClipMetadata[] | null;
    currentClipId: string | undefined | null;
    currentClipIndex: number;
    skipViewed: boolean;
    onClipClick: (clip: TwitchClipMetadata) => void;
}

export default function ClipList({
    clips,
    currentClipId = null,
    currentClipIndex,
    skipViewed,
    onClipClick,
}: Props) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemsContainerRef = useRef<HTMLDivElement>(null);
    const viewedClips = useLiveQuery(() => db.viewedClips.toArray());

    const viewedClipIds = viewedClips?.map((c) => c.clipId) ?? [];

    const rowVirtualizer = useVirtualizer({
        count: clips?.length ?? 0,
        getScrollElement: () =>
            scrollContainerRef.current?.querySelector("[data-radix-scroll-area-viewport]") ?? null,
        estimateSize: () => 270,
        gap: 5,
    });

    useEffect(() => {
        rowVirtualizer.scrollToIndex(currentClipIndex, { align: "start", behavior: "smooth" });
    }, [currentClipIndex, rowVirtualizer]);

    if (!clips) return null;
    if (clips.length === 0) return <p className="px-2 text-xl">No clips</p>;

    return (
        <ScrollArea
            ref={scrollContainerRef}
            className="-mr-3 overflow-hidden pr-3"
        >
            <div
                ref={itemsContainerRef}
                className="relative"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const clip = clips[virtualItem.index];
                    if (!clip) return null;

                    return (
                        <Button
                            key={clip.id}
                            variant="outline"
                            className={cn(
                                "border-accent flex h-auto w-full flex-col items-stretch gap-0 overflow-hidden border-2 p-0 transition-opacity",
                                skipViewed &&
                                    viewedClipIds.includes(clip.id) &&
                                    "border-accent/50 opacity-30",
                                currentClipId === clip.id && "border-purple-800",
                            )}
                            onClick={() => onClipClick(clip)}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <img
                                src={clip.thumbnail_url}
                                alt={clip.title}
                                loading="lazy"
                                className="min-h-0 grow object-cover"
                            />
                            <div className="flex flex-col gap-2 p-2">
                                <div className="flex items-center gap-1">
                                    {viewedClipIds.includes(clip.id) && <Check />}
                                    <p className="max-w-full self-start truncate tracking-tighter">
                                        {clip.title}
                                    </p>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <p className="truncate">{clip.broadcaster_name}</p>
                                    <p>{clip.view_count}</p>
                                </div>
                            </div>
                        </Button>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
