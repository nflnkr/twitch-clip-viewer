import { hashKey, queryOptions } from "@tanstack/react-query";
import DataLoader, { type BatchLoadFn } from "dataloader";

export function createDataLoaderQueryOptions<TParams, TResult>({
    queryKey,
    defaultQueryOptions,
    batchDelay,
    maxBatchSize,
    batchLoadFn,
}: {
    queryKey: string;
    defaultQueryOptions?: Omit<Parameters<typeof queryOptions<TResult>>[0], "queryKey" | "queryFn">;
    batchDelay: number;
    maxBatchSize?: number;
    batchLoadFn: BatchLoadFn<TParams, TResult>;
}) {
    function createDataLoader() {
        const dataLoader = new DataLoader<TParams, TResult, string>(
            async (keys) => {
                dataLoader.clearAll();
                return batchLoadFn(keys);
            },
            {
                batchScheduleFn: (callback) => setTimeout(callback, batchDelay),
                cacheKeyFn: (key) => hashKey([queryKey, key]),
                maxBatchSize: maxBatchSize,
            },
        );

        return dataLoader;
    }

    const defaultDataLoader = createDataLoader();

    return {
        queryOptions(params: TParams, dataLoader = defaultDataLoader) {
            return queryOptions({
                ...defaultQueryOptions,
                queryKey: [queryKey, params],
                queryFn: () => dataLoader.load(params),
            });
        },
        createDataLoader,
    };
}

export function uniqueIds<TItemId extends string | number>(ids: TItemId[] | undefined): TItemId[] {
    return Array.from(new Set(ids));
}

export function isDefined<T>(value: T | null | undefined): value is NonNullable<T> {
    return value !== null && value !== undefined;
}
