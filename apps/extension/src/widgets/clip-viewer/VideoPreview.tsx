import { Box, Typography } from "@mui/material";

import type { TwitchClipMetadata } from "@repo/api";

export type Interaction = "drag" | "resize";

function getEmbedUrl(clip: TwitchClipMetadata, autoplay: boolean) {
    const params = new URLSearchParams({
        autoplay: String(autoplay),
        parent: window.location.hostname,
    });

    return `${clip.embed_url}&${params.toString()}`;
}

interface VideoPreviewProps {
    clip: TwitchClipMetadata | null;
    autoplay: boolean;
    interaction: Interaction | null;
}

export function VideoPreview({ clip, autoplay, interaction }: VideoPreviewProps) {
    return (
        <Box
            sx={{
                flex: 1,
                minWidth: 0,
                position: "relative",
                contain: "layout paint",
                containerType: "size",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    width: "min(100cqw, 177.777cqh)",
                    aspectRatio: "16 / 9",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    outline: interaction ? "1px dashed rgba(255, 255, 255, 0.5)" : "none",
                }}
            >
                {clip ? (
                    <iframe
                        key={clip.id}
                        src={getEmbedUrl(clip, autoplay)}
                        title={clip.title}
                        allow="autoplay; picture-in-picture; fullscreen"
                        allowFullScreen
                        style={{
                            width: "100%",
                            height: "100%",
                            border: 0,
                            display: "block",
                            visibility: interaction ? "hidden" : "visible",
                            pointerEvents: interaction ? "none" : "auto",
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{ color: "#ADADB8" }}
                        >
                            No clip
                        </Typography>
                    </Box>
                )}
                {interaction && (
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(14, 14, 16, 0.4)",
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{ color: "#ADADB8" }}
                        >
                            {interaction === "drag" ? "Moving…" : "Resizing…"}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
