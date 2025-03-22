import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { format, parse, subDays } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, ArrowRight, PanelLeftClose, PanelRightClose, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CSSProperties, KeyboardEvent, useState } from "react";
import { DateRange } from "react-day-picker";
import { z } from "zod";
import ClipInfo from "~/components/ClipInfo";
import ClipList from "~/components/ClipList";
import DateRangePicker from "~/components/DateRangePicker";
import { NumberInput } from "~/components/NumberInput";
import Spinner from "~/components/Spinner";
import TwitchClipEmbed from "~/components/TwitchClipEmbed";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { db } from "~/lib/db";
import { clipsOptions } from "~/lib/get-clips";
import { useClips } from "~/lib/use-clips";
import { useDebouncedValue } from "~/lib/use-debounced-value";

const clipAutoplayDefault = process.env.NODE_ENV === "production" ? true : false;

const defaultMinViews = 5;
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
    const queryClient = useQueryClient();
    const debouncedMinViews = useDebouncedValue(search.minViews, 500);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [clipAutoplay, setClipAutoplay] = useState<boolean>(clipAutoplayDefault);
    const [markAsViewed, setMarkAsViewed] = useState<boolean>(true);
    const [hideViewed, setHideViewed] = useState<boolean>(false);
    const [chronologicalOrder, setChronologicalOrder] = useState<boolean>(false);
    const [nameFilterField, setNameFilterField] = useState<string>("");
    const viewedClips = useLiveQuery(() => db.viewedClips.toArray());

    const channels = search.channels.split(",").filter(Boolean);
    const viewedClipsIds = viewedClips?.map((c) => c.clipId) || [];

    const { clips, isLoadingFirstPage, isLoadingAllClips, error } = useClips({
        channels,
        from: search.from,
        to: search.to,
        minViews: debouncedMinViews,
        chronologicalOrder,
    });

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

    const dateRange = {
        from: parse(search.from, "yyyy-MM-dd", new Date()),
        to: parse(search.to, "yyyy-MM-dd", new Date()),
    };

    const filteredClips = clips?.filter((clip) => {
        let showClip = true;

        const title = clip.title.toLowerCase();
        if (nameFilterField && !title.includes(nameFilterField.toLowerCase())) showClip = false;
        if (hideViewed && !viewedClipsIds.includes(clip.id)) showClip = false;

        return showClip;
    });

    const currentClip = filteredClips?.find((c) => c.id === selectedClipId) ?? filteredClips?.at(0);
    const currentClipIndex = (currentClip && filteredClips?.indexOf(currentClip)) ?? 0;
    const previousClip = filteredClips?.[currentClipIndex - 1];
    const nextClip = filteredClips?.[currentClipIndex + 1];

    async function selectClip(clipId: string | null) {
        const leavingClipId = currentClip?.id;

        if (markAsViewed && leavingClipId) {
            await db.viewedClips.add({
                clipId: leavingClipId,
                timestamp: Date.now(),
            });
        }

        setSelectedClipId(clipId);
    }

    const sidebarAnimate = sidebarOpen ? initialSidebarStyle : { width: "2.25rem", padding: "0" };

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
                            className="flex overflow-y-clip"
                        >
                            <Button
                                variant="outline"
                                className="h-full grow rounded-none"
                                disabled={!previousClip}
                                onClick={() => selectClip(previousClip?.id ?? null)}
                            >
                                <ArrowLeft />
                                Prev
                            </Button>
                            <Button
                                variant="outline"
                                className="h-full grow rounded-none border-r-0"
                                disabled={!nextClip}
                                onClick={() => selectClip(nextClip?.id ?? null)}
                            >
                                Next
                                <ArrowRight />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <motion.div
                initial={initialSidebarStyle}
                animate={sidebarAnimate}
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
                                            placeholder="New channel"
                                            enterKeyHint="done"
                                            onKeyUp={handleNewChannelEnterPress}
                                        />
                                    </div>
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
                                    <Label htmlFor="min-views">Min views</Label>
                                    <NumberInput
                                        id="min-views"
                                        name="minViews"
                                        value={search.minViews}
                                        onValueChange={(v) => {
                                            selectClip(null);
                                            navigate({ search: { ...search, minViews: v } });
                                        }}
                                        stepper={10}
                                        min={0}
                                    />
                                </div>
                                <DateRangePicker
                                    channels={channels}
                                    dateRange={dateRange}
                                    setDateRange={setDateRange}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="mr-auto flex items-center gap-2">
                                        <Switch
                                            id="clip-autoplay"
                                            checked={clipAutoplay}
                                            onCheckedChange={setClipAutoplay}
                                        />
                                        <Label htmlFor="clip-autoplay">Clip autoplay</Label>
                                    </div>
                                    <div className="mr-auto flex items-center gap-2">
                                        <Switch
                                            id="mark-as-viewed"
                                            checked={markAsViewed}
                                            onCheckedChange={setMarkAsViewed}
                                        />
                                        <Label htmlFor="mark-as-viewed">Mark as viewed</Label>
                                    </div>
                                    <div className="mr-auto flex items-center gap-2">
                                        <Switch
                                            id="chronological-order"
                                            checked={chronologicalOrder}
                                            onCheckedChange={setChronologicalOrder}
                                        />
                                        <Label htmlFor="chronological-order">Chronologically</Label>
                                    </div>
                                    <div className="mr-auto flex items-center gap-2">
                                        <Switch
                                            id="hide-viewed"
                                            checked={hideViewed}
                                            onCheckedChange={setHideViewed}
                                        />
                                        <Label htmlFor="hide-viewed">Hide viewed</Label>
                                    </div>
                                </div>
                                <div className="flex items-stretch gap-1">
                                    <Input
                                        placeholder="Filter clips by title"
                                        value={nameFilterField}
                                        onChange={(e) => setNameFilterField(e.target.value)}
                                    />
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={() => setNameFilterField("")}
                                        disabled={!nameFilterField}
                                        className="h-full"
                                    >
                                        <X />
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={clearViewedClips}
                                        disabled={!viewedClips?.length}
                                        className="h-full"
                                    >
                                        {`Clear viewed${viewedClips?.length ? `(${viewedClips.length})` : ""}`}
                                    </Button>
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
                                        currentClipIndex={currentClipIndex}
                                        isLoading={isLoadingAllClips}
                                    />
                                )
                            )}
                            <ClipList
                                clips={filteredClips}
                                currentClipId={currentClip?.id ?? null}
                                currentClipIndex={currentClipIndex}
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
                            className="flex h-full flex-col"
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
                                variant="ghost"
                                size="icon"
                                className="grow rounded-none hover:bg-gray-950"
                                disabled={!nextClip}
                                onClick={() => selectClip(nextClip?.id ?? null)}
                            >
                                <ArrowRight />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
