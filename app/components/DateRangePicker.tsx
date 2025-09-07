import { useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { PopoverContent } from "~/components/ui/popover";
import { clipsOptions } from "~/lib/clips/query";
import { datefnsLocaleByAppLocale, useLocaleContext, useTranslations } from "~/lib/locale/locales";
import { cn, getYearsArray } from "~/lib/utils/utils";
import { addDays, endOfYear, format, subDays, subMonths, subYears } from "date-fns";
import { CalendarIcon, Clock9 } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { Popover, PopoverTrigger } from "./ui/popover";

interface Props {
    channels: string[];
    currentClipDate: string | undefined;
    dateRange: DateRange | undefined;
    setDateRange: (dateRange: DateRange | undefined) => void;
}

export default function DateRangePicker({
    channels,
    currentClipDate,
    dateRange,
    setDateRange,
}: Props) {
    const t = useTranslations();
    const { locale } = useLocaleContext();
    const queryClient = useQueryClient();

    function prefetchLastWeek() {
        queryClient.prefetchQuery(
            clipsOptions({
                channels: channels.toSorted().join(",") || "",
                from: format(subDays(new Date(), 7), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
            }),
        );
    }

    function prefetchLastMonth() {
        queryClient.prefetchQuery(
            clipsOptions({
                channels: channels.toSorted().join(",") || "",
                from: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
            }),
        );
    }

    function prefetchLastYear() {
        queryClient.prefetchQuery(
            clipsOptions({
                channels: channels.toSorted().join(",") || "",
                from: format(subMonths(new Date(), 12), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
            }),
        );
    }

    function prefetchAll() {
        queryClient.prefetchQuery(
            clipsOptions({
                channels: channels.toSorted().join(",") || "",
                from: format(new Date(2016, 0, 1), "yyyy-MM-dd"),
                to: format(new Date(), "yyyy-MM-dd"),
            }),
        );
    }

    function prefetchCurrentClipDate() {
        if (!currentClipDate) return;

        queryClient.prefetchQuery(
            clipsOptions({
                channels: channels.toSorted().join(",") || "",
                from: format(new Date(currentClipDate), "yyyy-MM-dd"),
                to: format(addDays(new Date(currentClipDate), 1), "yyyy-MM-dd"),
            }),
        );
    }

    function prefetchYear(year: number) {
        return () => {
            queryClient.prefetchQuery(
                clipsOptions({
                    channels: channels.toSorted().join(",") || "",
                    from: format(new Date(year, 0, 1), "yyyy-MM-dd"),
                    to: format(endOfYear(new Date(year, 0, 1)), "yyyy-MM-dd"),
                }),
            );
        };
    }

    return (
        <div className="flex gap-1">
            <div className="grid grow gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground",
                            )}
                        >
                            <CalendarIcon />
                            {dateRange?.from
                                ? dateRange.to
                                    ? `${format(dateRange.from, "dd.MM.y")} - ${format(dateRange.to, "dd.MM.y")}`
                                    : format(dateRange.from, "dd.MM.y")
                                : null}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto p-0"
                        align="start"
                    >
                        <Calendar
                            initialFocus
                            locale={datefnsLocaleByAppLocale[locale]}
                            mode="range"
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                            defaultMonth={dateRange?.to}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                    >
                        <Clock9 />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() =>
                                setDateRange({
                                    from: subDays(new Date(), 7),
                                    to: new Date(),
                                })
                            }
                            onMouseEnter={prefetchLastWeek}
                        >
                            {t("time.lastWeek")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                setDateRange({
                                    from: subMonths(new Date(), 1),
                                    to: new Date(),
                                })
                            }
                            onMouseEnter={prefetchLastMonth}
                        >
                            {t("time.lastMonth")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                setDateRange({
                                    from: subYears(new Date(), 1),
                                    to: new Date(),
                                })
                            }
                            onMouseEnter={prefetchLastYear}
                        >
                            {t("time.lastYear")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                setDateRange({
                                    from: new Date(2011, 0, 1),
                                    to: new Date(),
                                })
                            }
                            onMouseEnter={prefetchAll}
                        >
                            {t("time.all")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={!currentClipDate}
                            onClick={() => {
                                if (!currentClipDate) return;

                                setDateRange({
                                    from: new Date(currentClipDate),
                                    to: addDays(new Date(currentClipDate), 1),
                                });
                            }}
                            onMouseEnter={prefetchCurrentClipDate}
                        >
                            {t("time.currentClipDate")}
                        </DropdownMenuItem>
                        {getYearsArray().map((year) => (
                            <DropdownMenuItem
                                key={year}
                                onClick={() =>
                                    setDateRange({
                                        from: new Date(year, 0, 1),
                                        to: endOfYear(new Date(year, 0, 1)),
                                    })
                                }
                                onMouseEnter={prefetchYear(year)}
                            >
                                {year}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
