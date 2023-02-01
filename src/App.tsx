import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TwitchClipEmbed from "./components/TwitchClipEmbed";
import { ChannelnameToIds, TwitchClipMetadata } from "./types";
import { getBroadcasterIds, getClips } from "./utils/fetchers";
import { NextUIProvider, Button, Text, Switch, Input, Badge, createTheme, Link, Loading, styled } from "@nextui-org/react";
import { DateRange, Range } from "react-date-range";
import { useDebounce, useMediaQuery } from "./utils/hooks";
import { ChannelGroup } from "./reducers/channelGroups";
import { IoMdSettings } from "react-icons/io";
import { ImArrowLeft2, ImArrowRight2 } from "react-icons/im";


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

const ControlsContainer = styled("div", {
    display: "flex",
    flexDirection: "column",
    gap: "1em",
    maxWidth: "26em",
});

const ClipInfoContainer = styled("div", {
    display: "flex",
    flexDirection: "column",
    gap: "0.25em",
    maxWidth: "25em",
});

const FlexboxWrap = styled("div", {
    display: "flex",
    gap: "1em",
    flexWrap: "wrap",
    alignItems: "center",
});

const FlexboxWrapSpaceBetween = styled("div", {
    display: "flex",
    gap: "1em",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
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

const CenterContentBox = styled("div", {
    display: "flex",
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
});

const ClipContainer = styled("div", {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    maxHeight: "100vh",
    minHeight: "160px",
});

const ButtonsContainer = styled("div", {
    display: "flex",
    width: "100%",
    gap: "1px",
    marginTop: "1px",
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

let initialIsAutoplay = true;
const isAutoplayString = localStorage.getItem("isAutoplay");
if (isAutoplayString) initialIsAutoplay = JSON.parse(isAutoplayString) as boolean;

let initialStartDateTimestamp: number = new Date(new Date().setDate(new Date().getDate() - 7)).getTime();
const initialStartDateTimestampString = localStorage.getItem("startDate");
if (initialStartDateTimestampString) initialStartDateTimestamp = JSON.parse(initialStartDateTimestampString) as number;

let initialChannels: string[] = [];
const initialChannelsString = localStorage.getItem("channels");
if (initialChannelsString) initialChannels = JSON.parse(initialChannelsString) as string[];

let initialChannelsGroups: ChannelGroup[] = [];
const initialChannelsGroupsString = localStorage.getItem("channels");
if (initialChannelsGroupsString) initialChannelsGroups = JSON.parse(initialChannelsGroupsString) as ChannelGroup[];

let initialMinViewCount: number = 10;
const initialMinViewCountString = localStorage.getItem("minViewCount");
if (initialMinViewCountString) initialMinViewCount = JSON.parse(initialMinViewCountString) as number;

let initialViewedClips: string[] = [];
const initialViewedClipsString = localStorage.getItem("viewedClips");
if (initialViewedClipsString) initialViewedClips = JSON.parse(initialViewedClipsString) as string[];


// TODO concurrent fetch
// TODO groups of streamers
// TODO only 2 orientations - media query
// TODO capture and stop MB3/4 events before iframe
// TODO replace styled-components with next/styled
// TODO show errors
// TODO collapse settings bar/ hide/show on hover
function App() {
    const [channelname, setChannelname] = useState<string>("");
    const [channels, setChannels] = useState<string[]>(initialChannels);
    const [channelGroups, setChannelGroups] = useState<ChannelGroup[]>(initialChannelsGroups);
    const [selectedChannelGroupId, setSelectedChannelGroupId] = useState<number>(0);
    const [channelIds, setChannelIds] = useState<number[]>([]);
    const [clips, setClips] = useState<TwitchClipMetadata[]>([]);
    const [currentClipIndex, setCurrentClipIndex] = useState<number>(0);
    const [isClipAutoplay, setIsClipAutoplay] = useState<boolean>(initialIsAutoplay);
    const [isInfinitePlay, setIsInfinitePlay] = useState<boolean>(false);
    const [isSkipViewed, setIsSkipViewed] = useState<boolean>(false);
    const [isCalendarShown, setIsCalendarShown] = useState<boolean>(false);
    const [isSettingsModalShown, setIsSettingsModalShown] = useState<boolean>(false);
    const [minViewCount, setMinViewCount] = useState<number>(initialMinViewCount);
    const [viewedClips, setViewedClips] = useState<string[]>(initialViewedClips);
    const [dateRange, setDateRange] = useState<Range[]>([{
        startDate: new Date(initialStartDateTimestamp),
        endDate: new Date(),
        key: "selection"
    }]);
    const nextClipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const appContainer = useRef<HTMLDivElement>(null);
    const debouncedMinViewCount = useDebounce(minViewCount, 1000);
    const isLandscape = useMediaQuery("(min-width: 1200px)");

    const filteredClips = useMemo(() => {
        const filteredByMinViewCount = clips.filter(clip => clip.view_count >= debouncedMinViewCount);
        return filteredByMinViewCount;
    }, [clips, debouncedMinViewCount]);

    const clipMeta = filteredClips.length ? filteredClips[currentClipIndex] : undefined;

    const nextClip = useCallback(() => {
        if (!clipMeta) return;

        if (nextClipTimeoutRef.current) {
            clearTimeout(nextClipTimeoutRef.current);
            nextClipTimeoutRef.current = null;
        }

        setViewedClips(prevViewedClips => {
            if (!prevViewedClips.includes(clipMeta.id)) return [...prevViewedClips, clipMeta.id];
            return prevViewedClips;
        });
        setCurrentClipIndex(prev => {
            let newIndex = prev + 1;
            if (newIndex > filteredClips.length - 1) newIndex = filteredClips.length - 1;
            return newIndex;
        });
    }, [clipMeta, filteredClips.length]);

    const prevClip = useCallback(() => {
        setIsSkipViewed(false);
        setIsInfinitePlay(false);
        setCurrentClipIndex(prev => {
            let newIndex = prev - 1;
            if (newIndex < 0) newIndex = 0;
            return newIndex;
        });
    }, []);

    const addChannel = useCallback(() => {
        setChannelname("");

        const newChannelNames = channelname.split(" ").map(s => s.toLowerCase()).filter(s => /^[a-zA-Z0-9][\w]{2,24}$/.test(s) && !channels.includes(s));
        const uniqueChannelNames = [...new Set(newChannelNames)];

        if (uniqueChannelNames.length) setChannels(prev => [...prev, ...uniqueChannelNames]);
    }, [channelname, channels]);

    function handleSettingsModalClose() {
        setIsSettingsModalShown(false);
        setIsCalendarShown(false);
        setTimeout(() => {
            appContainer.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
    }

    useEffect(function resetModalOnResize() {
        if (isLandscape) handleSettingsModalClose();
    }, [isLandscape]);

    useEffect(function saveToLocalStorage() {
        localStorage.setItem("channels", JSON.stringify(channels));
        localStorage.setItem("isAutoplay", JSON.stringify(isClipAutoplay));
        localStorage.setItem("minViewCount", JSON.stringify(debouncedMinViewCount));
        localStorage.setItem("viewedClips", JSON.stringify(viewedClips));
        if (dateRange[0].startDate) localStorage.setItem("startDate", JSON.stringify(dateRange[0].startDate.getTime()));
    }, [channels, isClipAutoplay, debouncedMinViewCount, isSkipViewed, dateRange, viewedClips]);

    useEffect(function getBroadcasterIdsFromChannelnames() {
        if (!channels.length) return setChannelIds([]);

        const channelnameToIdString = localStorage.getItem("channelnameToId");
        if (!channelnameToIdString) {
            getBroadcasterIds(channels).then(ids => {
                if (!ids) return;

                localStorage.setItem("channelnameToId", JSON.stringify(ids));

                const channelIds: number[] = [];
                for (let key in ids) {
                    channelIds.push(ids[key]);
                }
                setChannelIds(channelIds);
            });
        } else {
            const channelToId = JSON.parse(channelnameToIdString) as ChannelnameToIds;
            const missingIds: string[] = [];
            channels.forEach(channel => {
                if (!channelToId[channel]) missingIds.push(channel);
            });
            if (missingIds.length) {
                getBroadcasterIds(missingIds).then(ids => {

                    const newChannelToId: ChannelnameToIds = { ...channelToId, ...ids };
                    localStorage.setItem("channelnameToId", JSON.stringify(newChannelToId));

                    const channelIds: number[] = [];
                    channels.forEach(channel => {
                        channelIds.push(newChannelToId[channel]);
                    });
                    setChannelIds(channelIds);
                });
            } else {
                const newChannelIds: number[] = [];
                channels.forEach(channel => {
                    newChannelIds.push(channelToId[channel]);
                });
                setChannelIds(newChannelIds);
            }
        }
    }, [channels]);

    useEffect(function fetchClips() {
        if (!channelIds.length || !dateRange[0].startDate || !dateRange[0].endDate) return setClips([]);

        setClips([]);

        const includeLastDayDate = new Date(dateRange[0].endDate.getTime());
        includeLastDayDate.setHours(23, 59, 59, 999);
        const abortcontroller = new AbortController();
        getClips({
            channelIds,
            start: dateRange[0].startDate.toISOString(),
            end: includeLastDayDate.toISOString(),
            minViewCount: debouncedMinViewCount,
            signal: abortcontroller.signal
        }).then(clips => clips && setClips(clips));
        setCurrentClipIndex(0);

        return () => abortcontroller.abort();
    }, [channelIds, dateRange, debouncedMinViewCount]);

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
            }, (clipMeta.duration + 4) * 1000);
        }
    }, [clipMeta, isInfinitePlay, nextClip]);

    useEffect(function skipClipIfViewed() {
        if (!clipMeta) return;

        // TODO infinite rerender on last clip?
        if (isSkipViewed && viewedClips.includes(clipMeta.id)) {
            nextClip();
            // TODO find next not viewed clip
        }
    }, [clipMeta, isSkipViewed, nextClip, viewedClips]);

    function handleLastWeekClick() {
        setDateRange([{
            startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
            endDate: new Date(),
            key: "selection"
        }]);
    }

    function handleLastMonthClick() {
        setDateRange([{
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            endDate: new Date(),
            key: "selection"
        }]);
    }

    function handleLastYearClick() {
        setDateRange([{
            startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
            endDate: new Date(),
            key: "selection"
        }]);
    }

    function handleAlltimeClick() {
        setDateRange([{
            startDate: new Date(2011, 5, 6),
            endDate: new Date(),
            key: "selection"
        }]);
    }

    // disable rerender on isAutoplay change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const clip = useMemo(() => clipMeta ? <TwitchClipEmbed key={Math.random()} clip={clipMeta} autoplay={isClipAutoplay} /> : null, [clipMeta]);

    const settingsContainer = (
        <ControlsContainer>
            <Input
                aria-label="add channel"
                bordered
                placeholder="Add channel"
                value={channelname}
                onChange={e => setChannelname(e.target.value)}
                contentRight={<Button size="xs" onPress={addChannel} style={{ right: "5em" }}>Add</Button>}
            />
            <FlexboxWrap>
                {channels.map(channel =>
                    <Badge
                        color="secondary"
                        key={channel}
                        size="md"
                        onClick={() => setChannels(prev => prev.filter(ch => ch !== channel))}
                    >
                        {channel}
                    </Badge>
                )}
            </FlexboxWrap>
            {/* <Card variant="bordered">
                            <Card.Body css={{
                                padding: 10,
                                backgroundColor: "#26262e",
                                flexWrap: "wrap",
                                flexDirection: "row",
                                gap: "0.25em"
                            }}>
                                {channels.map(channel => (
                                    <Badge
                                        color="secondary"
                                        key={channel}
                                        size="md"
                                        onClick={() => setChannels(prev => prev.filter(ch => ch !== channel))}
                                    >
                                        {channel}
                                    </Badge>
                                ))}
                            </Card.Body>
                            <Card.Footer css={{
                                flexWrap: "wrap",
                                justifyContent: "space-between"
                            }}>
                                <Button css={{ width: "20%" }} size={"xs"}>Delete</Button>
                                <Button css={{ width: "20%" }} size={"xs"}>Move up</Button>
                                <Button css={{ width: "20%" }} size={"xs"}>Move down</Button>
                                <Button css={{ width: "20%" }} size={"xs"}>Merge with</Button>
                            </Card.Footer>
                        </Card> */}
            <Button
                size="sm"
                onPress={() => setIsCalendarShown(prev => !prev)}
            >
                {`${dateRange[0].startDate?.toLocaleDateString()} - ${dateRange[0].endDate?.toLocaleDateString()}`}
            </Button>
            {isCalendarShown &&
                <DateRange
                    onChange={item => setDateRange([item.selection])}
                    maxDate={new Date()}
                    ranges={dateRange}
                    direction="vertical"
                />
            }
            <FlexboxWrapSpaceBetween>
                <Button size="xs" onPress={handleLastWeekClick}>Last week</Button>
                <Button size="xs" onPress={handleLastMonthClick}>Last month</Button>
                <Button size="xs" onPress={handleLastYearClick}>Last year</Button>
                <Button size="xs" onPress={handleAlltimeClick}>All</Button>
            </FlexboxWrapSpaceBetween>
            <Input
                aria-label="min views"
                label="Min views"
                type="number"
                bordered
                value={minViewCount}
                onChange={e => setMinViewCount(Number(e.target.value))}
            />
            <FlexboxWrap css={{ userSelect: "none" }}>
                {filteredClips.length ? <Text>{currentClipIndex + 1}/{filteredClips.length}</Text> : null}
            </FlexboxWrap>
            <FlexboxWrap>
                <Switch checked={isClipAutoplay} onChange={e => {
                    if (!e.target.checked) setIsInfinitePlay(false);
                    setIsClipAutoplay(e.target.checked);
                }} />
                <Text>Clip autoplay</Text>
            </FlexboxWrap>
            <FlexboxWrap>
                <Switch checked={isInfinitePlay} onChange={e => {
                    if (e.target.checked) setIsClipAutoplay(true);
                    setIsInfinitePlay(e.target.checked);
                }} />
                <Text>Auto next</Text>
            </FlexboxWrap>
            <FlexboxWrap>
                <Switch checked={isSkipViewed} onChange={e => setIsSkipViewed(e.target.checked)} />
                <Text>Skip viewed</Text>
            </FlexboxWrap>
            <Button
                size="xs"
                onPress={() => {
                    localStorage.removeItem("viewedClips");
                    setViewedClips([]);
                    setIsSkipViewed(false);
                }}
            >
                Clear viewed clips {viewedClips.length > 0 && `(${viewedClips.length})`}
            </Button>
            {isSettingsModalShown &&
                <Button size="sm" onPress={handleSettingsModalClose}>Close</Button>
            }
            {/* <Tooltip
                color="primary"
                placement="right"
                hideArrow
                content={
                    <Grid.Container>
                        <Grid xs={6}>Next clip</Grid>
                        <Grid xs={6}>➡, N, mouse button 4</Grid>
                        <Grid xs={6}>Previous clip</Grid>
                        <Grid xs={6}>⬅, B, mouse button 3</Grid>
                    </Grid.Container>
                }
            >
                <Button size="xs">Shortcuts</Button>
            </Tooltip> */}
        </ControlsContainer>
    );

    return (
        <NextUIProvider theme={theme}>
            <AppContainer
                ref={appContainer}
                style={{
                    flexDirection: isLandscape ? "row" : "column",
                    filter: isSettingsModalShown ? "blur(2px)" : undefined,
                    height: isLandscape ? "100vh" : undefined,
                }}
            >
                <ClipContainer>
                    {clips.length ?
                        <>
                            {clip}
                            <ButtonsContainer>
                                <Button
                                    size="md"
                                    disabled={currentClipIndex === 0} onPress={prevClip}
                                    icon={<ImArrowLeft2 />}
                                    css={{
                                        backgroundColor: "$primaryDark",
                                        flex: "1 1 50%",
                                        borderRadius: 0,
                                        minWidth: "120px"
                                    }}
                                />
                                <Button
                                    size="md"
                                    disabled={currentClipIndex >= filteredClips.length - 1} onPress={nextClip}
                                    icon={<ImArrowRight2 />}
                                    css={{
                                        backgroundColor: "$primaryDark",
                                        flex: "1 1 50%",
                                        borderRadius: 0,
                                        minWidth: "120px"
                                    }}
                                />
                            </ButtonsContainer>
                        </>
                        :
                        channelIds.length ?
                            <CenterContentBox><Loading size="xl" /></CenterContentBox>
                            :
                            <CenterContentBox><Text h2>No channels</Text></CenterContentBox>
                    }
                </ClipContainer>
                <ControlsAndClipInfoContainer
                    style={{
                        borderLeft: isLandscape ? "1px solid #363636" : undefined,
                        flexDirection: isLandscape ? "column" : "row",
                        justifyContent: isLandscape ? undefined : "space-between",
                        width: isLandscape ? undefined : "100%",
                    }}
                >
                    {isLandscape && settingsContainer}
                    {clipMeta &&
                        <ClipInfoContainer css={{
                            marginTop: isLandscape ? "2em" : undefined,
                        }}>
                            <Text h3 css={{ overflowWrap: "anywhere" }}>{clipMeta.title}</Text>
                            <Link
                                target="_blank"
                                rel="noopener noreferrer"
                                color="secondary"
                                href={`https://twitch.tv/${clipMeta.broadcaster_name.toLowerCase()}`}
                            >
                                {clipMeta.broadcaster_name}
                            </Link>
                            <Text>Views: {clipMeta.view_count}</Text>
                            <Text>Author: {clipMeta.creator_name}</Text>
                            <Text>Date: {new Date(clipMeta.created_at).toLocaleDateString()}</Text>
                        </ClipInfoContainer>
                    }
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
                                setTimeout(() => {
                                    appContainer.current?.scrollIntoView({ behavior: "smooth" });
                                }, 300);
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
                        {settingsContainer}
                    </SettingsModalContainer>
                </ModalContainer>
            }
        </NextUIProvider>
    );
}

export default App;