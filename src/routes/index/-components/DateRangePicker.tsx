import { addDays, endOfYear, format, subDays, subMonths, subYears } from "date-fns";
import { CalendarIcon, CalendarRange } from "lucide-react";
import { type DateRange } from "react-day-picker";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { datefnsLocaleByAppLocale, useLocaleContext, useTranslations } from "~/lib/locale/locales";
import { cn, getYearsArray } from "~/lib/utils";

interface Props {
    currentClipDate: string | undefined;
    dateRange: DateRange | undefined;
    setDateRange: (dateRange: DateRange | undefined) => void;
}

export default function DateRangePicker({ currentClipDate, dateRange, setDateRange }: Props) {
    const t = useTranslations();
    const { locale } = useLocaleContext();

    return (
        <div className="flex">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "grow justify-start rounded-r-none text-left font-normal",
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
                        autoFocus
                        locale={datefnsLocaleByAppLocale[locale]}
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        defaultMonth={dateRange?.to}
                    />
                </PopoverContent>
            </Popover>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-l-none border-l-0"
                    >
                        <CalendarRange />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-56"
                >
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() =>
                                setDateRange({
                                    from: subDays(new Date(), 7),
                                    to: new Date(),
                                })
                            }
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
