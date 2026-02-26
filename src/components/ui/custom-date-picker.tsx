"use client"

import * as React from "react"
import { format, addMonths, setMonth, setYear } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export interface DatePickerCustomProps {
    selected?: Date | DateRange;
    onSelect?: (date: Date | undefined) => void;
    onRangeSelect?: (range: DateRange | undefined) => void;
    onClose: () => void; // Changed to required
    mode?: "single" | "range";
}

export function DatePickerCustom({ selected, onSelect, onRangeSelect, onClose, mode = "single" }: DatePickerCustomProps) {
    const [month, setMonthInternal] = React.useState<Date>(
        mode === "range"
            ? (selected as DateRange)?.from || new Date()
            : (selected as Date) || new Date()
    );
    const [tempSelected, setTempSelected] = React.useState<Date | DateRange | undefined>(selected);

    const handleYearChange = (year: string) => {
        const newDate = setYear(month, parseInt(year))
        setMonthInternal(newDate)
    }

    const handleMonthChange = (monthIdx: string) => {
        const newDate = setMonth(month, parseInt(monthIdx))
        setMonthInternal(newDate)
    }

    const handlePrevMonth = () => setMonthInternal(addMonths(month, -1))
    const handleNextMonth = () => setMonthInternal(addMonths(month, 1))

    const handleOK = () => {
        if (mode === "single" && onSelect) {
            onSelect(tempSelected as Date);
        } else if (mode === "range" && onRangeSelect) {
            onRangeSelect(tempSelected as DateRange);
        }
        onClose();
    };

    const handleCancel = () => {
        onClose?.()
    }

    const years = React.useMemo(() => {
        const currentYear = new Date().getFullYear()
        return Array.from({ length: 20 }, (_, i) => currentYear - 10 + i)
    }, [])

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    return (
        <div className="flex flex-col p-4 bg-white rounded-lg shadow-xl border w-[320px] anima-in fade-in zoom-in duration-200">
            {/* Top Header - Centered Date */}
            <div className="text-center py-2 mb-4">
                <span className="text-lg font-bold text-[#064e3b]">
                    {(() => {
                        if (mode === "single") {
                            const d = (tempSelected as Date) || new Date();
                            return format(d, "dd MMM yyyy");
                        } else {
                            const range = tempSelected as DateRange;
                            if (!range?.from) return "Pick a range";
                            if (!range.to) return format(range.from, "dd MMM yyyy");
                            return `${format(range.from, "dd MMM")} - ${format(range.to, "dd MMM yyyy")}`;
                        }
                    })()}
                </span>
            </div>

            {/* Navigation Controls */}
            <div className="flex gap-2 mb-4">
                {/* Month Selector */}
                <div className="flex items-center flex-1 border rounded-md px-1 h-10">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#064e3b]" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center text-sm font-bold text-[#064e3b]">
                        {months[month.getMonth()]}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#064e3b]" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Year Selector */}
                <div className="flex items-center w-[100px] border rounded-md px-1 h-10">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#064e3b]" onClick={() => handleYearChange((month.getFullYear() - 1).toString())}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center text-sm font-bold text-[#064e3b]">
                        {month.getFullYear()}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#064e3b]" onClick={() => handleYearChange((month.getFullYear() + 1).toString())}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex justify-center">
                <DayPicker
                    mode={mode as any}
                    selected={tempSelected as any}
                    onSelect={setTempSelected as any}
                    month={month}
                    onMonthChange={setMonthInternal}
                    showOutsideDays
                    className="p-0 m-0"
                    classNames={{
                        month: "space-y-4",
                        month_caption: "hidden", // Hide default caption
                        nav: "hidden", // Hide default nav
                        month_grid: "w-full border-collapse space-y-1",
                        weekdays: "flex justify-between",
                        weekday: "text-muted-foreground w-9 font-normal text-[0.8rem] text-center",
                        week: "flex w-full mt-2 justify-between",
                        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                        day_button: cn(
                            "h-9 w-9 p-0 font-normal rounded-md transition-colors hover:bg-green-50",
                            "aria-selected:bg-[#064e3b] aria-selected:!text-white aria-selected:font-bold"
                        ),
                        selected: "bg-[#064e3b] !text-white hover:bg-[#064e3b]/90",
                        today: "text-[#064e3b] font-bold border border-[#064e3b]/20",
                        outside: "text-muted-foreground opacity-50",
                        disabled: "text-muted-foreground opacity-50",
                    }}
                />
            </div>

            {/* Footer Buttons */}
            <div className="mt-4 pt-4 border-t flex justify-end gap-4">
                <Button
                    variant="ghost"
                    onClick={handleCancel}
                    className="text-muted-foreground hover:text-foreground text-sm font-bold tracking-wider uppercase h-8"
                >
                    CANCEL
                </Button>
                <Button
                    variant="ghost"
                    onClick={handleOK}
                    className="text-[#064e3b] hover:text-[#064e3b]/80 text-sm font-bold tracking-wider uppercase h-8"
                >
                    OK
                </Button>
            </div>
        </div>
    )
}
