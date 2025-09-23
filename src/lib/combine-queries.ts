import type {
    DefinedUseQueryResult,
    QueryObserverLoadingErrorResult,
    QueryObserverLoadingResult,
    QueryObserverPendingResult,
    QueryObserverPlaceholderResult,
    UseSuspenseQueryResult,
} from "@tanstack/react-query";

export function combineSuspenseQueries<TData>(
    result: UseSuspenseQueryResult<TData, Error>[],
): TData[] {
    return result.map((r) => r.data);
}

export function combineQueries<TData>(
    result: (
        | DefinedUseQueryResult<TData, Error>
        | QueryObserverLoadingErrorResult<TData, Error>
        | QueryObserverLoadingResult<TData, Error>
        | QueryObserverPendingResult<TData, Error>
        | QueryObserverPlaceholderResult<TData, Error>
    )[],
): {
    data: TData[];
    isPending: boolean;
    isFetching: boolean;
    error: Error | null;
} {
    let isPending = true;
    let isFetching = false;
    let error: Error | null = null;
    const items: TData[] = [];

    result.forEach((item) => {
        if (item.error) error = item.error;
        if (item.isPending) isFetching = true;
        else isPending = false;
        if (item.data) items.push(item.data);
    });

    return {
        data: items,
        isPending,
        isFetching,
        error: items.length ? null : error,
    };
}
