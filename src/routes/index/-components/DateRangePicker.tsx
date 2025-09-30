import { getRouteApi, Link } from "@tanstack/react-router";
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

const Route = getRouteApi("/");

interface Props {
    currentClipDate: string | undefined;
    dateRange: DateRange;
    onDateRangeChange: () => void;
}

export default function DateRangePicker({ currentClipDate, dateRange, onDateRangeChange }: Props) {
    const navigate = Route.useNavigate();
    const t = useTranslations();
    const { locale } = useLocaleContext();

    function getNewDateRange({ from, to }: DateRange) {
        return {
            from: from ? format(from, "yyyy-MM-dd") : undefined,
            to: to ? format(to, "yyyy-MM-dd") : from ? format(from, "yyyy-MM-dd") : undefined,
        };
    }

    function selectDateRange(dateRange: DateRange | undefined) {
        if (!dateRange) return;

        onDateRangeChange();
        navigate({
            search: (search) => ({
                ...search,
                ...getNewDateRange(dateRange),
            }),
        });
    }

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
                        onSelect={selectDateRange}
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
                        <DropdownMenuItem asChild>
                            <Link
                                to="/"
                                search={(search) => ({
                                    ...search,
                                    ...getNewDateRange({
                                        from: subDays(new Date(), 7),
                                        to: new Date(),
                                    }),
                                })}
                                onClick={() => onDateRangeChange()}
                                className="cursor-pointer"
                            >
                                {t("time.lastWeek")}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                to="/"
                                search={(search) => ({
                                    ...search,
                                    ...getNewDateRange({
                                        from: subMonths(new Date(), 1),
                                        to: new Date(),
                                    }),
                                })}
                                onClick={() => onDateRangeChange()}
                                className="cursor-pointer"
                            >
                                {t("time.lastMonth")}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                to="/"
                                search={(search) => ({
                                    ...search,
                                    ...getNewDateRange({
                                        from: subYears(new Date(), 1),
                                        to: new Date(),
                                    }),
                                })}
                                onClick={() => onDateRangeChange()}
                                className="cursor-pointer"
                            >
                                {t("time.lastYear")}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                to="/"
                                search={(search) => ({
                                    ...search,
                                    ...getNewDateRange({
                                        from: new Date(2016, 0, 1),
                                        to: new Date(),
                                    }),
                                })}
                                onClick={() => onDateRangeChange()}
                                className="cursor-pointer"
                            >
                                {t("time.all")}
                            </Link>
                        </DropdownMenuItem>
                        {currentClipDate && (
                            <DropdownMenuItem asChild>
                                <Link
                                    to="/"
                                    search={(search) => ({
                                        ...search,
                                        ...getNewDateRange({
                                            from: new Date(currentClipDate),
                                            to: addDays(new Date(currentClipDate), 1),
                                        }),
                                    })}
                                    onClick={() => onDateRangeChange()}
                                    className="cursor-pointer"
                                >
                                    {t("time.currentClipDate")}
                                </Link>
                            </DropdownMenuItem>
                        )}
                        {getYearsArray().map((year) => (
                            <DropdownMenuItem
                                key={year}
                                asChild
                            >
                                <Link
                                    to="/"
                                    search={(search) => ({
                                        ...search,
                                        ...getNewDateRange({
                                            from: new Date(year, 0, 1),
                                            to: endOfYear(new Date(year, 0, 1)),
                                        }),
                                    })}
                                    onClick={() => onDateRangeChange()}
                                    className="cursor-pointer"
                                >
                                    {year}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
