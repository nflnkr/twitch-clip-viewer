import { createRatelimitMiddleware } from "@orpc/experimental-ratelimit";
import { MemoryRatelimiter } from "@orpc/experimental-ratelimit/memory";

const MAX_REQUESTS = 60;
const WINDOW_MS = 60_000;

const clientLimiter = new MemoryRatelimiter({
    maxRequests: MAX_REQUESTS,
    window: WINDOW_MS,
});

const internalLimiter = new MemoryRatelimiter({
    maxRequests: 100_000,
    window: WINDOW_MS,
});

export const rateLimitMiddleware = createRatelimitMiddleware({
    limiter: ({ context }) => (context.ip === "ssr" ? internalLimiter : clientLimiter),
    key: ({ context }) => `ip:${context.ip}`,
});
