import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components/macro";
import TwitchClipEmbed from "./components/TwitchClipEmbed";
import { ChannelnameToIds, Layout, TwitchClipMetadata } from "./types";
import { getBroadcasterIds, getClips } from "./utils/fetchers";
import { NextUIProvider, Button, Text, Switch, Input, Badge, createTheme, Link, Loading, Tooltip, Grid } from "@nextui-org/react";
import { DateRange, Range } from "react-date-range";
import { useDebounce, useMediaQuery } from "./utils/hooks";


const VERSION = "1.1.0";

const darkTheme = createTheme({
    type: "dark",
    theme: {
        colors: {
            background: "#1a1a1a"
        }
    }
});

const AppContainer = styled.main`
    display: flex;
    height: 100vh;
`;

const ControlsAndClipInfoContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-width: fit-content;
    max-width: 26em;
`;

const ControlsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1em;
    padding: 1em;
    max-width: 26em;
`;

const ClipInfoContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25em;
    padding: 1em;
    max-width: 25em;
`;

const FlexboxWrap = styled.div`
    display: flex;
    gap: 1em;
    flex-wrap: wrap;
    align-items: center;
`;

const FlexboxWrapSpaceBetween = styled.div`
    display: flex;
    gap: 1em;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
`;

const DateRangePickerModal = styled.div`
    position: absolute;
    top: 10px;
    right: 10px;
    box-shadow: 0px 0px 14px 0px rgba(0,0,0,1);
`;

const ModalContainer = styled.div`
    position: absolute;
    top: 0px;
    left: 0px;
    height: 100vh;
    width: 100vw;
    z-index: 1000;
`;

const CenterContentBox = styled.div`
    display: flex;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
`;

let initialIsAutoplay = true;
const isAutoplayString = localStorage.getItem("isAutoplay");
if (isAutoplayString) initialIsAutoplay = JSON.parse(isAutoplayString) as boolean;

let initialStartDateTimestamp: number = new Date(new Date().setDate(new Date().getDate() - 7)).getTime();
const initialStartDateTimestampString = localStorage.getItem("startDate");
if (initialStartDateTimestampString) initialStartDateTimestamp = JSON.parse(initialStartDateTimestampString) as number;

let initialChannels: string[] = [];
const initialChannelsString = localStorage.getItem("channels");
if (initialChannelsString) initialChannels = JSON.parse(initialChannelsString) as string[];

let initialMinViewCount: number = 10;
const initialMinViewCountString = localStorage.getItem("minViewCount");
if (initialMinViewCountString) initialMinViewCount = JSON.parse(initialMinViewCountString) as number;

let initialViewedClips: string[] = [];
const initialViewedClipsString = localStorage.getItem("viewedClips");
if (initialViewedClipsString) initialViewedClips = JSON.parse(initialViewedClipsString) as string[];


// TODO link to a vod
// TODO twitchtracker link
// TODO groups of streamers
// TODO only 2 orientations - media query
// TODO capture and stop MB3/4 events before iframe
function App() {
    const [channelname, setChannelname] = useState<string>("");
    const [channels, setChannels] = useState<string[]>(initialChannels);
    const [channelIds, setChannelIds] = useState<number[]>([]);
    const [clips, setClips] = useState<TwitchClipMetadata[]>([]);
    const [currentClipIndex, setCurrentClipIndex] = useState<number>(0);
    const [isClipAutoplay, setIsClipAutoplay] = useState<boolean>(initialIsAutoplay);
    const [isInfinitePlay, setIsInfinitePlay] = useState<boolean>(false);
    const [isSkipViewed, setIsSkipViewed] = useState<boolean>(false);
    const [isModalShown, setIsModalShown] = useState<boolean>(false);
    const [minViewCount, setMinViewCount] = useState<number>(initialMinViewCount);
    const [viewedClips, setViewedClips] = useState<string[]>(initialViewedClips);
    const [dateRange, setDateRange] = useState<Range[]>([{
        startDate: new Date(initialStartDateTimestamp),
        endDate: new Date(),
        key: "selection"
    }]);
    const nextClipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debouncedMinViewCount = useDebounce(minViewCount, 1000);
    const isHorizontal = useMediaQuery("(min-width: 70em)");
    const isVertical = useMediaQuery("(max-width: 34em)");

    const layout: Layout = isHorizontal ? "horizontal" : isVertical ? "vertical" : "square";

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

    return (
        <NextUIProvider theme={darkTheme}>
            <AppContainer
                style={{
                    flexDirection: layout === "horizontal" ? "row" : "column",
                    alignItems: layout === "square" ? "center" : undefined
                }}
            >
                {clips.length ?
                    clip
                    :
                    channelIds.length ?
                        <CenterContentBox><Loading size="xl" /></CenterContentBox>
                        :
                        <CenterContentBox><Text h2>No channels</Text></CenterContentBox>
                }
                <ControlsAndClipInfoContainer
                    style={{
                        flexDirection: layout === "square" ? "row" : "column",
                        alignItems: layout === "vertical" ? "center" : undefined,
                        borderLeft: layout === "horizontal" ? "1px solid #363636" : undefined,
                    }}
                >
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
                        </FlexboxWrap>
                        <Button
                            size="sm"
                            onPress={() => setIsModalShown(true)}
                        >
                            {`${dateRange[0].startDate?.toLocaleDateString()} - ${dateRange[0].endDate?.toLocaleDateString()}`}
                        </Button>
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
                        <FlexboxWrap style={{ userSelect: "none" }}>
                            <Button size="sm" disabled={currentClipIndex === 0} onPress={prevClip}>Previous</Button>
                            <Button size="sm" disabled={currentClipIndex >= filteredClips.length - 1} onPress={nextClip}>Next</Button>
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
                        <Tooltip
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
                        </Tooltip>
                    </ControlsContainer>
                    {clipMeta &&
                        <ClipInfoContainer>
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
                            <Text size="$xs" color="#ffffff29">{VERSION}</Text>
                        </ClipInfoContainer>
                    }
                </ControlsAndClipInfoContainer>
            </AppContainer>
            {
                isModalShown &&
                <ModalContainer onClick={() => setIsModalShown(false)}>
                    <DateRangePickerModal onClick={e => e.stopPropagation()}>
                        <DateRange
                            onChange={item => setDateRange([item.selection])}
                            maxDate={new Date()}
                            ranges={dateRange}
                            direction="vertical"
                        />
                    </DateRangePickerModal>
                </ModalContainer>
            }
        </NextUIProvider >
    );
}

export default App;
