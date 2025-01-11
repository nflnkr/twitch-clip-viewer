import { useQuery } from "@tanstack/react-query";
import { clipsOptions } from "~/lib/get-clips";

interface Props {
    channels: string[];
    from: string;
    to: string;
    minViews: number;
}

/**
 * Fetches first page and all pages in parallel, so we can return data faster
 */
export function useClips({ channels, from, to, minViews }: Props) {
    const {
        data: clipsFirstPage,
        isLoading: isLoadingFirstPage,
        error: errorFirstPage,
    } = useQuery(
        clipsOptions({
            channels: channels.toSorted().join(",") || "",
            from: from,
            to: to,
            minViews,
            onlyFirstPage: true,
        }),
    );
    const {
        data: allClips,
        isLoading: isLoadingAllClips,
        error: errorAllClips,
    } = useQuery(
        clipsOptions({
            channels: channels.toSorted().join(",") || "",
            from: from,
            to: to,
            minViews,
            onlyFirstPage: false,
        }),
    );

    return {
        clips: allClips ?? clipsFirstPage,
        isLoadingFirstPage,
        isLoadingAllClips,
        error: errorFirstPage ?? errorAllClips,
    };
}
