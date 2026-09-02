import { Close, OpenInNew, Search } from "@mui/icons-material";
import { Box, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material";
import { format } from "date-fns";
import { useState } from "react";

import type { TwitchClipMetadata } from "@repo/api";

import { env } from "~/env";

import { ClipCard } from "./ClipCard";
import { ClipDateFilter, type DateRange } from "./ClipDateFilter";
import { ClipList } from "./ClipList";
import { SearchField } from "./SearchField";

export type PanelView = "clips" | "queue";

const SIDEBAR_WIDTH = 300;

const LIST_SX = {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    p: 1.5,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
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
};

interface ClipSidebarProps {
    view: PanelView;
    channelName: string;
    clips: TwitchClipMetadata[];
    queuedClips: TwitchClipMetadata[];
    selectedClip: TwitchClipMetadata | null;
    isLoading: boolean;
    titleFilter: string;
    range: DateRange;
    onTitleFilterChange: (value: string) => void;
    onRangeChange: (range: DateRange) => void;
    onSelectClip: (id: string) => void;
    onRemoveClip: (id: string) => void;
    onScrollBottom: () => void;
}

export function ClipSidebar({
    view,
    channelName,
    clips,
    queuedClips,
    selectedClip,
    isLoading,
    titleFilter,
    range,
    onTitleFilterChange,
    onRangeChange,
    onSelectClip,
    onRemoveClip,
    onScrollBottom,
}: ClipSidebarProps) {
    const [searchOpen, setSearchOpen] = useState(false);

    const websiteUrl = new URL(env.VITE_BASE_URL);
    websiteUrl.searchParams.set("channels", channelName);
    websiteUrl.searchParams.set("from", format(range.from, "yyyy-MM-dd"));
    websiteUrl.searchParams.set("to", format(range.to, "yyyy-MM-dd"));

    return (
        <Box
            sx={{
                width: SIDEBAR_WIDTH,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#0E0E10",
                borderLeft: 1,
                borderColor: "rgba(255, 255, 255, 0.12)",
            }}
        >
            {view === "clips" ? (
                <>
                    <Box
                        sx={{
                            position: "relative",
                            px: 1.5,
                            py: 1,
                            backgroundColor: "#18181B",
                            borderBottom: 1,
                            borderColor: "rgba(255, 255, 255, 0.12)",
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box
                                sx={{
                                    position: "relative",
                                    flex: 1,
                                    minWidth: 0,
                                }}
                            >
                                <ClipDateFilter
                                    range={range}
                                    onChange={onRangeChange}
                                />
                                {searchOpen && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            inset: 0,
                                            backgroundColor: "#18181B",
                                            zIndex: 1,
                                        }}
                                    >
                                        <SearchField
                                            value={titleFilter}
                                            onChange={onTitleFilterChange}
                                        />
                                    </Box>
                                )}
                            </Box>
                            <Tooltip title="Open website">
                                <IconButton
                                    component="a"
                                    href={websiteUrl.toString()}
                                    target="_blank"
                                    rel="noreferrer"
                                    size="small"
                                    aria-label="open website"
                                    sx={{
                                        ml: 0.5,
                                        color: "#ADADB8",
                                        "&:hover": {
                                            color: "#EFEFF1",
                                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                                        },
                                    }}
                                >
                                    <OpenInNew fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={searchOpen ? "Close search" : "Search by title"}>
                                <IconButton
                                    size="small"
                                    aria-label="toggle search"
                                    onClick={() => setSearchOpen((prev) => !prev)}
                                    sx={{
                                        ml: 0.5,
                                        color: searchOpen ? "#5E427E" : "#ADADB8",
                                        "&:hover": {
                                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                                        },
                                    }}
                                >
                                    <Search fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                    {isLoading ? (
                        <Box sx={LIST_SX}>
                            <Box
                                sx={{
                                    flex: 1,
                                    minHeight: 160,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <CircularProgress
                                    size={24}
                                    sx={{ color: "#5E427E" }}
                                />
                            </Box>
                        </Box>
                    ) : clips.length === 0 ? (
                        <Box sx={LIST_SX}>
                            <Box
                                sx={{
                                    flex: 1,
                                    minHeight: 160,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{ color: "#ADADB8" }}
                                >
                                    No clips for this period
                                </Typography>
                            </Box>
                        </Box>
                    ) : (
                        <ClipList
                            clips={clips}
                            selectedClipId={selectedClip?.id ?? null}
                            onSelectClip={onSelectClip}
                            onScrollBottom={onScrollBottom}
                        />
                    )}
                </>
            ) : (
                <Box sx={LIST_SX}>
                    {queuedClips.length === 0 ? (
                        <Box
                            sx={{
                                flex: 1,
                                minHeight: 160,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{ color: "#ADADB8" }}
                            >
                                Queue is empty
                            </Typography>
                        </Box>
                    ) : (
                        queuedClips.map((clip) => (
                            <Box
                                key={clip.id}
                                sx={{ position: "relative" }}
                            >
                                <ClipCard
                                    clip={clip}
                                    selected={clip.id === selectedClip?.id}
                                    onClick={() => onSelectClip(clip.id)}
                                />
                                <Tooltip title="Remove from queue">
                                    <IconButton
                                        size="small"
                                        aria-label="remove from queue"
                                        onClick={() => onRemoveClip(clip.id)}
                                        className="clip-panel-cancel"
                                        sx={{
                                            position: "absolute",
                                            top: 4,
                                            right: 4,
                                            color: "#ADADB8",
                                            backgroundColor: "rgba(14, 14, 16, 0.6)",
                                            "&:hover": {
                                                color: "#FF4B4B",
                                                backgroundColor: "rgba(14, 14, 16, 0.9)",
                                            },
                                        }}
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        ))
                    )}
                </Box>
            )}
        </Box>
    );
}
