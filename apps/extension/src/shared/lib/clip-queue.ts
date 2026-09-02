import type { TwitchClipMetadata } from "@repo/api";
import { create } from "zustand";

import { orpcClient } from "~/lib/orpc";

export interface FlightItem {
    id: string;
    x: number;
    y: number;
}

interface ClipQueueState {
    clips: TwitchClipMetadata[];
    flights: FlightItem[];
}

export const useClipQueue = create<ClipQueueState>(() => ({
    clips: [],
    flights: [],
}));

export function triggerFlight(x: number, y: number): void {
    const id = crypto.randomUUID();

    useClipQueue.setState((state) => ({ flights: [...state.flights, { id, x, y }] }));
}

export function endFlight(id: string): void {
    useClipQueue.setState((state) => ({
        flights: state.flights.filter((flight) => flight.id !== id),
    }));
}

export function addClip(clip: TwitchClipMetadata): void {
    useClipQueue.setState((state) =>
        state.clips.some((item) => item.id === clip.id)
            ? state
            : { clips: [clip, ...state.clips] },
    );
}

export function removeClip(id: string): void {
    useClipQueue.setState((state) => ({ clips: state.clips.filter((item) => item.id !== id) }));
}

export function parseClipIdFromUrl(url: string): string | null {
    try {
        const { hostname, pathname } = new URL(url);

        if (!hostname.includes("twitch")) return null;

        const match = /^\/\w+\/clip\/([a-zA-Z0-9-]+)$/.exec(pathname);

        return match?.[1] ?? null;
    } catch {
        return null;
    }
}

export async function queueClipFromUrl(url: string): Promise<void> {
    const clipId = parseClipIdFromUrl(url);

    if (!clipId || useClipQueue.getState().clips.some((clip) => clip.id === clipId)) return;

    try {
        const clip = await orpcClient.getClip({ id: clipId });

        if (clip) addClip(clip);
    } catch (error) {
        console.error("Error enqueueing clip", error);

        window.open(url, "_blank", "noreferrer");
    }
}
