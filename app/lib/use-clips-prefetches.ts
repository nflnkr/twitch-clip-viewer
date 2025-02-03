import { useQueryClient } from "@tanstack/react-query";
import { clipsOptions } from "./get-clips";
import { format, subDays, subMonths } from "date-fns";

export function useClipsPrefetches({
    channels,
    from,
    to,
    minViews,
}: {
    channels: string;
    from: string;
    to: string;
    minViews: number;
}) {
    const queryClient = useQueryClient();

    const channelsArray = channels.split(",").filter(Boolean);

    function prefetchChannelsBeforeRemove(channel: string) {
        const newChannels = channelsArray.filter((c) => c !== channel);

        queryClient.prefetchQuery(
            clipsOptions({
                channels: newChannels.toSorted().join(",") || "",
                from: from,
                to: to,
                minViews: minViews,
                onlyFirstPage: false,
            }),
        );
        queryClient.prefetchQuery(
            clipsOptions({
                channels: newChannels.toSorted().join(",") || "",
                from: from,
                to: to,
                minViews: minViews,
                onlyFirstPage: true,
            }),
        );
    }

    function prefetchLastWeek() {
        queryClient.prefetchQuery(
            clipsOptions({
                channels: channelsArray.toSorted().join(",") || "",
                from: format(subDays(new Date(), 7), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
                minViews: minViews,
                onlyFirstPage: false,
            }),
        );
        queryClient.prefetchQuery(
            clipsOptions({
                channels: channelsArray.toSorted().join(",") || "",
                from: format(subDays(new Date(), 7), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
                minViews: minViews,
                onlyFirstPage: true,
            }),
        );
    }

    function prefetchLastMonth() {
        queryClient.prefetchQuery(
            clipsOptions({
                channels: channelsArray.toSorted().join(",") || "",
                from: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
                minViews: minViews,
                onlyFirstPage: false,
            }),
        );
        queryClient.prefetchQuery(
            clipsOptions({
                channels: channelsArray.toSorted().join(",") || "",
                from: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
                minViews: minViews,
                onlyFirstPage: true,
            }),
        );
    }

    return {
        prefetchChannelsBeforeRemove,
        prefetchLastWeek,
        prefetchLastMonth,
    };
}
