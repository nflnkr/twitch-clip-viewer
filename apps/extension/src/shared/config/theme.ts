import { createTheme } from "@mui/material";

const primaryColor = "#9146FF";
const secondaryColor = "#00E6CB";
const textColor = "#0E0E10";
const mutedTextColor = "#53535F";
const fontFamily = '"Roboto", "Helvetica", "Arial", sans-serif';

export const theme = createTheme({
    palette: {
        primary: {
            main: primaryColor,
        },
        secondary: {
            main: secondaryColor,
        },
        text: {
            primary: textColor,
            secondary: mutedTextColor,
        },
    },
    typography: {
        fontFamily,
        allVariants: {
            letterSpacing: 0,
        },
        // Twitch sets `html { font-size: 62.5% }` (1rem = 10px). MUI emits font sizes in
        // rem, and rem is relative to the document root (which we don't control), so every
        // MUI text becomes 62.5% too small. Emit px instead of rem here.
        pxToRem: (px: number) => `${px}px`,
    } as never,
    components: {
        MuiSwitch: {
            styleOverrides: {
                root: {
                    width: 40,
                    height: 24,
                    padding: 0,
                },
                switchBase: {
                    padding: 0,
                    margin: 3,
                    transitionDuration: "300ms",
                    "&.Mui-checked": {
                        transform: "translateX(16px)",
                        color: "#fff",
                        "& + .MuiSwitch-track": {
                            backgroundColor: primaryColor,
                            opacity: 1,
                            border: 0,
                        },
                        "&.Mui-disabled + .MuiSwitch-track": {
                            opacity: 0.3,
                        },
                    },
                    "&.Mui-focusVisible .MuiSwitch-thumb": {
                        color: primaryColor,
                        border: "6px solid #fff",
                    },
                    "&.Mui-disabled .MuiSwitch-thumb": {
                        color: "#B0B0B0",
                    },
                    "&.Mui-disabled + .MuiSwitch-track": {
                        opacity: 0.3,
                    },
                },
                thumb: {
                    boxSizing: "border-box",
                    width: 18,
                    height: 18,
                },
                track: {
                    borderRadius: 12,
                    backgroundColor: "#ccc",
                    opacity: 1,
                    transition: "background-color 500ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
                },
            },
        },
    },
});
