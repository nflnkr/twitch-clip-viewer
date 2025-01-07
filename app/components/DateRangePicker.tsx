import { endOfYear, format, subDays, subMonths, subYears } from "date-fns";
import { CalendarIcon, Clock9 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { PopoverContent } from "~/components/ui/popover";
import { cn, getYearsArray } from "~/lib/utils";
import { Popover, PopoverTrigger } from "./ui/popover";

interface Props {
    dateRange: DateRange | undefined;
    setDateRange: (dateRange: DateRange | undefined) => void;
}

export default function DateRangePicker({ dateRange, setDateRange }: Props) {
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
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto p-0"
                        align="start"
                    >
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
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
                        >
                            Last week
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                setDateRange({
                                    from: subMonths(new Date(), 1),
                                    to: new Date(),
                                })
                            }
                        >
                            Last month
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                setDateRange({
                                    from: subYears(new Date(), 1),
                                    to: new Date(),
                                })
                            }
                        >
                            Last year
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Year</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
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
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuItem
                            onClick={() =>
                                setDateRange({
                                    from: new Date(2011, 0, 1),
                                    to: new Date(),
                                })
                            }
                        >
                            All
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
