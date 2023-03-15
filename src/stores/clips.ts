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

export async function fetchClips() {
    const clips: TwitchClipMetadata[] = [];

    useClipsStore.setState({ clips });
};