import { Search } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";

interface SearchFieldProps {
    value: string;
    onChange: (value: string) => void;
}

export function SearchField({ value, onChange }: SearchFieldProps) {
    return (
        <Box sx={{ mb: 1 }}>
            <TextField
                fullWidth
                size="small"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search clips by title…"
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" sx={{ color: "#ADADB8" }} />
                            </InputAdornment>
                        ),
                        sx: {
                            color: "#EFEFF1",
                            fontSize: "13px",
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255, 255, 255, 0.12)",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255, 255, 255, 0.28)",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#5E427E",
                            },
                        },
                    },
                }}
            />
        </Box>
    );
}
