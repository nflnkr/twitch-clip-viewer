import { createServerFn } from "@tanstack/start";
import { endOfDay, parse, startOfDay } from "date-fns";
import { getEvent } from "vinxi/server";
import { z } from "zod";
import { fetchBroadcasterClips } from "./fetch-broadcaster-clips";
import { logger } from "./logger";

export const getStreamedClips = createServerFn({
    method: "POST",
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
                await Promise.all(
                    broadcasterNameArray.map(async (broadcasterName) => {
                        const clipsGenerator = generateBroadcasterClips({
                            broadcasterName,
                            fromTimestamp: fromStartOfDay.getTime(),
                            toTimestamp: endOfToDay.getTime(),
                            minViews,
                        });

                        for await (const clips of clipsGenerator) {
                            if (event.node.res.closed) break;

                            const chunk = JSON.stringify(clips) + "\n";
                            controller.enqueue(encoder.encode(chunk));
                        }
                    }),
                );

                controller.close();
            },
        });

        return new Response(stream, {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
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
            await new Promise((resolve) => setTimeout(resolve, 1000));
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
