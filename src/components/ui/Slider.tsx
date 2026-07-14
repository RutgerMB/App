import { useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface SliderProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  className?: string
  'aria-label'?: string
}

/** Touch-friendly slider — works on iOS where vertical range inputs fail. */
export function Slider({ min, max, step = 1, value, onChange, className, 'aria-label': ariaLabel }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return value
      const rect = track.getBoundingClientRect()
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const raw = min + pct * (max - min)
      const stepped = Math.round(raw / step) * step
      return Math.max(min, Math.min(max, stepped))
    },
    [min, max, step, value]
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    onChange(valueFromClientX(e.clientX))
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    onChange(valueFromClientX(e.clientX))
  }

  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('w-full touch-none select-none', className)}>
      <div
        ref={trackRef}
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(max, value + step))
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(min, value - step))
        }}
        className="relative h-12 flex items-center cursor-pointer"
      >
        <div className="absolute inset-x-0 h-2 rounded-full bg-white/10" />
        <div
          className="absolute left-0 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 pointer-events-none"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute w-7 h-7 -ml-3.5 rounded-full bg-white shadow-lg shadow-indigo-500/30 border-2 border-indigo-400 pointer-events-none"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  )
}
