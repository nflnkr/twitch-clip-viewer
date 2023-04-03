import { useCallback, useEffect, useMemo, useRef } from "react";
import { getClips } from "./utils/fetchers";
import { NextUIProvider, Button, createTheme, styled, useTheme, Badge } from "@nextui-org/react";
import { useDebounce, useMediaQuery } from "./utils/hooks";
import { IoMdSettings } from "react-icons/io";
import { addChannels, addClips, addViewedClips, clearClips, decrementCurrentClipIndex, incrementCurrentClipIndex, setCurrentClipIndex, setIsCalendarShown, setIsInfinitePlay, setIsLoading, setIsSettingsModalShown, useAppStore } from "./stores/app";
import Settings from "./components/Settings/Settings";
import ClipInfo from "./components/ClipInfo";
import ClipBox from "./components/ClipBox/ClipBox";


const nextTheme = createTheme({
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
    width: "25rem",
    maxHeight: "100dvh",
    overflowY: "auto",
    overflowX: "hidden",
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
    marginTop: "1em",
    marginBottom: "1em",
    height: "max-content",
});

export const StyledBadge = styled(Badge, {
    userSelect: "none",
});

const DEBOUNCE_TIME = 500;

// TODO capture and stop MB3/4 events before iframe
// TODO handle errors
// TODO collapse settings bar/ hide/show on hover
// TODO en/ru
function App() {
    const clips = useAppStore(state => state.clips);
    const titleFilterField = useAppStore(state => state.titleFilterField);
    const channels = useAppStore(state => state.channels);
    const currentClipIndex = useAppStore(state => state.currentClipIndex);
    const isInfinitePlay = useAppStore(state => state.isInfinitePlay);
    const isSettingsModalShown = useAppStore(state => state.isSettingsModalShown);
    const infinitePlayBuffer = useAppStore(state => state.infinitePlayBuffer);
    const minViewCount = useAppStore(state => state.minViewCount);
    const startDate = useAppStore(state => state.startDate);
    const endDate = useAppStore(state => state.endDate);
    const nextClipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>();
    const appContainer = useRef<HTMLDivElement>(null);
    const debouncedMinViewCount = useDebounce(minViewCount, DEBOUNCE_TIME);
    const debouncedTitleFilterField = useDebounce(titleFilterField, DEBOUNCE_TIME);
    const debouncedChannels = useDebounce(channels, DEBOUNCE_TIME);
    const isLandscape = useMediaQuery("(min-width: 1200px)");
    const theme = useTheme();

    const filteredClipsByMinViews = useMemo(() => {
        return clips.filter(clip => clip.view_count >= debouncedMinViewCount).sort((a, b) => b.view_count - a.view_count);
    }, [clips, debouncedMinViewCount]);

    const filteredClips = useMemo(() => {
        let filteredClips = filteredClipsByMinViews;
        if (debouncedTitleFilterField) filteredClips = filteredClips.filter(
            clip => clip.title.toLowerCase().includes(debouncedTitleFilterField.toLowerCase())
        );

        return filteredClips;
    }, [debouncedTitleFilterField, filteredClipsByMinViews]);

    const clipMeta = filteredClips.length ? filteredClips[currentClipIndex] : undefined;

    const nextClip = useCallback(() => { // TODO move to action
        if (!clipMeta) return;

        if (nextClipTimeoutRef.current) {
            clearTimeout(nextClipTimeoutRef.current);
            nextClipTimeoutRef.current = null;
        }

        addViewedClips([clipMeta.id]);
        incrementCurrentClipIndex(filteredClips.length - 1);
    }, [clipMeta, filteredClips.length]);

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
        setCurrentClipIndex(0);

        if (!debouncedChannels.length) return;

        setTimeout(() => {
            setIsLoading(true);
        }, 100);

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const abortcontroller = new AbortController();
        getClips({
            channels: debouncedChannels,
            start: start.toISOString(),
            end: end.toISOString(),
            minViewCount: debouncedMinViewCount,
            signal: abortcontroller.signal,
            onNewClips: addClips,
        }).catch(console.log).finally(() => {
            setIsLoading(false);
        });

        return () => {
            abortcontroller.abort();
            clearClips();
        };
    }, [debouncedChannels, debouncedMinViewCount, endDate, startDate]);

    useEffect(function attachEventHandlers() {
        function keyHandler(e: KeyboardEvent) {
            if (e.code === "Enter" || e.code === "NumpadEnter") {
                addChannels();
            }

            if ((e.target as HTMLElement).tagName === "INPUT") return;

            if (e.code === "KeyN" || e.code === "ArrowRight") return nextClip();
            if (e.code === "KeyB" || e.code === "ArrowLeft") return decrementCurrentClipIndex();
        }
        function mouseHandler(e: MouseEvent) {
            e.preventDefault();
            if (e.button === 3) return decrementCurrentClipIndex();
            if (e.button === 4) return nextClip();
        }
        document.addEventListener("keydown", keyHandler);
        document.addEventListener("mouseup", mouseHandler);
        return () => {
            document.removeEventListener("keydown", keyHandler);
            document.removeEventListener("mouseup", mouseHandler);
        };
    }, [nextClip]);

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
    }, [clipMeta, infinitePlayBuffer, isInfinitePlay, nextClip]);

    const settings = (
        <Settings scrollTop={scrollTop} />
    );

    return (
        <NextUIProvider theme={nextTheme}>
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
                    filteredClips={filteredClips}
                    clipMeta={clipMeta}
                />
                <ControlsAndClipInfoContainer style={{
                    borderLeft: isLandscape ? `1px solid ${theme.theme?.colors.border}` : undefined,
                    flexDirection: isLandscape ? "column" : "row",
                    justifyContent: isLandscape ? undefined : "space-between",
                    width: isLandscape ? undefined : "100%",
                }}>
                    {isLandscape && settings}
                    <ClipInfo clipMeta={clipMeta} filteredClips={filteredClips} />
                    {!isLandscape &&
                        <Button
                            css={{
                                minWidth: "40px",
                                minHeight: "40px",
                                paddingLeft: "2.5em",
                                m: "1em",
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
                        {settings}
                    </SettingsModalContainer>
                </ModalContainer>
            }
        </NextUIProvider>
    );
}

export default App;