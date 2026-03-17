import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full text-base transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: [
          "min-h-[140px] rounded-2xl border border-gray-200",
          "bg-gray-50/50 hover:bg-gray-50/80",
          "px-5 py-4 shadow-sm ring-offset-background",
          "placeholder:text-gray-400",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500",
          "resize-none",
        ],
        underline: [
          "rounded-none border-0 border-b border-[rgba(15,15,20,0.14)]",
          "bg-transparent px-0 py-3 shadow-none",
          "text-[15px] text-[rgba(15,15,20,0.88)]",
          "placeholder:text-[rgba(15,15,20,0.28)]",
          "focus-visible:outline-none focus-visible:border-[rgba(15,15,20,0.45)]",
          "ring-0 ring-offset-0 resize-none",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface TextareaProps
  extends React.ComponentPropsWithoutRef<"textarea">,
    VariantProps<typeof textareaVariants> {}

function Textarea({ className, variant, ...props }: Readonly<TextareaProps>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Textarea }
