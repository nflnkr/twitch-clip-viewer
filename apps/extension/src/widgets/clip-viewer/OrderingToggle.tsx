import { Box, ButtonBase } from "@mui/material";

interface OrderingToggleProps {
    chronologicalOrder: boolean;
    onChange: (chronologicalOrder: boolean) => void;
}

export function OrderingToggle({ chronologicalOrder, onChange }: OrderingToggleProps) {
    const options = [
        { label: "Top", value: false },
        { label: "Newest", value: true },
    ];

    return (
        <Box
            className="clip-panel-cancel"
            sx={{ display: "inline-flex", borderRadius: 1, overflow: "hidden" }}
        >
            {options.map((option) => {
                const active = option.value === chronologicalOrder;

                return (
                    <ButtonBase
                        key={option.label}
                        onClick={() => onChange(option.value)}
                        sx={{
                            py: 0.5,
                            px: 1,
                            fontSize: "12px",
                            fontWeight: 600,
                            lineHeight: 1,
                            color: active ? "#EFEFF1" : "#ADADB8",
                            backgroundColor: active ? "rgba(94, 66, 126, 0.4)" : "transparent",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRightWidth: option.value ? "1px" : 0,
                            transition: "background-color 0.15s ease, color 0.15s ease",
                            "&:hover": {
                                color: "#EFEFF1",
                                backgroundColor: "rgba(255, 255, 255, 0.08)",
                            },
                        }}
                    >
                        {option.label}
                    </ButtonBase>
                );
            })}
        </Box>
    );
}
