import { onError } from "@orpc/client";
import { RatelimitHandlerPlugin } from "@orpc/experimental-ratelimit";
import { RPCHandler } from "@orpc/server/fetch";
import { createFileRoute } from "@tanstack/react-router";

import { orpcRouter } from "@repo/api";

const handler = new RPCHandler(orpcRouter, {
    plugins: [new RatelimitHandlerPlugin()],
    interceptors: [
        onError((error) => {
            console.error("ORPC error: ", error);
        }),
    ],
});

function getClientIp(request: Request) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0]?.trim();

    return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? "unknown";
}

const allowedOrigins = /^https:\/\/(\w+\.)?twitch\.tv$/;

function getAllowOrigin(request: Request) {
    const origin = request.headers.get("Origin");
    return origin && allowedOrigins.test(origin) ? origin : null;
}

function corsHeaders(request: Request) {
    const allowOrigin = getAllowOrigin(request);

    return {
        "Access-Control-Allow-Origin": allowOrigin ?? "",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Max-Age": "86400",
    };
}

async function handleORPCRequest({ request }: { request: Request }) {
    const { response } = await handler.handle(request, {
        prefix: "/api/rpc",
        context: { ip: getClientIp(request) },
    });

    const headers = new Headers(response?.headers);
    for (const [key, value] of Object.entries(corsHeaders(request))) {
        if (value) headers.set(key, value);
    }

    return new Response(response?.body, {
        status: response?.status ?? 404,
        headers,
    });
}

function handleOPTIONS({ request }: { request: Request }) {
    const headers = new Headers();
    for (const [key, value] of Object.entries(corsHeaders(request))) {
        if (value) headers.set(key, value);
    }

    return new Response(null, { status: 204, headers });
}

export const Route = createFileRoute("/api/rpc/$")({
    server: {
        handlers: {
            HEAD: handleORPCRequest,
            GET: handleORPCRequest,
            POST: handleORPCRequest,
            PUT: handleORPCRequest,
            PATCH: handleORPCRequest,
            DELETE: handleORPCRequest,
            OPTIONS: handleOPTIONS,
        },
    },
});
