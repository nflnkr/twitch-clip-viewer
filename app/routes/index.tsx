import { reatomComponent } from "@reatom/react";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { format, parse, subDays } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, ArrowRight, CirclePause, CirclePlay, PanelRightClose, X } from "lucide-react";
import {
    animate,
    AnimatePresence,
    motion,
    useMotionValue,
    useMotionValueEvent,
} from "motion/react";
import type { KeyboardEvent } from "react";
import { useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { z } from "zod";

import ClipInfo from "~/components/ClipInfo";
import ClipList from "~/components/ClipList";
import DateRangePicker from "~/components/DateRangePicker";
import ExtraSettingsPopover from "~/components/ExtraSettings";
import GameSelect from "~/components/GameSelect";
import LanguageMenu from "~/components/LanguageMenu";
import { NumberInput } from "~/components/NumberInput";
import SideBarCollapsed from "~/components/SideBarCollapsed";
import Spinner from "~/components/Spinner";
import TwitchClipEmbed from "~/components/TwitchClipEmbed";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
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
    ssr: false,
});

const Index = reatomComponent(function Index() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    const t = useTranslations();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<"settings" | "clips">("settings");
    const [debouncedMinViews] = useDebouncedValue(search.minViews, { wait: 500 });
    const [titleFilterField, setTitleFilterField] = useState<string>("");
    const [selectedGame, setSelectedGame] = useState<string>("");
    const [debouncedTitleFilterField] = useDebouncedValue(titleFilterField, { wait: 500 });
    const animationRef = useRef<ReturnType<typeof animate>>(null);
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

    const uniqueSortedGameIds = [...new Set(clips?.map((c) => c.game_id) ?? [])].sort();

    const { data: gamesInfo = [], isPending: isPendingGames } = useGames(uniqueSortedGameIds);

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
            selectedGame && gamesInfo.find((game) => game.name === selectedGame);
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

    const clipProgressOverlayWidth = useMotionValue("0%");

    const clipProgressOverlay = currentClip && autonextEnabled() && (
        <motion.div
            style={{ width: clipProgressOverlayWidth }}
            className="h-full bg-zinc-400 opacity-10"
        />
    );

    useMotionValueEvent(clipProgressOverlayWidth, "animationComplete", () => {
        if (nextClip && !document.hidden) {
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
        setSelectedGame("");
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
        setSelectedGame("");
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
        setSelectedGame("");
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
        setSelectedGame("");
        chronologicalOrder.set(false);
        navigate({ search: { ...search, minViews: value } });
    }

    return (
        <div className="flex h-full divide-x">
            <div className="flex h-full grow flex-col">
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
                            initial={{ height: 0 }}
                            animate={{ height: "2rem" }}
                            exit={{ height: 0 }}
                            className="relative flex overflow-y-clip"
                        >
                            <Button
                                variant="outline"
                                className="h-full grow rounded-none"
                                disabled={!previousClip}
                                onClick={handleSelectPrevClip}
                            >
                                <ArrowLeft />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-full rounded-none border-x-0"
                                disabled={!nextClip}
                                onClick={switchAutonext}
                            >
                                {t("player.autoplay")}
                                {autonextEnabled() ? <CirclePause /> : <CirclePlay />}
                            </Button>
                            <Button
                                variant="outline"
                                className="h-full grow rounded-none border-r-0"
                                disabled={!nextClip}
                                onClick={handleSelectNextClip}
                            >
                                <ArrowRight />
                            </Button>
                            <div className="pointer-events-none absolute inset-0">
                                {clipProgressOverlay}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <motion.div
                variants={{
                    collapsed: { width: "2.25rem", padding: "0" },
                    expanded: { width: "24rem", padding: "1rem" },
                }}
                initial="expanded"
                animate={sidebarOpen() ? "expanded" : "collapsed"}
                className="h-full overflow-y-auto overflow-x-clip"
            >
                <AnimatePresence mode="wait">
                    {sidebarOpen() ? (
                        <Tabs
                            key="sidebar-expanded"
                            value={tab}
                            onValueChange={(value) => setTab(value as "settings" | "clips")}
                            asChild
                        >
                            <motion.div
                                initial={{
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                    transition: { delay: 0.1 },
                                }}
                                exit={{
                                    opacity: 0,
                                }}
                                className="flex h-full min-w-[22rem] flex-col"
                            >
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => sidebarOpen.set((o) => !o)}
                                    >
                                        <PanelRightClose />
                                    </Button>
                                    <TabsList className="grow">
                                        <TabsTrigger
                                            value="settings"
                                            className="flex-1"
                                        >
                                            {t("settings")}
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="clips"
                                            className="flex-1"
                                        >
                                            {t("clips")}
                                        </TabsTrigger>
                                    </TabsList>
                                    <LanguageMenu />
                                </div>
                                <TabsContent
                                    value="settings"
                                    className="flex flex-col gap-4"
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
                                        <div className="flex items-center justify-between">
                                            <div className="mr-auto flex items-center gap-2">
                                                <Switch
                                                    id="skip-viewed"
                                                    checked={skipViewed()}
                                                    onCheckedChange={skipViewed.set}
                                                />
                                                <Label htmlFor="skip-viewed">
                                                    {t("viewed.skipViewed")}
                                                </Label>
                                            </div>
                                            <ExtraSettingsPopover
                                                resetSelectedClip={() => {
                                                    selectClip(null);
                                                    stopAutonextTimer();
                                                    setSelectedGame("");
                                                }}
                                            />
                                        </div>
                                        <p className="text-lg">Фильтры</p>
                                        <div className="flex flex-col gap-2 text-balance">
                                            <div className="flex flex-col gap-1">
                                                <Label htmlFor="title-filter">
                                                    {t("filterByTitle")}
                                                </Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="title-filter"
                                                        value={titleFilterField}
                                                        onChange={(e) =>
                                                            setTitleFilterField(e.target.value)
                                                        }
                                                    />
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setTitleFilterField("");
                                                            stopAutonextTimer();
                                                        }}
                                                        disabled={!titleFilterField}
                                                        className="aspect-square h-full"
                                                    >
                                                        <X />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label htmlFor="title-filter">
                                                    {t("filterByCategory")}
                                                </Label>
                                                <div className="flex items-center gap-2">
                                                    <GameSelect
                                                        disabled={isPendingGames}
                                                        games={gamesInfo}
                                                        selectedGame={selectedGame}
                                                        setSelectedGame={setSelectedGame}
                                                    />
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setSelectedGame("");
                                                            stopAutonextTimer();
                                                        }}
                                                        disabled={!selectedGame}
                                                        className="aspect-square h-full"
                                                    >
                                                        <X />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent
                                    value="clips"
                                    className="flex min-h-0 flex-col gap-4"
                                >
                                    {error ? (
                                        <p className="text-red-500">Error: {error.message}</p>
                                    ) : isLoadingFirstPage ? (
                                        <Spinner />
                                    ) : (
                                        currentClip && (
                                            <ClipInfo
                                                currentClip={currentClip}
                                                clipsLength={filteredClips?.length ?? 0}
                                                totalClipsDuration={totalClipsDuration}
                                                currentClipIndex={currentClipIndex}
                                                isLoading={isLoadingAllClips}
                                            />
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
                                </TabsContent>
                            </motion.div>
                        </Tabs>
                    ) : (
                        <SideBarCollapsed
                            hasPrevClip={Boolean(previousClip)}
                            hasNextClip={Boolean(nextClip)}
                            selectNextClip={handleSelectNextClip}
                            selectPrevClip={handleSelectPrevClip}
                            clipProgressOverlay={clipProgressOverlay}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
});
