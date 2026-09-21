import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

// ═══════════════════════════════════════════════════════════════════════════
//   Renders the brand images in public/ from the logo and the product's own
//   fonts: the Open Graph card every shared link unfurls into, and the
//   icons a browser, a phone home screen and the web manifest ask for.
//   Generated, never edited by hand, so a change to the mark or the palette
//   is one run of `npm run assets:build` away from every size at once.
// ═══════════════════════════════════════════════════════════════════════════

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')

const MARK = readFileSync(join(publicDir, 'favicon.svg'), 'utf8')

function fontFace(family: string, file: string, weight: number): string {
	const data = readFileSync(join(publicDir, 'fonts', file)).toString('base64')

	return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2')}`
}

const FONTS = [
	fontFace('Fixel Text', 'FixelText-Regular.woff2', 400),
	fontFace('Fixel Text', 'FixelText-Medium.woff2', 500),
	fontFace('Fixel Display', 'FixelDisplay-SemiBold.woff2', 600),
].join('')

const OG_CARD = `<!doctype html><html><head><style>${FONTS}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:'Fixel Text';color:#fff;
background:linear-gradient(150deg,#087443,#084c2e);position:relative}
body::before{content:'';position:absolute;inset:0;background-image:radial-gradient(circle,rgb(255 255 255/.12) 1.5px,transparent 2px);background-size:28px 28px}
.copy{position:absolute;left:80px;top:88px;width:600px}
.brand{display:flex;align-items:center;gap:16px;font-family:'Fixel Display';font-weight:600;font-size:34px}
.brand span.mark{width:56px;height:56px;border-radius:50%;background:#fff;display:grid;place-items:center}
.brand svg{width:44px;height:44px}
h1{font-family:'Fixel Display';font-weight:600;font-size:64px;line-height:1.05;letter-spacing:-.03em;margin-top:56px}
p{font-size:26px;line-height:1.45;color:rgb(255 255 255/.78);margin-top:28px}
.card{position:absolute;right:72px;top:96px;width:380px;height:470px;background:#fff;border-radius:24px;
box-shadow:0 40px 80px -30px rgb(0 0 0/.55);transform:rotate(4deg);padding:36px 32px;color:#101828}
.card .hi{font-family:'Fixel Display';font-weight:600;font-size:20px}
.line{height:12px;border-radius:6px;background:#eaecf0;margin-top:14px}
.gap{height:22px}
.caret{display:inline-block;width:3px;height:20px;background:#099250;vertical-align:-3px;margin-left:4px}
.chip{position:absolute;right:360px;bottom:70px;background:#fff;color:#101828;border-radius:999px;padding:14px 22px;
font-weight:500;font-size:20px;display:flex;gap:10px;align-items:center;box-shadow:0 20px 40px -18px rgb(0 0 0/.5)}
.dot{width:12px;height:12px;border-radius:50%;background:#099250}
</style></head><body>
<div class="copy"><div class="brand"><span class="mark">${MARK}</span>Alt+Shift</div>
<h1>A personal cover letter for every job, in seconds</h1>
<p>Describe the role. Watch the letter write itself — from your facts only.</p></div>
<div class="card"><div class="hi">Dear Northwind Team,</div><div class="gap"></div>
<div class="line" style="width:100%"></div><div class="line" style="width:92%"></div><div class="line" style="width:97%"></div><div class="line" style="width:60%"></div>
<div class="gap"></div><div class="line" style="width:95%"></div><div class="line" style="width:100%"></div><div class="line" style="width:84%"></div>
<div class="gap"></div><div class="line" style="width:90%"></div><div class="line" style="width:48%;display:inline-block"></div><span class="caret"></span></div>
<div class="chip"><span class="dot"></span>Writing…</div>
</body></html>`

function iconPage(size: number): string {
	const inset = Math.round(size * 0.14)

	return `<!doctype html><html><head><style>*{margin:0}body{width:${size}px;height:${size}px;background:#fff;display:grid;place-items:center}
svg{width:${size - inset * 2}px;height:${size - inset * 2}px}</style></head><body>${MARK}</body></html>`
}

// ═══════════════════════════════════════════════════════════════════════════
//   An .ico is a tiny directory of images, and a PNG may be stored in it
//   whole — every browser that still probes /favicon.ico reads that — so
//   one 32×32 PNG with a six-byte header and a sixteen-byte entry is a valid
//   icon, with no image library to install for it.
// ═══════════════════════════════════════════════════════════════════════════
function pngToIco(png: Buffer, size: number): Buffer {
	const header = Buffer.alloc(6)
	header.writeUInt16LE(0, 0)
	header.writeUInt16LE(1, 2)
	header.writeUInt16LE(1, 4)

	const entry = Buffer.alloc(16)
	entry.writeUInt8(size, 0)
	entry.writeUInt8(size, 1)
	entry.writeUInt16LE(1, 4)
	entry.writeUInt16LE(32, 6)
	entry.writeUInt32LE(png.length, 8)
	entry.writeUInt32LE(header.length + entry.length, 12)

	return Buffer.concat([header, entry, png])
}

const browser = await chromium.launch()

async function render(html: string, width: number, height: number) {
	const page = await browser.newPage({ viewport: { height, width } })
	await page.setContent(html)
	await page.evaluate(() => document.fonts.ready)
	const png = await page.screenshot({ type: 'png' })
	await page.close()
	return png
}

writeFileSync(join(publicDir, 'og-image.png'), await render(OG_CARD, 1200, 630))

for (const [file, size] of [
	['apple-touch-icon.png', 180],
	['icon-192.png', 192],
	['icon-512.png', 512],
] as const) {
	writeFileSync(join(publicDir, file), await render(iconPage(size), size, size))
}

writeFileSync(
	join(publicDir, 'favicon.ico'),
	pngToIco(await render(iconPage(32), 32, 32), 32),
)

await browser.close()

console.info('brand assets written to public/')
