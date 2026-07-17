#!/usr/bin/env node
/**
 * TikTok slideshow PNGs — atmosphere-first, brand/copy over UI dumps.
 *
 * Composition rules (hard):
 * - Full-bleed real gym/phone photos from docs/marketing/assets/bg/
 * - One idea per slide, ≤8 words, Impact-style white type
 * - NEVER draw carousel dots (TikTok adds them)
 * - NEVER purple glow / pill chrome / AI-slop accents
 * - App UI: at most ONE small phone mock (solution slide), ≤22% frame height
 * - Screenshots are secondary — atmosphere + copy dominate every frame
 *
 * Usage: node scripts/generate-tiktok-slides.mjs [id|all]
 */
import sharp from 'sharp'
import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const WIDTH = 1080
const HEIGHT = 1920
const OUT = join(process.cwd(), 'docs', 'marketing', 'slides')
const BG_DIR = join(process.cwd(), 'docs', 'marketing', 'assets', 'bg')

const MAX_WORDS = 8

/** Device mock — ≤10% of frame height, corner only, solution slide only */
const PHONE_W = 190
const PHONE_H = 380
const PHONE_LEFT = WIDTH - PHONE_W - 48
const PHONE_TOP = HEIGHT - PHONE_H - 260

/** Royalty-free Unsplash crops (1080×1920) — cached in docs/marketing/assets/bg/ */
const BACKGROUND_URLS = {
  gym1: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&h=1920&fit=crop&q=85',
  gym2: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1080&h=1920&fit=crop&q=85',
  gym3: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1080&h=1920&fit=crop&q=85',
  gym4: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080&h=1920&fit=crop&q=85',
  phone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1080&h=1920&fit=crop&q=85',
  scroll: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1080&h=1920&fit=crop&q=85',
  night: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1080&h=1920&fit=crop&q=85',
  dark: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1080&h=1920&fit=crop&crop=entropy&q=85',
  'rack-empty': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1080&h=1920&fit=crop&q=85',
  timer: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=1080&h=1920&fit=crop&q=85',
  'hands-phone': 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1080&h=1920&fit=crop&q=85',
  mirror: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1080&h=1920&fit=crop&q=85',
  locker: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=1080&h=1920&fit=crop&q=85',
  'bed-scroll': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1080&h=1920&fit=crop&crop=faces&q=85',
  'cardio-empty': 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=1080&h=1920&fit=crop&crop=top&q=85',
  bench: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&h=1920&fit=crop&q=85',
  chalk: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1080&h=1920&fit=crop&q=85',
  weights: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1080&h=1920&fit=crop&crop=top&q=85',
  squat: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080&h=1920&fit=crop&crop=faces&q=85',
  treadmill: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1080&h=1920&fit=crop&crop=bottom&q=85',
}

const bgCache = new Map()

function wordCount(text) {
  return text
    .replace(/[^\w\s']/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function validateSlides(config) {
  let deviceCount = 0
  for (const [i, slide] of config.slides.entries()) {
    const count = wordCount(slide.text)
    if (count > MAX_WORDS) {
      throw new Error(
        `${config.name} slide ${i + 1} has ${count} words (max ${MAX_WORDS}): "${slide.text.replace(/\n/g, ' ')}"`
      )
    }
    if (!BACKGROUND_URLS[slide.bg]) {
      throw new Error(`${config.name} slide ${i + 1} uses unknown bg key: ${slide.bg}`)
    }
    if (slide.device) deviceCount++
  }
  if (deviceCount > 1) {
    throw new Error(`${config.name}: max 1 device mock per pack (got ${deviceCount})`)
  }
}

async function ensureBackground(key) {
  if (bgCache.has(key)) return bgCache.get(key)

  mkdirSync(BG_DIR, { recursive: true })
  const filePath = join(BG_DIR, `${key}.jpg`)

  if (!existsSync(filePath)) {
    const url = BACKGROUND_URLS[key]
    if (!url) throw new Error(`Unknown background key: ${key}`)
    console.log(`  ↓ downloading bg/${key}.jpg`)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to download background "${key}": HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    await sharp(buf)
      .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 90 })
      .toFile(filePath)
  }

  const processed = await sharp(filePath).jpeg().toBuffer()
  bgCache.set(key, processed)
  return processed
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Small stylized phone — lock/earn mechanic as brand proof.
 * Not a paywall dump. ~11% of frame area, corner placement.
 */
function deviceMockSvg(line1 = 'LOCKED', line2 = '20 push-ups') {
  const w = PHONE_W
  const h = PHONE_H
  const r = 30
  const screenX = 9
  const screenY = 10
  const screenW = w - 18
  const screenH = h - 20
  const screenR = 24

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bezel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2A2A2E"/>
      <stop offset="100%" stop-color="#0C0C0E"/>
    </linearGradient>
    <filter id="phoneShadow">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity="0.55"/>
    </filter>
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="url(#bezel)" filter="url(#phoneShadow)"/>
  <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="${r - 2}" fill="none" stroke="#3F3F46" stroke-width="2"/>
  <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" rx="${screenR}" fill="#0A0A0B"/>
  <rect x="${w / 2 - 30}" y="18" width="60" height="8" rx="4" fill="#18181B"/>
  <text x="${w / 2}" y="100" text-anchor="middle" font-family="Arial Black,Impact,sans-serif" font-size="15" font-weight="700" fill="#71717A" letter-spacing="2">REPLOCK</text>
  <path d="M ${w / 2 - 14} 165 V 150 A 14 14 0 0 1 ${w / 2 + 14} 150 V 165" fill="none" stroke="#FAFAFA" stroke-width="3" stroke-linecap="round"/>
  <rect x="${w / 2 - 24}" y="165" width="48" height="40" rx="7" fill="none" stroke="#FAFAFA" stroke-width="2.5"/>
  <circle cx="${w / 2}" cy="182" r="3.5" fill="#FAFAFA"/>
  <rect x="${w / 2 - 1.5}" y="182" width="3" height="12" rx="1" fill="#FAFAFA"/>
  <text x="${w / 2}" y="250" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="24" font-weight="900" fill="#FAFAFA">${esc(line1)}</text>
  <text x="${w / 2}" y="282" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="600" fill="#A1A1AA">${esc(line2)}</text>
  <text x="${w / 2}" y="320" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#52525B">earn your scroll</text>
</svg>`)
}

/** Bottom-third text — photo reads first. No dots. No purple chrome. */
function textOverlaySvg(slide) {
  const { type, text, device } = slide
  const lines = text.split('\n').slice(0, 2)
  const isHook = type === 'hook'
  const isCta = type === 'cta'
  const hasDevice = Boolean(device)

  const fontSize = isHook ? 92 : isCta ? 86 : 64
  const lineHeight = isHook ? 102 : isCta ? 96 : 78

  // Keep copy clear of the corner device
  const startY = hasDevice
    ? HEIGHT * 0.68
    : isCta
      ? HEIGHT * 0.42
      : HEIGHT * 0.7
  // When device is present, shift text left of phone
  const tx = hasDevice ? 380 : 540

  const tspans = lines
    .map((line, i) => {
      const y = startY + i * lineHeight
      return `<tspan x="${tx}" y="${y}">${esc(line)}</tspan>`
    })
    .join('\n')

  const ctaSub = isCta
    ? `<text x="540" y="${startY + lineHeight + 56}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="600" fill="#D4D4D8" letter-spacing="1">earn scroll with real reps</text>
       <text x="540" y="${startY + lineHeight + 120}" text-anchor="middle" font-family="Arial Black,Impact,sans-serif" font-size="22" font-weight="700" fill="#FAFAFA" letter-spacing="8">REPLOCK</text>`
    : ''

  // Lighter vignette so gym photo stays the hero
  const topOpacity = isHook ? 0.15 : 0.22
  const bottomOpacity = isCta ? 0.72 : hasDevice ? 0.55 : 0.58

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="${topOpacity}"/>
      <stop offset="45%" stop-color="#000" stop-opacity="0.02"/>
      <stop offset="100%" stop-color="#000" stop-opacity="${bottomOpacity}"/>
    </linearGradient>
    <filter id="ts">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.9"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#shade)"/>
  <text text-anchor="middle" font-family="Impact,Arial Black,Helvetica Neue,sans-serif" font-size="${fontSize}" font-weight="900" fill="#FFFFFF" filter="url(#ts)">${tspans}</text>
  ${ctaSub}
</svg>`)
}

/**
 * 6 slides: hook → story ×2 → solution (optional small device) → proof → cta
 * Copy aligned to docs/marketing/TIKTOK-GYMBRO-LAUNCH.md scripts.
 * Atmosphere + copy first. Device only on solution when marked.
 */
const SLIDESHOWS = {
  1: {
    name: 'Leg Day Excuses',
    folder: 'slideshow-1',
    script: 2,
    slides: [
      { type: 'hook', text: 'skipped legs again.\nsee slide 4.', bg: 'gym2' },
      { type: 'story', text: 'opened TikTok\nfor motivation', bg: 'phone' },
      { type: 'story', text: '45 min later.\nzero squats.', bg: 'scroll' },
      { type: 'solution', text: 'apps stay locked\nuntil you rep', bg: 'rack-empty', device: true, deviceLine1: 'LOCKED', deviceLine2: '20 push-ups' },
      { type: 'proof', text: 'friction >\nmotivation', bg: 'mirror' },
      { type: 'cta', text: 'Search RepLock', bg: 'locker' },
    ],
  },
  2: {
    name: 'Rest Timer Scrolling',
    folder: 'slideshow-2',
    script: 1,
    slides: [
      { type: 'hook', text: '90 sec rest.\n90 min scroll.', bg: 'gym3' },
      { type: 'story', text: 'one notification\n→ full spiral', bg: 'hands-phone' },
      { type: 'story', text: 'he hit 4 sets.\nyou hit 1.', bg: 'timer' },
      { type: 'solution', text: 'earn minutes\nwith real reps', bg: 'gym4', device: true, deviceLine1: 'EARN', deviceLine2: '15 squats' },
      { type: 'proof', text: 'push-ups · squats\n· planks', bg: 'bench' },
      { type: 'cta', text: 'Search RepLock', bg: 'night' },
    ],
  },
  3: {
    name: 'No Gains Arc',
    folder: 'slideshow-3',
    script: 4,
    slides: [
      { type: 'hook', text: '6 months in.\nsame mirror pic?', bg: 'mirror' },
      { type: 'story', text: 'protein fine.\nsplit fine.', bg: 'weights' },
      { type: 'story', text: 'phone access?\nunlimited.', bg: 'scroll' },
      { type: 'solution', text: 'was a phone\nproblem', bg: 'chalk', device: true, deviceLine1: 'LOCKED', deviceLine2: 'do the reps' },
      { type: 'proof', text: 'earn time\nwith real reps', bg: 'gym1' },
      { type: 'cta', text: 'Search RepLock', bg: 'dark' },
    ],
  },
  4: {
    name: 'Gym Crush Cardio',
    folder: 'slideshow-4',
    script: 13,
    slides: [
      { type: 'hook', text: "she's on cardio.\nyou're on reels.", bg: 'cardio-empty' },
      { type: 'story', text: 'walked past\ntreadmill 3×', bg: 'treadmill' },
      { type: 'story', text: 'one curl.\nzero steps.', bg: 'phone' },
      { type: 'solution', text: 'lock distractions\nearn your scroll', bg: 'gym3', device: true, deviceLine1: 'LOCKED', deviceLine2: 'earn minutes' },
      { type: 'proof', text: 'apps locked\ntill you move', bg: 'squat' },
      { type: 'cta', text: 'Search RepLock', bg: 'locker' },
    ],
  },
  5: {
    name: 'Phone Spotter',
    folder: 'slideshow-5',
    script: 3,
    slides: [
      { type: 'hook', text: "spotter doesn't miss.\nphone does.", bg: 'gym2' },
      { type: 'story', text: 'spotter: one more\nphone: one reel', bg: 'phone' },
      { type: 'story', text: '4 sets planned.\n1 set done.', bg: 'scroll' },
      { type: 'solution', text: '15 push-ups\nor apps locked', bg: 'bench', device: true, deviceLine1: 'LOCKED', deviceLine2: '15 push-ups' },
      { type: 'proof', text: 'embarrassing.\neffective.', bg: 'chalk' },
      { type: 'cta', text: 'Search RepLock', bg: 'dark' },
    ],
  },
  6: {
    name: 'Morning Scroll',
    folder: 'slideshow-6',
    script: 6,
    slides: [
      { type: 'hook', text: '6am alarm.\nalready scrolling?', bg: 'bed-scroll' },
      { type: 'story', text: 'thumb opens feed\nbefore the bag', bg: 'phone' },
      { type: 'story', text: 'whole day\ndecided itself', bg: 'scroll' },
      { type: 'solution', text: 'earn morning\nscroll time', bg: 'night', device: true, deviceLine1: 'EARN', deviceLine2: 'morning reps' },
      { type: 'proof', text: 'lock apps\ntill you move', bg: 'gym1' },
      { type: 'cta', text: 'Search RepLock', bg: 'dark' },
    ],
  },
  7: {
    name: 'Plateau Theory',
    folder: 'slideshow-7',
    script: 7,
    slides: [
      { type: 'hook', text: 'same weight\n3 months?', bg: 'weights' },
      { type: 'story', text: 'tracked macros\nmissed sleep', bg: 'scroll' },
      { type: 'story', text: 'scrolled every\nrest timer', bg: 'bed-scroll' },
      { type: 'solution', text: 'maybe it was\nthe phone', bg: 'gym4', device: true, deviceLine1: 'LOCKED', deviceLine2: 'reps first' },
      { type: 'proof', text: 'reps before\nreels', bg: 'timer' },
      { type: 'cta', text: 'Search RepLock', bg: 'night' },
    ],
  },
  8: {
    name: 'Sunday Reset',
    folder: 'slideshow-8',
    script: 11,
    slides: [
      { type: 'hook', text: 'meal prep done.\nhabits unchanged.', bg: 'gym3' },
      { type: 'story', text: 'deleted apps.\nreinstalled apps.', bg: 'phone' },
      { type: 'story', text: 'called it a reset.\nnothing reset.', bg: 'scroll' },
      { type: 'solution', text: 'need friction\nnot wallpaper', bg: 'rack-empty', device: true, deviceLine1: 'LOCKED', deviceLine2: 'move first' },
      { type: 'proof', text: 'block apps\ntill you move', bg: 'squat' },
      { type: 'cta', text: 'Search RepLock', bg: 'locker' },
    ],
  },
  9: {
    name: 'Push-Up Tax',
    folder: 'slideshow-9',
    script: 5,
    slides: [
      { type: 'hook', text: 'scroll tax\nis real.', bg: 'gym2' },
      { type: 'story', text: 'Instagram costs\npush-ups', bg: 'phone' },
      { type: 'story', text: 'YouTube costs\nsquats', bg: 'scroll' },
      { type: 'solution', text: 'feed not worth it\nanymore', bg: 'chalk', device: true, deviceLine1: 'TAX', deviceLine2: '10 push-ups' },
      { type: 'proof', text: 'reps first.\nfeed second.', bg: 'bench' },
      { type: 'cta', text: 'Search RepLock', bg: 'dark' },
    ],
  },
  10: {
    name: 'Mirror vs Phone',
    folder: 'slideshow-10',
    script: 10,
    slides: [
      { type: 'hook', text: 'form checks: 2\nphone checks: 47', bg: 'mirror' },
      { type: 'story', text: 'rest timer =\nentertainment', bg: 'timer' },
      { type: 'story', text: 'left gym tired\nof scrolling', bg: 'scroll' },
      { type: 'solution', text: "rest is training.\nscroll isn't.", bg: 'hands-phone', device: true, deviceLine1: 'LOCKED', deviceLine2: 'earn scroll' },
      { type: 'proof', text: 'earn rest back\nwith reps', bg: 'gym1' },
      { type: 'cta', text: 'Search RepLock', bg: 'locker' },
    ],
  },
  // Text-atmosphere packs for scripts without screen-record assets
  11: {
    name: 'Product Mechanic',
    folder: 'slideshow-11',
    script: 8,
    slides: [
      { type: 'hook', text: "apps won't open\nuntil you train.", bg: 'phone' },
      { type: 'story', text: 'open Instagram.\nblocked.', bg: 'hands-phone' },
      { type: 'story', text: 'do the reps.\nearn minutes.', bg: 'chalk' },
      { type: 'solution', text: "unlock.\nthat's the product.", bg: 'gym4', device: true, deviceLine1: 'EARNED', deviceLine2: '12 min scroll' },
      { type: 'proof', text: 'push-ups · squats\n· planks', bg: 'bench' },
      { type: 'cta', text: 'Search RepLock', bg: 'dark' },
    ],
  },
  12: {
    name: 'Discipline Take',
    folder: 'slideshow-12',
    script: 9,
    slides: [
      { type: 'hook', text: "discipline isn't\nyour problem.", bg: 'gym1' },
      { type: 'story', text: 'unlimited phone\naccess is.', bg: 'scroll' },
      { type: 'story', text: "you're not lazy.\nalways unlocked.", bg: 'phone' },
      { type: 'solution', text: 'lock the apps.\nearn the minutes.', bg: 'rack-empty', device: true, deviceLine1: 'LOCKED', deviceLine2: 'earn minutes' },
      { type: 'proof', text: 'friction sticks.\nmotivation fades.', bg: 'chalk' },
      { type: 'cta', text: 'Search RepLock', bg: 'night' },
    ],
  },
  13: {
    name: '7-Day Challenge',
    folder: 'slideshow-13',
    script: 14,
    slides: [
      { type: 'hook', text: '7 days.\nearn every scroll.', bg: 'gym2' },
      { type: 'story', text: 'no deleting apps.\njust earning them.', bg: 'phone' },
      { type: 'story', text: 'day 1 rule:\nlocked → reps', bg: 'scroll' },
      { type: 'solution', text: 'push-ups unlock\nminutes', bg: 'bench', device: true, deviceLine1: 'DAY 1', deviceLine2: 'earn scroll' },
      { type: 'proof', text: 'comment "in"\nif you\'re playing', bg: 'weights' },
      { type: 'cta', text: 'Search RepLock', bg: 'dark' },
    ],
  },
}

async function renderSlide(slide) {
  const bg = await ensureBackground(slide.bg)
  const composites = [{ input: bg, top: 0, left: 0 }]

  composites.push({ input: textOverlaySvg(slide), top: 0, left: 0 })

  if (slide.device) {
    const phone = deviceMockSvg(slide.deviceLine1 ?? 'LOCKED', slide.deviceLine2 ?? '20 push-ups')
    composites.push({ input: phone, top: PHONE_TOP, left: PHONE_LEFT })
  }

  return sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 3, background: { r: 10, g: 10, b: 11 } },
  })
    .composite(composites)
    .png({ compressionLevel: 8 })
    .toBuffer()
}

async function generateSlideshow(id, config) {
  validateSlides(config)
  const outDir = join(OUT, config.folder)
  mkdirSync(outDir, { recursive: true })
  console.log(`\n${config.name} → ${config.folder}/ (${config.slides.length} slides)`)

  for (let i = 0; i < config.slides.length; i++) {
    const slide = config.slides[i]
    const filename = `slide-${String(i + 1).padStart(2, '0')}.png`
    const png = await renderSlide(slide)
    await sharp(png).toFile(join(outDir, filename))
    const tag = slide.device ? 'solution+device' : slide.type
    console.log(`  ✓ ${filename} [${tag}]`)
  }
}

const arg = process.argv[2] ?? 'all'
const ids = arg === 'all' ? Object.keys(SLIDESHOWS) : [arg]

if (!ids.every((id) => SLIDESHOWS[id])) {
  console.error('Usage: node scripts/generate-tiktok-slides.mjs [1-13|all]')
  process.exit(1)
}

for (const id of ids) {
  await generateSlideshow(id, SLIDESHOWS[id])
}

console.log(`\nDone — ${ids.length} slideshow(s), 6 atmosphere-first slides each.`)
console.log('Rules: no dots, no purple chrome, device ≤~10% height, photo + copy dominate.')
console.log('Post guide: docs/marketing/POST-NOW.md')
