import type { AppBrand } from '@/types'

export interface DeviceAppDefinition {
  id: string
  name: string
  brand?: AppBrand
  color: string
  /** Android package name for installed-app detection */
  packageName?: string
  /** Opaque Family Controls token id (iOS) */
  iosTokenId?: string
  category: 'social' | 'entertainment' | 'games' | 'productivity' | 'shopping' | 'other'
}

export const DEVICE_APPS: DeviceAppDefinition[] = [
  { id: 'instagram', name: 'Instagram', brand: 'instagram', color: '#E1306C', packageName: 'com.instagram.android', category: 'social' },
  { id: 'tiktok', name: 'TikTok', brand: 'tiktok', color: '#000000', packageName: 'com.zhiliaoapp.musically', category: 'social' },
  { id: 'x', name: 'Twitter / X', brand: 'x', color: '#000000', packageName: 'com.twitter.android', category: 'social' },
  { id: 'facebook', name: 'Facebook', brand: 'facebook', color: '#1877F2', packageName: 'com.facebook.katana', category: 'social' },
  { id: 'snapchat', name: 'Snapchat', brand: 'snapchat', color: '#FFFC00', packageName: 'com.snapchat.android', category: 'social' },
  { id: 'whatsapp', name: 'WhatsApp', brand: 'whatsapp', color: '#25D366', packageName: 'com.whatsapp', category: 'social' },
  { id: 'discord', name: 'Discord', brand: 'discord', color: '#5865F2', packageName: 'com.discord', category: 'social' },
  { id: 'reddit', name: 'Reddit', brand: 'reddit', color: '#FF4500', packageName: 'com.reddit.frontpage', category: 'social' },
  { id: 'youtube', name: 'YouTube', brand: 'youtube', color: '#FF0000', packageName: 'com.google.android.youtube', category: 'entertainment' },
  { id: 'netflix', name: 'Netflix', brand: 'netflix', color: '#E50914', packageName: 'com.netflix.mediaclient', category: 'entertainment' },
  { id: 'spotify', name: 'Spotify', brand: 'spotify', color: '#1DB954', packageName: 'com.spotify.music', category: 'entertainment' },
  { id: 'twitch', name: 'Twitch', brand: 'twitch', color: '#9146FF', packageName: 'tv.twitch.android.app', category: 'entertainment' },
  { id: 'pinterest', name: 'Pinterest', brand: 'pinterest', color: '#E60023', packageName: 'com.pinterest', category: 'social' },
  { id: 'telegram', name: 'Telegram', brand: 'telegram', color: '#26A5E4', packageName: 'org.telegram.messenger', category: 'social' },
  { id: 'linkedin', name: 'LinkedIn', brand: 'linkedin', color: '#0A66C2', packageName: 'com.linkedin.android', category: 'social' },
  { id: 'roblox', name: 'Roblox', brand: 'roblox', color: '#E2231A', packageName: 'com.roblox.client', category: 'games' },
  { id: 'minecraft', name: 'Minecraft', brand: 'minecraft', color: '#62B47A', packageName: 'com.mojang.minecraftpe', category: 'games' },
  { id: 'candy_crush', name: 'Candy Crush', brand: 'candy_crush', color: '#FF69B4', packageName: 'com.king.candycrushsaga', category: 'games' },
  { id: 'gmail', name: 'Gmail', brand: 'gmail', color: '#EA4335', packageName: 'com.google.android.gm', category: 'productivity' },
  { id: 'chrome', name: 'Chrome', brand: 'chrome', color: '#4285F4', packageName: 'com.android.chrome', category: 'productivity' },
  { id: 'amazon', name: 'Amazon', brand: 'amazon', color: '#FF9900', packageName: 'com.amazon.mShop.android.shopping', category: 'shopping' },
  { id: 'shein', name: 'SHEIN', brand: 'shein', color: '#000000', packageName: 'com.zzkko', category: 'shopping' },
]

export const APP_CATEGORIES = ['social', 'entertainment', 'games', 'productivity', 'shopping', 'other'] as const

const PACKAGE_BRAND_MAP = new Map(
  DEVICE_APPS.filter((a) => a.packageName).map((a) => [a.packageName!, a])
)

/** Merge installed app info with known catalog metadata (brand, color, category). */
export function enrichDeviceApp(app: DeviceAppDefinition): DeviceAppDefinition {
  const known =
    PACKAGE_BRAND_MAP.get(app.packageName ?? '') ??
    DEVICE_APPS.find((d) => d.id === app.id)
  if (!known) {
    return { ...app, category: app.category ?? 'other' }
  }
  return {
    ...known,
    ...app,
    id: app.packageName ?? app.id,
    name: app.name || known.name,
    packageName: app.packageName ?? known.packageName,
    brand: app.brand ?? known.brand,
    color: app.color || known.color,
    category: known.category ?? app.category,
  }
}

export function groupAppsByCategory(apps: DeviceAppDefinition[]): { category: string; apps: DeviceAppDefinition[] }[] {
  const map = new Map<string, DeviceAppDefinition[]>()
  for (const app of apps) {
    const cat = app.category ?? 'other'
    const list = map.get(cat) ?? []
    list.push(app)
    map.set(cat, list)
  }
  const order = [...APP_CATEGORIES]
  return order
    .filter((c) => map.has(c))
    .map((category) => ({
      category,
      apps: (map.get(category) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    }))
}
