import { Box, Fade, GlobalStyles, Paper } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import fuzzysort from "fuzzysort";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";

import type { TwitchClipMetadata } from "@repo/api";

import { orpc } from "~/lib/orpc";
import {
    setClipLinkInterceptorEnabled,
    useClipLinkInterceptor,
} from "~/shared/lib/clip-link-interceptor";
import {
    setAutoplay,
    setChronologicalOrder,
    useClipPanelSettings,
} from "~/shared/lib/clip-panel-settings";
import { removeClip, useClipQueue } from "~/shared/lib/clip-queue";
import { useCurrentUrl } from "~/shared/lib/use-current-url";
import {
    loadClipPanelLayout,
    saveClipPanelLayout,
    type ClipPanelLayout,
} from "~/shared/model/clip-panel-layout";

import { createDefaultRange, dateRangeToTimestamps, type DateRange } from "./ClipDateFilter";
import { ClipSidebar, type PanelView } from "./ClipSidebar";
import { PanelHeader } from "./PanelHeader";
import { VideoPreview, type Interaction } from "./VideoPreview";

const DEFAULT_WIDTH_FRACTION = 0.5;
const DEFAULT_HEIGHT_FRACTION = 2 / 3;
const INITIAL_PAGE_SIZE = 100;
const SIDEBAR_WIDTH = 300;
const VIDEO_PREVIEW_MIN_WIDTH = 360;
const MIN_WIDTH = SIDEBAR_WIDTH + VIDEO_PREVIEW_MIN_WIDTH;
const MIN_HEIGHT = 360;
const PANEL_GAP = 8;
const PANEL_BACKGROUND = "#0E0E10";
const PANEL_BORDER = "rgba(255, 255, 255, 0.14)";
const PANEL_BORDER_RADIUS = 8;
const RESIZE_HANDLE_SIZE = 12;
const RESIZE_HANDLE_ACCENT = PANEL_BORDER;

function toFraction(value: number, total: number) {
    return Math.min(1, Math.max(0, value / total));
}

interface ClipViewerPanelProps {
    anchorEl: HTMLElement;
    open: boolean;
    onClose: () => void;
    onExited: () => void;
}

export function ClipViewerPanel({ anchorEl, open, onClose, onExited }: ClipViewerPanelProps) {
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [layout, setLayout] = useState<ClipPanelLayout | null>(loadClipPanelLayout);
    const [interaction, setInteraction] = useState<Interaction | null>(null);
    const [resizeDirection, setResizeDirection] = useState<string | null>(null);
    const [range, setRange] = useState<DateRange>(createDefaultRange);
    const [isTransparent, setIsTransparent] = useState(false);
    const [view, setView] = useState<PanelView>("clips");
    const [titleFilter, setTitleFilter] = useState("");
    const [loadAllChannel, setLoadAllChannel] = useState<string | null>(null);

    const queuedClips = useClipQueue((state) => state.clips);
    const chronologicalOrder = useClipPanelSettings((state) => state.chronologicalOrder);
    const autoplay = useClipPanelSettings((state) => state.autoplay);
    const clipLinkInterceptorEnabled = useClipLinkInterceptor((state) => state.enabled);

    const url = useCurrentUrl();
    const channelName = url.pathname.split("/").filter(Boolean).find(Boolean) ?? "";

    const { from, to } = dateRangeToTimestamps(range);

    const previewQuery = useQuery({
        ...orpc.getClips.experimental_streamedOptions({
            input: { channels: [channelName], from, to, minViews: 0, limit: INITIAL_PAGE_SIZE },
        }),
        enabled: Boolean(channelName),
    });

    const fullQuery = useQuery({
        ...orpc.getClips.experimental_streamedOptions({
            input: { channels: [channelName], from, to, minViews: 0 },
        }),
        enabled: Boolean(channelName) && loadAllChannel === channelName,
    });

    const clips = useMemo(() => {
        const clipById: Record<string, TwitchClipMetadata> = {};

        [...(previewQuery.data ?? []), ...(fullQuery.data ?? [])].flat().forEach((clip) => {
            clipById[clip.id] = clip;
        });

        const sorted = Object.values(clipById).sort((a, b) =>
            chronologicalOrder
                ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                : b.view_count - a.view_count,
        );

        return fuzzysort
            .go(titleFilter, sorted, {
                key: "title",
                threshold: 0.3,
                all: true,
            })
            .map((result) => result.obj);
    }, [previewQuery.data, fullQuery.data, chronologicalOrder, titleFilter]);

    const isLoading = previewQuery.isLoading;

    const selectableClips = useMemo(() => {
        const byId = new Map<string, TwitchClipMetadata>();

        clips.forEach((clip) => byId.set(clip.id, clip));
        queuedClips.forEach((clip) => byId.set(clip.id, clip));

        return Array.from(byId.values());
    }, [clips, queuedClips]);

    const selectedClip =
        clips.find((clip) => clip.id === selectedClipId) ??
        selectableClips.find((clip) => clip.id === selectedClipId) ??
        clips.at(0) ??
        queuedClips.at(0) ??
        null;

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", onKeyDown);

        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    function handleRangeChange(nextRange: DateRange) {
        setRange(nextRange);
        setSelectedClipId(null);
        setLoadAllChannel(null);
    }

    function handleTitleFilterChange(value: string) {
        setTitleFilter(value);
        setSelectedClipId(null);
        if (value) setLoadAllChannel(channelName);
    }

    function handleOrderingChange(value: boolean) {
        setChronologicalOrder(value);
        setSelectedClipId(null);
    }

    function persistLayout(next: { x: number; y: number; width: number; height: number }) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const nextLayout: ClipPanelLayout = {
            x: toFraction(next.x, windowWidth),
            y: toFraction(next.y, windowHeight),
            width: toFraction(next.width, windowWidth),
            height: toFraction(next.height, windowHeight),
        };

        setLayout(nextLayout);
        saveClipPanelLayout(nextLayout);
    }

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const width = Math.max((layout?.width ?? DEFAULT_WIDTH_FRACTION) * windowWidth, MIN_WIDTH);
    const height = Math.max((layout?.height ?? DEFAULT_HEIGHT_FRACTION) * windowHeight, MIN_HEIGHT);
    const initialX = layout
        ? Math.min((layout?.x ?? 0) * windowWidth, windowWidth - width)
        : Math.max(anchorEl.getBoundingClientRect().right - width, 0);
    const initialY = layout
        ? Math.min((layout?.y ?? 0) * windowHeight, windowHeight - height)
        : Math.max(anchorEl.getBoundingClientRect().bottom + PANEL_GAP, 0);

    const shieldCursor =
        interaction === "drag"
            ? "move"
            : resizeDirection === "right"
              ? "ew-resize"
              : resizeDirection === "bottom"
                ? "ns-resize"
                : "nwse-resize";

    return createPortal(
        <Fade
            in={open}
            mountOnEnter
            unmountOnExit
            onExited={onExited}
        >
            <Box sx={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1100 }}>
                {interaction && (
                    <Box
                        sx={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 1299,
                            cursor: shieldCursor,
                        }}
                    />
                )}
                <GlobalStyles
                    styles={{
                        ".clip-resize-handle-right, .clip-resize-handle-bottom, .clip-resize-handle-bottomRight":
                            {
                                backgroundColor: "#0E0E10",
                                transition: "background-color 0.12s ease",
                            },
                        ".clip-resize-handle-right:hover, .clip-resize-handle-bottom:hover, .clip-resize-handle-bottomRight:hover":
                            {
                                backgroundColor: "#3A2560",
                            },
                        ".clip-resizing .clip-resize-handle-right, .clip-resizing .clip-resize-handle-bottom, .clip-resizing .clip-resize-handle-bottomRight":
                            {
                                backgroundColor: "#2E1B4C",
                                opacity: 1,
                            },
                        ".clip-resizing .clip-resize-handle-right:hover, .clip-resizing .clip-resize-handle-bottom:hover, .clip-resizing .clip-resize-handle-bottomRight:hover":
                            {
                                backgroundColor: "#2E1B4C",
                            },
                    }}
                />
                <Rnd
                    default={{ x: initialX, y: initialY, width, height }}
                    className={interaction === "resize" ? "clip-resizing" : undefined}
                    minWidth={MIN_WIDTH}
                    minHeight={MIN_HEIGHT}
                    bounds="window"
                    dragHandleClassName="clip-panel-drag-handle"
                    cancel=".clip-panel-cancel"
                    enableResizing={{
                        top: false,
                        right: true,
                        bottom: true,
                        left: false,
                        topRight: false,
                        bottomRight: true,
                        bottomLeft: false,
                        topLeft: false,
                    }}
                    resizeHandleWrapperStyle={{
                        pointerEvents: "auto",
                        opacity: interaction === "resize" || !isTransparent ? 1 : 0.3,
                    }}
                    resizeHandleStyles={{
                        right: {
                            width: RESIZE_HANDLE_SIZE,
                            right: -RESIZE_HANDLE_SIZE,
                            top: 0,
                            height: "100%",
                            borderTop: `1px solid ${RESIZE_HANDLE_ACCENT}`,
                            borderRight: `1px solid ${RESIZE_HANDLE_ACCENT}`,
                            borderBottom: `1px solid ${RESIZE_HANDLE_ACCENT}`,
                            borderRadius: `0 ${PANEL_BORDER_RADIUS}px 0 0`,
                        },
                        bottom: {
                            height: RESIZE_HANDLE_SIZE,
                            bottom: -RESIZE_HANDLE_SIZE,
                            left: 0,
                            width: "100%",
                            borderLeft: `1px solid ${RESIZE_HANDLE_ACCENT}`,
                            borderBottom: `1px solid ${RESIZE_HANDLE_ACCENT}`,
                            borderRight: `1px solid ${RESIZE_HANDLE_ACCENT}`,
                            borderRadius: `0 0 0 ${PANEL_BORDER_RADIUS}px`,
                        },
                        bottomRight: {
                            width: RESIZE_HANDLE_SIZE,
                            height: RESIZE_HANDLE_SIZE,
                            right: -RESIZE_HANDLE_SIZE,
                            bottom: -RESIZE_HANDLE_SIZE,
                            borderRight: `1px solid ${RESIZE_HANDLE_ACCENT}`,
                            borderBottom: `1px solid ${RESIZE_HANDLE_ACCENT}`,
                            borderRadius: `0 0 ${PANEL_BORDER_RADIUS}px 0`,
                        },
                    }}
                    resizeHandleClasses={{
                        right: "clip-resize-handle-right",
                        bottom: "clip-resize-handle-bottom",
                        bottomRight: "clip-resize-handle-bottomRight",
                    }}
                    onDragStart={() => {
                        setInteraction("drag");
                        setResizeDirection(null);
                    }}
                    onResizeStart={(_, dir) => {
                        setInteraction("resize");
                        setResizeDirection(dir);
                    }}
                    onDragStop={(_, data) => {
                        setInteraction(null);
                        setResizeDirection(null);
                        persistLayout({ x: data.x, y: data.y, width, height });
                    }}
                    onResizeStop={(_, _dir, ref, _delta, position) => {
                        setInteraction(null);
                        setResizeDirection(null);
                        persistLayout({
                            x: position.x,
                            y: position.y,
                            width: ref.offsetWidth,
                            height: ref.offsetHeight,
                        });
                    }}
                    style={{
                        position: "fixed",
                        zIndex: 1300,
                        willChange: "transform",
                        pointerEvents: "auto",
                    }}
                >
                    <Paper
                        sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            backgroundColor: PANEL_BACKGROUND,
                            color: "#EFEFF1",
                            border: `1px solid ${PANEL_BORDER}`,
                            borderRadius: `${PANEL_BORDER_RADIUS}px 0 0 0`,
                            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.55)",
                            opacity: isTransparent ? 0.3 : 1,
                            transition: "opacity 0.15s ease",
                        }}
                    >
                        <PanelHeader
                            channelName={channelName}
                            view={view}
                            onViewChange={setView}
                            queueCount={queuedClips.length}
                            chronologicalOrder={chronologicalOrder}
                            autoplay={autoplay}
                            clipLinkInterceptorEnabled={clipLinkInterceptorEnabled}
                            isTransparent={isTransparent}
                            onOrderingChange={handleOrderingChange}
                            onToggleAutoplay={() => setAutoplay(!autoplay)}
                            onToggleLinkInterceptor={() =>
                                setClipLinkInterceptorEnabled(!clipLinkInterceptorEnabled)
                            }
                            onToggleTransparent={() => setIsTransparent((value) => !value)}
                            onClose={onClose}
                        />
                        <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
                            <VideoPreview
                                clip={selectedClip}
                                autoplay={autoplay}
                                interaction={interaction}
                            />
                            <ClipSidebar
                                view={view}
                                channelName={channelName}
                                clips={clips}
                                queuedClips={queuedClips}
                                selectedClip={selectedClip}
                                isLoading={isLoading}
                                titleFilter={titleFilter}
                                range={range}
                                onTitleFilterChange={handleTitleFilterChange}
                                onRangeChange={handleRangeChange}
                                onSelectClip={setSelectedClipId}
                                onRemoveClip={removeClip}
                                onScrollBottom={() => setLoadAllChannel(channelName)}
                            />
                        </Box>
                    </Paper>
                </Rnd>
            </Box>
        </Fade>,
        document.body,
    );
}
