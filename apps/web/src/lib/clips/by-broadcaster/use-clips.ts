import { useQuery } from "@tanstack/react-query";
import { endOfDay, parse, startOfDay } from "date-fns";
import { useMemo } from "react";

import { orpc } from "~/lib/orpc";
import type { TwitchClipMetadata } from "~/model/twitch";

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
    const normalizedChannels = useMemo(
        () => channels.filter((channel) => /^[a-zA-Z0-9][\w]{2,24}$/.test(channel)).toSorted(),
        [channels],
    );

    const fromTimestamp = startOfDay(parse(from, "yyyy-MM-dd", new Date())).getTime();
    const toTimestamp = endOfDay(parse(to, "yyyy-MM-dd", new Date())).getTime();

    const clipsQuery = useQuery({
        ...orpc.getClips.experimental_streamedOptions({
            input: {
                channels: normalizedChannels,
                from: fromTimestamp,
                to: toTimestamp,
                minViews,
            },
        }),
        enabled: normalizedChannels.length > 0,
    });

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
