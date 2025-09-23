import { createServerFn } from "@tanstack/react-start";
import { getEvent } from "@tanstack/react-start/server";
import { endOfDay, parse, startOfDay } from "date-fns";
import { z } from "zod";

import { logger } from "../../logger";
import { fetchBroadcasterClips } from "./fetch-broadcaster-clips";

export const getStreamedClips = createServerFn({
    method: "GET",
    response: "raw",
})
    .validator(
        z.object({
            channels: z.string(),
            from: z.string().date(),
            to: z.string().date(),
            minViews: z.number(),
        }),
    )
    .handler(async (params) => {
        const { channels, from, to, minViews } = params.data;

        const fromTimestamp = parse(from, "yyyy-MM-dd", new Date());
        const toTimestamp = parse(to, "yyyy-MM-dd", new Date());
        const fromStartOfDay = startOfDay(fromTimestamp);
        const endOfToDay = endOfDay(toTimestamp);

        const broadcasterNameArray = channels
            .split(",")
            .filter((channel) => /^[a-zA-Z0-9][\w]{2,24}$/.test(channel));

        const event = getEvent();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                params.signal.addEventListener("abort", () => {
                    controller.close();
                });

                await Promise.all(
                    broadcasterNameArray.map(async (broadcasterName) => {
                        const clipsGenerator = generateBroadcasterClips({
                            broadcasterName,
                            fromTimestamp: fromStartOfDay.getTime(),
                            toTimestamp: endOfToDay.getTime(),
                            minViews,
                        });

                        for await (const clips of clipsGenerator) {
                            if (params.signal.aborted || event.node.res.closed) break;

                            await new Promise((resolve) => setTimeout(resolve, 2000));

                            const chunk = JSON.stringify(clips) + "\n";
                            controller.enqueue(encoder.encode(chunk));
                        }
                    }),
                );

                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    });

async function* generateBroadcasterClips({
    broadcasterName,
    fromTimestamp,
    toTimestamp,
    minViews,
}: {
    broadcasterName: string;
    fromTimestamp: number;
    toTimestamp: number;
    minViews: number;
}) {
    let cursor: string | null = "";

    do {
        try {
            const response = await fetchBroadcasterClips({
                broadcasterName,
                fromTimestamp,
                toTimestamp,
                cursor,
            });
            if (!response?.clips.length) break;

            yield response.clips;

            const lastClip = response.clips.at(-1);
            if (!lastClip || lastClip.view_count < minViews) break;

            cursor = response.cursor;
        } catch (err) {
            logger.error(err, "Error fetching all broadcaster clips");

            break;
        }
    } while (cursor);
}
