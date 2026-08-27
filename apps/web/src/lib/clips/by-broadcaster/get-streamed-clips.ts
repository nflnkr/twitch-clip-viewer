import { createServerFn } from "@tanstack/react-start";
import { endOfDay, parse, startOfDay } from "date-fns";
import { z } from "zod";

import { logger } from "../../logger";
import { fetchBroadcasterClips } from "./fetch-broadcaster-clips";

export const getStreamedClips = createServerFn({ method: "POST" })
    .inputValidator(
        z.object({
            channels: z.string().nonempty(),
            from: z.iso.date(),
            to: z.iso.date(),
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

        const encoder = new TextEncoder();

        let cancelled = false;

        const stream = new ReadableStream({
            cancel() {
                cancelled = true;
            },
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
                            if (cancelled) break;

                            const chunk = JSON.stringify(clips) + "\n";
                            controller.enqueue(encoder.encode(chunk));
                        }
                    }),
                );

                if (!cancelled) controller.close();
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
