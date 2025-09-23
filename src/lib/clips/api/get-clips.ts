import { createServerFn } from "@tanstack/react-start";
import { endOfDay, parse, startOfDay } from "date-fns";
import { z } from "zod";

import { fetchBroadcasterClips } from "./fetch-broadcaster-clips";

export const getClips = createServerFn({ method: "GET" })
    .validator(
        z.object({
            channels: z.string(),
            from: z.string().date(),
            to: z.string().date(),
        }),
    )
    .handler(async (params) => {
        const { channels, from, to } = params.data;

        const fromTimestamp = parse(from, "yyyy-MM-dd", new Date());
        const toTimestamp = parse(to, "yyyy-MM-dd", new Date());
        const fromStartOfDay = startOfDay(fromTimestamp);
        const endOfToDay = endOfDay(toTimestamp);

        const broadcasterNameArray = channels.split(",");
        if (
            !broadcasterNameArray.length ||
            !broadcasterNameArray.every((s) => /^[a-zA-Z0-9][\w]{2,24}$/.test(s))
        ) {
            return null;
        }

        const clips = await Promise.all(
            broadcasterNameArray.map((broadcasterName) =>
                fetchBroadcasterClips({
                    broadcasterName,
                    fromTimestamp: fromStartOfDay.getTime(),
                    toTimestamp: endOfToDay.getTime(),
                }).then((clips) => clips?.clips || []),
            ),
        );

        return clips.flat(1);
    });
