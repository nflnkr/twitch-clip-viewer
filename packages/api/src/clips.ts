import { eventIterator } from "@orpc/server";
import { z } from "zod";

import { base } from "./base";
import { fetchBroadcasterClips, fetchClipById } from "./twitch-clips";
import {
    twitchClipMetadataArraySchema,
    twitchClipMetadataSchema,
    type TwitchClipMetadata,
} from "./twitch-model";

const DEFAULT_MIN_VIEWS = 10;

export const getClip = base
    .input(
        z.object({
            id: z.string().min(1),
        }),
    )
    .output(twitchClipMetadataSchema.nullable())
    .handler(async ({ input, signal }) => {
        if (signal?.aborted) return null;

        return fetchClipById(input.id);
    });

export const getClips = base
    .input(
        z.object({
            channels: z.array(z.string()),
            from: z.number(),
            to: z.number(),
            minViews: z.number().optional().default(DEFAULT_MIN_VIEWS),
            limit: z.number().optional(),
        }),
    )
    .output(eventIterator(twitchClipMetadataArraySchema))
    .handler(async function* ({ input, signal }) {
        const { channels, from, to, minViews, limit } = input;

        if (channels.length === 0) return;

        const queue = createAsyncQueue<TwitchClipMetadata[]>();

        const producers = channels.map(async (broadcasterName) => {
            try {
                for await (const clips of generateBroadcasterClips({
                    broadcasterName,
                    fromTimestamp: from,
                    toTimestamp: to,
                    minViews,
                    limit,
                })) {
                    if (signal?.aborted) return;

                    queue.push(clips);
                }
            } catch (error) {
                console.error(`Error fetching clips for ${broadcasterName}`, error);
            }
        });

        await Promise.allSettled(producers).then(() => queue.close());

        yield* queue;
    });

function createAsyncQueue<T>() {
    const pending: T[] = [];
    const waiters: ((value: IteratorResult<T>) => void)[] = [];
    let closed = false;

    return {
        push(value: T) {
            const waiter = waiters.shift();
            if (waiter) waiter({ value, done: false });
            else pending.push(value);
        },
        close() {
            closed = true;
            const waiter = waiters.shift();
            if (waiter) waiter({ value: undefined, done: true });
        },
        [Symbol.asyncIterator]() {
            return {
                next: async (): Promise<IteratorResult<T>> => {
                    if (pending.length) return { value: pending.shift()!, done: false };
                    if (closed) return { value: undefined, done: true };
                    return new Promise((resolve) => waiters.push(resolve));
                },
            };
        },
    };
}

async function* generateBroadcasterClips({
    broadcasterName,
    fromTimestamp,
    toTimestamp,
    minViews,
    limit,
}: {
    broadcasterName: string;
    fromTimestamp: number;
    toTimestamp: number;
    minViews: number;
    limit?: number;
}) {
    let cursor: string | null = "";
    let produced = 0;

    do {
        const response = await fetchBroadcasterClips({
            broadcasterName,
            fromTimestamp,
            toTimestamp,
            cursor,
        });
        if (!response?.clips.length) break;

        let batch = response.clips;
        if (limit !== undefined) {
            const remaining = limit - produced;
            if (remaining <= 0) break;
            batch = batch.slice(0, remaining);
        }

        if (batch.length) yield batch;
        produced += batch.length;

        const lastClip = response.clips.at(-1);
        if (!lastClip || lastClip.view_count < minViews) break;
        if (limit !== undefined && produced >= limit) break;

        cursor = response.cursor;
    } while (cursor);
}
