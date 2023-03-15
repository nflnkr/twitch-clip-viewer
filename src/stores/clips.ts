import { create } from "zustand";
import { TwitchClipMetadata } from "../model/clips";


interface ClipsState {
    clips: TwitchClipMetadata[];
}

export const useClipsStore = create<ClipsState>()(() => ({
    clips: [],
}));

export async function fetchClips() {
    const clips: TwitchClipMetadata[] = [];

    useClipsStore.setState({ clips });
};