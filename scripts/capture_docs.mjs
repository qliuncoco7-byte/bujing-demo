import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const base = 'http://localhost:4173/'
const out = path.resolve('docs/assets')
await mkdir(out, { recursive: true })

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})
await page.addInitScript(() => {
  try {
    localStorage.setItem('bujing-entry-hint-seen', '1')
  } catch {
    // ignore
  }
})
const wait = (ms) => page.waitForTimeout(ms)
const shot = async (name) => {
  await page.screenshot({ path: path.join(out, `${name}.png`) })
  console.log(name)
}

await page.goto(base, { waitUntil: 'networkidle' })
await wait(600)
await shot('overview')

await page.locator('.timeline-gap').click()
await wait(350)
await shot('gap')

await page.locator('.timeline-context .btn-primary').click()
await wait(400)
await page.getByRole('button', { name: /填入示例/ }).click()
await page.getByRole('switch', { name: '参考原片匹配' }).click()
await wait(1150)
await page.locator('.panel-scroll').evaluate((el) => (el.scrollTop = 140))
await wait(250)
await shot('panel-analysis')

await page.locator('.panel-scroll').evaluate((el) => (el.scrollTop = el.scrollHeight))
await wait(250)
await shot('panel-library')

const cards = page.locator('.candidate-card')
await cards.nth(0).getByRole('button', { name: /放入片段预览/ }).click()
await wait(3200)
await shot('context-real')

await page.locator('.context-actions .btn-secondary').click()
await wait(300)
await cards.nth(2).getByRole('button', { name: /放入片段预览/ }).click()
await wait(3200)
await shot('context-best')
await page.locator('.context-actions .btn-primary').click()
await wait(900)
await page.locator('.toast-close').click().catch(() => {})
await wait(450)
await shot('inserted')

// Generated result for the AI page.
await page.locator('.timeline-clip.is-inserted').click()
await wait(250)
await page.locator('.timeline-context button', { hasText: '替换' }).click()
await wait(300)
await page.getByRole('tab', { name: /AI 生成/ }).click()
await wait(250)
await page.getByRole('button', { name: /生成候选镜头/ }).click()
await wait(2400)
await page.getByRole('button', { name: /树摆动太剧烈/ }).click()
await wait(150)
await page.getByRole('button', { name: /按修改重新生成/ }).click()
await wait(2100)
await shot('generated')
await page.locator('.generated-actions .btn-primary').click()
await wait(1000)
await shot('generated-context')
await page.locator('.context-actions .btn-primary').click()
await wait(900)
await page.locator('.toast-close').click().catch(() => {})
await wait(450)
await shot('generated-inserted')

await browser.close()
