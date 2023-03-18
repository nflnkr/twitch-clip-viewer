import { useMemo } from "react";
import { Button, Text, Switch, Input, Badge, styled, Divider, useTheme } from "@nextui-org/react";
import { DateRange, RangeKeyDict } from "react-date-range";
import { clearViewedClips, removeChannels, setChannelnameField, setEndDate, setInfinitePlayBuffer, setIsCalendarShown, setIsClipAutoplay, setIsInfinitePlay, setIsSettingsModalShown, setIsShowCarousel, setMinViewCount, setTitleFilterField, setStartDate, switchIsCalendarShown, useAppStore, switchIsHideViewed, setIsHideViewed, addChannelGroup } from "../stores/app";
import { TwitchClipMetadata } from "../model/clips";
import { IoMdClose } from "react-icons/io";
import ChannelGroupItem from "./ChannelGroupItem";


const ControlsContainer = styled("div", {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
});

const Flexbox = styled("div", {
    display: "flex",
});

const FlexColumn = styled("div", {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
});

const FlexboxWrap = styled("div", {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
});

const Grid = styled("div", {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridAutoRows: "1fr",
    gap: "6px",
});

export default function Settings({ scrollTop, addChannel, filteredClips, totalClips }: {
    scrollTop: () => void;
    addChannel: () => void;
    filteredClips: TwitchClipMetadata[];
    totalClips: number;
}) {
    const channels = useAppStore(state => state.channels);
    const channelGroups = useAppStore(state => state.channelGroups);
    const selectedChannelGroupIndex = useAppStore(state => state.selectedChannelGroupIndex);
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

    function handleCreateGroup() {
        addChannelGroup({
            channels: channels.slice(),
            minViews: minViewCount,
            titleFilter: titleFilterField,
        });
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
            <FlexboxWrap css={{ gap: "2px" }}>
                {channels.map(channel =>
                    <Badge
                        color="secondary"
                        key={channel}
                        size="sm"
                        onClick={() => removeChannels([channel])}
                    >{channel}</Badge>
                )}
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
                onChange={e => setTitleFilterField(e.target.value)}
                css={{
                    ".nextui-input-label--left": {
                        whiteSpace: "nowrap",
                    },
                }}
                contentRight={titleFilterField &&
                    <Button
                        icon={<IoMdClose />}
                        onPress={() => setTitleFilterField("")}
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
            <Button size="sm" onPress={handleCreateGroup}>Create group</Button>
            {channelGroups.length > 0 &&
                <FlexColumn css={{ gap: theme.theme?.space.xs }}>
                    {channelGroups.map((channelGroup, index) =>
                        <ChannelGroupItem
                            key={channelGroup.id}
                            channelGroup={channelGroup}
                            index={index}
                            isSelected={index === selectedChannelGroupIndex}
                        />
                    )}
                </FlexColumn>
            }
            <Divider />
            <FlexColumn>
                <Button
                    size="sm"
                    onPress={() => switchIsCalendarShown()}
                    css={{
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                    }}
                >
                    {`${dateRange.startDate?.toLocaleDateString()} - ${dateRange.endDate?.toLocaleDateString()}`}
                </Button>
                <Flexbox css={{
                    gap: "1px",
                    "> button": {
                        borderRadius: 0,
                        flex: "1 1 25%",
                        minWidth: "min-content",
                        "&:first-of-type": {
                            borderBottomLeftRadius: theme.theme?.radii.sm,
                        },
                        "&:last-of-type": {
                            borderBottomRightRadius: theme.theme?.radii.sm,
                        },
                    }
                }}>
                    <Button size="xs" onPress={handleLastWeekClick}>Last week</Button>
                    <Button size="xs" onPress={handleLastMonthClick}>Last month</Button>
                    <Button size="xs" onPress={handleLastYearClick}>Last year</Button>
                    <Button size="xs" onPress={handleAlltimeClick}>All</Button>
                </Flexbox>
            </FlexColumn>
            {isCalendarShown &&
                <DateRange
                    onChange={handleRangeChange}
                    maxDate={new Date()}
                    ranges={[dateRange]}
                    direction="vertical"
                />
            }
            {isHideViewed ?
                <Text>Remaining: {filteredClips.length - 1}</Text>
                :
                <Text>{currentClipIndex + 1}/{totalClips}</Text>
            }
            <Grid>
                <FlexboxWrap>
                    <Switch size="sm" checked={isHideViewed} onChange={e => switchIsHideViewed()} />
                    <Text>Hide viewed</Text>
                </FlexboxWrap>
                <FlexboxWrap>
                    <Switch size="sm" checked={isShowCarousel} onChange={e => setIsShowCarousel(e.target.checked)} />
                    <Text>Carousel</Text>
                </FlexboxWrap>
                <FlexboxWrap>
                    <Switch size="sm" checked={isClipAutoplay} onChange={e => {
                        if (!e.target.checked) setIsInfinitePlay(false);
                        setIsClipAutoplay(e.target.checked);
                    }} />
                    <Text>Clip autoplay</Text>
                </FlexboxWrap>
                <FlexboxWrap>
                    <Switch size="sm" checked={isInfinitePlay} onChange={e => {
                        if (e.target.checked) setIsClipAutoplay(true);
                        setIsInfinitePlay(e.target.checked);
                    }} />
                    <Text>Auto next</Text>
                </FlexboxWrap>
            </Grid>
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