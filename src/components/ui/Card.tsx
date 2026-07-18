import { type HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, glow, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl bg-surface-2 border border-border',
        hover && 'hover:border-border-hover hover:bg-surface-3 transition-all duration-200 cursor-pointer',
        glow && 'shadow-lg shadow-emerald-500/5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'

export function MotionCard({
  className,
  hover,
  glow,
  children,
  ...props
}: CardProps & React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl bg-surface-2 border border-border',
        hover && 'hover:border-border-hover hover:bg-surface-3 transition-all duration-200 cursor-pointer',
        glow && 'shadow-lg shadow-emerald-500/5',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
