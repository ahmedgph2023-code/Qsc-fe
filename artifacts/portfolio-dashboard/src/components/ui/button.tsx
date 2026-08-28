import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

/**
 * Button system — Stocks header actions (/stocks Add / Bulk Upload / Classify).
 * Primary = filled blue. Outline/secondary = light bordered. Spacing via size.
 */
const buttonVariants = cva(
  [
    "relative inline-flex w-fit max-w-full items-center justify-center gap-1.5 whitespace-nowrap",
    "rounded-[14px] border border-transparent",
    "text-[12px] font-bold tracking-[0.01em]",
    "transition-[background,color,border-color,box-shadow,filter] duration-200",
    "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
    "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
    "[&_svg]:pointer-events-none [&_svg]:m-0 [&_svg]:size-4 [&_svg]:shrink-0",
    "data-[loading=true]:pointer-events-none",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-[#8db0ff] bg-[linear-gradient(145deg,#3c75f3,#1454df)] text-white",
          "shadow-[0_8px_16px_rgba(26,87,225,0.25),inset_1px_1px_2px_rgba(255,255,255,0.4)]",
          "hover:bg-[linear-gradient(145deg,#4a80f7,#1658e6)] hover:text-white",
          "dark:border-[color-mix(in_srgb,var(--shell-blue)_45%,transparent)]",
        ].join(" "),
        destructive: [
          "border-[color-mix(in_srgb,var(--color-negative)_35%,#fff)] bg-[var(--color-negative)] text-[var(--color-on-primary)]",
          "shadow-[0_8px_16px_color-mix(in_srgb,var(--color-negative)_28%,transparent),inset_1px_1px_2px_rgba(255,255,255,0.35)]",
          "hover:bg-[color-mix(in_srgb,var(--color-negative)_82%,#000)] hover:text-[var(--color-on-primary)]",
        ].join(" "),
        outline: [
          "border-[#dfe6f6] bg-[linear-gradient(145deg,#fff,#eef3fd)] text-[#0e1837]",
          "shadow-[0_9px_22px_rgba(71,96,153,0.13),inset_1px_1px_2px_rgba(255,255,255,0.95),inset_-1px_-1px_3px_rgba(170,190,230,0.22)]",
          "hover:border-[#c9d4ea] hover:bg-[linear-gradient(145deg,#fff,#e7eefc)] hover:text-[#0e1837]",
          "dark:border-(--shell-border) dark:bg-(image:--shell-surface) dark:text-(--shell-ink)",
        ].join(" "),
        secondary: [
          "border-[#dfe6f6] bg-[linear-gradient(145deg,#fff,#eef3fd)] text-[#0e1837]",
          "shadow-[0_9px_22px_rgba(71,96,153,0.13),inset_1px_1px_2px_rgba(255,255,255,0.95),inset_-1px_-1px_3px_rgba(170,190,230,0.22)]",
          "hover:border-[#c9d4ea] hover:bg-[linear-gradient(145deg,#fff,#e7eefc)] hover:text-[#0e1837]",
          "dark:border-(--shell-border) dark:bg-(image:--shell-surface) dark:text-(--shell-ink)",
        ].join(" "),
        ghost: [
          "bg-transparent text-[var(--color-text-secondary)] shadow-none",
          "hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text-primary)]",
        ].join(" "),
        link: "bg-transparent text-primary underline-offset-4 shadow-none hover:underline",
        soft: [
          "bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)] shadow-none",
          "hover:bg-[color-mix(in_srgb,var(--color-accent-soft)_70%,var(--color-accent-ink))]",
        ].join(" "),
        success: [
          "border-[color-mix(in_srgb,var(--color-positive)_35%,#fff)] bg-[var(--color-positive)] text-[var(--color-on-primary)]",
          "shadow-[0_8px_16px_color-mix(in_srgb,var(--color-positive)_28%,transparent),inset_1px_1px_2px_rgba(255,255,255,0.35)]",
          "hover:bg-[color-mix(in_srgb,var(--color-positive)_82%,#000)] hover:text-[var(--color-on-primary)]",
        ].join(" "),
        buy: [
          "border-[color-mix(in_srgb,var(--color-positive)_35%,#fff)] bg-[var(--color-positive)] text-[var(--color-on-primary)]",
          "shadow-[0_8px_16px_color-mix(in_srgb,var(--color-positive)_28%,transparent),inset_1px_1px_2px_rgba(255,255,255,0.35)]",
          "hover:bg-[color-mix(in_srgb,var(--color-positive)_82%,#000)] hover:text-[var(--color-on-primary)]",
        ].join(" "),
        sell: [
          "border-[color-mix(in_srgb,var(--color-negative)_35%,#fff)] bg-[var(--color-negative)] text-[var(--color-on-primary)]",
          "shadow-[0_8px_16px_color-mix(in_srgb,var(--color-negative)_28%,transparent),inset_1px_1px_2px_rgba(255,255,255,0.35)]",
          "hover:bg-[color-mix(in_srgb,var(--color-negative)_82%,#000)] hover:text-[var(--color-on-primary)]",
        ].join(" "),
      },
      size: {
        icon: "ui-icon-btn shrink-0 rounded-full",
        block: "h-10 min-h-10 w-full rounded-[14px] px-2.5",
        default: "h-10 min-h-10 w-fit rounded-[14px] px-2.5",
        sm: "h-[34px] min-h-[34px] w-fit rounded-[12px] px-2 text-[12px]",
        lg: "h-12 min-h-12 w-fit rounded-[14px] px-3.5 text-[13px]",
      },
    },
    compoundVariants: [
      /* ghost + icon: flat toolbar actions (tables / row menus) */
      {
        variant: "ghost",
        size: "icon",
        class:
          "!border-transparent !bg-transparent !shadow-none hover:!bg-[var(--color-surface-soft)] hover:!shadow-none hover:!translate-y-0 size-9 min-h-9 min-w-9",
      },
      /* outline + icon: keep elevated Notification chrome */
      {
        variant: "outline",
        size: "icon",
        class: "ui-icon-btn",
      },
      {
        variant: "soft",
        size: "icon",
        class: "ui-icon-btn border-transparent",
      },
      {
        variant: "link",
        size: "icon",
        class:
          "!border-transparent !bg-transparent !shadow-none hover:!shadow-none size-9",
      },
      /* primary / success / danger / buy / sell icon: solid color, not elevated surface */
      {
        variant: "default",
        size: "icon",
        class:
          "border-transparent bg-primary text-primary-foreground shadow-[var(--shadow-2)] hover:bg-[var(--color-primary-hover)] hover:shadow-[var(--shadow-3)]",
      },
      {
        variant: "destructive",
        size: "icon",
        class: "border-transparent",
      },
      {
        variant: "success",
        size: "icon",
        class: "border-transparent",
      },
      {
        variant: "buy",
        size: "icon",
        class: "border-transparent",
      },
      {
        variant: "sell",
        size: "icon",
        class: "border-transparent",
      },
      {
        variant: "secondary",
        size: "icon",
        class:
          "border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] shadow-[var(--shadow-1)]",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        data-loading={loading || undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Spinner className="absolute size-4" />
            <span className="opacity-0">{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
