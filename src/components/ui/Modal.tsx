import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  /** 'center' keeps the sheet above the bottom nav; 'bottom' anchors near the nav */
  position?: 'center' | 'bottom'
  /**
   * When true (default), header stays put and only the body scrolls.
   * Needed for long lists on Android WebView.
   */
  scrollBody?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  position = 'center',
  scrollBody = true,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed left-4 right-4 z-[60] mx-auto max-w-md',
              'bg-surface-1 border border-border rounded-3xl',
              'shadow-2xl shadow-black/40',
              'pointer-events-auto flex flex-col',
              // Cap height so the inner body can scroll on Android
              'max-h-[min(85dvh,720px)]',
              position === 'center'
                ? 'top-1/2 -translate-y-1/2'
                : 'bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]',
              className
            )}
          >
            <div className="flex items-center justify-between shrink-0 px-6 pt-6 pb-3">
              {title && <h2 className="text-lg font-semibold">{title}</h2>}
              <button
                type="button"
                onClick={onClose}
                className="ml-auto p-2 -mr-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div
              className={cn(
                'px-6 pb-6',
                scrollBody && 'flex-1 min-h-0 overflow-y-scroll overscroll-contain'
              )}
              style={
                scrollBody
                  ? { WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }
                  : undefined
              }
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
