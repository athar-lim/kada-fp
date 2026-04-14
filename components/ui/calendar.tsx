"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;
type CalendarChevronProps = {
  orientation?: "left" | "right" | "down";
  className?: string;
} & React.SVGProps<SVGSVGElement>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row sm:gap-6",
        month: "space-y-4",
        caption: "relative flex items-center justify-center pt-1",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button:
          "h-7 w-7 rounded-md border border-input bg-background p-0 opacity-70 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground",
        row: "mt-2 flex w-full",
        cell: cn(
          "relative h-9 w-9 p-0 text-center text-sm",
          "[&:has([aria-selected])]:bg-accent",
          "first:[&:has([aria-selected])]:rounded-l-md",
          "last:[&:has([aria-selected])]:rounded-r-md",
          "[&:has(.day-range-start)]:rounded-l-md",
          "[&:has(.day-range-end)]:rounded-r-md",
          "focus-within:relative focus-within:z-20"
        ),
        day: "h-9 w-9 rounded-md p-0 font-normal aria-selected:opacity-100",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        dropdowns: "flex items-center justify-center gap-2",
        dropdown:
          "h-8 rounded-md border border-input bg-background px-2 text-sm outline-none",
        vhidden: "hidden",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...iconProps }: CalendarChevronProps) => {
          if (orientation === "left") {
            return <ChevronLeft className={cn("h-4 w-4", className)} {...iconProps} />;
          }

          if (orientation === "right") {
            return <ChevronRight className={cn("h-4 w-4", className)} {...iconProps} />;
          }

          return <ChevronDown className={cn("h-4 w-4", className)} {...iconProps} />;
        },
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };