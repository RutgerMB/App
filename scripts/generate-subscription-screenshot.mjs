#!/usr/bin/env node
/**
 * App Store Connect subscription review screenshots (iPhone dimensions).
 * Usage: node scripts/generate-subscription-screenshot.mjs [yearly|monthly|both]
 */
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join } from 'path'

const WIDTH = 1290
const HEIGHT = 2796
const BG = '#0A0A0B'
const SURFACE = '#18181B'
const ACCENT = '#5E6AD2'
const ACCENT_LIGHT = '#8B5CF6'
const TEXT = '#FFFFFF'
const MUTED = '#A1A1AA'
const MUTED_DARK = '#71717A'

const outDir = join(process.cwd(), 'docs', 'app-store')
mkdirSync(outDir, { recursive: true })

function buildSvg(plan) {
  const isYearly = plan === 'yearly'

  const yearlyTabFill = isYearly
    ? 'fill="rgba(94,106,210,0.22)" stroke="rgba(94,106,210,0.45)" stroke-width="2"'
    : 'fill="none"'
  const yearlyTabText = isYearly ? '#C7D2FE' : MUTED_DARK
  const yearlyTabWeight = isYearly ? '600' : '500'

  const monthlyTabX = 657
  const monthlyTabFill = !isYearly
    ? 'fill="rgba(94,106,210,0.22)" stroke="rgba(94,106,210,0.45)" stroke-width="2"'
    : 'fill="none"'
  const monthlyTabText = !isYearly ? '#C7D2FE' : MUTED_DARK
  const monthlyTabWeight = !isYearly ? '600' : '500'

  const priceMain = isYearly ? '€59,99' : '€7,99'
  const pricePeriod = isYearly ? '/year' : '/month'
  const priceXOffset = isYearly ? 420 : 340
  const priceSub = isYearly
    ? '€5,00/mo billed annually · Save €35,89/year vs monthly'
    : 'Less than two coffees · Cancel anytime'
  const priceSubColor = isYearly ? '#6EE7B7' : MUTED_DARK

  const badgeBlock = isYearly
    ? `<rect x="980" y="972" width="210" height="48" rx="0" fill="rgba(94,106,210,0.25)"/>
  <text x="1085" y="1005" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="22" font-weight="700" fill="#A5B4FC" letter-spacing="2">MOST POPULAR</text>`
    : `<rect x="980" y="972" width="210" height="48" rx="0" fill="rgba(63,63,70,0.5)"/>
  <text x="1085" y="1005" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="22" font-weight="700" fill="${MUTED}" letter-spacing="2">FLEXIBLE</text>`

  const productPrimary = isYearly
    ? 'replock_pro_yearly · Auto-renewable subscription'
    : 'replock_pro_monthly · Auto-renewable subscription'
  const productSecondary = isYearly
    ? 'replock_pro_monthly also available'
    : 'replock_pro_yearly also available'

  const cta = isYearly ? 'Start annual Pro plan' : 'Start Pro subscription'

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#111113"/>
    </linearGradient>
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ACCENT}"/>
      <stop offset="100%" stop-color="${ACCENT_LIGHT}"/>
    </linearGradient>
    <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${ACCENT}"/>
      <stop offset="100%" stop-color="${ACCENT_LIGHT}"/>
    </linearGradient>
    <radialGradient id="glowTop" cx="50%" cy="0%" r="60%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glowTop)"/>

  <text x="645" y="95" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="34" font-weight="600" fill="${TEXT}">9:41</text>

  <circle cx="95" cy="175" r="28" fill="${SURFACE}" stroke="#3F3F46" stroke-width="2"/>
  <text x="95" y="183" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="28" fill="${MUTED}">✕</text>
  <rect x="1080" y="148" width="120" height="54" rx="27" fill="rgba(94,106,210,0.25)" stroke="rgba(139,92,246,0.4)" stroke-width="2"/>
  <text x="1140" y="184" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="26" font-weight="700" fill="#C4B5FD">PRO</text>

  <rect x="80" y="240" width="1130" height="120" rx="32" fill="rgba(94,106,210,0.12)" stroke="rgba(94,106,210,0.35)" stroke-width="2"/>
  <text x="645" y="295" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="32" font-weight="600" fill="#A5B4FC">5 days left in your free trial</text>
  <text x="645" y="335" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="26" fill="${MUTED_DARK}">Full access to all 3 apps &amp; Pro features during trial</text>

  <rect x="565" y="410" width="160" height="160" rx="36" fill="url(#iconGrad)"/>
  <text x="645" y="515" text-anchor="middle" font-size="72" fill="${TEXT}">✦</text>

  <text x="645" y="660" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="64" font-weight="700" fill="${TEXT}">Invest in your discipline</text>
  <text x="645" y="730" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="28" fill="${MUTED_DARK}">Pro gives you the tools to stay consistent</text>
  <text x="645" y="768" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="28" fill="${MUTED_DARK}">and block every distraction.</text>

  <rect x="80" y="820" width="1130" height="100" rx="28" fill="${SURFACE}" stroke="#3F3F46" stroke-width="2"/>
  <rect x="88" y="828" width="545" height="84" rx="22" ${yearlyTabFill}/>
  <text x="360" y="882" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="32" font-weight="${yearlyTabWeight}" fill="${yearlyTabText}">Yearly</text>
  <rect x="520" y="838" width="108" height="36" rx="18" fill="rgba(16,185,129,0.2)" stroke="rgba(16,185,129,0.4)" stroke-width="1"/>
  <text x="574" y="863" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="18" font-weight="700" fill="#6EE7B7">SAVE 37%</text>
  <rect x="${monthlyTabX}" y="828" width="545" height="84" rx="22" ${monthlyTabFill}/>
  <text x="930" y="882" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="32" font-weight="${monthlyTabWeight}" fill="${monthlyTabText}">Monthly</text>

  <rect x="80" y="960" width="1130" height="720" rx="40" fill="${SURFACE}" stroke="rgba(94,106,210,0.45)" stroke-width="3"/>
  ${badgeBlock}

  <text x="130" y="1085" font-family="-apple-system, sans-serif" font-size="88" font-weight="700" fill="${TEXT}">${priceMain}</text>
  <text x="${priceXOffset}" y="1085" font-family="-apple-system, sans-serif" font-size="36" fill="${MUTED_DARK}">${pricePeriod}</text>
  <text x="130" y="1140" font-family="-apple-system, sans-serif" font-size="28" fill="${priceSubColor}">${priceSub}</text>

  <text x="130" y="1230" font-family="-apple-system, sans-serif" font-size="30" font-weight="600" fill="#E4E4E7">✓  Unlimited locked apps</text>
  <text x="130" y="1295" font-family="-apple-system, sans-serif" font-size="30" font-weight="600" fill="#E4E4E7">✓  All difficulty modes</text>
  <text x="130" y="1360" font-family="-apple-system, sans-serif" font-size="30" font-weight="600" fill="#E4E4E7">✓  Custom daily limits</text>
  <text x="130" y="1425" font-family="-apple-system, sans-serif" font-size="30" font-weight="600" fill="#E4E4E7">✓  Streak protection</text>
  <text x="130" y="1490" font-family="-apple-system, sans-serif" font-size="30" font-weight="600" fill="#E4E4E7">✓  Deep activity insights</text>

  <text x="130" y="1580" font-family="-apple-system, sans-serif" font-size="22" fill="#52525B">${productPrimary}</text>
  <text x="130" y="1615" font-family="-apple-system, sans-serif" font-size="22" fill="#52525B">${productSecondary}</text>

  <rect x="80" y="1740" width="1130" height="110" rx="28" fill="url(#btnGrad)"/>
  <text x="645" y="1808" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="36" font-weight="700" fill="${TEXT}">${cta}</text>

  <text x="645" y="1900" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="28" fill="#818CF8">Restore purchases</text>
  <text x="645" y="1960" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="24" fill="${MUTED_DARK}">Payment charged to Apple ID · Cancel anytime in Settings</text>

  <text x="645" y="2680" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="26" fill="#3F3F46">RepLocks · app.replock.bleeker</text>
</svg>`
}

async function generate(plan) {
  const filename =
    plan === 'yearly'
      ? 'subscription-review-screenshot-yearly.png'
      : 'subscription-review-screenshot-monthly.png'
  const outPath = join(outDir, filename)
  await sharp(Buffer.from(buildSvg(plan))).png().toFile(outPath)
  console.log(`✓ ${outPath}`)
}

const arg = process.argv[2] ?? 'both'
const plans = arg === 'both' ? ['yearly', 'monthly'] : [arg]

if (!['yearly', 'monthly', 'both'].includes(arg)) {
  console.error('Usage: node scripts/generate-subscription-screenshot.mjs [yearly|monthly|both]')
  process.exit(1)
}

for (const plan of plans) {
  await generate(plan)
}

// Legacy filename alias for yearly
if (plans.includes('yearly')) {
  const yearlyPath = join(outDir, 'subscription-review-screenshot-yearly.png')
  const legacyPath = join(outDir, 'subscription-review-screenshot.png')
  await sharp(yearlyPath).toFile(legacyPath)
  console.log(`✓ ${legacyPath} (yearly alias)`)
}
