import { reatomComponent } from "@reatom/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { milliseconds } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";
import { RefObject, useEffect, useImperativeHandle, useRef } from "react";

import { ScrollArea } from "~/components/ui/scroll-area";
import { db } from "~/lib/db";
import { chronologicalOrder, skipViewed, smallClipButton } from "~/lib/store/atoms";
import type { TwitchClipMetadata } from "~/model/twitch";
import ClipButton from "./ClipButton";

export type ClipListRef = {
    scrollToIndex: (index: number) => void;
    scrollToStart: () => void;
} | null;

interface Props {
    ref: RefObject<ClipListRef>;
    clips: TwitchClipMetadata[];
    currentClipId: string | null;
    currentClipIndex: number;
    onClipClick: (clip: TwitchClipMetadata) => void;
}

function ClipList({ ref, clips, currentClipId = null, currentClipIndex, onClipClick }: Props) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const viewedClips = useLiveQuery(() => db.viewedClips.toArray());

    const viewedClipIds = viewedClips?.map((c) => c.clipId) ?? [];

    const small = smallClipButton();
    const clipHeight = small ? 68 : 270;

    const rowVirtualizer = useVirtualizer({
        count: clips.length,
        getScrollElement: () =>
            scrollContainerRef.current?.querySelector("[data-radix-scroll-area-viewport]") ?? null,
        estimateSize: () => clipHeight,
        gap: 5,
    });

    useImperativeHandle(ref, () => ({
        scrollToIndex: (index) => {
            rowVirtualizer.scrollToIndex(index, { align: "start" });
        },
        scrollToStart: () => {
            rowVirtualizer.scrollToOffset(0);
        },
    }));

    useEffect(() => {
        rowVirtualizer.scrollToIndex(currentClipIndex, { align: "start", behavior: "smooth" });
    }, [currentClipIndex, rowVirtualizer]);

    return (
        <ScrollArea
            ref={scrollContainerRef}
            className="-mr-3 overflow-hidden pr-3"
            scrollHideDelay={milliseconds({ seconds: 10 })}
        >
            <div
                className="relative"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const clip = clips[virtualItem.index];
                    if (!clip) return null;

                    return (
                        <ClipButton
                            key={clip.id + small.toString()}
                            ref={rowVirtualizer.measureElement}
                            fade={skipViewed() && viewedClipIds.includes(clip.id)}
                            selected={currentClipId === clip.id}
                            viewed={viewedClipIds.includes(clip.id)}
                            thumbnailUrl={clip.thumbnail_url}
                            title={clip.title}
                            leftText={clip.broadcaster_name}
                            rightText={
                                chronologicalOrder() ? (
                                    <p>{new Date(clip.created_at).toLocaleString()}</p>
                                ) : (
                                    <p>{clip.view_count}</p>
                                )
                            }
                            onClick={() => onClipClick(clip)}
                            data-index={virtualItem.index}
                            className="absolute top-0 left-0 w-full"
                            style={{
                                height: clipHeight,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        />
                    );
                })}
            </div>
        </ScrollArea>
    );
}

export default reatomComponent(ClipList);
