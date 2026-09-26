// No "use client": the filter rail, a Server Component, styles links with
// toggleVariants. The Radix primitive carries its own client boundary.

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Toggle as TogglePrimitive } from "radix-ui"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 text-sm font-normal whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-muted data-[state=on]:bg-muted dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "rounded-none bg-transparent",
        outline:
          "rounded-none border border-input bg-transparent hover:bg-muted data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:hover:bg-foreground/85 data-[state=on]:hover:text-background aria-[current]:border-foreground aria-[current]:bg-foreground aria-[current]:text-background aria-[current]:hover:bg-foreground/85 aria-[current]:hover:text-background disabled:line-through disabled:opacity-60",
        swatch:
          "relative rounded-full border border-border p-0 ring-offset-2 ring-offset-background hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:ring-2 data-[state=on]:ring-foreground aria-[current]:ring-2 aria-[current]:ring-foreground disabled:opacity-60 disabled:after:absolute disabled:after:inset-x-1 disabled:after:top-1/2 disabled:after:h-px disabled:after:-rotate-45 disabled:after:bg-foreground",
      },
      size: {
        default:
          "h-11 min-w-11 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        sm: "h-9 min-w-9 px-3 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 min-w-12 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        swatch: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
