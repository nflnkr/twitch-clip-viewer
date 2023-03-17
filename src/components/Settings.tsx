import { useMemo } from "react";
import { Button, Text, Switch, Input, Badge, styled, useTheme } from "@nextui-org/react";
import { DateRange, RangeKeyDict } from "react-date-range";
import { clearViewedClips, removeChannels, setChannelnameField, setEndDate, setInfinitePlayBuffer, setIsCalendarShown, setIsClipAutoplay, setIsInfinitePlay, setIsSettingsModalShown, setIsShowCarousel, setMinViewCount, setTItleFilterField, setStartDate, switchIsCalendarShown, useAppStore, switchIsHideViewed, setIsHideViewed } from "../stores/app";
import { TwitchClipMetadata } from "../model/clips";
import { IoMdClose } from "react-icons/io";


const ControlsContainer = styled("div", {
    display: "flex",
    flexDirection: "column",
    gap: "1em",
    maxWidth: "26em",
});

const FlexboxWrap = styled("div", {
    display: "flex",
    gap: "1em",
    flexWrap: "wrap",
    alignItems: "center",
});

export default function Settings({ scrollTop, addChannel, filteredClips }: {
    scrollTop: () => void;
    addChannel: () => void;
    filteredClips: TwitchClipMetadata[];
}) {
    const channels = useAppStore(state => state.channels);
    const channelsField = useAppStore(state => state.channelsField);
    const titleFilterField = useAppStore(state => state.titleFilterField);
    const currentClipIndex = useAppStore(state => state.currentClipIndex);
    const isClipAutoplay = useAppStore(state => state.isClipAutoplay);
    const isInfinitePlay = useAppStore(state => state.isInfinitePlay);
    const isHideViewed = useAppStore(state => state.isHideViewed);
    const isCalendarShown = useAppStore(state => state.isCalendarShown);
    const isSettingsModalShown = useAppStore(state => state.isSettingsModalShown);
    const isShowCarousel = useAppStore(state => state.isShowCarousel);
    const infinitePlayBuffer = useAppStore(state => state.infinitePlayBuffer);
    const minViewCount = useAppStore(state => state.minViewCount);
    const viewedClips = useAppStore(state => state.viewedClips);
    const startDate = useAppStore(state => state.startDate);
    const endDate = useAppStore(state => state.endDate);
    const theme = useTheme();

    const dateRange = useMemo(() => ({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        key: "selection"
    }), [endDate, startDate]);

    function handleLastWeekClick() {
        setStartDate(new Date(new Date().setDate(new Date().getDate() - 7)).getTime());
        setEndDate(new Date().getTime());
    }

    function handleLastMonthClick() {
        setStartDate(new Date(new Date().setMonth(new Date().getMonth() - 1)).getTime());
        setEndDate(new Date().getTime());
    }

    function handleLastYearClick() {
        setStartDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)).getTime());
        setEndDate(new Date().getTime());
    }

    function handleAlltimeClick() {
        setStartDate(new Date(2011, 5, 6).getTime());
        setEndDate(new Date().getTime());
    }

    function handleSettingsModalClose() {
        setIsSettingsModalShown(false);
        setIsCalendarShown(false);
        scrollTop();
    }

    function handleRangeChange(item: RangeKeyDict) {
        const newStartDate = item.selection.startDate?.getTime();
        const newEndDate = item.selection.endDate?.getTime();
        if (!newStartDate || !newEndDate) return;

        setStartDate(newStartDate);
        setEndDate(newEndDate);
    }

    return (
        <ControlsContainer>
            <Input
                aria-label="new channel"
                bordered
                placeholder="New channel"
                value={channelsField}
                onChange={e => setChannelnameField(e.target.value)}
                contentRight={<Button size="xs" onPress={addChannel} style={{ right: "5em" }}>Add</Button>}
            />
            <FlexboxWrap>
                {channels.map(channel =>
                    <Badge
                        color="secondary"
                        key={channel}
                        size="md"
                        onClick={() => removeChannels([channel])}
                    >{channel}</Badge>
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
                onPress={() => switchIsCalendarShown()}
            >
                {`${dateRange.startDate?.toLocaleDateString()} - ${dateRange.endDate?.toLocaleDateString()}`}
            </Button>
            {isCalendarShown &&
                <DateRange
                    onChange={handleRangeChange}
                    maxDate={new Date()}
                    ranges={[dateRange]}
                    direction="vertical"
                />
            }
            <FlexboxWrap css={{ justifyContent: "space-between" }}>
                <Button size="xs" onPress={handleLastWeekClick}>Last week</Button>
                <Button size="xs" onPress={handleLastMonthClick}>Last month</Button>
                <Button size="xs" onPress={handleLastYearClick}>Last year</Button>
                <Button size="xs" onPress={handleAlltimeClick}>All</Button>
            </FlexboxWrap>
            <Input
                size="sm"
                aria-label="min views"
                labelLeft="Min views"
                type="number"
                bordered
                value={minViewCount}
                onChange={e => setMinViewCount(Number(e.target.value))}
                css={{
                    ".nextui-input-label--left": {
                        whiteSpace: "nowrap",
                    }
                }}
            />
            <Input
                size="sm"
                aria-label="filter by name"
                labelLeft="Filter by name"
                type="text"
                bordered
                value={titleFilterField}
                onChange={e => setTItleFilterField(e.target.value)}
                css={{
                    ".nextui-input-label--left": {
                        whiteSpace: "nowrap",
                    },
                }}
                contentRight={
                    <Button
                        icon={<IoMdClose />}
                        onPress={() => setTItleFilterField("")}
                        css={{
                            right: "2px",
                            height: "20px",
                            minWidth: "20px",
                            backgroundColor: "rgb(0 0 0 / 0)",
                            color: "rgba(255, 255, 255, 0.5)",
                            ":hover": {
                                color: "rgba(255, 255, 255, 0.9)",
                            }
                        }}
                    />
                }
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
            {isInfinitePlay &&
                <Input
                    size="sm"
                    aria-label="infinite play buffer"
                    labelLeft="Buffer in seconds"
                    type="number"
                    bordered
                    value={infinitePlayBuffer}
                    onChange={e => setInfinitePlayBuffer(Number(e.target.value) || 4)}
                    css={{
                        ".nextui-input-label--left": {
                            whiteSpace: "nowrap",
                        }
                    }}
                />
            }
            <FlexboxWrap>
                <Switch checked={isHideViewed} onChange={e => switchIsHideViewed()} />
                <Text>Hide viewed</Text>
            </FlexboxWrap>
            <FlexboxWrap>
                <Switch checked={isShowCarousel} onChange={e => setIsShowCarousel(e.target.checked)} />
                <Text>Carousel</Text>
            </FlexboxWrap>
            <Button
                size="xs"
                onPress={() => {
                    clearViewedClips();
                    setIsHideViewed(false);
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
}