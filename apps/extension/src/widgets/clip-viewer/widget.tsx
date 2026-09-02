import { Movie } from "@mui/icons-material";
import { Box } from "@mui/material";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { widgetOptions } from "~/shared/lib/widgets/widget-controller";

import { ClipViewer } from "./ClipViewer";

export const clipViewerWidgetOptions = widgetOptions({
    id: "clip-viewer",
    selector: "div:has(> div > div > div > button[data-a-target='whisper-box-button'])",
    insertPosition: "after",
    render: ({ rootElement }) => {
        rootElement.style.margin = "4px";

        return (
            <ErrorBoundary fallback={null}>
                <Suspense
                    fallback={
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#ADADB8",
                            }}
                        >
                            <Movie fontSize="small" />
                        </Box>
                    }
                >
                    <ClipViewer />
                </Suspense>
            </ErrorBoundary>
        );
    },
});
