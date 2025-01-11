import { ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { TwitchClipMetadata } from "~/model/twitch";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface Props {
    clips?: TwitchClipMetadata[] | null;
    currentClipId: string | null;
    currentClipIndex: number;
    onClipClick: (clipId: string) => void;
}

export default function ClipList({ clips, currentClipId, currentClipIndex, onClipClick }: Props) {
    const [open, setOpen] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemsContainerRef = useRef<HTMLDivElement>(null);

    useEffect(
        function scrollToNewClip() {
            if (!open) return;

            const item = itemsContainerRef.current?.children[currentClipIndex];
            if (!item || !(item instanceof HTMLButtonElement)) return;

            const scrollContainer = scrollContainerRef.current?.querySelector("div");
            scrollContainer?.scrollTo({
                top: item.offsetTop,
                behavior: "smooth",
            });
        },
        [currentClipIndex, open],
    );

    if (!clips) return null;
    if (clips.length === 0) return <p className="px-2 text-xl">No clips</p>;

    return (
        <div className="flex grow flex-col gap-2 overflow-hidden">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen((o) => !o)}
            >
                <ChevronsUpDown className="h-4 w-4" />
                Clips
            </Button>
            {open && (
                <ScrollArea ref={scrollContainerRef}>
                    <div
                        ref={itemsContainerRef}
                        className="flex flex-col gap-1"
                    >
                        {clips.map((clip) => (
                            <Button
                                key={clip.id}
                                variant="outline"
                                className={cn(
                                    "flex h-auto w-full flex-col items-stretch gap-0 overflow-hidden border-2 border-accent p-0",
                                    currentClipId === clip.id && "border-purple-800",
                                )}
                                onClick={() => onClipClick(clip.id)}
                            >
                                <img
                                    src={clip.thumbnail_url}
                                    alt={clip.title}
                                    loading="lazy"
                                    className="aspect-video object-cover"
                                />
                                <div className="flex flex-col gap-2 p-2">
                                    <p className="self-start truncate tracking-tighter">
                                        {clip.title}
                                    </p>
                                    <div className="flex justify-between gap-2">
                                        <p className="truncate">{clip.broadcaster_name}</p>
                                        <p>{clip.view_count}</p>
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
