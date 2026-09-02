import { Box, ScopedCssBaseline, ThemeProvider, Typography } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, type PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { queryClient } from "~/shared/config/query-client";
import { theme } from "~/shared/config/theme";

export function WidgetRoot({ children }: PropsWithChildren) {
    return (
        <ErrorBoundary
            fallbackRender={(props) => {
                if (!import.meta.env.DEV) {
                    return null;
                }

                return (
                    <Box
                        sx={{
                            position: "relative",
                            p: 1,
                            my: 1,
                            borderRadius: 2,
                            backgroundColor: "#ff070775",
                        }}
                    >
                        <Typography
                            component="pre"
                            sx={{
                                fontSize: "12px",
                                whiteSpace: "break-spaces",
                                overflow: "clip",
                            }}
                        >
                            {props.error instanceof Error ? props.error.stack : String(props.error)}
                        </Typography>
                    </Box>
                );
            }}
        >
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>
                    <ScopedCssBaseline
                        sx={{
                            height: "100%",
                            backgroundColor: "transparent",
                        }}
                    >
                        <Suspense>{children}</Suspense>
                    </ScopedCssBaseline>
                </ThemeProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
