import type { AppBrand } from '@/types'
import { cn } from '@/lib/utils'

const BRAND_COLORS: Record<AppBrand, string> = {
  instagram: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
  tiktok: 'bg-black',
  x: 'bg-black',
  facebook: 'bg-[#1877F2]',
  snapchat: 'bg-[#FFFC00] text-black',
  whatsapp: 'bg-[#25D366]',
  discord: 'bg-[#5865F2]',
  reddit: 'bg-[#FF4500]',
  youtube: 'bg-[#FF0000]',
  netflix: 'bg-[#E50914]',
  spotify: 'bg-[#1DB954]',
  twitch: 'bg-[#9146FF]',
  pinterest: 'bg-[#E60023]',
  telegram: 'bg-[#26A5E4]',
  linkedin: 'bg-[#0A66C2]',
  roblox: 'bg-[#E2231A]',
  minecraft: 'bg-[#62B47A]',
  candy_crush: 'bg-[#FF69B4]',
  gmail: 'bg-[#EA4335]',
  chrome: 'bg-[#4285F4]',
  amazon: 'bg-[#FF9900]',
  shein: 'bg-zinc-900',
}

const BRAND_LETTERS: Partial<Record<AppBrand, string>> = {
  instagram: 'IG', tiktok: 'TT', x: 'X', facebook: 'f', snapchat: '👻',
  whatsapp: 'WA', discord: 'D', reddit: 'R', youtube: '▶', netflix: 'N',
  spotify: '♫', twitch: 'Tw', pinterest: 'P', telegram: 'T', linkedin: 'in',
  roblox: 'R', minecraft: 'M', candy_crush: 'C', gmail: 'M', chrome: 'C',
  amazon: 'a', shein: 'S',
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function AppBrandIcon({
  brand,
  name,
  color,
  size = 'md',
  className,
}: {
  brand?: AppBrand
  name?: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  const iconSizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }

  if (brand === 'instagram') {
    return (
      <div className={cn('rounded-2xl flex items-center justify-center shrink-0', sizes[size], BRAND_COLORS.instagram, className)}>
        <InstagramIcon className={cn(iconSizes[size], 'text-white')} />
      </div>
    )
  }
  if (brand === 'tiktok') {
    return (
      <div className={cn('rounded-2xl flex items-center justify-center shrink-0', sizes[size], BRAND_COLORS.tiktok, className)}>
        <TikTokIcon className={cn(iconSizes[size], 'text-white')} />
      </div>
    )
  }
  if (brand === 'youtube') {
    return (
      <div className={cn('rounded-2xl flex items-center justify-center shrink-0', sizes[size], BRAND_COLORS.youtube, className)}>
        <YouTubeIcon className={cn(iconSizes[size], 'text-white')} />
      </div>
    )
  }
  if (brand === 'x') {
    return (
      <div className={cn('rounded-2xl flex items-center justify-center shrink-0', sizes[size], BRAND_COLORS.x, className)}>
        <XIcon className={cn(iconSizes[size], 'text-white')} />
      </div>
    )
  }

  const bg = brand ? BRAND_COLORS[brand] : ''
  const letter = brand ? BRAND_LETTERS[brand] : name?.charAt(0).toUpperCase() ?? '?'
  const isSnapchat = brand === 'snapchat'

  return (
    <div
      className={cn(
        'rounded-2xl flex items-center justify-center shrink-0 font-bold',
        sizes[size],
        bg || '',
        isSnapchat ? 'text-black' : 'text-white',
        className
      )}
      style={!brand && color ? { backgroundColor: color } : undefined}
    >
      {letter}
    </div>
  )
}

export function AppIcon({
  brand,
  icon = '',
  name,
  color,
  size = 'md',
  grayscale,
}: {
  brand?: AppBrand
  icon?: string
  name?: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  grayscale?: boolean
}) {
  // Prefer an explicit emoji/icon the user chose (common for iOS nicknamed apps).
  if (icon && !brand) {
    const sizes = { sm: 'w-8 h-8 text-base', md: 'w-10 h-10 text-xl', lg: 'w-12 h-12 text-2xl' }
    return (
      <div
        className={cn(
          'rounded-2xl flex items-center justify-center shrink-0',
          sizes[size],
          grayscale && 'grayscale opacity-50'
        )}
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>
    )
  }

  if (brand || !icon) {
    return (
      <AppBrandIcon
        brand={brand}
        name={name}
        color={color}
        size={size}
        className={grayscale ? 'grayscale opacity-50' : ''}
      />
    )
  }

  const sizes = { sm: 'w-8 h-8 text-base', md: 'w-10 h-10 text-xl', lg: 'w-12 h-12 text-2xl' }
  return (
    <div
      className={cn('rounded-2xl flex items-center justify-center shrink-0', sizes[size], grayscale && 'grayscale opacity-50')}
      style={{ backgroundColor: `${color}20` }}
    >
      {icon}
    </div>
  )
}
