import { Movie } from "@mui/icons-material";
import { Badge, IconButton, Tooltip } from "@mui/material";
import { useRef, useState } from "react";

import { useClipQueue } from "~/shared/lib/clip-queue";

import { ClipViewerPanel } from "./ClipViewerPanel";
import { FlyingClip } from "./FlyingClip";

export function ClipViewer() {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const queuedClips = useClipQueue((state) => state.clips);
    const flights = useClipQueue((state) => state.flights);
    const queueCount = queuedClips.length;

    return (
        <>
            <Tooltip title="Open clip viewer">
                <IconButton
                    ref={buttonRef}
                    size="small"
                    aria-label="clip viewer"
                    onClick={(event) => {
                        if (open) {
                            setOpen(false);
                        } else {
                            setAnchorEl(event.currentTarget);
                            requestAnimationFrame(() => setOpen(true));
                        }
                    }}
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        color: "#5E427E",
                        "&:hover": { backgroundColor: "rgba(94, 66, 126, 0.15)" },
                    }}
                >
                    <Badge
                        badgeContent={queueCount}
                        max={99}
                        color="secondary"
                        sx={{ "& .MuiBadge-badge": { fontSize: 10, minWidth: 16, height: 16 } }}
                    >
                        <Movie fontSize="small" />
                    </Badge>
                </IconButton>
            </Tooltip>
            {anchorEl && (
                <ClipViewerPanel
                    anchorEl={anchorEl}
                    open={open}
                    onClose={() => setOpen(false)}
                    onExited={() => setAnchorEl(null)}
                />
            )}
            {flights.map((flight) => (
                <FlyingClip key={flight.id} flight={flight} targetRef={buttonRef} />
            ))}
        </>
    );
}
