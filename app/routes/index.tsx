import { useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/start";
import { zodValidator } from "@tanstack/zod-adapter";
import { format, parse, subDays } from "date-fns";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { KeyboardEvent, useRef, useState } from "react";
import { DateRange } from "react-day-picker";
import { z } from "zod";
import ClipInfo from "~/components/ClipInfo";
import ClipsList from "~/components/ClipsList";
import DateRangePicker from "~/components/DateRangePicker";
import { NumberInput } from "~/components/NumberInput";
import Spinner from "~/components/Spinner";
import TwitchClipEmbed from "~/components/TwitchClipEmbed";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { getClips } from "~/lib/get-clips";
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

function Index() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    const debouncedMinViews = useDebouncedValue(search.minViews, 500);
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const clipAutoplayRef = useRef(clipAutoplayDefault);
    const fetchClips = useServerFn(getClips);

    const channels = search.channels.split(",").filter(Boolean);

    const queryParams = {
        channels: channels.toSorted().join(",") || "",
        from: search.from,
        to: search.to,
        minViews: debouncedMinViews,
    };

    const {
        data: clips,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["clips", queryParams],
        queryFn: () => fetchClips({ data: queryParams }),
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
            search: { ...search, channels: channels.filter((c) => c !== channel).join(",") },
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

        navigate({ search: { ...search, channels: uniqueChannels.join(",") } });
    }

    const dateRange = {
        from: parse(search.from, "yyyy-MM-dd", new Date()),
        to: parse(search.to, "yyyy-MM-dd", new Date()),
    };

    const currentClip = clips?.find((c) => c.id === selectedClipId) ?? clips?.at(0);
    const currentClipIndex = (currentClip && clips?.indexOf(currentClip)) ?? 0;
    const previousClip = clips?.[currentClipIndex - 1];
    const nextClip = clips?.[currentClipIndex + 1];

    return (
        <div className="flex h-full divide-x">
            <div className="flex h-full grow flex-col">
                <div className="flex flex-grow items-center justify-center">
                    <TwitchClipEmbed
                        key={currentClip?.id || "no-clip"}
                        clip={currentClip}
                        noChannels={channels.length === 0}
                        autoplay={clipAutoplayRef.current}
                    />
                </div>
                <div className="flex">
                    <Button
                        variant="outline"
                        className="flex-grow rounded-none"
                        disabled={!previousClip}
                        onClick={() => setSelectedClipId(previousClip?.id ?? null)}
                    >
                        <ArrowLeft />
                        Prev
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-grow rounded-none"
                        disabled={!nextClip}
                        onClick={() => setSelectedClipId(nextClip?.id ?? null)}
                    >
                        Next
                        <ArrowRight />
                    </Button>
                </div>
            </div>
            <div className="flex h-full w-96 flex-col gap-4 overflow-y-auto py-4">
                <div className="flex flex-col gap-2 px-4">
                    <Input
                        placeholder="New channel"
                        enterKeyHint="done"
                        onKeyUp={handleKeyPress}
                    />
                    <div className="flex flex-wrap gap-1">
                        {channels.map((channel, index) => (
                            <Button
                                key={index}
                                size="xs"
                                variant="outline"
                                onClick={() => removeChannel(channel)}
                            >
                                {channel}
                                <X />
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-2 px-4">
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="min-views">Min views</Label>
                        <NumberInput
                            id="min-views"
                            name="minViews"
                            value={search.minViews}
                            onValueChange={(v) => navigate({ search: { ...search, minViews: v } })}
                            stepper={10}
                            min={0}
                        />
                    </div>
                    <DateRangePicker
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                    />
                    <div className="flex items-center gap-2">
                        <Switch
                            id="clip-autoplay"
                            onCheckedChange={(checked) => {
                                clipAutoplayRef.current = checked;
                            }}
                        />
                        <Label htmlFor="clip-autoplay">Clip autoplay</Label>
                    </div>
                </div>
                {error ? (
                    <p className="px-4 text-red-500">Error: {error.message}</p>
                ) : isLoading ? (
                    <Spinner />
                ) : (
                    currentClip && (
                        <ClipInfo
                            currentClip={currentClip}
                            clipsLength={clips?.length ?? 0}
                            currentClipIndex={currentClipIndex}
                        />
                    )
                )}
                {clips && (
                    <ClipsList
                        clips={clips}
                        currentClipId={currentClip?.id ?? null}
                        currentClipIndex={currentClipIndex}
                        onClipClick={setSelectedClipId}
                    />
                )}
            </div>
        </div>
    );
}
