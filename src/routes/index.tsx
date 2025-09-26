import { reatomComponent } from "@reatom/react";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { format, parse, subDays } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    CalendarArrowDown,
    CirclePause,
    CirclePlay,
    ExternalLink,
    EyeOff,
    ListChevronsDownUp,
    ListChevronsUpDown,
    ListTodo,
    Loader2,
    PanelRightClose,
    SquarePlay,
    X,
} from "lucide-react";
import {
    animate,
    AnimatePresence,
    motion,
    useMotionValue,
    useMotionValueEvent,
    type AnimationPlaybackControlsWithThen,
} from "motion/react";
import type { KeyboardEvent } from "react";
import { useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { z } from "zod";

import ClipList from "~/components/ClipList";
import DateRangePicker from "~/components/DateRangePicker";
import ExtraSettingsDialog from "~/components/ExtraSettings";
import GameSelect from "~/components/GameSelect";
import { NumberInput } from "~/components/NumberInput";
import SideBarCollapsed from "~/components/SideBarCollapsed";
import Spinner from "~/components/Spinner";
import TwitchClipEmbed from "~/components/TwitchClipEmbed";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Toggle } from "~/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { clipsOptions, useClips } from "~/lib/clips/query";
import { db } from "~/lib/db";
import { useGames } from "~/lib/games/query";
import { useTranslations } from "~/lib/locale/locales";
import {
    autonextBuffer,
    autonextEnabled,
    chronologicalOrder,
    clipAutoplay,
    markAsViewed,
    selectedClipId,
    sidebarOpen,
    skipViewed,
} from "~/lib/settings/atoms";
import { formatSeconds } from "~/lib/utils";
import { getVodLink } from "~/lib/vod-link";
import type { TwitchClipMetadata } from "~/model/twitch";

const defaultMinViews = 10;
const getDefaultFrom = () => format(subDays(new Date(), 7), "yyyy-MM-dd");
const getDefaultTo = () => format(new Date(), "yyyy-MM-dd");

export const Route = createFileRoute("/")({
    validateSearch: zodValidator(
        z.object({
            channels: z.string().optional().default("").catch(""),
            from: z.string().date().optional().default(getDefaultFrom).catch(getDefaultFrom),
            to: z.string().date().optional().default(getDefaultTo).catch(getDefaultTo),
            minViews: z.number().optional().default(defaultMinViews).catch(defaultMinViews),
        }),
    ),
    search: {
        middlewares: [
            stripSearchParams({
                channels: "",
                minViews: defaultMinViews,
                from: getDefaultFrom(),
                to: getDefaultTo(),
            }),
        ],
    },
    component: () => <Index />,
    ssr: true,
});

const Index = reatomComponent(function Index() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    const t = useTranslations();
    const queryClient = useQueryClient();
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [debouncedMinViews] = useDebouncedValue(search.minViews, { wait: 500 });
    const [titleFilterField, setTitleFilterField] = useState("");
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    const [debouncedTitleFilterField] = useDebouncedValue(titleFilterField, { wait: 500 });
    const animationRef = useRef<AnimationPlaybackControlsWithThen>(null);
    const viewedClips = useLiveQuery(() => db.viewedClips.toArray());

    const channels = search.channels.split(",").filter(Boolean);
    const viewedClipsIds = viewedClips?.map((c) => c.clipId) ?? [];

    const { clips, isLoadingFirstPage, isLoadingAllClips, error } = useClips({
        channels,
        from: search.from,
        to: search.to,
        minViews: debouncedMinViews,
        chronologicalOrder: chronologicalOrder(),
    });

    const uniqueGameIds = Array.from(new Set(clips?.map((c) => c.game_id)));

    const { data: gamesInfo = [], isPending: isPendingGames } = useGames(uniqueGameIds);

    const gameCountById: Record<string, number> = {};
    clips?.forEach((clip) => {
        gameCountById[clip.game_id] = (gameCountById[clip.game_id] ?? 0) + 1;
    });

    const gamesInfoWithCount = gamesInfo
        .map((game) => ({
            ...game,
            count: gameCountById[game.id] ?? 0,
        }))
        .sort((a, b) => b.count - a.count);

    const dateRange = {
        from: parse(search.from, "yyyy-MM-dd", new Date()),
        to: parse(search.to, "yyyy-MM-dd", new Date()),
    };

    const filteredClips = clips?.filter((clip) => {
        let showClip = true;

        const title = clip.title.toLowerCase();
        if (debouncedTitleFilterField && !title.includes(debouncedTitleFilterField.toLowerCase())) {
            showClip = false;
        }

        const selectedGameInfo =
            selectedGameId && gamesInfo.find((game) => game.id === selectedGameId);
        if (selectedGameInfo && clip.game_id !== selectedGameInfo.id) {
            showClip = false;
        }

        return showClip;
    });

    const currentClip =
        filteredClips?.find((c) => c.id === selectedClipId()) ?? filteredClips?.at(0);

    const currentClipIndex = (currentClip && filteredClips?.indexOf(currentClip)) ?? 0;
    const previousClip = filteredClips?.[currentClipIndex - 1];
    const nextClip = skipViewed()
        ? filteredClips?.find((clip, index) => {
              if (index <= currentClipIndex) return false;
              return !viewedClipsIds?.includes(clip.id);
          })
        : filteredClips?.[currentClipIndex + 1];

    const totalClipsDuration = filteredClips?.reduce((acc, c) => acc + c.duration, 0) ?? 0;

    const vodLink = currentClip ? getVodLink(currentClip.vod_offset, currentClip.video_id) : null;

    const clipProgressOverlayWidth = useMotionValue("0%");

    const clipProgressOverlay = currentClip && autonextEnabled() && (
        <motion.div
            style={{ width: clipProgressOverlayWidth }}
            className="h-full bg-zinc-400 opacity-10"
        />
    );

    useMotionValueEvent(clipProgressOverlayWidth, "animationComplete", () => {
        if (nextClip) {
            selectClip(nextClip);
            startAutonextTimer(nextClip.duration + autonextBuffer());
        } else {
            stopAutonextTimer();
        }
    });

    function startAutonextTimer(duration: number) {
        autonextEnabled.set(true);

        animationRef.current?.stop();
        clipProgressOverlayWidth.jump("0%");
        animationRef.current = animate(clipProgressOverlayWidth, "100%", {
            ease: "linear",
            duration,
        });
    }

    function stopAutonextTimer() {
        autonextEnabled.set(false);

        animationRef.current?.stop();
        clipProgressOverlayWidth.jump("0%");
    }

    async function selectClip(clip: TwitchClipMetadata | null = null) {
        if (currentClip?.id === clip?.id) return;

        const leavingClipId = currentClip?.id;

        if (markAsViewed() && leavingClipId && clip?.id) {
            try {
                const exists = await db.viewedClips.where("clipId").equals(leavingClipId).count();

                if (!exists) {
                    await db.viewedClips.add({
                        clipId: leavingClipId,
                        timestamp: Date.now(),
                    });
                }
            } catch (error) {
                console.error(error);
            }
        }

        selectedClipId.set(clip?.id ?? null);
    }

    function handleSelectNextClip() {
        selectClip(nextClip);
        if (autonextEnabled() && nextClip) startAutonextTimer(nextClip.duration + autonextBuffer());
    }

    function handleSelectPrevClip() {
        selectClip(previousClip);
        stopAutonextTimer();
    }

    function switchAutonext() {
        if (!autonextEnabled() && currentClip) {
            startAutonextTimer(currentClip.duration + autonextBuffer());
        } else {
            stopAutonextTimer();
        }
    }

    function setDateRange(dateRange: DateRange | undefined) {
        selectClip(null);
        stopAutonextTimer();
        setSelectedGameId(null);
        navigate({
            search: {
                ...search,
                from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
                to: dateRange?.to
                    ? format(dateRange.to, "yyyy-MM-dd")
                    : dateRange?.from
                      ? format(dateRange.from, "yyyy-MM-dd")
                      : undefined,
            },
        });
    }

    function removeChannel(channel: string) {
        selectClip(null);
        stopAutonextTimer();
        setSelectedGameId(null);
        navigate({
            search: {
                ...search,
                channels: channels.filter((c) => c !== channel).join(","),
            },
        });
    }

    function openChannelClips(channel: string) {
        const currentUrl = new URL(window.location.href);

        currentUrl.searchParams.set("channels", channel);

        window.open(currentUrl.href, "_blank");
    }

    function handleNewChannelEnterPress(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key !== "Enter") return;

        const filteredNewChannels = event.currentTarget.value
            .split(" ")
            .map((s) => s.toLowerCase())
            .filter((s) => /^[a-zA-Z0-9][\w]{2,24}$/.test(s));
        const newChannels = [...channels, ...filteredNewChannels];
        const uniqueChannels = [...new Set(newChannels)];

        event.currentTarget.value = "";

        selectClip(null);
        stopAutonextTimer();
        setSelectedGameId(null);
        navigate({
            search: {
                ...search,
                channels: uniqueChannels.join(","),
            },
        });
    }

    function prefetchChannelsBeforeRemove(channel: string) {
        const newChannels = channels.filter((c) => c !== channel);

        queryClient.prefetchQuery(
            clipsOptions({
                channels: newChannels.toSorted().join(","),
                from: search.from,
                to: search.to,
            }),
        );
    }

    function handleMinViewsChange(value: number | undefined) {
        selectClip(null);
        stopAutonextTimer();
        setSelectedGameId(null);
        chronologicalOrder.set(false);
        navigate({ search: { ...search, minViews: value } });
    }

    return (
        <div className="flex h-full divide-x">
            <div className="flex h-full min-w-0 grow flex-col">
                <div className="flex grow items-center justify-center">
                    <TwitchClipEmbed
                        key={currentClip?.id}
                        clip={currentClip}
                        noChannels={channels.length === 0}
                        autoplay={clipAutoplay()}
                    />
                </div>
                <AnimatePresence>
                    {sidebarOpen() && (
                        <motion.div
                            initial={{ height: 0, padding: 0 }}
                            animate={{ height: "5rem", padding: "0.25rem" }}
                            exit={{ height: 0, padding: 0 }}
                            className="flex flex-col gap-1 overflow-y-clip"
                        >
                            {currentClip && (
                                <div className="flex grow items-center justify-between gap-2">
                                    <p
                                        title={currentClip.title}
                                        className="truncate px-2 text-xl font-semibold tracking-tighter"
                                    >
                                        {currentClip.title}
                                    </p>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="tracking-tight"
                                            asChild
                                        >
                                            <a
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                color="secondary"
                                                href={`https://twitch.tv/${currentClip.broadcaster_name.toLowerCase()}`}
                                            >
                                                {currentClip.broadcaster_name}
                                                <ExternalLink />
                                            </a>
                                        </Button>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            asChild
                                            className="tracking-tight"
                                        >
                                            <a
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                color="secondary"
                                                href={vodLink ?? undefined}
                                            >
                                                {new Date(currentClip.created_at).toLocaleString()}
                                                {vodLink ? <ExternalLink /> : <Calendar />}
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="relative flex grow gap-1">
                                <Button
                                    variant="outline"
                                    disabled={!previousClip}
                                    onClick={handleSelectPrevClip}
                                    className="h-full grow"
                                >
                                    <ArrowLeft />
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={!nextClip}
                                    onClick={switchAutonext}
                                    className="h-full"
                                >
                                    {t("player.autoplay")}
                                    {autonextEnabled() ? <CirclePause /> : <CirclePlay />}
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={!nextClip}
                                    onClick={handleSelectNextClip}
                                    className="h-full grow"
                                >
                                    <ArrowRight />
                                </Button>
                                <div className="pointer-events-none absolute inset-0">
                                    {clipProgressOverlay}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <motion.div
                variants={{
                    collapsed: { width: "2.25rem", minWidth: "2.25rem", padding: "0" },
                    expanded: { width: "24rem", minWidth: "24rem", padding: "1rem" },
                }}
                initial="expanded"
                animate={sidebarOpen() ? "expanded" : "collapsed"}
                className="h-full overflow-x-clip overflow-y-auto"
            >
                <AnimatePresence mode="wait">
                    {sidebarOpen() ? (
                        <motion.div
                            key="sidebar-expanded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex h-full min-h-0 min-w-[22rem] flex-col"
                        >
                            <div className="flex justify-between gap-2">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    onClick={() => setFiltersOpen((o) => !o)}
                                >
                                    <AnimatePresence mode="popLayout">
                                        {filtersOpen ? (
                                            <motion.span
                                                key="close"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                            >
                                                <ListChevronsDownUp />
                                            </motion.span>
                                        ) : (
                                            <motion.span
                                                key="open"
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                            >
                                                <ListChevronsUpDown />
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Button>
                                <div className="flex gap-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Toggle
                                                    pressed={skipViewed()}
                                                    onPressedChange={skipViewed.set}
                                                >
                                                    <EyeOff />
                                                </Toggle>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p> {t("viewed.skipViewed")}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Toggle
                                                    pressed={markAsViewed()}
                                                    onPressedChange={markAsViewed.set}
                                                >
                                                    <ListTodo />
                                                </Toggle>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t("viewed.markAsViewed")}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Toggle
                                                    pressed={clipAutoplay()}
                                                    onPressedChange={clipAutoplay.set}
                                                >
                                                    <SquarePlay />
                                                </Toggle>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t("clipAutoplay")}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Toggle
                                                    pressed={chronologicalOrder()}
                                                    onPressedChange={(value) => {
                                                        chronologicalOrder.set(value);
                                                        selectClip(null);
                                                        stopAutonextTimer();
                                                        setSelectedGameId(null);
                                                    }}
                                                >
                                                    <CalendarArrowDown />
                                                </Toggle>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{t("chronologicalOrder")}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className="flex gap-2">
                                    <ExtraSettingsDialog />
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => sidebarOpen.set((o) => !o)}
                                    >
                                        <PanelRightClose />
                                    </Button>
                                </div>
                            </div>
                            <AnimatePresence>
                                {filtersOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, marginTop: 0, height: 0 }}
                                        animate={{
                                            opacity: 1,
                                            marginTop: "0.5rem",
                                            height: "auto",
                                        }}
                                        exit={{ opacity: 0, marginTop: 0, height: 0 }}
                                        className="flex flex-col gap-2"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder={t("addChannel")}
                                                    enterKeyHint="done"
                                                    onKeyUp={handleNewChannelEnterPress}
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {channels.map((channel, index) => (
                                                    <Button
                                                        key={index}
                                                        size="xs"
                                                        variant="outline"
                                                        onMouseEnter={() =>
                                                            prefetchChannelsBeforeRemove(channel)
                                                        }
                                                        onClick={(event) => {
                                                            if (event.shiftKey)
                                                                openChannelClips(channel);
                                                            else removeChannel(channel);
                                                        }}
                                                    >
                                                        {channel}
                                                        <X />
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-col gap-1">
                                                <Label htmlFor="min-views"> {t("minViews")}</Label>
                                                <NumberInput
                                                    id="min-views"
                                                    name="minViews"
                                                    value={search.minViews}
                                                    onValueChange={handleMinViewsChange}
                                                    stepper={10}
                                                    min={0}
                                                />
                                            </div>
                                            <DateRangePicker
                                                channels={channels}
                                                currentClipDate={currentClip?.created_at}
                                                dateRange={dateRange}
                                                setDateRange={setDateRange}
                                            />
                                        </div>
                                        <div className="flex">
                                            <Input
                                                placeholder={t("filterByTitle")}
                                                id="title-filter"
                                                value={titleFilterField}
                                                onChange={(e) =>
                                                    setTitleFilterField(e.target.value)
                                                }
                                                className="rounded-r-none"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                    setTitleFilterField("");
                                                    stopAutonextTimer();
                                                }}
                                                className="h-full rounded-l-none border-l-0"
                                            >
                                                <X />
                                            </Button>
                                        </div>
                                        <GameSelect
                                            disabled={
                                                isPendingGames || gamesInfoWithCount.length === 0
                                            }
                                            games={gamesInfoWithCount}
                                            selectedGameId={selectedGameId}
                                            setSelectedGameId={setSelectedGameId}
                                            onClearSelectedGameClick={() => {
                                                setSelectedGameId("");
                                                stopAutonextTimer();
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="mt-2 flex min-h-0 flex-col gap-2">
                                {error ? (
                                    <p className="text-red-500">Error: {error.message}</p>
                                ) : isLoadingFirstPage ? (
                                    <Spinner />
                                ) : (
                                    currentClip && (
                                        <div className="flex items-center gap-2">
                                            {isLoadingAllClips && (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            )}
                                            <p className="text-sm">{`${currentClipIndex + 1}/${filteredClips?.length ?? 0} (${formatSeconds(totalClipsDuration)})`}</p>
                                        </div>
                                    )
                                )}
                                <ClipList
                                    clips={filteredClips}
                                    currentClipId={currentClip?.id}
                                    currentClipIndex={currentClipIndex}
                                    skipViewed={skipViewed()}
                                    onClipClick={(clip) => {
                                        selectClip(clip);
                                        stopAutonextTimer();
                                    }}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <SideBarCollapsed
                            hasPrevClip={Boolean(previousClip)}
                            hasNextClip={Boolean(nextClip)}
                            selectNextClip={handleSelectNextClip}
                            selectPrevClip={handleSelectPrevClip}
                            clipProgressOverlay={clipProgressOverlay}
                            switchAutonext={switchAutonext}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
});
