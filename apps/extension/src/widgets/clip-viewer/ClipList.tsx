import { useVirtualizer } from "@tanstack/react-virtual";
import { Box } from "@mui/material";
import { useRef, type UIEvent } from "react";

import type { TwitchClipMetadata } from "@repo/api";

import { ClipCard } from "./ClipCard";

const CLIP_HEIGHT = 68;
const CLIP_GAP = 6;
const SCROLL_BOTTOM_THRESHOLD = 200;

interface ClipListProps {
    clips: TwitchClipMetadata[];
    selectedClipId: string | null;
    onSelectClip: (id: string) => void;
    onScrollBottom: () => void;
}

export function ClipList({ clips, selectedClipId, onSelectClip, onScrollBottom }: ClipListProps) {
    "use no memo";

    const scrollElementRef = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: clips.length,
        getScrollElement: () => scrollElementRef.current,
        estimateSize: () => CLIP_HEIGHT,
        gap: CLIP_GAP,
    });

    function handleScroll(event: UIEvent<HTMLDivElement>) {
        const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
        if (scrollTop + clientHeight >= scrollHeight - SCROLL_BOTTOM_THRESHOLD) {
            onScrollBottom();
        }
    }

    return (
        <Box
            ref={scrollElementRef}
            onScroll={handleScroll}
            sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                p: 1.5,
                "&::-webkit-scrollbar": { width: 8 },
                "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#33333B",
                    borderRadius: 4,
                },
                "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: "#454549",
                },
                "&::-webkit-scrollbar-track": {
                    backgroundColor: "transparent",
                },
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    height: rowVirtualizer.getTotalSize(),
                    width: "100%",
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const clip = clips[virtualItem.index];
                    if (!clip) return null;

                    return (
                        <Box
                            key={clip.id}
                            sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <ClipCard
                                clip={clip}
                                selected={clip.id === selectedClipId}
                                onClick={() => onSelectClip(clip.id)}
                            />
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
