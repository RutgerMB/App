#!/usr/bin/env node
/**
 * Generate app icons from the RepLock logo master image.
 * Usage: node scripts/generate-app-icons.mjs [source.png]
 */
import sharp from 'sharp'
import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const root = process.cwd()
const defaultSrc = join(
  root,
  '..',
  '.cursor',
  'projects',
  'c-Users-Admin-Documents-GitHub-App',
  'assets',
  'c__Users_Admin_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_Logo_and_app_icon_design_202607052356-06f4a0c2-c5bd-4f72-9c8b-e43acee0c7ab.png'
)

const src = process.argv[2] ? join(root, process.argv[2]) : defaultSrc

if (!existsSync(src)) {
  console.error(`Source image not found: ${src}`)
  process.exit(1)
}

const androidBuckets = [
  { folder: 'mipmap-mdpi', launcher: 48, foreground: 108 },
  { folder: 'mipmap-hdpi', launcher: 72, foreground: 162 },
  { folder: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
  { folder: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
  { folder: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
]

async function squareCrop(input) {
  const meta = await input.metadata()
  const size = Math.min(meta.width, meta.height)
  const left = Math.floor((meta.width - size) / 2)
  const top = Math.floor((meta.height - size) / 2)
  return input.extract({ left, top, width: size, height: size })
}

/** Adaptive icon foreground: icon scaled into center safe zone on transparent canvas */
async function adaptiveForeground(cropped, canvasSize) {
  const iconSize = Math.round(canvasSize * 0.82)
  const icon = await cropped.clone().resize(iconSize, iconSize).png().toBuffer()
  const offset = Math.floor((canvasSize - iconSize) / 2)
  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: icon, left: offset, top: offset }])
    .png()
}

async function main() {
  const input = sharp(src)
  const cropped = await squareCrop(input)

  const iosIcon = join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png')
  await cropped.clone().resize(1024, 1024, { fit: 'cover' }).png().toFile(iosIcon)
  console.log('iOS:', iosIcon)

  const publicDir = join(root, 'public')
  await cropped.clone().resize(512, 512).png().toFile(join(publicDir, 'apple-touch-icon.png'))
  await cropped.clone().resize(512, 512).png().toFile(join(publicDir, 'icon-512.png'))
  await cropped.clone().resize(192, 192).png().toFile(join(publicDir, 'icon-192.png'))
  console.log('Web: public/apple-touch-icon.png, icon-512.png, icon-192.png')

  const assetsDir = join(root, 'assets')
  mkdirSync(assetsDir, { recursive: true })
  await cropped.clone().resize(1024, 1024).png().toFile(join(assetsDir, 'app-icon.png'))
  console.log('Master: assets/app-icon.png')

  const resRoot = join(root, 'android', 'app', 'src', 'main', 'res')
  for (const { folder, launcher, foreground } of androidBuckets) {
    const dir = join(resRoot, folder)
    mkdirSync(dir, { recursive: true })
    await cropped.clone().resize(launcher, launcher).png().toFile(join(dir, 'ic_launcher.png'))
    await cropped.clone().resize(launcher, launcher).png().toFile(join(dir, 'ic_launcher_round.png'))
    const fg = await adaptiveForeground(cropped, foreground)
    await fg.toFile(join(dir, 'ic_launcher_foreground.png'))
    console.log(`Android ${folder}`)
  }

  console.log('\nDone. Run npm run cap:sync to copy web assets to native projects.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
