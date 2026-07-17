#!/usr/bin/env node
/**
 * RepLock TikTok slideshows — bodyweight / doomscroll audience.
 *
 * Rules (from founder feedback):
 * - ONE person photo per slideshow (same image on all photo slides)
 * - Real app UI screenshots (0m home, lock, earn) — not stock Unsplash
 * - App earns via push-ups / squats / planks / bodyweight — NOT lifting/running
 * - Audience = phone addicts who need to move, not gymbros chasing PRs
 *
 * Usage: node scripts/generate-tiktok-slides.mjs [id|all]
 */
import sharp from 'sharp'
import { mkdirSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'

const WIDTH = 1080
const HEIGHT = 1920
const OUT = join(process.cwd(), 'docs', 'marketing', 'slides')
const PEOPLE = join(process.cwd(), 'docs', 'marketing', 'assets', 'people')
const UI_DIR = join(process.cwd(), 'docs', 'marketing', 'assets', 'ui')

const imgCache = new Map()

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function loadPerson(key) {
  if (imgCache.has(key)) return imgCache.get(key)
  const filePath = join(PEOPLE, `${key}.jpg`)
  if (!existsSync(filePath)) throw new Error(`Missing person asset: ${filePath}`)
  const buf = await sharp(filePath)
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88 })
    .toBuffer()
  imgCache.set(key, buf)
  return buf
}

async function loadHomeScreenshot() {
  const key = 'home-0m'
  if (imgCache.has(key)) return imgCache.get(key)
  const filePath = join(UI_DIR, 'home-0m.png')
  if (!existsSync(filePath)) throw new Error(`Run scripts/patch-home-screenshot.mjs first (${filePath})`)
  const buf = await sharp(filePath)
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer()
  imgCache.set(key, buf)
  return buf
}

function lockUiSvg({ appName = 'TikTok' } = {}) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0B0B0F"/>
  <defs>
    <linearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <rect x="460" y="520" width="160" height="160" rx="40" fill="url(#logo)"/>
  <text x="540" y="630" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="72" font-weight="800" fill="#FFFFFF">R</text>
  <text x="540" y="780" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="48" font-weight="700" fill="#FFFFFF">${esc(appName)} is locked</text>
  <text x="540" y="860" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="28" font-weight="500" fill="#999999">Earn screen time with workouts in RepLock,</text>
  <text x="540" y="900" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="28" font-weight="500" fill="#999999">then unlock this app.</text>
  <rect x="96" y="1020" width="888" height="112" rx="28" fill="#6366F1"/>
  <text x="540" y="1090" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="32" font-weight="700" fill="#FFFFFF">Open RepLock</text>
  <rect x="96" y="1160" width="888" height="112" rx="28" fill="#2A2A2E"/>
  <text x="540" y="1230" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="30" font-weight="600" fill="#CCCCCC">Go to home screen</text>
</svg>`)
}

function earnUiSvg({ reps = 20, minutes = 30, exercise = 'PUSH-UPS' } = {}) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0A0A0B"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5E6AD2"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
    <radialGradient id="blob" cx="50%" cy="35%" r="45%">
      <stop offset="0%" stop-color="#5E6AD2" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0A0A0B" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#blob)"/>
  <text x="540" y="220" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="28" font-weight="600" fill="#A1A1AA" letter-spacing="4">${esc(exercise)}</text>
  <text x="540" y="280" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="26" font-weight="500" fill="#71717A">Set 1 of 3</text>
  <text x="540" y="620" text-anchor="middle" font-family="Helvetica Neue,Arial Black,Arial,sans-serif" font-size="220" font-weight="900" fill="url(#g)">${reps}</text>
  <text x="540" y="720" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="36" font-weight="600" fill="#D4D4D8">reps</text>
  <text x="540" y="820" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="30" font-weight="500" fill="#A1A1AA">earn ~${minutes} min scroll</text>
  <rect x="160" y="900" width="760" height="12" rx="6" fill="#27272A"/>
  <rect x="160" y="900" width="380" height="12" rx="6" fill="url(#g)"/>
  <rect x="96" y="1100" width="888" height="120" rx="32" fill="url(#g)"/>
  <text x="540" y="1175" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="34" font-weight="700" fill="#FFFFFF">I did these reps</text>
  <text x="540" y="1320" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="24" font-weight="500" fill="#52525B">RepLock · earn your scroll</text>
</svg>`)
}

async function ensureUi(kind, opts = {}) {
  const cacheKey = `${kind}-${JSON.stringify(opts)}`
  if (imgCache.has(cacheKey)) return imgCache.get(cacheKey)
  mkdirSync(UI_DIR, { recursive: true })
  let buf
  if (kind === 'home') buf = await loadHomeScreenshot()
  else if (kind === 'lock') buf = await sharp(lockUiSvg(opts)).png().toBuffer()
  else if (kind === 'earn') buf = await sharp(earnUiSvg(opts)).png().toBuffer()
  else throw new Error(`Unknown UI: ${kind}`)
  imgCache.set(cacheKey, buf)
  return buf
}

function textOverlaySvg(slide) {
  const lines = slide.text.split('\n').slice(0, 3)
  const isHook = slide.type === 'hook'
  const fontSize = isHook ? 70 : 66
  const lineHeight = Math.round(fontSize * 1.2)
  const startY = slide.y === 'high' ? HEIGHT * 0.2 : slide.y === 'low' ? HEIGHT * 0.68 : HEIGHT * 0.38

  const tspans = lines
    .map((line, i) => `<tspan x="540" y="${startY + i * lineHeight}">${esc(line)}</tspan>`)
    .join('\n')

  const sub = slide.sub
    ? `<text x="540" y="${startY + lines.length * lineHeight + 40}" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="28" font-weight="600" fill="#FAFAFA" stroke="#000" stroke-width="5" paint-order="stroke fill">${esc(slide.sub)}</text>`
    : ''

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.4"/>
      <stop offset="45%" stop-color="#000" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#shade)"/>
  <text text-anchor="middle" font-family="Helvetica Neue,Arial Black,Arial,sans-serif" font-size="${fontSize}" font-weight="800" fill="#FFFFFF" stroke="#000000" stroke-width="8" paint-order="stroke fill">${tspans}</text>
  ${sub}
</svg>`)
}

function rankedOverlaySvg(slide) {
  const title = esc(slide.text.replace(/\n/g, ' '))
  const score = esc(slide.score || '')
  const pros = (slide.pros || []).map(esc)
  const cons = (slide.cons || []).map(esc)
  const proLines = pros
    .map((p, i) => `<text x="100" y="${560 + i * 50}" font-family="Helvetica Neue,Arial,sans-serif" font-size="32" font-weight="700" fill="#86EFAC" stroke="#000" stroke-width="4" paint-order="stroke fill">+ ${p}</text>`)
    .join('\n')
  const conLines = cons
    .map((c, i) => `<text x="100" y="${820 + i * 50}" font-family="Helvetica Neue,Arial,sans-serif" font-size="32" font-weight="700" fill="#FCA5A5" stroke="#000" stroke-width="4" paint-order="stroke fill">− ${c}</text>`)
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#000" fill-opacity="0.58"/>
  <text x="540" y="260" text-anchor="middle" font-family="Helvetica Neue,Arial Black,Arial,sans-serif" font-size="56" font-weight="900" fill="#FFF" stroke="#000" stroke-width="8" paint-order="stroke fill">${title}</text>
  <text x="540" y="360" text-anchor="middle" font-family="Helvetica Neue,Arial Black,Arial,sans-serif" font-size="88" font-weight="900" fill="#FFF" stroke="#000" stroke-width="9" paint-order="stroke fill">${score}</text>
  <text x="100" y="500" font-family="Helvetica Neue,Arial Black,Arial,sans-serif" font-size="34" font-weight="800" fill="#22C55E" stroke="#000" stroke-width="5" paint-order="stroke fill">PROS</text>
  ${proLines}
  <text x="100" y="760" font-family="Helvetica Neue,Arial Black,Arial,sans-serif" font-size="34" font-weight="800" fill="#EF4444" stroke="#000" stroke-width="5" paint-order="stroke fill">CONS</text>
  ${conLines}
</svg>`)
}

/**
 * Each pack has ONE `person` — reused on every photo slide.
 * Product slides use real home-0m screenshot or lock/earn UI.
 * Copy = doomscroll / 0 minutes / bodyweight earn — not lifting culture.
 */
const SLIDESHOWS = {
  1: {
    name: 'Zero Minutes',
    folder: 'slideshow-1',
    person: 'p01',
    caption:
      "0 minutes. TikTok locked. only way out is push-ups 💀 search RepLock\n\n#screentime #pushups #appblocker #digitaldetox #lockin #fyp",
    sound: 'phonk / lock in edit',
    slides: [
      { type: 'hook', text: '0 minutes left.', y: 'mid' },
      { type: 'story', text: 'TikTok?\nlocked.', y: 'mid' },
      { type: 'ui', ui: 'home' },
      { type: 'story', text: '20 push-ups\nto unlock.', y: 'mid' },
      { type: 'cta', text: 'App: RepLock', sub: 'earn your scroll', y: 'mid' },
    ],
  },
  2: {
    name: 'Just Checking',
    folder: 'slideshow-2',
    person: 'p03',
    caption:
      "\"just checking Instagram\" → locked until I knock out reps. RepLock makes you earn scroll time.\n\n#screentime #instagram #pushups #appblocker #lockin #digitaldetox",
    sound: 'slowed edit',
    slides: [
      { type: 'hook', text: "\"just checking\nInstagram\"", y: 'mid' },
      { type: 'ui', ui: 'lock', uiOpts: { appName: 'Instagram' } },
      { type: 'story', text: 'do the reps.\nor stay locked.', y: 'mid' },
      { type: 'ui', ui: 'earn', uiOpts: { reps: 20, minutes: 30, exercise: 'PUSH-UPS' } },
      { type: 'cta', text: 'search RepLock', y: 'mid' },
    ],
  },
  3: {
    name: 'Doomscroll Tax',
    folder: 'slideshow-3',
    person: 'p05',
    caption:
      "scroll tax is real. Instagram costs push-ups. TikTok costs squats. search RepLock\n\n#doomscroll #screentime #pushups #squats #appblocker #lockin",
    sound: 'meme / phonk',
    slides: [
      { type: 'hook', text: 'scroll tax\nis real.', y: 'mid' },
      { type: 'story', text: 'Instagram =\n20 push-ups', y: 'mid' },
      { type: 'story', text: 'TikTok =\n30 squats', y: 'mid' },
      { type: 'ui', ui: 'home' },
      { type: 'cta', text: 'earn it or\ndon\'t scroll', sub: 'RepLock', y: 'mid' },
    ],
  },
  4: {
    name: 'I Found An App',
    folder: 'slideshow-4',
    person: 'p07',
    caption:
      "found an app that locks TikTok until you do push-ups… idk if I hate it or need it 💀 search RepLock\n\n#screentime #pushups #appblocker #lockin #digitaldetox #fyp",
    sound: 'I found the best / Char slowed',
    slides: [
      { type: 'hook', text: 'I found an app that\nlocks TikTok', sub: '(App: RepLock)', y: 'mid' },
      { type: 'story', text: 'won\'t open until\nyou earn minutes', y: 'mid' },
      { type: 'ui', ui: 'home' },
      { type: 'ui', ui: 'earn', uiOpts: { reps: 15, minutes: 22, exercise: 'PUSH-UPS' } },
      { type: 'punch', text: 'embarrassing.\neffective.', y: 'mid' },
    ],
  },
  5: {
    name: 'Wake Up Locked',
    folder: 'slideshow-5',
    person: 'p09',
    caption:
      "wake up. 0m screen time. TikTok locked. lock in with push-ups before the feed. RepLock.\n\n#screentime #morningroutine #pushups #lockin #appblocker #digitaldetox",
    sound: 'soft morning → drop',
    slides: [
      { type: 'hook', text: '6am.\n0 minutes.', y: 'mid' },
      { type: 'ui', ui: 'home' },
      { type: 'story', text: 'feed stays locked\ntill you move', y: 'mid' },
      { type: 'ui', ui: 'earn', uiOpts: { reps: 10, minutes: 15, exercise: 'SQUATS' } },
      { type: 'cta', text: 'search RepLock', y: 'mid' },
    ],
  },
  6: {
    name: 'Fix Doomscroll Ranking',
    folder: 'slideshow-6',
    person: 'phone01',
    caption:
      "Ways I tried to fix doomscrolling #screentime #digitaldetox #appblocker #pushups #fyp",
    sound: 'listicle edit',
    slides: [
      { type: 'hook', text: 'Ways I tried to\nfix doomscrolling', y: 'high' },
      {
        type: 'ranked',
        text: '1. Delete TikTok',
        score: '2/10',
        pros: ['works 2 days'],
        cons: ['you reinstall'],
      },
      {
        type: 'ranked',
        text: '2. Screen Time limits',
        score: '3/10',
        pros: ['free'],
        cons: ['you ignore them'],
      },
      {
        type: 'ranked',
        text: '3. RepLock',
        score: '9.5/10',
        pros: ['0m until you train', 'push-ups unlock scroll'],
        cons: ['no free doomscroll'],
      },
      { type: 'ui', ui: 'home' },
    ],
  },
  7: {
    name: 'Plank Or Scroll',
    folder: 'slideshow-7',
    person: 'p12',
    caption:
      "apps stay at 0m until you earn them. plank. push-ups. squats. then you scroll. RepLock.\n\n#plank #pushups #screentime #lockin #appblocker #digitaldetox",
    sound: 'dark phonk',
    slides: [
      { type: 'hook', text: 'lock in or\nkeep scrolling.', y: 'mid' },
      { type: 'story', text: 'your apps are\nunlocked 24/7', y: 'mid' },
      { type: 'ui', ui: 'lock', uiOpts: { appName: 'TikTok' } },
      { type: 'ui', ui: 'home' },
      { type: 'cta', text: 'earn your scroll', sub: 'RepLock', y: 'mid' },
    ],
  },
  8: {
    name: 'Best Feeling Unlock',
    folder: 'slideshow-8',
    person: 'p04',
    caption:
      "best feeling? unlocking TikTok after you actually earned the minutes 📱 search RepLock\n\n#screentime #pushups #lockin #digitaldetox #appblocker #fyp",
    sound: 'feel-good edit',
    slides: [
      { type: 'hook', text: "best feeling\nright now?", y: 'mid' },
      { type: 'story', text: 'not the scroll.', y: 'mid' },
      { type: 'story', text: 'earning it first.', y: 'mid' },
      { type: 'ui', ui: 'earn', uiOpts: { reps: 20, minutes: 30, exercise: 'PUSH-UPS' } },
      { type: 'ui', ui: 'home' },
    ],
  },
}

async function renderSlide(slide, personKey) {
  if (slide.type === 'ui') {
    return ensureUi(slide.ui, slide.uiOpts || {})
  }

  const bg = await loadPerson(personKey)
  const overlay = slide.type === 'ranked' ? rankedOverlaySvg(slide) : textOverlaySvg(slide)
  return sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 3, background: { r: 10, g: 10, b: 11 } },
  })
    .composite([
      { input: bg, top: 0, left: 0 },
      { input: overlay, top: 0, left: 0 },
    ])
    .png({ compressionLevel: 8 })
    .toBuffer()
}

async function generateSlideshow(id, config) {
  const outDir = join(OUT, config.folder)
  mkdirSync(outDir, { recursive: true })
  console.log(`\n${config.name} → ${config.folder}/ (person: ${config.person}, ${config.slides.length} slides)`)

  for (let i = 0; i < config.slides.length; i++) {
    const slide = config.slides[i]
    const filename = `slide-${String(i + 1).padStart(2, '0')}.png`
    const png = await renderSlide(slide, config.person)
    await sharp(png).toFile(join(outDir, filename))
    const label =
      slide.type === 'ui'
        ? `ui:${slide.ui}`
        : `${slide.type} ${slide.text?.replace(/\n/g, ' / ') || ''}`
    console.log(`  ✓ ${filename} [${label}]`)
  }

  writeFileSync(
    join(outDir, 'POST.txt'),
    [
      `# ${config.name}`,
      `Person asset: ${config.person}.jpg (same face/body all photo slides)`,
      '',
      `Sound: ${config.sound}`,
      '',
      '--- CAPTION ---',
      config.caption,
      '',
      '--- SLIDES ---',
      ...config.slides.map((s, i) => {
        if (s.type === 'ui') return `${i + 1}. [APP UI: ${s.ui}]`
        if (s.type === 'ranked')
          return `${i + 1}. ${s.text} ${s.score} | Pros: ${(s.pros || []).join(', ')} | Cons: ${(s.cons || []).join(', ')}`
        return `${i + 1}. ${s.text.replace(/\n/g, ' ')}${s.sub ? ` (${s.sub})` : ''}`
      }),
      '',
      'Pin comment: search RepLock',
    ].join('\n'),
    'utf8'
  )
}

const arg = process.argv[2] ?? 'all'
const ids = arg === 'all' ? Object.keys(SLIDESHOWS) : [arg]

if (!ids.every((id) => SLIDESHOWS[id])) {
  console.error('Usage: node scripts/generate-tiktok-slides.mjs [1-8|all]')
  process.exit(1)
}

for (const id of ids) {
  const cfg = SLIDESHOWS[id]
  if (!existsSync(join(PEOPLE, `${cfg.person}.jpg`))) {
    console.error(`Missing person image for slideshow ${id}: ${cfg.person}.jpg`)
    process.exit(1)
  }
  await generateSlideshow(id, cfg)
}

console.log(`\nDone — ${ids.length} packs. One person each. Real 0m home UI. Bodyweight/doomscroll copy.`)
console.log('Post: docs/marketing/POST-NOW.md')
