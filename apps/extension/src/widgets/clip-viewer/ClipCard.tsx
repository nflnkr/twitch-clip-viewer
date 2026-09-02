import { Box, ButtonBase, Typography } from "@mui/material";

import type { TwitchClipMetadata } from "@repo/api";

interface ClipCardProps {
    clip: TwitchClipMetadata;
    selected: boolean;
    onClick: () => void;
}

function getThumbnailUrl(clip: TwitchClipMetadata) {
    return clip.thumbnail_url.replace("%{width}", "488").replace("%{height}", "274");
}

export function ClipCard({ clip, selected, onClick }: ClipCardProps) {
    return (
        <ButtonBase
            component="div"
            onClick={onClick}
            sx={{
                display: "flex",
                width: "100%",
                height: 68,
                minHeight: 68,
                flexShrink: 0,
                alignItems: "stretch",
                padding: 0,
                textAlign: "start",
                backgroundColor: "#18181B",
                color: "#EFEFF1",
                border: "2px solid",
                borderColor: selected ? "#5E427E" : "transparent",
                outline: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 1.5,
                overflow: "hidden",
                transition: "border-color 0.15s ease, background-color 0.15s ease, outline-color 0.15s ease",
                "&:hover": {
                    borderColor: "#6B4F8A",
                    backgroundColor: "#1F1F23",
                    outlineColor: "transparent",
                },
            }}
        >
            <Box
                component="img"
                src={getThumbnailUrl(clip)}
                alt={clip.title}
                loading="lazy"
                sx={{
                    width: "33%",
                    height: "100%",
                    objectFit: "cover",
                    backgroundColor: "rgba(145, 70, 255, 0.08)",
                    flexShrink: 0,
                }}
            />
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 0.5,
                    p: 1,
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        color: "#EFEFF1",
                        fontWeight: 600,
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                    noWrap
                    title={clip.title}
                >
                    {clip.title}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Typography
                        variant="caption"
                        sx={{ color: "#ADADB8" }}
                        noWrap
                        title={clip.broadcaster_name}
                    >
                        {clip.broadcaster_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#ADADB8" }} noWrap>
                        {clip.view_count}
                    </Typography>
                </Box>
            </Box>
        </ButtonBase>
    );
}
