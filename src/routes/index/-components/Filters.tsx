import { reatomComponent } from "@reatom/react";
import { getRouteApi } from "@tanstack/react-router";
import { format, parse } from "date-fns";
import { X } from "lucide-react";
import { motion } from "motion/react";
import type { KeyboardEvent, ReactNode } from "react";
import type { DateRange } from "react-day-picker";

import { NumberInput } from "~/components/NumberInput";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useTranslations } from "~/lib/locale/locales";
import { chronologicalOrder, titleFilterField } from "~/lib/settings/atoms";
import { stopAutonextTimer } from "~/lib/settings/autonext";
import DateRangePicker from "~/routes/index/-components/DateRangePicker";

const Route = getRouteApi("/");

interface Props {
    currentClipCreatedAt: string | undefined;
    children: ReactNode;
    resetSelected: () => void;
}

function Filters({ currentClipCreatedAt, children, resetSelected }: Props) {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    const t = useTranslations();

    const channels = search.channels.split(",").filter(Boolean);

    const dateRange = {
        from: parse(search.from, "yyyy-MM-dd", new Date()),
        to: parse(search.to, "yyyy-MM-dd", new Date()),
    };

    function handleNewChannelEnterPress(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key !== "Enter") return;

        const filteredNewChannels = event.currentTarget.value
            .split(" ")
            .map((s) => s.toLowerCase())
            .filter((s) => /^[a-zA-Z0-9][\w]{2,24}$/.test(s));
        const newChannels = [...channels, ...filteredNewChannels];
        const uniqueChannels = [...new Set(newChannels)];

        event.currentTarget.value = "";

        stopAutonextTimer();
        resetSelected();
        navigate({
            search: {
                ...search,
                channels: uniqueChannels.join(","),
            },
        });
    }

    function handleMinViewsChange(value: number | undefined) {
        stopAutonextTimer();
        resetSelected();
        chronologicalOrder.set(false);
        navigate({ search: { ...search, minViews: value } });
    }

    function openChannelClips(channel: string) {
        const currentUrl = new URL(window.location.href);

        currentUrl.searchParams.set("channels", channel);

        window.open(currentUrl.href, "_blank");
    }

    function removeChannel(channel: string) {
        stopAutonextTimer();
        resetSelected();
        navigate({
            search: {
                ...search,
                channels: channels.filter((c) => c !== channel).join(","),
            },
        });
    }

    function setDateRange(dateRange: DateRange | undefined) {
        stopAutonextTimer();
        resetSelected();
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

    return (
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
                            onClick={(event) => {
                                if (event.shiftKey) openChannelClips(channel);
                                else removeChannel(channel);
                            }}
                        >
                            {channel}
                            <X />
                        </Button>
                    ))}
                </div>
            </div>
            <DateRangePicker
                currentClipDate={currentClipCreatedAt}
                dateRange={dateRange}
                setDateRange={setDateRange}
            />
            <div className="flex items-center gap-1">
                <div className="flex grow flex-col gap-1">
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
                    <div className="flex">
                        <Input
                            placeholder={t("filterByTitle")}
                            id="title-filter"
                            value={titleFilterField()}
                            onChange={(e) => titleFilterField.set(e.target.value)}
                            className="rounded-r-none"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                titleFilterField.set("");
                                stopAutonextTimer();
                            }}
                            className="rounded-l-none border-l-0"
                        >
                            <X />
                        </Button>
                    </div>
                </div>
                {children}
            </div>
        </motion.div>
    );
}

export default reatomComponent(Filters);
