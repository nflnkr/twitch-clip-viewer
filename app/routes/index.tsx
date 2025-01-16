import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { format, parse, subDays, subMonths } from "date-fns";
import { ArrowLeft, ArrowRight, PanelLeftClose, PanelRightClose, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CSSProperties, KeyboardEvent, useRef, useState } from "react";
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
import { clipsOptions } from "~/lib/get-clips";
import { useClips } from "~/lib/use-clips";
import { useDebouncedValue } from "~/lib/use-debounced-value";

const clipAutoplayDefault = process.env.NODE_ENV === "production" ? true : false;

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

export function Index() {
    const queryClient = useQueryClient();
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    const debouncedMinViews = useDebouncedValue(search.minViews, 500);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const clipAutoplayRef = useRef(clipAutoplayDefault);

    const channels = search.channels.split(",").filter(Boolean);

    const { clips, isLoadingFirstPage, isLoadingAllClips, error } = useClips({
        channels,
        from: search.from,
        to: search.to,
        minViews: debouncedMinViews,
    });

    function setDateRange(dateRange: DateRange | undefined) {
        setSelectedClipId(null);
        navigate({
            search: {
                ...search,
                from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
                to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
            },
        });
    }

    function removeChannel(channel: string) {
        navigate({
            search: {
                ...search,
                channels: channels.filter((c) => c !== channel).join(","),
            },
        });
    }

    function handleKeyPress(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key !== "Enter") return;

        const filteredNewChannels = event.currentTarget.value
            .split(" ")
            .map((s) => s.toLowerCase())
            .filter((s) => /^[a-zA-Z0-9][\w]{2,24}$/.test(s));
        const newChannels = [...channels, ...filteredNewChannels];
        const uniqueChannels = [...new Set(newChannels)];

        event.currentTarget.value = "";

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
                channels: newChannels.toSorted().join(",") || "",
                from: search.from,
                to: search.to,
                minViews: debouncedMinViews,
                onlyFirstPage: false,
            }),
        );
        queryClient.prefetchQuery(
            clipsOptions({
                channels: newChannels.toSorted().join(",") || "",
                from: search.from,
                to: search.to,
                minViews: debouncedMinViews,
                onlyFirstPage: true,
            }),
        );
    }

    function prefetchLastWeek() {
        queryClient.prefetchQuery(
            clipsOptions({
                channels: channels.toSorted().join(",") || "",
                from: format(subDays(new Date(), 7), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
                minViews: debouncedMinViews,
                onlyFirstPage: false,
            }),
        );
        queryClient.prefetchQuery(
            clipsOptions({
                channels: channels.toSorted().join(",") || "",
                from: format(subDays(new Date(), 7), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
                minViews: debouncedMinViews,
                onlyFirstPage: true,
            }),
        );
    }

    function prefetchLastMonth() {
        queryClient.prefetchQuery(
            clipsOptions({
                channels: channels.toSorted().join(",") || "",
                from: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
                minViews: debouncedMinViews,
                onlyFirstPage: false,
            }),
        );
        queryClient.prefetchQuery(
            clipsOptions({
                channels: channels.toSorted().join(",") || "",
                from: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
                minViews: debouncedMinViews,
                onlyFirstPage: true,
            }),
        );
    }

    const dateRange = {
        from: parse(search.from, "yyyy-MM-dd", new Date()),
        to: parse(search.to, "yyyy-MM-dd", new Date()),
    };

    const currentClip = clips?.find((c) => c.id === selectedClipId) ?? clips?.at(0);
    const currentClipIndex = (currentClip && clips?.indexOf(currentClip)) ?? 0;
    const previousClip = clips?.[currentClipIndex - 1];
    const nextClip = clips?.[currentClipIndex + 1];

    const sidebarAnimate = sidebarOpen ? initialSidebarStyle : { width: "2.25rem", padding: "0" };

    return (
        <div className="flex h-full divide-x">
            <div className="flex h-full grow flex-col">
                <div className="flex grow items-center justify-center">
                    <TwitchClipEmbed
                        key={currentClip?.id || "no-clip"}
                        clip={currentClip}
                        noChannels={channels.length === 0}
                        autoplay={clipAutoplayRef.current}
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
                                onClick={() => setSelectedClipId(previousClip?.id ?? null)}
                            >
                                <ArrowLeft />
                                Prev
                            </Button>
                            <Button
                                variant="outline"
                                className="h-full grow rounded-none border-r-0"
                                disabled={!nextClip}
                                onClick={() => setSelectedClipId(nextClip?.id ?? null)}
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
                                            onKeyUp={handleKeyPress}
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
                                        onValueChange={(v) =>
                                            navigate({ search: { ...search, minViews: v } })
                                        }
                                        stepper={10}
                                        min={0}
                                    />
                                </div>
                                <DateRangePicker
                                    dateRange={dateRange}
                                    setDateRange={setDateRange}
                                    prefetchLastWeek={prefetchLastWeek}
                                    prefetchLastMonth={prefetchLastMonth}
                                />
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="clip-autoplay"
                                        defaultChecked={clipAutoplayDefault}
                                        onCheckedChange={(checked) => {
                                            clipAutoplayRef.current = checked;
                                        }}
                                    />
                                    <Label htmlFor="clip-autoplay">Clip autoplay</Label>
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
                                        clipsLength={clips?.length ?? 0}
                                        currentClipIndex={currentClipIndex}
                                        isLoading={isLoadingAllClips}
                                    />
                                )
                            )}
                            <ClipList
                                clips={clips}
                                currentClipId={currentClip?.id ?? null}
                                currentClipIndex={currentClipIndex}
                                onClipClick={setSelectedClipId}
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
                                onClick={() => setSelectedClipId(previousClip?.id ?? null)}
                            >
                                <ArrowLeft />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="grow rounded-none hover:bg-gray-950"
                                disabled={!nextClip}
                                onClick={() => setSelectedClipId(nextClip?.id ?? null)}
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
