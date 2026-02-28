"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "./utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover";

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
    id?: string;
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    placeholder?: string;
}

export function DateRangePicker({
    id,
    date,
    setDate,
    placeholder = "Pick a date",
    className,
}: DateRangePickerProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        variant={"outline"}
                        className={cn(
                            "w-full justify-between text-left font-bold bg-muted/50 border-border text-foreground hover:bg-muted transition-all h-10 rounded-xl",
                            !date && "text-foreground/40 font-medium "
                        )}
                    >
                        <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            {date?.from ? (
                                date.to ? (
                                    <span className="text-xs sm:text-sm tracking-tight">
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </span>
                                ) : (
                                    <span className="text-xs sm:text-sm tracking-tight">
                                        {format(date.from, "LLL dd, y")}
                                    </span>
                                )
                            ) : (
                                <span className="text-xs sm:text-sm tracking-tight">{placeholder}</span>
                            )}
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-border bg-card shadow-2xl rounded-2xl overflow-hidden" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={(newRange) => {
                            console.log("Selected range:", newRange);
                            setDate(newRange);
                        }}
                        numberOfMonths={1}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
