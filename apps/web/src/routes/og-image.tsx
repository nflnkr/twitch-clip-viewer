import { createFileRoute } from "@tanstack/react-router";
import { differenceInDays, endOfToday, subYears } from "date-fns";

import { fetchBroadcasterClips } from "~/lib/clips/by-broadcaster/fetch-broadcaster-clips";
import { composeImageGrid } from "~/lib/compose-image-grid";

export const Route = createFileRoute("/og-image")({
    server: {
        handlers: {
            GET: async ({ request }) => {
                const channels = new URL(request.url).searchParams
                    .get("channels")
                    ?.split(",")
                    .filter(Boolean);
                if (!channels?.length) throw new Error("No channels");

                const to = endOfToday();
                const from = subYears(to, 1);
                const dayspan = differenceInDays(to, from);

                const clipsResults = await Promise.all(
                    channels.map((channel) =>
                        fetchBroadcasterClips({
                            broadcasterName: channel,
                            fromTimestamp: from.getTime(),
                            toTimestamp: to.getTime(),
                        }),
                    ),
                );

                const clips = clipsResults.flatMap((clipResult) => clipResult?.clips ?? []);

                if (!clips.length) throw new Error("No clips");

                const weightedClips = clips.map((clip) => {
                    const clipDate = new Date(clip.created_at);
                    const weight = (differenceInDays(clipDate, from) / dayspan) ** 3;
                    const randomWeight = weight * (Math.random() * (1.1 - 0.9) + 0.9);

                    return {
                        thumbnailUrl: clip.thumbnail_url,
                        weight: clip.view_count * randomWeight,
                    };
                });

                weightedClips.sort((a, b) => b.weight - a.weight);

                const image = await composeImageGrid({
                    urls: weightedClips.map((clip) => clip.thumbnailUrl),
                    resultWidth: 1200,
                    resultHeight: 630,
                    rows: 4,
                    cols: 5,
                    padding: 8,
                    gap: 8,
                });

                return new Response(image, {
                    status: 200,
                    headers: { "Content-Type": "image/png" },
                });
            },
        },
    },
});
