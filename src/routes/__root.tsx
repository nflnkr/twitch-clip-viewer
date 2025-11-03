import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useState } from "react";

import { createGamesLoader, GamesLoaderContext } from "~/lib/games/query";
import { getRequestLocale } from "~/lib/locale/api";
import { LocaleContext, type AppLocale } from "~/lib/locale/locales";
import appCss from "~/styles/app.css?url";

interface MyRouterContext {
    queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
    head: () => ({
        meta: [
            {
                charSet: "utf-8",
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            {
                title: "Clip Viewer",
            },
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss,
            },
        ],
    }),
    loader: async () => ({ requestLocale: await getRequestLocale() }),
    shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
    const requestLocale = Route.useLoaderData().requestLocale;
    const [locale, setLocale] = useState<AppLocale>(requestLocale);
    const [gamesLoader] = useState(createGamesLoader);

    return (
        <GamesLoaderContext value={gamesLoader}>
            <LocaleContext value={{ locale, setLocale }}>
                <html
                    lang="en"
                    className="dark scheme-dark"
                >
                    <head>
                        <HeadContent />
                    </head>
                    <body className="h-dvh">
                        {children}
                        <TanStackDevtools
                            plugins={[
                                {
                                    name: "Tanstack Router",
                                    render: <TanStackRouterDevtoolsPanel />,
                                },
                                {
                                    name: "Tanstack Query",
                                    render: <ReactQueryDevtoolsPanel style={{ height: "100%" }} />,
                                },
                            ]}
                        />
                        <Scripts />
                    </body>
                </html>
            </LocaleContext>
        </GamesLoaderContext>
    );
}
