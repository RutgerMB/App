#!/usr/bin/env node
/**
 * Generate 1080×1920 TikTok slideshow PNGs for RepLock gymbro campaign.
 * Usage: node scripts/generate-tiktok-slides.mjs [slideshow-id]
 *   slideshow-id: 1, 2, or "all" (default)
 */
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join } from 'path'

const WIDTH = 1080
const HEIGHT = 1920
const BG = '#0A0A0B'
const ACCENT = '#5E6AD2'
const ACCENT_LIGHT = '#8B5CF6'
const TEXT = '#FFFFFF'
const MUTED = '#71717A'

const root = process.cwd()
const outRoot = join(root, 'docs', 'marketing', 'slides')

const SLIDESHOWS = {
  1: {
    name: 'Leg Day Excuses',
    folder: 'slideshow-1',
    slides: [
      { text: "POV: it's leg day and your brain is negotiating", hook: true },
      { text: "I'll hit legs tomorrow" },
      { text: 'My knees feel weird tho' },
      { text: 'Upper body is looking insane anyway' },
      { text: "Opens TikTok for 'motivation'" },
      { text: '45 min later. Zero squats. Full scroll.', pivot: true },
      { text: 'Search RepLock', cta: true },
    ],
  },
  2: {
    name: 'Rest Timer Scrolling',
    folder: 'slideshow-2',
    slides: [
      { text: '90 second rest timer.\n90 minute scroll session.', hook: true },
      { text: 'Set timer. Put phone down.' },
      { text: 'Check one notification' },
      { text: "Now you're on Reels" },
      { text: 'Timer went off 20 min ago' },
      { text: 'Bro next to you hit 4 sets. You hit 1.', pivot: true },
      { text: 'Search RepLock', cta: true },
    ],
  },
  3: {
    name: 'No Gains Arc',
    folder: 'slideshow-3',
    slides: [
      { text: 'Training 6 months.\nStill look the same. Wonder why.', hook: true },
      { text: 'Perfect split. Perfect protein.' },
      { text: 'Terrible sleep. Worse focus.' },
      { text: '3 hours/day on the phone' },
      { text: 'Recovery? More like Reels.' },
      { text: "You're not lazy. You're just unlocked 24/7.", pivot: true },
      { text: 'Search RepLock', cta: true },
    ],
  },
  4: {
    name: 'Gym Crush Cardio Skip',
    folder: 'slideshow-4',
    slides: [
      { text: "She's on the treadmill.\nYou're 'warming up' on Instagram.", hook: true },
      { text: 'Walked past cardio 3 times' },
      { text: 'Did one set of bicep curls instead' },
      { text: 'She definitely saw you skip' },
      { text: 'Phone in hand. Zero steps.' },
      { text: 'Main character energy. Side quest results.', pivot: true },
      { text: 'Search RepLock', cta: true },
    ],
  },
  5: {
    name: 'The Phone Spotter',
    folder: 'slideshow-5',
    slides: [
      { text: "My spotter doesn't miss reps.\nMy phone does.", hook: true },
      { text: "Spotter: 'One more!'" },
      { text: "Phone: 'One more Reel'" },
      { text: 'Guess which one I listen to' },
      { text: 'RepLock said do 15 push-ups' },
      { text: 'Or TikTok stays locked. I chose violence.', pivot: true },
      { text: 'Search RepLock', cta: true },
    ],
  },
  6: {
    name: 'Morning Scroll Trap',
    folder: 'slideshow-6',
    slides: [
      { text: 'POV: 6am alarm.\nAlready lost to the feed.', hook: true },
      { text: 'Open eyes. Open Instagram.' },
      { text: '45 min in bed. Zero steps.' },
      { text: 'Gym bag still packed from yesterday' },
      { text: 'Morning routine = scroll routine' },
      { text: 'RepLock made me earn breakfast scroll time', pivot: true },
      { text: 'Search RepLock', cta: true },
    ],
  },
  7: {
    name: 'Plateau Phone Theory',
    folder: 'slideshow-7',
    slides: [
      { text: 'Stuck at the same weight for 3 months.\nPhone usage up 40%.', hook: true },
      { text: 'Track every macro' },
      { text: 'Skip every rest-day walk' },
      { text: 'Scroll between every set' },
      { text: 'Sleep trash. Recovery trash.' },
      { text: 'Maybe the problem was never the program.', pivot: true },
      { text: 'Search RepLock', cta: true },
    ],
  },
  8: {
    name: 'Sunday Reset',
    folder: 'slideshow-8',
    slides: [
      { text: 'Sunday: meal prep ✓\nSunday: 4 hours on the phone ✓', hook: true },
      { text: 'New week. Same habits.' },
      { text: 'Deleted TikTok. Reinstalled TikTok.' },
      { text: 'Bought pre-workout instead' },
      { text: 'Still no discipline' },
      { text: 'Needed an app that blocks until I move', pivot: true },
      { text: 'Search RepLock', cta: true },
    ],
  },
  9: {
    name: 'Push-Up Tax',
    folder: 'slideshow-9',
    slides: [
      { text: 'Every minute of scroll costs reps now.', hook: true },
      { text: 'Want Instagram? 10 push-ups.' },
      { text: 'Want YouTube? Squats.' },
      { text: 'Want one more episode? Plank.' },
      { text: 'Suddenly the feed isn\'t worth it' },
      { text: 'That\'s RepLock. Earn it or lock it.', pivot: true },
      { text: 'Search RepLock', cta: true },
    ],
  },
  10: {
    name: 'Gym Mirror vs Phone',
    folder: 'slideshow-10',
    slides: [
      { text: 'Checks form in mirror: 2 times\nChecks phone: 47 times', hook: true },
      { text: 'Filming sets for the gram' },
      { text: 'Never posting. Always scrolling.' },
      { text: 'Rest timer = entertainment timer' },
      { text: 'Left the gym tired. Of scrolling.' },
      { text: 'RepLock turned my rest into reps', pivot: true },
      { text: 'Search RepLock', cta: true },
    ],
  },
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function wrapText(text, maxChars = 22) {
  const paragraphs = text.split('\n')
  const lines = []

  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ')
    let current = ''

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (candidate.length <= maxChars) {
        current = candidate
      } else {
        if (current) lines.push(current)
        current = word
      }
    }
    if (current) lines.push(current)
  }

  return lines
}

function buildSlideSvg(slide, index, total) {
  const { text, hook, pivot, cta } = slide
  const lines = wrapText(text, hook ? 18 : cta ? 16 : 20)
  const fontSize = hook ? 72 : cta ? 96 : pivot ? 64 : 68
  const lineHeight = hook ? 88 : cta ? 110 : 82
  const textBlockHeight = lines.length * lineHeight
  const startY = (HEIGHT - textBlockHeight) / 2 + fontSize * 0.35

  const tspans = lines
    .map((line, i) => {
      const y = startY + i * lineHeight
      return `<tspan x="540" y="${y}">${escapeXml(line)}</tspan>`
    })
    .join('\n')

  const dots = Array.from({ length: total }, (_, i) => {
    const cx = 540 - ((total - 1) * 18) / 2 + i * 18
    const fill = i === index ? ACCENT : '#27272A'
    const r = i === index ? 6 : 4
    return `<circle cx="${cx}" cy="1780" r="${r}" fill="${fill}"/>`
  }).join('\n')

  const label = cta
    ? `<text x="540" y="1520" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700" fill="${ACCENT_LIGHT}" letter-spacing="6">REPLOCK</text>`
    : hook
      ? `<text x="540" y="280" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="${ACCENT}" letter-spacing="8">GYM BRO</text>`
      : pivot
        ? `<rect x="340" y="200" width="400" height="4" rx="2" fill="url(#accentGrad)"/>`
        : ''

  const ctaExtras = cta
    ? `
    <rect x="190" y="1280" width="700" height="140" rx="24" fill="none" stroke="url(#accentGrad)" stroke-width="4"/>
    <text x="540" y="1680" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${MUTED}">Earn scroll time with real reps</text>
  `
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="50%" stop-color="#111113"/>
      <stop offset="100%" stop-color="${BG}"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${ACCENT}"/>
      <stop offset="100%" stop-color="${ACCENT_LIGHT}"/>
    </linearGradient>
    <radialGradient id="glowRed" cx="80%" cy="20%" r="50%">
      <stop offset="0%" stop-color="#7F1D1D" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowIndigo" cx="15%" cy="85%" r="45%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
    <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glowRed)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glowIndigo)"/>

  <line x1="80" y1="120" x2="220" y2="120" stroke="url(#accentGrad)" stroke-width="3" opacity="0.7"/>
  <line x1="860" y1="1800" x2="1000" y2="1800" stroke="url(#accentGrad)" stroke-width="3" opacity="0.7"/>

  ${label}
  ${ctaExtras}

  <text
    text-anchor="middle"
    font-family="Impact, Haettenschweiler, 'Arial Narrow Bold', Arial Black, sans-serif"
    font-size="${fontSize}"
    font-weight="900"
    fill="${TEXT}"
    filter="url(#textShadow)"
  >
    ${tspans}
  </text>

  ${dots}
</svg>`
}

async function generateSlideshow(id, config) {
  const outDir = join(outRoot, config.folder)
  mkdirSync(outDir, { recursive: true })

  console.log(`\n${config.name} → ${config.folder}/`)

  for (let i = 0; i < config.slides.length; i++) {
    const slide = config.slides[i]
    const filename = `slide-${String(i + 1).padStart(2, '0')}.png`
    const outPath = join(outDir, filename)
    const svg = buildSlideSvg(slide, i, config.slides.length)

    await sharp(Buffer.from(svg)).png().toFile(outPath)
    console.log(`  ✓ ${filename} — ${slide.text.replace(/\n/g, ' ')}`)
  }
}

async function main() {
  const arg = process.argv[2] ?? 'all'
  const ids =
    arg === 'all'
      ? Object.keys(SLIDESHOWS)
      : [arg]

  for (const id of ids) {
    const config = SLIDESHOWS[id]
    if (!config) {
      console.error(`Unknown slideshow: ${id}. Use 1-10 or all.`)
      process.exit(1)
    }
    await generateSlideshow(id, config)
  }

  console.log(`\nDone. ${ids.length} slideshow(s) → docs/marketing/slides/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
