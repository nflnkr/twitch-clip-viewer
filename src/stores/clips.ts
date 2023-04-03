import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { TwitchClipMetadata } from "../model/clips";


interface ClipsState {
    clips: TwitchClipMetadata[];
}

export const useClipsStore = create<ClipsState>()(
    devtools(
        (set, get) => ({
            clips: [],
        }),
        { name: "Clips" }
    )
);

export const setClips = (clips: TwitchClipMetadata[]) => useClipsStore.setState({ clips });

export const clearClips = () => useClipsStore.setState({ clips: [] });

export const addClips = (clips: TwitchClipMetadata[]) => useClipsStore.setState(state => ({ clips: [...state.clips, ...clips] }));