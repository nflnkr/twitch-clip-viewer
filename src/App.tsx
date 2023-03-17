import { useCallback, useEffect, useMemo, useRef } from "react";
import { getClips } from "./utils/fetchers";
import { NextUIProvider, Button, createTheme, styled } from "@nextui-org/react";
import { useDebounce, useMediaQuery } from "./utils/hooks";
import { IoMdSettings } from "react-icons/io";
import { addChannels, addViewedClip, decrementCurrentClipIndex, incrementCurrentClipIndex, setChannelnameField, setCurrentClipIndex, setIsCalendarShown, setIsInfinitePlay, setIsSettingsModalShown, useAppStore } from "./stores/app";
import Settings from "./components/Settings";
import ClipInfo from "./components/ClipInfo";
import ClipBox from "./components/ClipBox";
import { setClips, useClipsStore } from "./stores/clips";


const theme = createTheme({
    type: "dark",
    theme: {
        colors: {
            background: "#1a1a1a",
            primary: "$blue500",
            primaryDark: "$blue300",
        }
    }
});

const AppContainer = styled("main", {
    display: "flex",
});

const ControlsAndClipInfoContainer = styled("div", {
    display: "flex",
    minWidth: "fit-content",
    flex: "1",
    padding: "1em",
    overflow: "auto",
});

const ModalContainer = styled("div", {
    position: "absolute",
    display: "flex",
    justifyContent: "center",
    top: "0px",
    left: "0px",
    minHeight: "100%",
    width: "100vw",
});

const SettingsModalContainer = styled("div", {
    backgroundColor: "$backgroundContrast",
    border: "1px solid $gray400",
    borderRadius: "4px",
    boxShadow: "$sm",
    padding: "1em",
    marginTop: "1em",
    marginBottom: "1em",
    height: "max-content",
});

// TODO concurrent fetch
// TODO groups of streamers
// TODO capture and stop MB3/4 events before iframe
// TODO show errors
// TODO collapse settings bar/ hide/show on hover
// TODO find clip by name
function App() {
    const clips = useClipsStore(state => state.clips);
    const channelsField = useAppStore(state => state.channelsField);
    const titleFilterField = useAppStore(state => state.titleFilterField);
    const channels = useAppStore(state => state.channels);
    const currentClipIndex = useAppStore(state => state.currentClipIndex);
    const isInfinitePlay = useAppStore(state => state.isInfinitePlay);
    const isHideViewed = useAppStore(state => state.isHideViewed);
    const isSettingsModalShown = useAppStore(state => state.isSettingsModalShown);
    const infinitePlayBuffer = useAppStore(state => state.infinitePlayBuffer);
    const minViewCount = useAppStore(state => state.minViewCount);
    const viewedClips = useAppStore(state => state.viewedClips);
    const startDate = useAppStore(state => state.startDate);
    const endDate = useAppStore(state => state.endDate);
    const nextClipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const appContainer = useRef<HTMLDivElement>(null);
    const debouncedMinViewCount = useDebounce(minViewCount, 1000);
    const debouncedTitleFilterField = useDebounce(titleFilterField, 1000);
    const isLandscape = useMediaQuery("(min-width: 1200px)");

    const filteredClips = useMemo(() => {
        let filteredClips = clips.filter(clip => clip.view_count >= debouncedMinViewCount);
        if (debouncedTitleFilterField) filteredClips = filteredClips.filter(
            clip => clip.title.toLowerCase().includes(debouncedTitleFilterField.toLowerCase())
        );
        if (isHideViewed) filteredClips = filteredClips.filter(
            clip => !viewedClips.includes(clip.id)
        );

        return filteredClips;
    }, [clips, debouncedMinViewCount, debouncedTitleFilterField, isHideViewed, viewedClips]);

    const clipMeta = filteredClips.length ? filteredClips[currentClipIndex] : undefined;

    const nextClip = useCallback(() => {
        if (!clipMeta) return;

        if (nextClipTimeoutRef.current) {
            clearTimeout(nextClipTimeoutRef.current);
            nextClipTimeoutRef.current = null;
        }

        addViewedClip(clipMeta.id);
        incrementCurrentClipIndex(filteredClips.length - 1);
    }, [clipMeta, filteredClips.length]);

    const prevClip = useCallback(() => {
        setIsInfinitePlay(false);
        decrementCurrentClipIndex();
    }, []);

    const addChannel = useCallback(() => {
        setChannelnameField("");

        const newChannelNames = channelsField.split(" ").map(s => s.toLowerCase()).filter(s => /^[a-zA-Z0-9][\w]{2,24}$/.test(s) && !channels.includes(s));
        const uniqueChannelNames = [...new Set(newChannelNames)];

        if (uniqueChannelNames.length) addChannels(uniqueChannelNames);
    }, [channelsField, channels]);

    const scrollTop = useCallback(() => {
        setTimeout(() => {
            appContainer.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
    }, []);

    const handleSettingsModalClose = useCallback(function handleSettingsModalClose() {
        setIsSettingsModalShown(false);
        setIsCalendarShown(false);
        scrollTop();
    }, [scrollTop]);

    useEffect(function resetModalOnResize() {
        if (isLandscape) handleSettingsModalClose();
    }, [handleSettingsModalClose, isLandscape]);

    useEffect(function fetchClips() {
        if (!channels.length) return setClips([]);

        setClips([]);

        const includeLastDayDate = new Date(endDate);
        includeLastDayDate.setHours(23, 59, 59, 999);
        const abortcontroller = new AbortController();
        getClips({
            channels,
            start: new Date(startDate).toISOString(),
            end: includeLastDayDate.toISOString(),
            minViewCount: debouncedMinViewCount,
            signal: abortcontroller.signal
        }).then(clips => clips && setClips(clips));
        setCurrentClipIndex(0);

        return () => abortcontroller.abort();
    }, [channels, debouncedMinViewCount, endDate, startDate]);

    useEffect(function attachEventHandlers() {
        function keyHandler(e: KeyboardEvent) {
            if (e.code === "Enter" || e.code === "NumpadEnter") {
                addChannel();
            }

            if ((e.target as HTMLElement).tagName === "INPUT") return;

            if (e.code === "KeyN" || e.code === "ArrowRight") return nextClip();
            if (e.code === "KeyB" || e.code === "ArrowLeft") return prevClip();
        }
        function mouseHandler(e: MouseEvent) {
            e.preventDefault();
            if (e.button === 3) return prevClip();
            if (e.button === 4) return nextClip();
        }
        document.addEventListener("keydown", keyHandler);
        document.addEventListener("mouseup", mouseHandler);
        return () => {
            document.removeEventListener("keydown", keyHandler);
            document.removeEventListener("mouseup", mouseHandler);
        };
    }, [addChannel, nextClip, prevClip]);

    useEffect(function startInfinitePlayTimer() {
        if ((!isInfinitePlay && nextClipTimeoutRef.current) || !clipMeta) {
            if (!nextClipTimeoutRef.current) return;
            clearTimeout(nextClipTimeoutRef.current);
            nextClipTimeoutRef.current = null;
            return;
        }

        if (isInfinitePlay && !nextClipTimeoutRef.current) {
            nextClipTimeoutRef.current = setTimeout(() => {
                nextClipTimeoutRef.current = null;
                if (!document.hidden) return nextClip();
                else setIsInfinitePlay(false);
            }, (clipMeta.duration + infinitePlayBuffer) * 1000);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clipMeta, isInfinitePlay, nextClip]);

    useEffect(function resetCurrentClipIndex() {
        setCurrentClipIndex(0);
    }, [filteredClips]);

    return (
        <NextUIProvider theme={theme}>
            <AppContainer
                ref={appContainer}
                style={{
                    flexDirection: isLandscape ? "row" : "column",
                    filter: isSettingsModalShown ? "blur(2px)" : undefined,
                    minHeight: isLandscape ? "100vh" : undefined,
                }}
            >
                <ClipBox
                    nextClip={nextClip}
                    prevClip={prevClip}
                    filteredClips={filteredClips}
                    clipMeta={clipMeta}
                />
                <ControlsAndClipInfoContainer
                    style={{
                        borderLeft: isLandscape ? "1px solid #363636" : undefined,
                        flexDirection: isLandscape ? "column" : "row",
                        justifyContent: isLandscape ? undefined : "space-between",
                        width: isLandscape ? undefined : "100%",
                    }}
                >
                    {isLandscape && <Settings scrollTop={scrollTop} addChannel={addChannel} filteredClips={filteredClips} />}
                    {clipMeta && <ClipInfo clipMeta={clipMeta} />}
                    {!isLandscape &&
                        <Button
                            css={{
                                minWidth: "40px",
                                minHeight: "40px",
                                paddingLeft: "2.5em",
                                marginLeft: "auto",
                            }}
                            onPress={() => {
                                setIsSettingsModalShown(true);
                                scrollTop();
                            }}
                            icon={<IoMdSettings />}
                        >Settings</Button>
                    }
                </ControlsAndClipInfoContainer>
            </AppContainer>
            {isSettingsModalShown && !isLandscape &&
                <ModalContainer css={{ zIndex: 100 }} onClick={handleSettingsModalClose}>
                    <SettingsModalContainer
                        css={{ zIndex: 101 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <Settings scrollTop={scrollTop} addChannel={addChannel} filteredClips={filteredClips} />
                    </SettingsModalContainer>
                </ModalContainer>
            }
        </NextUIProvider>
    );
}

export default App;