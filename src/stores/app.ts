import { nanoid } from "nanoid";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { ChannelPreset } from "../model/channelPreset";


interface AppState {
    channels: string[];
    channelsField: string;
    titleFilterField: string;
    channelPresets: ChannelPreset[];
    selectedChannelPresetIndex: number | null;
    currentClipIndex: number;
    isClipAutoplay: boolean;
    isInfinitePlay: boolean;
    isHideViewed: boolean;
    isCalendarShown: boolean;
    isSettingsModalShown: boolean;
    isShowCarousel: boolean;
    infinitePlayBuffer: number;
    minViewCount: number;
    viewedClips: string[];
    startDate: number;
    endDate: number;
    isLoading: boolean;
}

export const useAppStore = create<AppState>()(
    persist(
        devtools(
            (set, get) => ({
                channels: [],
                channelsField: "",
                titleFilterField: "",
                channelPresets: [],
                selectedChannelPresetIndex: null,
                currentClipIndex: 0,
                isClipAutoplay: true,
                isInfinitePlay: false,
                isHideViewed: false,
                isCalendarShown: false,
                isSettingsModalShown: false,
                isShowCarousel: false,
                infinitePlayBuffer: 4,
                minViewCount: 50,
                viewedClips: [],
                startDate: new Date(new Date().setDate(new Date().getDate() - 7)).getTime(),
                endDate: new Date().getTime(),
                isLoading: false,
            }),
            { name: "App" }
        ),
        {
            version: 0,
            name: "app",
            storage: createJSONStorage(() => localStorage),
            partialize: state => ({
                channels: state.channels,
                channelPresets: state.channelPresets,
                selectedChannelPresetIndex: state.selectedChannelPresetIndex,
                isClipAutoplay: state.isClipAutoplay,
                isShowCarousel: state.isShowCarousel,
                infinitePlayBuffer: state.infinitePlayBuffer,
                minViewCount: state.minViewCount,
                viewedClips: state.viewedClips,
                startDate: state.startDate,
            }),
        }
    )
);

export const setChannelsField = (channelsField: string) => useAppStore.setState({ channelsField });
export const setCurrentClipIndex = (currentClipIndex: number) => useAppStore.setState({ currentClipIndex });
export const switchIsClipAutoplay = () => useAppStore.setState(state => ({ isClipAutoplay: !state.isClipAutoplay }));
export const setIsClipAutoplay = (isClipAutoplay: boolean) => useAppStore.setState({ isClipAutoplay });
export const switchIsInfinitePlay = () => useAppStore.setState(state => ({ isInfinitePlay: !state.isInfinitePlay }));
export const setIsInfinitePlay = (isInfinitePlay: boolean) => useAppStore.setState({ isInfinitePlay });
export const setIsHideViewed = (isHideViewed: boolean) => useAppStore.setState({ isHideViewed });
export const switchIsCalendarShown = () => useAppStore.setState(state => ({ isCalendarShown: !state.isCalendarShown }));
export const setIsCalendarShown = (isCalendarShown: boolean) => useAppStore.setState({ isCalendarShown });
export const setIsLoading = (isLoading: boolean) => useAppStore.setState({ isLoading });
export const switchIsSettingsModalShown = () => useAppStore.setState(state => ({ isSettingsModalShown: !state.isSettingsModalShown }));
export const setIsSettingsModalShown = (isSettingsModalShown: boolean) => useAppStore.setState({ isSettingsModalShown });
export const switchIsShowCarousel = () => useAppStore.setState(state => ({ isShowCarousel: !state.isShowCarousel }));
export const setIsShowCarousel = (isShowCarousel: boolean) => useAppStore.setState({ isShowCarousel });
export const setInfinitePlayBuffer = (infinitePlayBuffer: number) => useAppStore.setState({ infinitePlayBuffer });
export const setStartDate = (startDate: number) => useAppStore.setState({ startDate });
export const setEndDate = (endDate: number) => useAppStore.setState({ endDate });

export const switchIsHideViewed = () => useAppStore.setState(state => ({ isHideViewed: !state.isHideViewed }));

export const setMinViewCount = (minViewCount: number) => {
    useAppStore.setState({ minViewCount });
};

export const setSelectedChannelPresetIndex = (selectedChannelPresetIndex: number | null) => {
    const state = useAppStore.getState();

    const newState = selectedChannelPresetIndex === null ? {
        ...state,
    } : {
        ...state,
        selectedChannelPresetIndex,
        titleFilterField: state.channelPresets[selectedChannelPresetIndex].titleFilter,
        minViewCount: state.channelPresets[selectedChannelPresetIndex].minViews,
        channels: state.channelPresets[selectedChannelPresetIndex].channels.slice(),
    };

    useAppStore.setState(newState);
};

export const setTitleFilterField = (titleFilterField: string) => {
    useAppStore.setState({ titleFilterField: titleFilterField.trim() });
};

export const addChannels = () => {
    const state = useAppStore.getState();

    const filteredNewChannels = state.channelsField.split(" ").map(s => s.toLowerCase()).filter(s => /^[a-zA-Z0-9][\w]{2,24}$/.test(s));
    const newChannels = [...state.channels, ...filteredNewChannels];
    const uniqueChannels = [...new Set(newChannels)];

    useAppStore.setState({
        channels: uniqueChannels,
        channelsField: "",
    });
};

export const removeChannels = (channelsToRemove: string[]) => {
    const channels = useAppStore.getState().channels.filter(channel => !channelsToRemove.includes(channel));
    useAppStore.setState({ channels });
};

export const clearChannels = () => {
    useAppStore.setState({ channels: [] });
};

export const addViewedClips = (clipsToAdd: string[]) => {
    const viewedClips = [...useAppStore.getState().viewedClips, ...clipsToAdd];
    const uniqueViewedClips = [...new Set(viewedClips)];
    useAppStore.setState({ viewedClips: uniqueViewedClips });
};

export const clearViewedClips = () => useAppStore.setState({ viewedClips: [] });

export const incrementCurrentClipIndex = (maxIndex: number) => {
    const newCurrentClipIndex = useAppStore.getState().currentClipIndex + 1;
    if (newCurrentClipIndex <= maxIndex) useAppStore.setState({
        currentClipIndex: newCurrentClipIndex,
    });
};

export const decrementCurrentClipIndex = () => {
    const newCurrentClipIndex = useAppStore.getState().currentClipIndex - 1;
    useAppStore.setState({
        currentClipIndex: Math.max(newCurrentClipIndex, 0),
        isInfinitePlay: false,
    });
};

export const addChannelPreset = () => {
    const state = useAppStore.getState();
    if (!state.channels.length) return;

    useAppStore.setState({
        channelPresets: [
            {
                channels: state.channels.slice(),
                minViews: state.minViewCount,
                titleFilter: state.titleFilterField,
                id: nanoid(),
            },
            ...state.channelPresets,
        ],
    });
};

export const updateChannelPreset = () => {
    const state = useAppStore.getState();
    if (!state.channels.length || state.selectedChannelPresetIndex === null) return;

    const newChannelPresets: ChannelPreset[] = state.channelPresets.slice();
    newChannelPresets[state.selectedChannelPresetIndex] = {
        channels: state.channels.slice(),
        minViews: state.minViewCount,
        titleFilter: state.titleFilterField,
        id: state.channelPresets[state.selectedChannelPresetIndex].id,
    };
    useAppStore.setState({ channelPresets: newChannelPresets });
};

export const removeChannelPreset = (channelPresetId: string) => {
    useAppStore.setState({
        channelPresets: useAppStore.getState().channelPresets.filter(channelPreset => channelPreset.id !== channelPresetId)
    });
};


function migrateOldStorage<T>(oldKey: string, setState: (arg: T) => void) {
    const string = localStorage.getItem(oldKey);
    if (string) {
        const value = JSON.parse(string) as T;
        setState(value);
        localStorage.removeItem(oldKey);
    }
}

migrateOldStorage("viewedClips", addViewedClips);
migrateOldStorage("channels", addChannels);