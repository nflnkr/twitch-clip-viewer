import { reatomComponent } from "@reatom/react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { parse } from "date-fns";
import { ListIndentIncrease, X } from "lucide-react";
import { motion } from "motion/react";
import type { KeyboardEvent, ReactNode } from "react";

import { NumberInput } from "~/components/NumberInput";
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { useTranslations } from "~/lib/locale/locales";
import { chronologicalOrder, selectedGameId, titleFilterField } from "~/lib/store/atoms";
import { stopAutonextTimer } from "~/lib/store/autonext";
import { cn } from "~/lib/utils";
import DateRangePicker from "./DateRangePicker";

const Route = getRouteApi("/");

interface Props {
    currentClipCreatedAt: string | undefined;
    children: ReactNode;
    resetSelectedClip: () => void;
}

function Filters({ currentClipCreatedAt, children, resetSelectedClip }: Props) {
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
        const uniqueChannels = Array.from(new Set(newChannels));

        event.currentTarget.value = "";

        stopAutonextTimer();
        resetSelectedClip();
        selectedGameId.set(null);
        navigate({
            search: (search) => ({
                ...search,
                channels: uniqueChannels.join(","),
            }),
        });
    }

    function handleMinViewsChange(value: number | undefined) {
        stopAutonextTimer();
        resetSelectedClip();
        selectedGameId.set(null);
        chronologicalOrder.set(false);
        navigate({ search: (search) => ({ ...search, minViews: value }) });
    }

    function onDateRangeChange() {
        stopAutonextTimer();
        resetSelectedClip();
        selectedGameId.set(null);
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
                        <div
                            key={index}
                            className={cn(
                                buttonVariants({ variant: "outline", size: "xs" }),
                                "pr-1 select-none",
                            )}
                        >
                            <p className="text-xs">{channel}</p>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Link
                                        to="/"
                                        search={(search) => ({
                                            ...search,
                                            channels: channel,
                                        })}
                                        onClick={() => {
                                            stopAutonextTimer();
                                            resetSelectedClip();
                                            selectedGameId.set(null);
                                        }}
                                    >
                                        <ListIndentIncrease />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t("keepOnlyThisChannel")}</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Link
                                        to="/"
                                        search={(search) => ({
                                            ...search,
                                            channels: channels
                                                .filter((c) => c !== channel)
                                                .join(","),
                                        })}
                                        onClick={() => {
                                            stopAutonextTimer();
                                            resetSelectedClip();
                                            selectedGameId.set(null);
                                        }}
                                    >
                                        <X />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t("removeChannel")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    ))}
                </div>
            </div>
            <DateRangePicker
                currentClipDate={currentClipCreatedAt}
                dateRange={dateRange}
                onDateRangeChange={onDateRangeChange}
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
                            placeholder={t("search")}
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
