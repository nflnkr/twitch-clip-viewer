import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { format, parse, subDays } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";
import {
    ArrowLeft,
    ArrowRight,
    CirclePause,
    CirclePlay,
    PanelLeftClose,
    PanelRightClose,
    Settings,
    X,
} from "lucide-react";
import { animate, AnimatePresence, motion, useMotionValue } from "motion/react";
import {
    type CSSProperties,
    type KeyboardEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import type { DateRange } from "react-day-picker";
import { z } from "zod";
import ClipInfo from "~/components/ClipInfo";
import ClipList from "~/components/ClipList";
import DateRangePicker from "~/components/DateRangePicker";
import LanguageMenu from "~/components/LanguageMenu";
import { NumberInput } from "~/components/NumberInput";
import Spinner from "~/components/Spinner";
import TwitchClipEmbed from "~/components/TwitchClipEmbed";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { db } from "~/lib/db";
import { clipsOptions } from "~/lib/get-clips";
import { useTranslations } from "~/lib/locales";
import { useClips } from "~/lib/use-clips";
import { useDebouncedValue } from "~/lib/use-debounced-value";

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
    component: Index,
});

const initialSidebarStyle = {
    width: "24rem",
    padding: "1rem",
} satisfies CSSProperties;

function Index() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    const t = useTranslations();
    const queryClient = useQueryClient();
    const debouncedMinViews = useDebouncedValue(search.minViews, 500);
    const [autonextBuffer, setAutonextBuffer] = useState<number>(4);
    const [autonextEnabled, setAutonextEnabled] = useState<boolean>(false);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [clipAutoplay, setClipAutoplay] = useState<boolean>(true);
    const [markAsViewed, setMarkAsViewed] = useState<boolean>(true);
    const [skipViewed, setSkipViewed] = useState<boolean>(false);
    const [chronologicalOrder, setChronologicalOrder] = useState<boolean>(false);
    const [titleFilterField, setTitleFilterField] = useState<string>("");
    const autonextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debouncedTitleFilterField = useDebouncedValue(titleFilterField, 500);
    const viewedClips = useLiveQuery(() => db.viewedClips.toArray());

    const channels = search.channels.split(",").filter(Boolean);
    const viewedClipsIds = viewedClips?.map((c) => c.clipId) ?? [];

    const { clips, isLoadingFirstPage, isLoadingAllClips, error } = useClips({
        channels,
        from: search.from,
        to: search.to,
        minViews: debouncedMinViews,
        chronologicalOrder,
    });

    const dateRange = {
        from: parse(search.from, "yyyy-MM-dd", new Date()),
        to: parse(search.to, "yyyy-MM-dd", new Date()),
    };

    const filteredClips = clips?.filter((clip) => {
        let showClip = true;

        const title = clip.title.toLowerCase();
        if (debouncedTitleFilterField && !title.includes(debouncedTitleFilterField.toLowerCase()))
            showClip = false;

        return showClip;
    });

    const currentClip = filteredClips?.find((c) => c.id === selectedClipId) ?? filteredClips?.at(0);

    const currentClipIndex = (currentClip && filteredClips?.indexOf(currentClip)) ?? 0;
    const previousClip = filteredClips?.[currentClipIndex - 1];
    const nextClip = filteredClips?.[currentClipIndex + 1];
    const nextNonViewedClip = filteredClips?.find((clip, index) => {
        if (index <= currentClipIndex) return false;
        return !viewedClipsIds?.includes(clip.id);
    });
    const totalClipsDuration = filteredClips?.reduce((acc, c) => acc + c.duration, 0) ?? 0;

    const sidebarStyle = sidebarOpen ? initialSidebarStyle : { width: "2.25rem", padding: "0" };

    const clipProgressOverlayWidth = useMotionValue("0%");

    const clipProgressOverlay = currentClip && autonextEnabled && (
        <motion.div
            key={currentClip.id}
            style={{ width: clipProgressOverlayWidth }}
            className="h-full bg-zinc-400 opacity-10"
        />
    );

    const stopAutonext = useCallback(() => {
        setAutonextEnabled(false);
        clearTimeout(autonextTimeoutRef.current ?? 0);
        autonextTimeoutRef.current = null;
        clipProgressOverlayWidth.jump("0%");
    }, [clipProgressOverlayWidth]);

    const selectClip = useCallback(
        async (clipId: string | null, autonext = false) => {
            if (currentClip?.id === clipId) return;

            const leavingClipId = currentClip?.id;

            if (markAsViewed && leavingClipId) {
                const exists = await db.viewedClips.where("clipId").equals(leavingClipId).count();

                if (!exists) {
                    await db.viewedClips.add({
                        clipId: leavingClipId,
                        timestamp: Date.now(),
                    });
                }
            }

            setSelectedClipId(clipId);
            clipProgressOverlayWidth.jump("0%");
            if (!autonext) stopAutonext();
        },
        [clipProgressOverlayWidth, currentClip?.id, markAsViewed, stopAutonext],
    );

    const selectNextClip = useCallback(
        (autonext = false) => {
            selectClip((skipViewed ? nextNonViewedClip?.id : nextClip?.id) ?? null, autonext);
        },
        [nextClip?.id, nextNonViewedClip?.id, selectClip, skipViewed],
    );

    useEffect(
        function setAutonextTimer() {
            if (!currentClip || (!autonextEnabled && autonextTimeoutRef.current)) {
                return stopAutonext();
            }

            if (autonextEnabled && !autonextTimeoutRef.current) {
                animate(clipProgressOverlayWidth, "100%", {
                    duration: currentClip.duration + autonextBuffer,
                    ease: "linear",
                });

                autonextTimeoutRef.current = setTimeout(
                    () => {
                        autonextTimeoutRef.current = null;
                        if (document.hidden) return setAutonextEnabled(false);

                        if (nextClip) selectNextClip(true);
                        else stopAutonext();
                    },
                    (autonextBuffer + currentClip.duration) * 1000,
                );
            }
        },
        [
            autonextBuffer,
            autonextEnabled,
            clipProgressOverlayWidth,
            currentClip,
            nextClip,
            selectNextClip,
            stopAutonext,
        ],
    );

    function setDateRange(dateRange: DateRange | undefined) {
        selectClip(null);
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
        navigate({
            search: {
                ...search,
                channels: channels.filter((c) => c !== channel).join(","),
            },
        });
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

    function clearViewedClips() {
        db.viewedClips.clear();
    }

    function handleMinViewsChange(value: number | undefined) {
        selectClip(null);
        setChronologicalOrder(false);
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
                        autoplay={clipAutoplay}
                    />
                </div>
                <AnimatePresence>
                    {sidebarOpen && (
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
                                onClick={() => selectClip(previousClip?.id ?? null)}
                            >
                                <ArrowLeft />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-full rounded-none border-x-0"
                                onClick={() => setAutonextEnabled((prev) => !prev)}
                            >
                                {t("player.autoplay")}
                                {autonextEnabled ? <CirclePause /> : <CirclePlay />}
                            </Button>
                            <Button
                                variant="outline"
                                className="h-full grow rounded-none border-r-0"
                                disabled={!nextClip}
                                onClick={() => selectNextClip()}
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
                initial={initialSidebarStyle}
                animate={sidebarStyle}
                className="h-full overflow-y-auto overflow-x-clip"
            >
                <AnimatePresence mode="wait">
                    {sidebarOpen ? (
                        <motion.div
                            key="sidebar-expanded"
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
                            className="flex h-full min-w-[22rem] flex-col gap-4"
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="aspect-square p-0 transition-transform duration-200 [&_svg]:size-6"
                                        onClick={() => setSidebarOpen((o) => !o)}
                                    >
                                        <PanelRightClose />
                                    </Button>
                                    <div className="grow">
                                        <Input
                                            placeholder={t("addChannel")}
                                            enterKeyHint="done"
                                            onKeyUp={handleNewChannelEnterPress}
                                        />
                                    </div>
                                    <LanguageMenu />
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
                                            onClick={() => removeChannel(channel)}
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
                                            checked={skipViewed}
                                            onCheckedChange={setSkipViewed}
                                        />
                                        <Label htmlFor="skip-viewed">
                                            {t("viewed.skipViewed")}
                                        </Label>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                            >
                                                <Settings />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent
                                            className="gap-6 sm:max-w-[425px]"
                                            aria-describedby={undefined}
                                        >
                                            <DialogHeader>
                                                <DialogTitle>{t("settings")}</DialogTitle>
                                            </DialogHeader>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="mr-auto flex items-center gap-2">
                                                        <Switch
                                                            id="clip-autoplay"
                                                            checked={clipAutoplay}
                                                            onCheckedChange={setClipAutoplay}
                                                        />
                                                        <Label htmlFor="clip-autoplay">
                                                            {t("clipAutoplay")}
                                                        </Label>
                                                    </div>
                                                    <div className="mr-auto flex items-center gap-2">
                                                        <Switch
                                                            id="mark-as-viewed"
                                                            checked={markAsViewed}
                                                            onCheckedChange={setMarkAsViewed}
                                                        />
                                                        <Label htmlFor="mark-as-viewed">
                                                            {t("viewed.markAsViewed")}
                                                        </Label>
                                                    </div>
                                                    <div className="mr-auto flex items-center gap-2">
                                                        <Switch
                                                            id="chronological-order"
                                                            checked={chronologicalOrder}
                                                            onCheckedChange={(value) => {
                                                                setChronologicalOrder(value);
                                                                selectClip(null);
                                                            }}
                                                        />
                                                        <Label htmlFor="chronological-order">
                                                            {t("chronologicalOrder")}
                                                        </Label>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label htmlFor="title-filter">
                                                        {t("titleFilter")}
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
                                                                stopAutonext();
                                                            }}
                                                            disabled={!titleFilterField}
                                                            className="aspect-square h-full"
                                                        >
                                                            <X />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label htmlFor="autonext-buffer">
                                                        {t("autonextBuffer")}
                                                    </Label>
                                                    <NumberInput
                                                        id="autonext-buffer"
                                                        name="autonext-buffer"
                                                        value={autonextBuffer}
                                                        onValueChange={(v) => {
                                                            if (v !== undefined) {
                                                                setAutonextBuffer(v);
                                                            }
                                                        }}
                                                        min={0}
                                                    />
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    onClick={clearViewedClips}
                                                    disabled={!viewedClips?.length}
                                                    className="h-full"
                                                >
                                                    {`${t("viewed.clearViewedClips")} (${viewedClips?.length || 0})`}
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
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
                                currentClipId={currentClip?.id ?? null}
                                currentClipIndex={currentClipIndex}
                                skipViewed={skipViewed}
                                onClipClick={selectClip}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sidebar-collapsed"
                            initial={{
                                opacity: 0,
                            }}
                            animate={{
                                opacity: 1,
                            }}
                            className="relative flex h-full flex-col"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="aspect-square rounded-none p-0 transition-transform duration-200 [&_svg]:size-6"
                                onClick={() => setSidebarOpen((o) => !o)}
                            >
                                <PanelLeftClose />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-none hover:bg-gray-950"
                                disabled={!previousClip}
                                onClick={() => selectClip(previousClip?.id ?? null)}
                            >
                                <ArrowLeft />
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-none hover:bg-gray-950"
                                onClick={() => setAutonextEnabled((prev) => !prev)}
                            >
                                {autonextEnabled ? <CirclePause /> : <CirclePlay />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="grow rounded-none hover:bg-gray-950"
                                disabled={!nextClip}
                                onClick={() => selectNextClip()}
                            >
                                <ArrowRight />
                            </Button>
                            <div className="pointer-events-none absolute inset-0">
                                {clipProgressOverlay}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
