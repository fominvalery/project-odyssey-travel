import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "btn-glow relative inline-flex items-center justify-center gap-2",
          "bg-blue-600 hover:bg-blue-700 text-white font-semibold",
          "transition-all duration-200 cursor-pointer select-none",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

GlowButton.displayName = "GlowButton"

export { GlowButton }
