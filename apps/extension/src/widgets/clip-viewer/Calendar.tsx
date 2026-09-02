import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "@mui/icons-material";
import { GlobalStyles } from "@mui/material";
import { DayPicker, type ChevronProps } from "react-day-picker";

const CALENDAR_CLASS = "clip-calendar";

function Chevron({ orientation, ...props }: ChevronProps) {
    const sx = { fontSize: 16 };

    if (orientation === "right") {
        return <ChevronRightIcon sx={sx} {...props} />;
    }

    if (orientation === "down") {
        return <ChevronRightIcon sx={{ ...sx, transform: "rotate(90deg)" }} />;
    }

    if (orientation === "up") {
        return <ChevronRightIcon sx={{ ...sx, transform: "rotate(-90deg)" }} />;
    }

    return <ChevronLeftIcon sx={sx} {...props} />;
}

const CALENDAR_CSS = `
.${CALENDAR_CLASS} .rdp-root {
    width: fit-content;
    padding: 10px;
    user-select: none;
    color: #efeef1;
    font-family: "Roboto", "Helvetica", "Arial", sans-serif;
}

.${CALENDAR_CLASS} .rdp-months {
    display: flex;
    gap: 16px;
}

.${CALENDAR_CLASS} .rdp-month {
    position: relative;
    display: flex;
    flex-direction: column;
}

.${CALENDAR_CLASS} .rdp-month_caption {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    padding: 0 34px;
}

.${CALENDAR_CLASS} .rdp-caption_label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #efeef1;
}

.${CALENDAR_CLASS} .rdp-button_previous,
.${CALENDAR_CLASS} .rdp-button_next {
    position: absolute;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #efeef1;
    cursor: pointer;
    transition: background-color 0.12s ease, color 0.12s ease;
}

.${CALENDAR_CLASS} .rdp-button_previous {
    left: 0;
}

.${CALENDAR_CLASS} .rdp-button_next {
    right: 0;
}

.${CALENDAR_CLASS} .rdp-button_previous:hover:not(:disabled),
.${CALENDAR_CLASS} .rdp-button_next:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
}

.${CALENDAR_CLASS} .rdp-button_previous:disabled,
.${CALENDAR_CLASS} .rdp-button_next:disabled {
    color: rgba(255, 255, 255, 0.3);
    cursor: default;
}

.${CALENDAR_CLASS} .rdp-month_grid {
    border-collapse: collapse;
    width: 100%;
}

.${CALENDAR_CLASS} .rdp-weekday {
    width: 34px;
    height: 34px;
    padding: 0;
    text-align: center;
    font-size: 0.72rem;
    font-weight: 500;
    color: #53535f;
}

.${CALENDAR_CLASS} .rdp-day {
    width: 34px;
    padding: 0;
    text-align: center;
}

.${CALENDAR_CLASS} .rdp-day_button {
    width: 34px;
    height: 34px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    font-size: 0.78rem;
    font-weight: 400;
    color: #efeef1;
    cursor: pointer;
    transition: background-color 0.12s ease, color 0.12s ease, border-radius 0.12s ease;
}

.${CALENDAR_CLASS} .rdp-day_button:focus-visible {
    outline: 2px solid rgba(145, 70, 255, 0.6);
    outline-offset: -2px;
}

.${CALENDAR_CLASS} .rdp-day:not(.rdp-outside):not(.rdp-disabled):not(.rdp-selected):not(.rdp-range_start):not(.rdp-range_end):not(.rdp-range_middle) .rdp-day_button:hover {
    background: rgba(255, 255, 255, 0.08);
}

.${CALENDAR_CLASS} .rdp-outside .rdp-day_button,
.${CALENDAR_CLASS} .rdp-disabled .rdp-day_button {
    color: #53535f;
    cursor: default;
}

.${CALENDAR_CLASS} .rdp-today .rdp-day_button {
    background: rgba(145, 70, 255, 0.16);
}

.${CALENDAR_CLASS} .rdp-selected:not(.rdp-range_start):not(.rdp-range_end):not(.rdp-range_middle) .rdp-day_button {
    background: #9146ff;
    color: #fff;
    border-radius: 4px;
}

.${CALENDAR_CLASS} .rdp-range_start {
    background: #9146ff;
    border-radius: 4px 0 0 4px;
    color: #fff;
}

.${CALENDAR_CLASS} .rdp-range_end {
    background: #9146ff;
    border-radius: 0 4px 4px 0;
    color: #fff;
}

.${CALENDAR_CLASS} .rdp-range_middle {
    background: rgba(145, 70, 255, 0.18);
    color: #efeef1;
}

.${CALENDAR_CLASS} .rdp-range_start .rdp-day_button,
.${CALENDAR_CLASS} .rdp-range_end .rdp-day_button,
.${CALENDAR_CLASS} .rdp-range_middle .rdp-day_button {
    background: transparent;
    color: inherit;
}
`;

type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ components, ...props }: CalendarProps) {
    return (
        <>
            <GlobalStyles styles={CALENDAR_CSS} />
            <div className={CALENDAR_CLASS}>
                <DayPicker
                    captionLayout="label"
                    showOutsideDays
                    navLayout="around"
                    components={{ ...components, Chevron }}
                    {...props}
                />
            </div>
        </>
    );
}
