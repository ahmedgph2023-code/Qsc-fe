"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  navLayout = "around",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("group/calendar w-fit bg-transparent p-0", className)}
      captionLayout={captionLayout}
      navLayout={navLayout}
      formatters={{
        formatWeekdayName: (date) =>
          date.toLocaleDateString("en-GB", { weekday: "narrow" }),
        formatMonthDropdown: (date) =>
          date.toLocaleString("en-GB", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 sm:flex-row", defaultClassNames.months),
        month: cn("relative flex w-fit flex-col gap-3", defaultClassNames.month),
        month_caption: cn(
          "relative flex h-10 w-full items-center justify-center px-9",
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          "text-sm font-semibold tracking-tight text-[#1e3268]",
          captionLayout === "label" ? "" : "flex items-center gap-1",
          defaultClassNames.caption_label
        ),
        nav: cn(
          "pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "pointer-events-auto absolute start-0 top-0 z-10 inline-flex size-8 items-center justify-center rounded-full border border-white/80 bg-white/80 text-[#53658c] shadow-[inset_1px_1px_2px_#fff,0_4px_10px_rgba(61,88,145,0.1)] transition hover:bg-white hover:text-[#1659ea] disabled:opacity-30",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "pointer-events-auto absolute end-0 top-0 z-10 inline-flex size-8 items-center justify-center rounded-full border border-white/80 bg-white/80 text-[#53658c] shadow-[inset_1px_1px_2px_#fff,0_4px_10px_rgba(61,88,145,0.1)] transition hover:bg-white hover:text-[#1659ea] disabled:opacity-30",
          defaultClassNames.button_next
        ),
        dropdowns: cn(
          "flex h-10 items-center justify-center gap-2 text-sm font-semibold",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-full border border-[rgba(119,141,197,0.2)] bg-[linear-gradient(145deg,#fff,#eef3fd)] px-3 py-1 text-[#2b3d67] shadow-[inset_1px_1px_2px_#fff] hover:border-[rgba(77,121,233,0.45)]",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("absolute inset-0 cursor-pointer opacity-0", defaultClassNames.dropdown),
        month_grid: cn("block w-fit", defaultClassNames.month_grid),
        weekdays: cn("grid grid-cols-7", defaultClassNames.weekdays),
        weekday: cn(
          "flex size-9 items-center justify-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7b8cb3]",
          defaultClassNames.weekday
        ),
        weeks: cn("block", defaultClassNames.weeks),
        week: cn("grid grid-cols-7", defaultClassNames.week),
        week_number_header: cn("w-9", defaultClassNames.week_number_header),
        week_number: cn("text-muted-foreground text-[0.8rem]", defaultClassNames.week_number),
        day: cn("relative p-0 text-center", defaultClassNames.day),
        range_start: cn("rounded-s-full bg-[#edf2ff]", defaultClassNames.range_start),
        range_middle: cn("bg-[#edf2ff]", defaultClassNames.range_middle),
        range_end: cn("rounded-e-full bg-[#edf2ff]", defaultClassNames.range_end),
        today: cn(defaultClassNames.today),
        outside: cn("text-[#b7c3de]", defaultClassNames.outside),
        disabled: cn("opacity-30", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-4 rtl:rotate-180", className)} {...props} />
          }
          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-4 rtl:rotate-180", className)} {...props} />
          }
          return <ChevronDownIcon className={cn("size-3.5", className)} {...props} />
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const selectedSingle =
    modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
  const isSelected = selectedSingle || modifiers.range_start || modifiers.range_end
  const extra = modifiers as typeof modifiers & { hasData?: boolean; inIpms?: boolean }

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString("en-GB")}
      data-selected-single={selectedSingle || undefined}
      data-range-start={modifiers.range_start || undefined}
      data-range-end={modifiers.range_end || undefined}
      data-range-middle={modifiers.range_middle || undefined}
      data-has-data={extra.hasData || undefined}
      data-in-ipms={extra.inIpms || undefined}
      className={cn(
        defaultClassNames.day_button,
        "inline-flex size-9 items-center justify-center rounded-full text-[13px] font-medium tabular-nums text-[#1e3268] transition-colors",
        "hover:bg-[#edf2ff] hover:text-[#1659ea]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d79e9]/40 focus-visible:ring-offset-1",
        selectedSingle && "bg-[#1659ea] font-bold text-white shadow-[0_8px_16px_rgba(22,89,234,0.28)] hover:bg-[#1659ea] hover:text-white",
        modifiers.range_start && "bg-[#1659ea] font-bold text-white hover:bg-[#1659ea] hover:text-white",
        modifiers.range_end && "bg-[#1659ea] font-bold text-white hover:bg-[#1659ea] hover:text-white",
        modifiers.range_middle && "rounded-none bg-[#edf2ff] text-[#1659ea]",
        !isSelected && extra.inIpms && "bg-[#dce8ff] font-semibold text-[#175cd3] ring-1 ring-inset ring-[#175cd3]/35 hover:bg-[#cce0ff] hover:text-[#175cd3]",
        !isSelected && !extra.inIpms && extra.hasData && "bg-[#eef4ff] font-semibold text-[#175cd3] hover:bg-[#dce8ff] hover:text-[#175cd3]",
        modifiers.today && !isSelected && !extra.hasData && "bg-[#e8eefc] font-semibold text-[#1659ea] ring-1 ring-inset ring-[#4d79e9]/35",
        modifiers.outside && "text-[#b7c3de] hover:text-[#7b8cb3]",
        modifiers.disabled && "pointer-events-none opacity-30",
        className
      )}
    />
  )
}

export { Calendar, CalendarDayButton }
