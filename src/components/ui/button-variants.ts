import { cva } from "class-variance-authority"

/**
 * Button style variants — extracted to a shared module
 * so they can be used from both Server and Client Components.
 * (cva is a pure function, no React runtime needed)
 */
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-base font-light tracking-wide whitespace-nowrap transition-all duration-300 ease-out outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[2.5rem] md:min-h-[3rem] px-6 md:px-8 py-2 md:py-3 gap-2",
        xs: "min-h-[1.75rem] px-3 text-[10px] gap-1",
        sm: "min-h-[2rem] md:min-h-[2.5rem] px-4 md:px-6 text-xs md:text-sm gap-1.5",
        lg: "min-h-[3rem] md:min-h-[3.5rem] px-8 md:px-10 py-3 md:py-4 text-base md:text-lg uppercase tracking-widest gap-3",
        icon: "size-10 md:size-12",
        "icon-xs": "size-7 md:size-8",
        "icon-sm": "size-9 md:size-10",
        "icon-lg": "size-12 md:size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
