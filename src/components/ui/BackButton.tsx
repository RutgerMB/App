import { ArrowLeft, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type BackButtonVariant = 'back' | 'close'

interface BackButtonProps {
  onClick: () => void
  variant?: BackButtonVariant
  'aria-label'?: string
  className?: string
}

export function BackButton({
  onClick,
  variant = 'back',
  'aria-label': ariaLabel,
  className,
}: BackButtonProps) {
  const Icon = variant === 'close' ? X : ArrowLeft

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      whileTap={{ scale: 0.94 }}
      className={cn(
        'shrink-0 flex items-center justify-center',
        'h-12 w-12 rounded-2xl',
        'bg-white/[0.06] border border-white/10 backdrop-blur-sm',
        'text-white/65 hover:text-white hover:bg-white/[0.1] hover:border-white/20',
        'active:bg-white/[0.08] transition-colors duration-200',
        'shadow-[0_2px_16px_rgba(0,0,0,0.2)]',
        className
      )}
    >
      <Icon size={22} strokeWidth={2.25} />
    </motion.button>
  )
}
