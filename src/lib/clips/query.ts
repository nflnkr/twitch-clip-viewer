import {
    queryOptions,
    experimental_streamedQuery as streamedQuery,
    useQuery,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { twitchClipMetadataArraySchema, type TwitchClipMetadata } from "~/model/twitch";
import { getStreamedClips } from "./api/get-streamed-clips";

export function clipsOptions(params: {
    channels: string[];
    from: string;
    to: string;
    minViews: number;
}) {
    return queryOptions({
        queryKey: ["clips", params],
        queryFn: streamedQuery({
            streamFn: ({ signal }) => generateClips({ signal, params }),
        }),
        enabled: params.channels.length > 0,
    });
}

export function useClips({
    channels,
    from,
    to,
    minViews,
    chronologicalOrder,
}: {
    channels: string[];
    from: string;
    to: string;
    minViews: number;
    chronologicalOrder: boolean;
}) {
    const clipsQuery = useQuery(
        clipsOptions({ channels: channels.toSorted(), from, to, minViews }),
    );

    const uniqueSortedClips = useMemo(() => {
        if (!clipsQuery.data) return null;

        const clipById: Record<string, TwitchClipMetadata> = {};

        clipsQuery.data.flat().forEach((clip) => {
            clipById[clip.id] = clip;
        });

        const clipsArray = Array.from(Object.values(clipById))
            .sort((clipA, clipB) => {
                if (chronologicalOrder) {
                    return (
                        new Date(clipA.created_at).getTime() - new Date(clipB.created_at).getTime()
                    );
                }
                return clipB.view_count - clipA.view_count;
            })
            .filter((clip) => clip.view_count >= minViews);

        return clipsArray;
    }, [chronologicalOrder, clipsQuery.data, minViews]);

    return {
        ...clipsQuery,
        clips: uniqueSortedClips,
    };
}

async function* generateClips({
    signal,
    params: { channels, from, to, minViews },
}: {
    signal: AbortSignal;
    params: { channels: string[]; from: string; to: string; minViews: number };
}) {
    try {
        const response = await getStreamedClips({
            signal,
            data: { channels: channels.toSorted().join(","), from, to, minViews },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("Response body is empty or not readable.");
        }

        const decoder = new TextDecoder();
        let accumulatedString = "";
        let done = false;

        do {
            const read = await reader.read();
            done = read.done;

            accumulatedString += decoder.decode(read.value);

            if (accumulatedString.endsWith("\n")) {
                const lines = accumulatedString.split("\n").filter(Boolean);

                const clips: TwitchClipMetadata[] = [];
                for (const line of lines) {
                    const data = JSON.parse(line);
                    const newClips = twitchClipMetadataArraySchema.parse(data);

                    clips.push(...newClips);
                }

                yield clips;

                accumulatedString = "";
            }
        } while (!done);

        yield [];

        reader.releaseLock();
    } catch (error: unknown) {
        if (!(error instanceof Error)) throw error;

        if (error.name !== "AbortError") {
            console.error("%cFetch clips error:", "color: red", error);
        }
    }
}
