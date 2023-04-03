import { useMemo } from "react";
import { Button, Text, Switch, Input, styled, Divider, useTheme, Card } from "@nextui-org/react";
import { DateRange, RangeKeyDict } from "react-date-range";
import { clearViewedClips, removeChannels, setChannelsField, setEndDate, setInfinitePlayBuffer, setIsCalendarShown, setIsClipAutoplay, setIsInfinitePlay, setIsSettingsModalShown, setMinViewCount, setTitleFilterField, setStartDate, switchIsCalendarShown, useAppStore, addChannelPreset, updateChannelPreset, addChannels, clearChannels, clearClipsFromViewed } from "../../stores/app";
import { IoMdClose } from "react-icons/io";
import ChannelPresetItem from "./ChannelPresetItem";
import { StyledBadge } from "../../App";


const ControlsContainer = styled("div", {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    p: "1em",
    width: "inherit",
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

export default function Settings({ scrollTop }: {
    scrollTop: () => void;
}) {
    const channels = useAppStore(state => state.channels);
    const channelPresets = useAppStore(state => state.channelPresets);
    const selectedChannelPresetIndex = useAppStore(state => state.selectedChannelPresetIndex);
    const channelsField = useAppStore(state => state.channelsField);
    const titleFilterField = useAppStore(state => state.titleFilterField);
    const isClipAutoplay = useAppStore(state => state.isClipAutoplay);
    const isInfinitePlay = useAppStore(state => state.isInfinitePlay);
    const isCalendarShown = useAppStore(state => state.isCalendarShown);
    const isSettingsModalShown = useAppStore(state => state.isSettingsModalShown);
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
                onChange={e => setChannelsField(e.target.value)}
                contentRight={<Button size="xs" onPress={addChannels} style={{ right: "5em" }}>Add</Button>}
            />
            {channels.length > 0 &&
                <Card variant="bordered">
                    <Card.Body css={{
                        p: "4px",
                        backgroundColor: "#26262e",
                        flexDirection: "row",
                        alignItems: "center",
                    }}>
                        <FlexboxWrap css={{ gap: "2px" }}>
                            {channels.map(channel => (
                                <StyledBadge
                                    color="secondary"
                                    key={channel}
                                    size="sm"
                                    onClick={() => removeChannels([channel])}
                                >{channel}</StyledBadge>
                            ))}
                        </FlexboxWrap>
                        <Button
                            icon={<IoMdClose />}
                            onPress={clearChannels}
                            css={{
                                ml: "auto",
                                height: "20px",
                                minWidth: "20px",
                                width: "20px",
                                backgroundColor: "rgb(0 0 0 / 0)",
                                color: "rgba(255, 255, 255, 0.5)",
                                "&:hover": {
                                    color: "rgba(255, 255, 255, 0.9)",
                                }
                            }}
                        />
                    </Card.Body>
                </Card>
            }
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
                labelLeft="Name contains"
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
            <Flexbox css={{
                gap: "6px", // TODO replace all gaps with theme spacing
                width: "100%",
                "> button": {
                    flex: "1 1 50%",
                    minWidth: "min-content",
                }
            }}>
                <Button size="sm" onPress={addChannelPreset}>Create preset</Button>
                <Button size="sm" onPress={updateChannelPreset} disabled={selectedChannelPresetIndex === null}>Update preset</Button>
            </Flexbox>

            {channelPresets.length > 0 &&
                <FlexColumn css={{ gap: theme.theme?.space.xs }}>
                    {channelPresets.map((channelPreset, index) =>
                        <ChannelPresetItem
                            key={channelPreset.id}
                            channelPreset={channelPreset}
                            index={index}
                            isSelected={index === selectedChannelPresetIndex}
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
            <FlexboxWrap css={{ gap: "20px" }}>
                <FlexboxWrap>
                    <Switch size="md" checked={isInfinitePlay} onChange={e => {
                        if (e.target.checked) setIsClipAutoplay(true);
                        setIsInfinitePlay(e.target.checked);
                    }} />
                    <Text>Auto next</Text>
                </FlexboxWrap>
                <FlexboxWrap>
                    <Switch size="md" checked={isClipAutoplay} onChange={e => {
                        if (!e.target.checked) setIsInfinitePlay(false);
                        setIsClipAutoplay(e.target.checked);
                    }} />
                    <Text>Clip autoplay</Text>
                </FlexboxWrap>
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
            <Flexbox css={{
                gap: "8px",
                "> button": {
                    flex: "1 1 50%",
                    minWidth: "min-content",
                }
            }}>
                <Button
                    size="xs"
                    onPress={clearClipsFromViewed}
                >
                    Hide viewed clips
                </Button>
                <Button
                    size="xs"
                    onPress={clearViewedClips}
                >
                    Reset viewed clips {viewedClips.length > 0 && `(${viewedClips.length})`}
                </Button>
            </Flexbox>
            {isSettingsModalShown &&
                <Button size="sm" onPress={handleSettingsModalClose}>Close</Button>
            }
        </ControlsContainer>
    );
}