#!/usr/bin/env node
/**
 * TikTok slideshow PNGs — visual-first, 6 slides, ≤8 words each.
 * Backgrounds cached locally in docs/marketing/assets/bg/ (download once from Unsplash).
 *
 * Usage: node scripts/generate-tiktok-slides.mjs [id|all]
 */
import sharp from 'sharp'
import { mkdirSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const WIDTH = 1080
const HEIGHT = 1920
const OUT = join(process.cwd(), 'docs', 'marketing', 'slides')
const BG_DIR = join(process.cwd(), 'docs', 'marketing', 'assets', 'bg')
const APP_STORE_DIR = join(process.cwd(), 'docs', 'app-store')

const MAX_WORDS = 8

/** Royalty-free Unsplash crops (1080×1920) — downloaded once, then loaded from disk */
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
let appScreenshotCache = null
let appProofScreenshotCache = null

function wordCount(text) {
  return text
    .replace(/[^\w\s']/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function validateSlides(config) {
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
      .jpeg({ quality: 88 })
      .toFile(filePath)
  }

  if (!existsSync(filePath)) {
    throw new Error(`Background missing after download: ${filePath}`)
  }

  const processed = await sharp(filePath).jpeg().toBuffer()
  bgCache.set(key, processed)
  return processed
}

function findAppScreenshot(prefer) {
  if (!existsSync(APP_STORE_DIR)) return null
  const files = readdirSync(APP_STORE_DIR).filter((f) => f.endsWith('.png'))
  if (files.length === 0) return null
  if (prefer && files.includes(prefer)) return join(APP_STORE_DIR, prefer)
  const main = files.find((f) => f === 'subscription-review-screenshot.png')
  if (main) return join(APP_STORE_DIR, main)
  return join(APP_STORE_DIR, files[0])
}

async function loadAppScreenshot(kind) {
  if (kind === 'proof') {
    if (appProofScreenshotCache) return appProofScreenshotCache
    const path = findAppScreenshot('subscription-review-screenshot-monthly.png')
    if (!path) return null
    appProofScreenshotCache = await sharp(path)
      .resize(360, 780, { fit: 'cover', position: 'top' })
      .png()
      .toBuffer()
    return appProofScreenshotCache
  }

  if (appScreenshotCache) return appScreenshotCache
  const path = findAppScreenshot('subscription-review-screenshot.png')
  if (!path) return null
  appScreenshotCache = await sharp(path)
    .resize(360, 780, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer()
  return appScreenshotCache
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Bottom-third text placement — photo reads first, caption second */
function textOverlaySvg(slide, index, total) {
  const { type, text } = slide
  const lines = text.split('\n').slice(0, 2)
  const isHook = type === 'hook'
  const isCta = type === 'cta'
  const isSolution = type === 'solution'
  const isProof = type === 'proof'
  const hasPhone = isSolution || isProof

  const fontSize = isHook ? 88 : isCta ? 80 : isSolution || isProof ? 68 : 60
  const lineHeight = isHook ? 98 : isCta ? 90 : 76
  const startY = hasPhone ? HEIGHT * 0.78 : HEIGHT * 0.72

  const tspans = lines
    .map((line, i) => {
      const y = startY + i * lineHeight
      return `<tspan x="540" y="${y}">${esc(line)}</tspan>`
    })
    .join('\n')

  const ctaBlock = isCta
    ? `<rect x="190" y="${HEIGHT - 340}" width="700" height="110" rx="28" fill="none" stroke="#8B5CF6" stroke-width="5"/>
       <text x="540" y="${HEIGHT - 200}" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" fill="#A1A1AA">earn scroll with push-ups</text>
       <text x="540" y="${HEIGHT - 120}" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="700" fill="#8B5CF6" letter-spacing="6">REPLOCK</text>`
    : ''

  const storyInset = type === 'story'
    ? `<rect x="780" y="280" width="200" height="400" rx="28" fill="#111" stroke="#52525B" stroke-width="3" opacity="0.92"/>
       <rect x="795" y="310" width="170" height="340" rx="18" fill="#0A0A0B"/>
       <text x="880" y="420" text-anchor="middle" font-size="36">📱</text>
       <text x="880" y="470" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#A1A1AA">TikTok</text>
       <text x="880" y="510" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#71717A">Reels</text>`
    : ''

  const dots = Array.from({ length: total }, (_, i) => {
    const cx = 540 - ((total - 1) * 16) / 2 + i * 16
    return `<circle cx="${cx}" cy="1820" r="${i === index ? 7 : 4}" fill="${i === index ? '#8B5CF6' : 'rgba(255,255,255,0.25)'}"/>`
  }).join('\n')

  const overlayStrength = isHook ? 0.5 : hasPhone ? 0.75 : 0.62

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="${isHook ? 0.2 : 0.3}"/>
      <stop offset="50%" stop-color="#000" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000" stop-opacity="${overlayStrength}"/>
    </linearGradient>
    <filter id="ts"><feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#000" flood-opacity="0.85"/></filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#shade)"/>
  ${storyInset}
  ${ctaBlock}
  <text text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="${fontSize}" font-weight="900" fill="#FFFFFF" filter="url(#ts)">${tspans}</text>
  ${dots}
</svg>`)
}

function phoneFrameBorderSvg() {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect x="340" y="140" width="400" height="820" rx="48" fill="none" stroke="#5E6AD2" stroke-width="4"/>
  <rect x="420" y="168" width="240" height="28" rx="14" fill="#18181B" opacity="0.95"/>
</svg>`)
}

/** 6 slides: hook → story ×2 → solution → proof → cta; unique bg keys per pack */
const SLIDESHOWS = {
  1: {
    name: 'Leg Day Excuses',
    folder: 'slideshow-1',
    slides: [
      { type: 'hook', text: 'skipped legs again.\nsee slide 4 💀', bg: 'gym2' },
      { type: 'story', text: 'opened TikTok\nfor motivation', bg: 'phone' },
      { type: 'story', text: '45 min later.\nzero squats.', bg: 'scroll' },
      { type: 'solution', text: 'apps stay locked\nuntil you rep', bg: 'rack-empty' },
      { type: 'proof', text: '20 push-ups =\nscroll time', bg: 'mirror' },
      { type: 'cta', text: 'Search RepLock', bg: 'locker' },
    ],
  },
  2: {
    name: 'Rest Timer Scrolling',
    folder: 'slideshow-2',
    slides: [
      { type: 'hook', text: '90 sec rest.\n90 min scroll.', bg: 'gym3' },
      { type: 'story', text: 'one notification\n→ full spiral', bg: 'hands-phone' },
      { type: 'story', text: 'he hit 4 sets.\nyou hit 1.', bg: 'timer' },
      { type: 'solution', text: 'earn minutes\nwith real reps', bg: 'gym4' },
      { type: 'proof', text: 'push-ups · squats\n· planks', bg: 'bench' },
      { type: 'cta', text: 'try RepLock free', bg: 'night' },
    ],
  },
  3: {
    name: 'No Gains Arc',
    folder: 'slideshow-3',
    slides: [
      { type: 'hook', text: '6 months in.\nsame mirror pic?', bg: 'mirror' },
      { type: 'story', text: 'perfect split\n3hr phone days', bg: 'scroll' },
      { type: 'story', text: 'not lazy.\nunlocked 24/7.', bg: 'phone' },
      { type: 'solution', text: 'scroll tax =\npush-ups', bg: 'chalk' },
      { type: 'proof', text: 'earn time\nwith real reps', bg: 'weights' },
      { type: 'cta', text: 'Search RepLock', bg: 'dark' },
    ],
  },
  4: {
    name: 'Gym Crush Cardio',
    folder: 'slideshow-4',
    slides: [
      { type: 'hook', text: "she's on cardio.\nyou're on reels.", bg: 'cardio-empty' },
      { type: 'story', text: 'walked past treadmill\n3 times', bg: 'treadmill' },
      { type: 'story', text: 'one curl.\nzero steps.', bg: 'phone' },
      { type: 'solution', text: 'lock distractions\nearn your scroll', bg: 'gym3' },
      { type: 'proof', text: 'apps locked\ntill you move', bg: 'squat' },
      { type: 'cta', text: 'get RepLock', bg: 'locker' },
    ],
  },
  5: {
    name: 'Phone Spotter',
    folder: 'slideshow-5',
    slides: [
      { type: 'hook', text: 'spotter vs phone.\nguess who won', bg: 'gym2' },
      { type: 'story', text: 'spotter: one more\nphone: one reel', bg: 'phone' },
      { type: 'story', text: '4 sets planned.\n1 set done.', bg: 'scroll' },
      { type: 'solution', text: '15 push-ups\nor TikTok locked', bg: 'bench' },
      { type: 'proof', text: 'I chose\nviolence.', bg: 'chalk' },
      { type: 'cta', text: 'Search RepLock', bg: 'dark' },
    ],
  },
  6: {
    name: 'Morning Scroll',
    folder: 'slideshow-6',
    slides: [
      { type: 'hook', text: '6am alarm.\nalready scrolling?', bg: 'bed-scroll' },
      { type: 'story', text: '45 min in bed\nzero steps', bg: 'phone' },
      { type: 'story', text: 'gym bag still\npacked', bg: 'locker' },
      { type: 'solution', text: 'earn breakfast\nscroll time', bg: 'night' },
      { type: 'proof', text: 'lock apps\ntill you move', bg: 'gym1' },
      { type: 'cta', text: 'Search RepLock', bg: 'dark' },
    ],
  },
  7: {
    name: 'Plateau Theory',
    folder: 'slideshow-7',
    slides: [
      { type: 'hook', text: 'same weight\n3 months?', bg: 'weights' },
      { type: 'story', text: 'tracked macros\nscrolled every set', bg: 'scroll' },
      { type: 'story', text: 'sleep trash\nrecovery trash', bg: 'bed-scroll' },
      { type: 'solution', text: 'maybe it was\nthe phone', bg: 'gym4' },
      { type: 'proof', text: 'reps before\nreels', bg: 'timer' },
      { type: 'cta', text: 'try RepLock', bg: 'night' },
    ],
  },
  8: {
    name: 'Sunday Reset',
    folder: 'slideshow-8',
    slides: [
      { type: 'hook', text: 'meal prep ✓\n4hr phone ✓', bg: 'gym3' },
      { type: 'story', text: 'deleted TikTok\nreinstalled TikTok', bg: 'phone' },
      { type: 'story', text: 'new week\nsame habits', bg: 'scroll' },
      { type: 'solution', text: 'block apps\ntill you move', bg: 'rack-empty' },
      { type: 'proof', text: 'earn scroll\nwith exercise', bg: 'squat' },
      { type: 'cta', text: 'Search RepLock', bg: 'locker' },
    ],
  },
  9: {
    name: 'Push-Up Tax',
    folder: 'slideshow-9',
    slides: [
      { type: 'hook', text: 'scroll tax is real.\nslide 4 changed it', bg: 'gym2' },
      { type: 'story', text: 'Instagram?\n10 push-ups', bg: 'phone' },
      { type: 'story', text: 'YouTube?\nsquats.', bg: 'scroll' },
      { type: 'solution', text: 'feed not worth it\nanymore', bg: 'chalk' },
      { type: 'proof', text: 'every minute\ncosts reps', bg: 'bench' },
      { type: 'cta', text: 'get RepLock', bg: 'dark' },
    ],
  },
  10: {
    name: 'Mirror vs Phone',
    folder: 'slideshow-10',
    slides: [
      { type: 'hook', text: 'form checks: 2\nphone checks: 47', bg: 'mirror' },
      { type: 'story', text: 'rest timer =\nentertainment timer', bg: 'timer' },
      { type: 'story', text: 'left gym tired\nof scrolling', bg: 'scroll' },
      { type: 'solution', text: 'turn rest into\nreps', bg: 'hands-phone' },
      { type: 'proof', text: 'lock apps\ntill you earn', bg: 'gym1' },
      { type: 'cta', text: 'Search RepLock', bg: 'locker' },
    ],
  },
}

async function renderSlide(slide, index, total) {
  const bg = await ensureBackground(slide.bg)
  const composites = [{ input: bg, top: 0, left: 0 }]

  if (slide.type === 'solution' || slide.type === 'proof') {
    const shot = await loadAppScreenshot(slide.type === 'proof' ? 'proof' : 'main')
    if (shot) {
      composites.push({ input: shot, top: 180, left: 360 })
      composites.push({ input: phoneFrameBorderSvg(), top: 0, left: 0 })
    }
  }

  composites.push({ input: textOverlaySvg(slide, index, total), top: 0, left: 0 })

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
    const png = await renderSlide(slide, i, config.slides.length)
    await sharp(png).toFile(join(outDir, filename))
    console.log(`  ✓ ${filename} [${slide.type}]`)
  }
}

const arg = process.argv[2] ?? 'all'
const ids = arg === 'all' ? Object.keys(SLIDESHOWS) : [arg]

if (!ids.every((id) => SLIDESHOWS[id])) {
  console.error('Usage: node scripts/generate-tiktok-slides.mjs [1-10|all]')
  process.exit(1)
}

for (const id of ids) {
  await generateSlideshow(id, SLIDESHOWS[id])
}

console.log(`\nDone — ${ids.length} slideshow(s), 6 visual slides each.`)
