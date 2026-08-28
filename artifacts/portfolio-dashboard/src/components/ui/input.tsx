import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "control flex w-full px-[var(--ui-control-pad-x)] py-1 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
          type === "number" && "input-price",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
