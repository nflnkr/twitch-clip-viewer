import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";
import { TwitchClipMetadata } from "~/model/twitch";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

const CLIP_ELEMENT_HEIGHT = 270;

interface Props {
    clips?: TwitchClipMetadata[] | null;
    currentClipId: string | null;
    currentClipIndex: number;
    onClipClick: (clipId: string) => void;
}

export default function ClipList({ clips, currentClipId, currentClipIndex, onClipClick }: Props) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemsContainerRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: clips?.length ?? 0,
        getScrollElement: () =>
            scrollContainerRef.current?.querySelector("[data-radix-scroll-area-viewport]") ?? null,
        estimateSize: () => CLIP_ELEMENT_HEIGHT,
        gap: 5,
    });

    useEffect(() => {
        rowVirtualizer.scrollToIndex(currentClipIndex, { align: "start", behavior: "smooth" });
    }, [currentClipIndex, rowVirtualizer]);

    if (!clips) return null;
    if (clips.length === 0) return <p className="px-2 text-xl">No clips</p>;

    return (
        <ScrollArea ref={scrollContainerRef}>
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
                                "flex h-auto w-full flex-col items-stretch gap-0 overflow-hidden border-2 border-accent p-0",
                                currentClipId === clip.id && "border-purple-800",
                            )}
                            onClick={() => onClipClick(clip.id)}
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
                                <p className="max-w-full self-start truncate tracking-tighter">
                                    {clip.title}
                                </p>
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
