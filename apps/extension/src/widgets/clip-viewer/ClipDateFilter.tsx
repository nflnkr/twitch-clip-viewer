import { Box, Button } from "@mui/material";
import { endOfDay, isSameDay, startOfDay, subDays, subMonths } from "date-fns";

export interface DateRange {
    from: Date;
    to: Date;
}

export function createDefaultRange(): DateRange {
    return { from: subDays(new Date(), 7), to: new Date() };
}

export function dateRangeToTimestamps(range: DateRange) {
    return {
        from: startOfDay(range.from).getTime(),
        to: endOfDay(range.to).getTime(),
    };
}

interface ClipDateFilterProps {
    range: DateRange;
    onChange: (range: DateRange) => void;
}

const PRESETS: { label: string; from: (now: Date) => Date; to: (now: Date) => Date }[] = [
    { label: "Day", from: (now) => subDays(now, 1), to: (now) => now },
    { label: "Week", from: (now) => subDays(now, 7), to: (now) => now },
    { label: "Month", from: (now) => subMonths(now, 1), to: (now) => now },
];

function isSameRange(a: DateRange, b: DateRange) {
    return isSameDay(a.from, b.from) && isSameDay(a.to, b.to);
}

export function ClipDateFilter({ range, onChange }: ClipDateFilterProps) {
    const now = new Date();

    return (
        <Box sx={{ display: "flex", gap: 0.5 }}>
            {PRESETS.map((preset) => {
                const presetRange = { from: preset.from(now), to: preset.to(now) };
                const isActive = isSameRange(range, presetRange);

                return (
                    <Button
                        key={preset.label}
                        size="small"
                        onClick={() => onChange(presetRange)}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            px: 1,
                            py: 0.5,
                            textTransform: "none",
                            color: isActive ? "#EFEFF1" : "#ADADB8",
                            border: 1,
                            borderColor: isActive ? "#5E427E" : "rgba(255, 255, 255, 0.12)",
                            backgroundColor: isActive
                                ? "rgba(94, 66, 126, 0.15)"
                                : "transparent",
                            "&:hover": {
                                borderColor: "#5E427E",
                                backgroundColor: "rgba(255, 255, 255, 0.06)",
                            },
                        }}
                    >
                        {preset.label}
                    </Button>
                );
            })}
        </Box>
    );
}
