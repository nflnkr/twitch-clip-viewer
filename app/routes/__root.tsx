import { useQueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Meta, Scripts } from "@tanstack/start";
import { lazy, StrictMode, Suspense, useMemo, useState, type ReactNode } from "react";

import { createGamesLoader, GamesLoaderContext } from "~/lib/games/query";
import { getRequestLocale } from "~/lib/locale/api";
import { LocaleContext, type AppLocale } from "~/lib/locale/locales";
import appCss from "~/styles/app.css?url";

const TanStackRouterDevtools =
    process.env.NODE_ENV === "production"
        ? () => null
        : lazy(() =>
              import("@tanstack/router-devtools").then((res) => ({
                  default: res.TanStackRouterDevtools,
              })),
          );

const hmrFixScript =
    process.env.NODE_ENV === "production"
        ? []
        : [
              {
                  type: "module",
                  children: `import RefreshRuntime from "/_build/@react-refresh";
            RefreshRuntime.injectIntoGlobalHook(window)
            window.$RefreshReg$ = () => {}
            window.$RefreshSig$ = () => (type) => type`,
              },
          ];

export const Route = createRootRoute({
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
            { rel: "stylesheet", href: appCss },
            { rel: "icon", href: "/favicon.ico" },
        ],
        scripts: [...hmrFixScript],
    }),
    loader: async () => ({ requestLocale: await getRequestLocale() }),
    component: RootComponent,
});

function RootComponent() {
    const requestLocale = Route.useLoaderData().requestLocale;
    const [locale, setLocale] = useState<AppLocale>(requestLocale);
    const queryClient = useQueryClient();
    const gamesLoader = useMemo(() => createGamesLoader(queryClient, 500), [queryClient]);

    return (
        <StrictMode>
            <GamesLoaderContext value={gamesLoader}>
                <LocaleContext value={{ locale, setLocale }}>
                    <RootDocument>
                        <Outlet />
                    </RootDocument>
                </LocaleContext>
            </GamesLoaderContext>
        </StrictMode>
    );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html className="dark">
            <head>
                <Meta />
            </head>
            <body className="h-dvh">
                {children}
                <ReactQueryDevtools buttonPosition="bottom-left" />
                <Suspense>
                    <TanStackRouterDevtools position="bottom-right" />
                </Suspense>
                <Scripts />
            </body>
        </html>
    );
}
