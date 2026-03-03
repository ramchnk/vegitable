"use client"

import * as React from "react"
import { format, startOfToday, endOfToday, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from "date-fns"
import { DateRange } from "react-day-picker"
import { useLanguage } from "@/context/language-context"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { RotateCcw } from "lucide-react"

export interface DateRangePickerProps {
    value?: DateRange;
    onChange: (range: DateRange | undefined) => void;
    onApply?: () => void;
}

export function DateRangePicker({ value, onChange, onApply }: DateRangePickerProps) {
    const { t } = useLanguage();
    const [tempDate, setTempDate] = React.useState<DateRange | undefined>(value);
    const [month, setMonth] = React.useState<Date>(value?.from || new Date());

    // Sync tempDate with value when value changes externally
    React.useEffect(() => {
        setTempDate(value);
        if (value?.from) {
            setMonth(value.from);
        }
    }, [value]);

    // Update visible month when a preset is selected or tempDate.from changes
    React.useEffect(() => {
        if (tempDate?.from) {
            setMonth(tempDate.from);
        }
    }, [tempDate?.from]);

    const presets = [
        { label: 'Today', getValue: () => ({ from: startOfToday(), to: endOfToday() }) },
        { label: 'This Week', getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfToday() }) },
        { label: 'Last Week', getValue: () => ({ from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), to: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }) }) },
        { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfToday() }) },
        { label: 'Last Month', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
        { label: 'This Year', getValue: () => ({ from: startOfYear(new Date()), to: endOfToday() }) },
        { label: 'Last Year', getValue: () => ({ from: startOfYear(subYears(new Date(), 1)), to: endOfYear(subYears(new Date(), 1)) }) },
    ];

    const handleApply = () => {
        onChange(tempDate);
        onApply?.();
    };

    return (
        <div className="flex bg-white rounded-lg shadow-xl border overflow-hidden">
            {/* Sidebar Presets */}
            <div className="flex flex-col border-r bg-muted/5 min-w-[160px] p-3 gap-1">
                {presets.map((preset) => (
                    <Button
                        key={preset.label}
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "justify-start font-bold text-[#166534] hover:bg-[#166534]/10 h-9 px-3 rounded-md transition-colors",
                            // Add active styling if needed, but here simple click sets it
                        )}
                        onClick={() => {
                            const range = preset.getValue();
                            setTempDate(range);
                        }}
                    >
                        {preset.label}
                    </Button>
                ))}
                <div className="mt-auto pt-2 border-t">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start font-bold text-red-600 hover:bg-red-50 h-9 px-3 rounded-md transition-colors"
                        onClick={() => {
                            setTempDate(undefined);
                        }}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t('date.clear')}
                    </Button>
                </div>
            </div>

            {/* Calendar & Header */}
            <div className="flex flex-col relative">
                <div className="p-4 border-b flex items-center justify-between bg-muted/10">
                    <span className="text-sm font-bold text-[#064e3b]">Select Date Range</span>
                    <Button
                        size="sm"
                        className="h-9 px-6 bg-[#166534] hover:bg-[#15803d] text-white font-bold rounded-md shadow-sm"
                        disabled={!tempDate?.from || !tempDate?.to}
                        onClick={handleApply}
                    >
                        Apply
                    </Button>
                </div>
                <div className="p-2">
                    <Calendar
                        initialFocus
                        mode="range"
                        month={month}
                        onMonthChange={setMonth}
                        selected={tempDate}
                        onSelect={setTempDate}
                        numberOfMonths={2}
                        disabled={{ after: new Date() }}
                        className="rounded-md"
                        classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-8 sm:space-y-0 p-2",
                            button_previous: "h-10 w-10 bg-green-50 border border-[#166534]/30 text-[#166534] opacity-100 hover:bg-[#166534] hover:text-white hover:opacity-100 transition-all absolute left-4 top-4 shadow-sm flex items-center justify-center rounded-md z-20",
                            button_next: "h-10 w-10 bg-green-50 border border-[#166534]/30 text-[#166534] opacity-100 hover:bg-[#166534] hover:text-white hover:opacity-100 transition-all absolute right-4 top-4 shadow-sm flex items-center justify-center rounded-md z-20",
                            day_button: cn(
                                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-green-50 transition-colors"
                            ),
                            selected: "bg-[#166534] text-white hover:bg-[#166534] hover:text-white focus:bg-[#166534] focus:text-white h-9 w-9 p-0 font-bold",
                            range_middle: "aria-selected:bg-[#166534]/10 aria-selected:text-[#166534] font-medium",
                            range_start: "rounded-l-md",
                            range_end: "rounded-r-md",
                            today: "text-[#166534] font-black underline decoration-2 underline-offset-4"
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
