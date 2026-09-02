import { Box, ButtonBase } from "@mui/material";
import type { ReactNode } from "react";

interface SegmentedTabProps {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}

export function SegmentedTab({ active, onClick, children }: SegmentedTabProps) {
    return (
        <ButtonBase
            onClick={onClick}
            className="clip-panel-cancel"
            sx={{
                flex: 1,
                py: 0.75,
                px: 1,
                borderRadius: 1,
                fontSize: "12px",
                fontWeight: 600,
                textAlign: "center",
                whiteSpace: "nowrap",
                color: active ? "#EFEFF1" : "#ADADB8",
                backgroundColor: active ? "rgba(94, 66, 126, 0.4)" : "transparent",
                transition: "background-color 0.15s ease, color 0.15s ease",
                "&:hover": {
                    color: "#EFEFF1",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                },
            }}
        >
            <Box
                component="span"
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
                {children}
            </Box>
        </ButtonBase>
    );
}
