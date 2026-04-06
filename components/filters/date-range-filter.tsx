"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateRangeFilterProps = {
  value?: DateRange;
  onApply: (range: DateRange | undefined) => void;
  triggerLabel?: string;
};

export function DateRangeFilter({
  value,
  onApply,
  triggerLabel = "Select period",
}: DateRangeFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(value);

  React.useEffect(() => {
    setTempRange(value);
  }, [value]);

  const presets = [
    {
      label: "Today",
      getValue: () => {
        const today = new Date();
        return {
          from: startOfDay(today),
          to: endOfDay(today),
        };
      },
    },
    {
      label: "Yesterday",
      getValue: () => {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return {
          from: startOfDay(date),
          to: endOfDay(date),
        };
      },
    },
    {
      label: "This Week",
      getValue: () => {
        const now = new Date();
        return {
          from: startOfDay(startOfWeek(now, { weekStartsOn: 0 })),
          to: endOfDay(endOfWeek(now, { weekStartsOn: 0 })),
        };
      },
    },
    {
      label: "Last Week",
      getValue: () => {
        const prev = subWeeks(new Date(), 1);
        return {
          from: startOfDay(startOfWeek(prev, { weekStartsOn: 0 })),
          to: endOfDay(endOfWeek(prev, { weekStartsOn: 0 })),
        };
      },
    },
    {
      label: "This Month",
      getValue: () => {
        const now = new Date();
        return {
          from: startOfDay(startOfMonth(now)),
          to: endOfDay(endOfMonth(now)),
        };
      },
    },
    {
      label: "Last Month",
      getValue: () => {
        const prev = subMonths(new Date(), 1);
        return {
          from: startOfDay(startOfMonth(prev)),
          to: endOfDay(endOfMonth(prev)),
        };
      },
    },
  ];

  const appliedLabel =
    value?.from && value?.to
      ? `${format(value.from, "MMM d, yyyy")} - ${format(value.to, "MMM d, yyyy")}`
      : triggerLabel;

  const fromLabel = tempRange?.from
    ? format(tempRange.from, "MMM d, yyyy")
    : "Start date";

  const toLabel = tempRange?.to
    ? format(tempRange.to, "MMM d, yyyy")
    : "End date";

  const handleApply = () => {
    onApply(tempRange);
    setOpen(false);
  };

  const handleReset = () => {
    setTempRange(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal md:w-[260px]"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="truncate">{appliedLabel}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[920px] max-w-[95vw] overflow-hidden rounded-2xl p-0"
      >
        <div className="grid md:grid-cols-[240px_1fr]">
          <div className="border-r bg-muted/20">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setTempRange(preset.getValue())}
                className="w-full border-b px-6 py-5 text-left text-base transition hover:bg-muted/40"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col">
            <div className="grid grid-cols-2 gap-4 border-b bg-muted/20 p-4">
              <div className="rounded-xl border bg-background px-4 py-4 text-center text-lg text-muted-foreground shadow-sm">
                {fromLabel}
              </div>
              <div className="rounded-xl border bg-background px-4 py-4 text-center text-lg text-muted-foreground shadow-sm">
                {toLabel}
              </div>
            </div>

            <div className="p-4">
              <Calendar
                mode="range"
                selected={tempRange}
                onSelect={setTempRange}
                numberOfMonths={2}
                captionLayout="dropdown"
                defaultMonth={tempRange?.from ?? new Date()}
                className="w-full rounded-xl"
              />
            </div>

            <div className="flex gap-4 border-t p-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full"
                onClick={handleReset}
              >
                Reset Filter
              </Button>

              <Button
                type="button"
                className="flex-1 rounded-full"
                onClick={handleApply}
              >
                Apply Date
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}