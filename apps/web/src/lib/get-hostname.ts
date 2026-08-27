import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

export const getHost = createIsomorphicFn()
    .server(() => getRequestHeader("Host"))
    .client(() => window.location.host);
