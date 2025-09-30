import { reatomComponent } from "@reatom/react";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { format, subDays } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";
import fuzzysort from "fuzzysort";
import {
    CalendarArrowDown,
    EyeOff,
    ListChevronsDownUp,
    ListChevronsUpDown,
    ListTodo,
    Loader2,
    PanelRightClose,
    SquarePlay,
} from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent } from "motion/react";
import { z } from "zod";

import ToggleWithTooltip from "~/components/ToggleWithTooltip";
import { Button } from "~/components/ui/button";
import { useClips } from "~/lib/clips/query";
import { db } from "~/lib/db";
import { useGames } from "~/lib/games/query";
import { useTranslations } from "~/lib/locale/locales";
import {
    autonextBuffer,
    chronologicalOrder,
    clipAutoplay,
    filtersOpen,
    markAsViewed,
    selectedClipId,
    selectedGameId,
    sidebarOpen,
    skipViewed,
    titleFilterField,
} from "~/lib/store/atoms";
import {
    autonextEnabled,
    autonextTimer,
    startAutonextTimer,
    stopAutonextTimer,
} from "~/lib/store/autonext";
import { formatSeconds } from "~/lib/utils";
import type { TwitchClipMetadata } from "~/model/twitch";
import BottomBar from "./-components/BottomBar";
import ClipList from "./-components/ClipList";
import ExtraSettingsDialog from "./-components/ExtraSettings";
import Filters from "./-components/Filters";
import GameSelect from "./-components/GameSelect";
import SideBarCollapsed from "./-components/SideBarCollapsed";

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
    const t = useTranslations();
    const [debouncedMinViews] = useDebouncedValue(search.minViews, { wait: 500 });
    const [debouncedTitleFilterField] = useDebouncedValue(titleFilterField(), { wait: 500 });
    const viewedClips = useLiveQuery(() => db.viewedClips.toArray());

    const channels = search.channels.split(",").filter(Boolean);
    const viewedClipsIds = viewedClips?.map((c) => c.clipId);

    const { clips, isFetching, error } = useClips({
        channels,
        from: search.from,
        to: search.to,
        minViews: debouncedMinViews,
        chronologicalOrder: chronologicalOrder(),
    });

    const uniqueGameIds = Array.from(new Set(clips?.map((c) => c.game_id)));

    const { data: gamesInfo, isPending: isPendingGames } = useGames(uniqueGameIds);

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

    const filteredClips = selectedGameId()
        ? clips?.filter((clip) => clip.game_id === selectedGameId())
        : clips;

    const sortedClips =
        filteredClips &&
        fuzzysort
            .go(debouncedTitleFilterField, filteredClips, {
                key: "title",
                threshold: 0.3,
                all: true,
            })
            .map((result) => result.obj);

    const currentClip = sortedClips?.find((c) => c.id === selectedClipId()) ?? sortedClips?.at(0);
    const currentClipIndex = (currentClip && sortedClips?.indexOf(currentClip)) ?? 0;
    const previousClip = sortedClips?.[currentClipIndex - 1];
    const nextClip = skipViewed()
        ? sortedClips?.find((clip, index) => {
              if (index <= currentClipIndex) return false;
              return !viewedClipsIds?.includes(clip.id);
          })
        : sortedClips?.[currentClipIndex + 1];

    const totalClipsDuration = skipViewed()
        ? sortedClips
              ?.filter((clip) => !viewedClipsIds?.includes(clip.id))
              .reduce((acc, c) => acc + c.duration, 0)
        : sortedClips?.reduce((acc, c) => acc + c.duration, 0);

    useMotionValueEvent(autonextTimer, "animationComplete", () => {
        if (nextClip) {
            selectClip(nextClip);
            startAutonextTimer(nextClip.duration + autonextBuffer());
        } else {
            stopAutonextTimer();
        }
    });

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

    return (
        <div className="flex h-full divide-x">
            <div className="flex h-full min-w-0 grow flex-col">
                <div className="flex grow items-center justify-center">
                    {channels.length === 0 ? (
                        <p className="text-3xl">No Channels</p>
                    ) : !currentClip ? (
                        <p className="text-3xl">No clip</p>
                    ) : (
                        <motion.iframe
                            key={currentClip.id}
                            src={`${currentClip.embed_url}&parent=${globalThis.location.hostname}&autoplay=${clipAutoplay()}`}
                            allow="autoplay; picture-in-picture"
                            allowFullScreen
                            className="h-full w-full"
                            initial={{
                                opacity: 0,
                            }}
                            animate={{
                                opacity: 1,
                                transition: { delay: 0.7 },
                            }}
                        />
                    )}
                </div>
                <AnimatePresence>
                    {sidebarOpen() && (
                        <BottomBar
                            currentClip={currentClip}
                            hasNextClip={Boolean(nextClip)}
                            hasPrevClip={Boolean(previousClip)}
                            selectNextClip={handleSelectNextClip}
                            selectPrevClip={handleSelectPrevClip}
                            switchAutonext={switchAutonext}
                        />
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
                                    onClick={() => filtersOpen.set((o) => !o)}
                                >
                                    <AnimatePresence mode="popLayout">
                                        {filtersOpen() ? (
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
                                    <ToggleWithTooltip
                                        pressed={skipViewed()}
                                        onPressedChange={skipViewed.set}
                                        title={t("viewed.skipViewed")}
                                    >
                                        <EyeOff />
                                    </ToggleWithTooltip>
                                    <ToggleWithTooltip
                                        pressed={markAsViewed()}
                                        onPressedChange={markAsViewed.set}
                                        title={t("viewed.markAsViewed")}
                                    >
                                        <ListTodo />
                                    </ToggleWithTooltip>
                                    <ToggleWithTooltip
                                        pressed={clipAutoplay()}
                                        onPressedChange={clipAutoplay.set}
                                        title={t("clipAutoplay")}
                                    >
                                        <SquarePlay />
                                    </ToggleWithTooltip>
                                    <ToggleWithTooltip
                                        pressed={chronologicalOrder()}
                                        onPressedChange={(value) => {
                                            chronologicalOrder.set(value);
                                            selectClip(null);
                                            stopAutonextTimer();
                                            selectedGameId.set(null);
                                        }}
                                        title={t("chronologicalOrder")}
                                    >
                                        <CalendarArrowDown />
                                    </ToggleWithTooltip>
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
                                {filtersOpen() && (
                                    <Filters
                                        currentClipCreatedAt={currentClip?.created_at}
                                        resetSelectedClip={() => selectClip(null)}
                                    >
                                        <GameSelect
                                            disabled={isPendingGames || gamesInfo.length === 0}
                                            games={gamesInfoWithCount}
                                        />
                                    </Filters>
                                )}
                            </AnimatePresence>
                            <div className="mt-2 flex min-h-0 flex-col gap-2">
                                {error ? (
                                    <p className="text-red-500">Error: {error.message}</p>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {currentClip && totalClipsDuration && (
                                            <p className="text-sm">{`${currentClipIndex + 1}/${sortedClips?.length ?? 0} (${formatSeconds(totalClipsDuration)})`}</p>
                                        )}
                                    </div>
                                )}
                                {!!sortedClips?.length && (
                                    <ClipList
                                        clips={sortedClips}
                                        currentClipId={currentClip?.id}
                                        currentClipIndex={currentClipIndex}
                                        onClipClick={(clip) => {
                                            selectClip(clip);
                                            stopAutonextTimer();
                                        }}
                                    />
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <SideBarCollapsed
                            hasPrevClip={Boolean(previousClip)}
                            hasNextClip={Boolean(nextClip)}
                            selectNextClip={handleSelectNextClip}
                            selectPrevClip={handleSelectPrevClip}
                            switchAutonext={switchAutonext}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
});
