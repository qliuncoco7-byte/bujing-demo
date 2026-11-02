import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const outDir = '/tmp/bujing-shots'
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({
  executablePath:
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})

const errors = []
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`)
})
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))

const shot = async (name, scope = page) => {
  await scope.screenshot({ path: `${outDir}/${name}.png` })
  console.log(`shot: ${name}`)
}
const wait = (ms) => page.waitForTimeout(ms)

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await wait(900)
await shot('01-initial')

// Select the missing 4 s range and open the panel.
await page.locator('.timeline-gap').click()
await wait(350)
await shot('02-gap-selected')
await page.locator('.timeline-context .btn-primary').click()
await wait(500)
await shot('03-panel-open')

// Fill the example requirement and enable analysis.
await page.getByRole('button', { name: /填入示例/ }).click()
await wait(200)
await page.getByRole('switch', { name: '参考原片匹配' }).click()
await wait(300)
await shot('04-analysis-loading')
await wait(1100)
await shot('05-analysis-ready')
await page.locator('.panel-scroll').evaluate((el) => (el.scrollTop = 0))
await wait(100)

// Live-action-looking candidate, in context.
const cards = page.locator('.candidate-card')
await cards.nth(0).getByRole('button', { name: /放入片段预览/ }).click()
await wait(1200)
await shot('06-context-live-action')
await page.locator('.context-actions .btn-secondary').click()
await wait(300)

// Strong wind comic candidate, alone.
await cards.nth(1).getByRole('button', { name: '单独预览', exact: true }).click()
await wait(900)
await shot('07-candidate-strong-wind')

// Best library candidate, in context, then insert.
await cards.nth(2).getByRole('button', { name: /放入片段预览/ }).click()
await wait(1000)
await shot('08-context-best')
await page.locator('.context-actions .btn-primary').click()
await wait(1300)
await shot('09-inserted')
await page.locator('.toast-action').click()
await wait(600)
await shot('10-undone')

// Re-open and switch to AI generation.
await page.locator('.timeline-context .btn-primary').click()
await wait(400)
await page.getByRole('tab', { name: /AI 生成/ }).click()
await wait(300)
await page.locator('.panel-scroll').evaluate((el) => (el.scrollTop = el.scrollHeight))
await wait(150)
await shot('11-ai-empty')
await page.getByRole('button', { name: /生成候选镜头/ }).click()
await wait(500)
await shot('12-ai-generating')
await wait(2000)
await shot('13-ai-v1')

// Refine to breeze and regenerate.
await page.getByRole('button', { name: /树摆动太剧烈/ }).click()
await wait(200)
await page.getByRole('button', { name: /按修改重新生成/ }).click()
await wait(2100)
await shot('14-ai-v2')

// Insert the generated result via context preview.
await page.locator('.generated-actions .btn-primary').click()
await wait(900)
await page.locator('.context-actions .btn-primary').click()
await wait(1300)
await shot('15-ai-inserted')

// Replace with a library candidate, then undo the replacement.
await page.locator('.timeline-clip.is-inserted').click()
await wait(300)
await page.locator('.timeline-context button', { hasText: '替换' }).click()
await wait(500)
await shot('16-replace-panel')
await page.getByRole('tab', { name: /素材库/ }).click()
await wait(250)
await cards.nth(0).getByRole('button', { name: /放入片段预览/ }).click()
await wait(900)
await page.locator('.context-actions .btn-primary').click()
await wait(1000)
await shot('17-replaced')
await page.locator('.toast-action').click()
await wait(600)
await shot('18-undo-replace')

// Reset the demo.
await page.getByRole('button', { name: '重置示例' }).click()
await wait(300)
await shot('19-reset-dialog')
await page.getByRole('button', { name: /确认重置/ }).click()
await wait(600)
await shot('20-after-reset')

// Failure branch from a fresh state.
await page.locator('.timeline-gap').click()
await wait(250)
await page.locator('.timeline-context .btn-primary').click()
await wait(350)
await page.getByRole('button', { name: /填入示例/ }).click()
await page.getByRole('tab', { name: /AI 生成/ }).click()
await wait(250)
await page.getByRole('switch', { name: '下一次生成失败' }).click()
await page.locator('.panel-scroll').evaluate((el) => (el.scrollTop = el.scrollHeight))
await wait(100)
await page.getByRole('button', { name: /生成候选镜头/ }).click()
await wait(2400)
await shot('21-generation-failure')
await page.getByRole('button', { name: '重试', exact: true }).click()
await wait(2400)
await shot('22-retry-success')

// Mobile-ish narrow layout sanity check.
await page.setViewportSize({ width: 1180, height: 800 })
await wait(500)
await shot('23-narrow')

console.log('\nErrors:')
console.log(errors.length ? errors.join('\n') : 'none')
await browser.close()
