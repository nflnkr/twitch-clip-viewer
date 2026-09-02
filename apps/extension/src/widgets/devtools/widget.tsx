import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";

import { queryClient } from "~/shared/config/query-client";
import { widgetOptions } from "~/shared/lib/widgets/widget-controller";

export const devtoolsWidgetOptions = widgetOptions({
    id: "react-query-devtools",
    selector: "body",
    insertPosition: "append",
    render: () => (
        <QueryClientProvider client={queryClient}>
            <TanStackDevtools
                config={{
                    position: "bottom-left",
                }}
                plugins={[
                    {
                        name: "TanStack Query",
                        render: <ReactQueryDevtoolsPanel style={{ height: "100%" }} />,
                    },
                ]}
            />
        </QueryClientProvider>
    ),
});
