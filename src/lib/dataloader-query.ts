import { hashKey, queryOptions } from "@tanstack/react-query";
import DataLoader, { type BatchLoadFn } from "dataloader";

type CreateDataLoaderQueryParams<TParams, TResult, TItemId> = {
    queryKey: string;
    queryOptions?: Omit<ReturnType<typeof queryOptions<TResult>>, "queryKey" | "queryFn">;
    batchDelay: number;
    maxBatchSize?: number;
    batchLoadFn: BatchLoadFn<TParams & { id: TItemId }, TResult>;
};

export function createDataLoaderQueryOptions<TParams, TResult, TItemId>(
    params: CreateDataLoaderQueryParams<TParams, TResult, TItemId>,
) {
    function createDataLoader() {
        const dataLoader = new DataLoader<TParams & { id: TItemId }, TResult, string>(
            async (keys) => {
                dataLoader.clearAll();
                return params.batchLoadFn(keys);
            },
            {
                batchScheduleFn: (callback) => setTimeout(callback, params.batchDelay),
                cacheKeyFn: (key) => hashKey([params.queryKey, key]),
                maxBatchSize: params.maxBatchSize,
            },
        );

        return dataLoader;
    }

    const defaultDataLoader = createDataLoader();

    function _queryOptions(
        id: TItemId,
        queryParams: TParams,
        dataLoader: ReturnType<typeof createDataLoader> = defaultDataLoader,
    ) {
        return queryOptions({
            ...params.queryOptions,
            queryKey: [params.queryKey, { ...queryParams, id }],
            queryFn: () => dataLoader.load({ ...queryParams, id }),
        });
    }

    return { queryOptions: _queryOptions, createDataLoader } as const;
}

export function uniqueIds<TItemId extends string | number>(ids: TItemId[] | undefined): TItemId[] {
    return Array.from(new Set(ids));
}

export function isDefined<T>(value: T | null | undefined): value is NonNullable<T> {
    return value !== null && value !== undefined;
}
