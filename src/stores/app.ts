import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";


interface AppState {
    channelsField: string;
    channels: string[];
    // const [channelGroups, setChannelGroups] = useState<ChannelGroup[]>(initialChannelsGroups);
    // const [selectedChannelGroupId, setSelectedChannelGroupId] = useState<number>(0);
    channelIds: number[];
    currentClipIndex: number;
    isClipAutoplay: boolean;
    isInfinitePlay: boolean;
    isSkipViewed: boolean;
    isCalendarShown: boolean;
    isSettingsModalShown: boolean;
    isShowCarousel: boolean;
    infinitePlayBuffer: number;
    minViewCount: number;
    viewedClips: string[];
    startDate: number;
    endDate: number;
}

export const useAppStore = create<AppState>()(
    // persist(
    devtools(
        (set, get) => ({
            channels: [],
            channelsField: "",
            // const [channelGroups, setChannelGroups] = useState<ChannelGroup[]>(initialChannelsGroups);
            // const [selectedChannelGroupId, setSelectedChannelGroupId] = useState<number>(0);
            channelIds: [],
            currentClipIndex: 0,
            isClipAutoplay: true,
            isInfinitePlay: false,
            isSkipViewed: false,
            isCalendarShown: false,
            isSettingsModalShown: false,
            isShowCarousel: false,
            infinitePlayBuffer: 4,
            minViewCount: 50,
            viewedClips: [],
            startDate: new Date(new Date().setDate(new Date().getDate() - 7)).getTime(),
            endDate: new Date().getTime(),
        }),
        { name: "App" }
    ),
    //     {
    //         name: "app",
    //         storage: createJSONStorage(() => localStorage),
    //         partialize: state => ({
    //             channels: state.channels,
    //             isClipAutoplay: state.isClipAutoplay,
    //             isShowCarousel: state.isShowCarousel,
    //             infinitePlayBuffer: state.infinitePlayBuffer,
    //             minViewCount: state.minViewCount,
    //             viewedClips: state.viewedClips,
    //             startDate: state.startDate,
    //             endDate: state.endDate,
    //         }),

    //     }
    // )
);

export const setChannelnameField = (channelnameField: string) => useAppStore.setState({ channelsField: channelnameField });
export const setChannelIds = (channelIds: number[]) => useAppStore.setState({ channelIds });
export const setCurrentClipIndex = (currentClipIndex: number) => useAppStore.setState({ currentClipIndex });
export const switchIsClipAutoplay = () => useAppStore.setState(state => ({ isClipAutoplay: !state.isClipAutoplay }));
export const setIsClipAutoplay = (isClipAutoplay: boolean) => useAppStore.setState({ isClipAutoplay });
export const switchIsInfinitePlay = () => useAppStore.setState(state => ({ isInfinitePlay: !state.isInfinitePlay }));
export const setIsInfinitePlay = (isInfinitePlay: boolean) => useAppStore.setState({ isInfinitePlay });
export const switchIsSkipViewed = () => useAppStore.setState(state => ({ isSkipViewed: !state.isSkipViewed }));
export const setIsSkipViewed = (isSkipViewed: boolean) => useAppStore.setState({ isSkipViewed });
export const switchIsCalendarShown = () => useAppStore.setState(state => ({ isCalendarShown: !state.isCalendarShown }));
export const setIsCalendarShown = (isCalendarShown: boolean) => useAppStore.setState({ isCalendarShown });
export const switchIsSettingsModalShown = () => useAppStore.setState(state => ({ isSettingsModalShown: !state.isSettingsModalShown }));
export const setIsSettingsModalShown = (isSettingsModalShown: boolean) => useAppStore.setState({ isSettingsModalShown });
export const switchIsShowCarousel = () => useAppStore.setState(state => ({ isShowCarousel: !state.isShowCarousel }));
export const setIsShowCarousel = (isShowCarousel: boolean) => useAppStore.setState({ isShowCarousel });
export const setInfinitePlayBuffer = (infinitePlayBuffer: number) => useAppStore.setState({ infinitePlayBuffer });
export const setMinViewCount = (minViewCount: number) => useAppStore.setState({ minViewCount });
export const setStartDate = (startDate: number) => useAppStore.setState({ startDate });
export const setEndDate = (endDate: number) => useAppStore.setState({ endDate });

export const addChannels = (channelsToAdd: string[]) => {
    useAppStore.setState({ channels: [...useAppStore.getState().channels, ...channelsToAdd] });
};

export const removeChannels = (channelsToRemove: string[]) => {
    const channels = useAppStore.getState().channels.filter(channel => !channelsToRemove.includes(channel));
    useAppStore.setState({ channels });
};

export const addViewedClip = (clipToAdd: string) => {
    const viewedClips = useAppStore.getState().viewedClips;
    if (viewedClips.includes(clipToAdd)) return;
    useAppStore.setState({ viewedClips: [...useAppStore.getState().viewedClips, clipToAdd] });
};

export const clearViewedClips = () => useAppStore.setState({ viewedClips: [] });

export const incrementCurrentClipIndex = (maxIndex: number) => {
    const newCurrentClipIndex = useAppStore.getState().currentClipIndex + 1;
    useAppStore.setState({
        currentClipIndex: Math.min(newCurrentClipIndex, maxIndex)
    });
};

export const decrementCurrentClipIndex = () => {
    const newCurrentClipIndex = useAppStore.getState().currentClipIndex - 1;
    useAppStore.setState({
        currentClipIndex: Math.max(newCurrentClipIndex, 0)
    });
};
