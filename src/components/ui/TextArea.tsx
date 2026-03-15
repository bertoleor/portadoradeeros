import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-[140px] w-full rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50/80 px-5 py-4 text-base shadow-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-300 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
