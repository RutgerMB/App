#!/usr/bin/env node
import sharp from 'sharp'
import { mkdirSync } from 'fs'

const W = 1080
const H = 1920
mkdirSync('docs/marketing/assets/ui', { recursive: true })

const raw = 'docs/marketing/assets/ui/home-0m-raw.png'
const meta = await sharp(raw).metadata()
const sx = W / meta.width
const sy = H / meta.height

// Name is centered under "Welcome back" (Home.tsx text-center)
// Raw ~472x1024: name band roughly y 145–185, centered
const cover = {
  left: Math.round(120 * sx),
  top: Math.round(140 * sy),
  width: Math.round(232 * sx),
  height: Math.round(55 * sy),
}

const base = await sharp(raw).resize(W, H, { fit: 'fill' }).png().toBuffer()

const patch = await sharp({
  create: {
    width: cover.width,
    height: cover.height,
    channels: 3,
    background: { r: 10, g: 10, b: 11 },
  },
})
  .png()
  .toBuffer()

const fontSize = Math.round(cover.height * 0.78)
const nameSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${cover.width}" height="${cover.height}" xmlns="http://www.w3.org/2000/svg">
  <text x="${cover.width / 2}" y="${Math.round(cover.height * 0.8)}" text-anchor="middle" font-family="Helvetica Neue,Arial,sans-serif" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">Alex</text>
</svg>`)

await sharp(base)
  .composite([
    { input: patch, left: cover.left, top: cover.top },
    { input: nameSvg, left: cover.left, top: cover.top },
  ])
  .png()
  .toFile('docs/marketing/assets/ui/home-0m.png')

console.log('OK home-0m.png — centered Test → Alex', cover)
