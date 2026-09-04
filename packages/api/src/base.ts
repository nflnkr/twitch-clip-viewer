import { os } from "@orpc/server";

import { rateLimitMiddleware } from "./ratelimit";

export const base = os.$context<{ ip: string }>().use(rateLimitMiddleware);
