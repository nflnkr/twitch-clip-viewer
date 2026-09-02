import { create } from "zustand";

interface ClipPanelSettingsState {
    chronologicalOrder: boolean;
    autoplay: boolean;
}

export const useClipPanelSettings = create<ClipPanelSettingsState>(() => ({
    chronologicalOrder: false,
    autoplay: true,
}));

export function setChronologicalOrder(chronologicalOrder: boolean): void {
    useClipPanelSettings.setState({ chronologicalOrder });
}

export function setAutoplay(autoplay: boolean): void {
    useClipPanelSettings.setState({ autoplay });
}
