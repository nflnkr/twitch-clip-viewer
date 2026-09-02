import { Close, Movie, Visibility } from "@mui/icons-material";
import { Box, FormControlLabel, IconButton, Switch } from "@mui/material";

import type { PanelView } from "./ClipSidebar";
import { OrderingToggle } from "./OrderingToggle";
import { SegmentedTab } from "./SegmentedTab";

interface PanelHeaderProps {
    channelName: string;
    view: PanelView;
    onViewChange: (view: PanelView) => void;
    queueCount: number;
    chronologicalOrder: boolean;
    autoplay: boolean;
    clipLinkInterceptorEnabled: boolean;
    isTransparent: boolean;
    onOrderingChange: (value: boolean) => void;
    onToggleAutoplay: () => void;
    onToggleLinkInterceptor: () => void;
    onToggleTransparent: () => void;
    onClose: () => void;
}

export function PanelHeader({
    channelName,
    view,
    onViewChange,
    queueCount,
    chronologicalOrder,
    autoplay,
    clipLinkInterceptorEnabled,
    isTransparent,
    onOrderingChange,
    onToggleAutoplay,
    onToggleLinkInterceptor,
    onToggleTransparent,
    onClose,
}: PanelHeaderProps) {
    const streamerLabel = channelName
        ? `${channelName[0].toUpperCase()}${channelName.slice(1)}`
        : null;

    return (
        <Box
            className="clip-panel-drag-handle"
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: 1.5,
                py: 1,
                backgroundColor: "#18181B",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                cursor: "move",
                userSelect: "none",
            }}
        >
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                <Movie
                    fontSize="small"
                    sx={{ color: "#5E427E", flexShrink: 0 }}
                />
                <Box
                    sx={{
                        display: "flex",
                        gap: 0.5,
                        minWidth: 0,
                    }}
                >
                    <SegmentedTab
                        active={view === "clips"}
                        onClick={() => onViewChange("clips")}
                    >
                        {streamerLabel ? `${streamerLabel} clips` : "Clips"}
                    </SegmentedTab>
                    <SegmentedTab
                        active={view === "queue"}
                        onClick={() => onViewChange("queue")}
                    >
                        Queue ({queueCount})
                    </SegmentedTab>
                </Box>
            </Box>
            <FormControlLabel
                control={
                    <Switch
                        checked={clipLinkInterceptorEnabled}
                        onChange={onToggleLinkInterceptor}
                    />
                }
                label="Intercept clip links"
                className="clip-panel-cancel"
                slotProps={{ typography: { variant: "caption", color: "#ADADB8" } }}
                sx={{
                    m: 0,
                    gap: 1,
                    "& .MuiFormControlLabel-label": { margin: 0 },
                }}
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={autoplay}
                        onChange={onToggleAutoplay}
                    />
                }
                label="Clip autoplay"
                className="clip-panel-cancel"
                slotProps={{ typography: { variant: "caption", color: "#ADADB8" } }}
                sx={{
                    m: 0,
                    gap: 1,
                    "& .MuiFormControlLabel-label": { margin: 0 },
                }}
            />
            <OrderingToggle
                chronologicalOrder={chronologicalOrder}
                onChange={onOrderingChange}
            />
            <IconButton
                size="small"
                aria-label="toggle transparency"
                onClick={onToggleTransparent}
                className="clip-panel-cancel"
                sx={{
                    color: isTransparent ? "#5E427E" : "#ADADB8",
                    "&:hover": {
                        color: "#EFEFF1",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                }}
            >
                <Visibility fontSize="small" />
            </IconButton>
            <IconButton
                size="small"
                aria-label="close clip viewer"
                onClick={onClose}
                className="clip-panel-cancel"
                sx={{
                    color: "#ADADB8",
                    "&:hover": {
                        color: "#EFEFF1",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                }}
            >
                <Close fontSize="small" />
            </IconButton>
        </Box>
    );
}
