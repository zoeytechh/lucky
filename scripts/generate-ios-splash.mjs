// Generates the iOS launch-splash images (apple-touch-startup-image) —
// text only ("LUCKY YOU", the app's ground green + gold colors), matching
// what the user asked for specifically: the native OS splash currently
// shows just the mascot icon (Apple's default when no custom startup
// image is provided), and this replaces it with the app's name instead.
// Scoped to iPhone only (not iPad) — this is a phone-first raffle app.
// Reuses @vite-pwa/assets-generator's own device-size data for accuracy
// rather than hand-maintaining a list, but renders independently via
// sharp for full control over the design (that library's shared
// icon-generation pipeline is built around resizing one existing image,
// not composing new text).
import { appleSplashScreenSizes } from '@vite-pwa/assets-generator/config'
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'public', 'apple-splash')

const GROUND = '#0b3d24'
const GOLD = '#e8b63e'

function splashSvg(width, height) {
  // Font size scales with the shorter dimension so it reads consistently
  // across the big range of canvas sizes here (640×1136 up to 1320×2868).
  const fontSize = Math.round(Math.min(width, height) * 0.075)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="${GROUND}"/>
    <text
      x="50%" y="50%"
      font-family="Arial, Helvetica, sans-serif"
      font-weight="900"
      font-size="${fontSize}"
      fill="${GOLD}"
      text-anchor="middle"
      dominant-baseline="middle"
      letter-spacing="${Math.round(fontSize * 0.06)}"
    >LUCKY YOU</text>
  </svg>`
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const seen = new Map()
  for (const [name, size] of Object.entries(appleSplashScreenSizes)) {
    // Filter by device name, not dimensions — several iPad sizes (e.g.
    // iPad Pro 12.9" at 2048×2732) fall well within any plausible iPhone
    // dimension ceiling, so a size-only heuristic silently let iPads
    // through on the first pass of this script.
    if (!name.toLowerCase().includes('iphone')) continue
    const key = `${size.width}x${size.height}`
    if (!seen.has(key)) seen.set(key, size)
  }
  const iphoneSizes = [...seen.values()]

  const links = []
  for (const { width, height, scaleFactor } of iphoneSizes) {
    const fileName = `splash-${width}x${height}.png`
    const svg = splashSvg(width, height)
    await sharp(Buffer.from(svg)).png().toFile(path.join(OUT_DIR, fileName))

    const cssWidth = width / scaleFactor
    const cssHeight = height / scaleFactor
    links.push(
      `<link rel="apple-touch-startup-image" href="/apple-splash/${fileName}" media="(device-width: ${cssWidth}px) and (device-height: ${cssHeight}px) and (-webkit-device-pixel-ratio: ${scaleFactor}) and (orientation: portrait)">`,
    )
    console.log(`Generated ${fileName} (${cssWidth}x${cssHeight} @${scaleFactor}x)`)
  }

  await writeFile(path.join(OUT_DIR, 'links.html'), links.join('\n') + '\n')
  console.log(`\n${iphoneSizes.length} splash images written to public/apple-splash/`)
  console.log('Link tags written to public/apple-splash/links.html — paste into index.html, then delete that file.')
}

main()
