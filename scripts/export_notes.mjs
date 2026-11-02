import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const source = path.resolve(process.argv[2] ?? 'docs/产品说明.html')
const output = path.resolve(
  process.argv[3] ?? 'public/deliverables/bujing-product-notes.pdf',
)
await mkdir(path.dirname(output), { recursive: true })

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 794, height: 1123 } })
await page.goto(pathToFileURL(source).href, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
const pageCount = await page.locator('.page').count()
await page.pdf({
  path: output,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '0', bottom: '0', left: '0', right: '0' },
})
console.log(`exported ${pageCount} document page blocks -> ${output}`)
await browser.close()
