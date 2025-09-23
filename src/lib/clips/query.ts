import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { twitchClipMetadataArraySchema, type TwitchClipMetadata } from "~/model/twitch";
import { getClips } from "./api/get-clips";
import { getStreamedClips } from "./api/get-streamed-clips";

export function clipsOptions(params: Parameters<typeof getClips>[0]["data"]) {
    return queryOptions({
        queryKey: ["clips", params],
        queryFn: () => getClips({ data: params }),
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
    const {
        data: clipsFirstPage,
        isLoading: isLoadingFirstPage,
        error: errorFirstPage,
    } = useQuery(
        clipsOptions({
            channels: channels.toSorted().join(",") || "",
            from,
            to,
        }),
    );
    const {
        clips: streamedClips,
        isLoading: isLoadingStreamedClips,
        error: errorStreamedClips,
    } = useStreamedClips({ channels, from, to, minViews });

    const uniqueSortedClips = useMemo(() => {
        const clipById: Record<string, TwitchClipMetadata> = {};

        clipsFirstPage?.forEach((clip) => {
            clipById[clip.id] = clip;
        });
        streamedClips?.forEach((clip) => {
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
        if (clipsArray.length === 0) return null;

        return clipsArray;
    }, [chronologicalOrder, clipsFirstPage, minViews, streamedClips]);

    return {
        clips: uniqueSortedClips,
        isLoadingFirstPage,
        isLoadingAllClips: isLoadingStreamedClips,
        error: errorFirstPage ?? errorStreamedClips,
    };
}

function useStreamedClips({
    channels,
    from,
    to,
    minViews,
}: {
    channels: string[];
    from: string;
    to: string;
    minViews: number;
}) {
    const [clips, setClips] = useState<TwitchClipMetadata[] | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const channelsString = channels.toSorted().join(",");

    useEffect(() => {
        const controller = new AbortController();

        async function fetchClips() {
            setIsLoading(true);
            setClips(undefined);
            setError(null);

            try {
                const response = await getStreamedClips({
                    signal: controller.signal,
                    data: { channels: channelsString, from, to, minViews },
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
                        setClips((prevClips) => [...(prevClips ?? []), ...clips]);
                        accumulatedString = "";
                    }
                } while (!done);

                reader.releaseLock();
                setIsLoading(false);
            } catch (error: unknown) {
                if (!(error instanceof Error)) throw error;

                if (error.name !== "AbortError") {
                    console.error("%cFetch clips error:", "color: red", error);
                    setError(error);
                    setIsLoading(false);
                }
            }
        }

        fetchClips();

        return () => {
            controller.abort();
        };
    }, [channelsString, from, minViews, to]);

    return { clips, isLoading, error };
}
