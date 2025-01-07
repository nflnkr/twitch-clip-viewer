import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, ScrollRestoration, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Meta, Scripts } from "@tanstack/start";
import type { ReactNode } from "react";
import appCss from "~/styles/app.css?url";

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
    component: RootComponent,
});

function RootComponent() {
    return (
        <RootDocument>
            <Outlet />
        </RootDocument>
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
                <ScrollRestoration />
                <TanStackRouterDevtools position="bottom-right" />
                <ReactQueryDevtools buttonPosition="bottom-left" />
                <Scripts />
            </body>
        </html>
    );
}
