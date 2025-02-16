import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Meta, Scripts } from "@tanstack/start";
import { lazy, StrictMode, Suspense, type ReactNode } from "react";
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
    component: RootComponent,
});

function RootComponent() {
    return (
        <StrictMode>
            <RootDocument>
                <Outlet />
            </RootDocument>
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
