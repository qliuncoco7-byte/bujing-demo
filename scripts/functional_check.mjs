import assert from 'node:assert/strict'
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
page.on('response', (response) => {
  if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`)
})

const wait = (ms) => page.waitForTimeout(ms)
const shot = async (name) => {
  await page.screenshot({ path: `${outDir}/${name}.png` })
  console.log(`shot: ${name}`)
}
const check = (name, condition) => {
  assert.ok(condition, name)
  console.log(`ok: ${name}`)
}

const baseUrl = process.env.BUJING_URL ?? 'http://localhost:5173/'
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await wait(500)

// 1. Initial state and playback
check('project name rendered', (await page.textContent('.project-title strong')) === '城市里的树')
check('neutral gap is visible on timeline', (await page.locator('.timeline-gap').count()) === 1)
check('neutral gap label', (await page.locator('.timeline-gap').innerText()).includes('空档'))
check('persistent 补镜 entry visible', (await page.locator('.shot-entry').count()) === 1)
check('no preset task coach', (await page.locator('.coach-chip').count()) === 0)
check('first-visit entry hint shown', (await page.locator('.entry-hint').count()) === 1)
await page.locator('.transport-play').click()
await wait(1200)
check('entry hint dismissed after first action', (await page.locator('.entry-hint').count()) === 0)
const timeAfterPlay = await page.locator('.time-readout b').innerText()
check('timeline time advances', timeAfterPlay !== '00:00.0')
const audioState = await page.locator('audio').evaluate((el) => ({
  paused: el.paused,
  currentTime: el.currentTime,
  duration: el.duration,
}))
console.log('audio state:', audioState)
check('narration audio is loaded', audioState.duration > 10)
await page.locator('.transport-play').click()

// 2. Active entry -> panel
await page.locator('.shot-entry').click()
await wait(350)
check('panel opened from persistent entry', await page.locator('.side-panel').isVisible())
check('gap selected from entry', (await page.locator('.timeline-context').innerText()).includes('空档'))
check('no red warning before typing', (await page.locator('.panel-section .inline-warning').count()) === 0)
await shot('24-panel-empty-state')
await page.getByRole('button', { name: /填入示例/ }).click()
check(
  'example requirement filled',
  (await page.locator('.demand-input').inputValue()) === '风吹树冠，不要人物。',
)

// 3. Analysis on -> editable summary -> off -> manual
await page.getByRole('switch', { name: '参考原片匹配' }).click()
await wait(1200)
check('analysis summary shown', (await page.locator('.analysis-result').count()) === 1)
check('reference thumbnails shown', (await page.locator('.reference-thumb canvas').count()) === 2)
check(
  'analysis form is comic',
  (await page.locator('.analysis-row select').nth(1).inputValue()) === 'comic',
)
await page.getByRole('switch', { name: '参考原片匹配' }).click()
await wait(200)
check('manual style visible after skip', await page.locator('.manual-style').isVisible())
const conditionsAfterOff = await page.locator('.conditions-strip').innerText()
check('auto conditions no longer applied', conditionsAfterOff.includes('形式不限'))
await page.locator('.manual-field select').first().selectOption('comic')
await wait(200)
check('manual conditions applied', (await page.locator('.conditions-strip').innerText()).includes('漫画'))

// 4. Out-of-scope input
await page.locator('.demand-input').fill('一只猫在屋顶晒太阳')
await page.getByRole('tab', { name: /AI 生成/ }).click()
await wait(250)
check('scope warning shown', (await page.locator('.inline-warning.compact').count()) === 1)
check(
  'generate disabled out of scope',
  await page.getByRole('button', { name: /生成候选镜头/ }).isDisabled(),
)
await shot('25-out-of-scope')
await page.locator('.demand-input').fill('风吹树冠，不要人物。')
await wait(200)

// 5. Generate, switch away while loading, then return to the result
await page.getByRole('button', { name: /生成候选镜头/ }).click()
await wait(300)
check('generation loading state shown', await page.locator('.generating-card').isVisible())
await page.getByRole('tab', { name: /素材库/ }).click()
await wait(2200)
check('library tab stays interactive', await page.locator('.candidate-list').isVisible())
check('unseen result indicator shown', (await page.locator('.path-tab .tab-dot').count()) >= 1)
await page.getByRole('tab', { name: /AI 生成/ }).click()
await wait(500)
check('generated result shown', (await page.locator('.generated-result').count()) === 1)
check(
  'requirement preserved across tabs',
  (await page.locator('.demand-input').inputValue()) === '风吹树冠，不要人物。',
)
await shot('26-generated-auto-reveal')

// 6. Candidate single preview and context preview
await page.getByRole('tab', { name: /素材库/ }).click()
await wait(250)
const cards = page.locator('.candidate-card')
await cards.nth(0).getByRole('button', { name: '单独预览', exact: true }).click()
await wait(300)
check('candidate mode label', (await page.locator('.clip-chip').innerText()).includes('候选预览'))
await shot('27-real-candidate-preview')
await cards.nth(0).getByRole('button', { name: /放入片段预览/ }).click()
await wait(300)
check('context preview action visible', await page.locator('.context-actions').isVisible())
await page.locator('.context-actions .btn-primary').click()
await wait(800)
check('inserted clip in timeline', (await page.locator('.timeline-clip.is-inserted').count()) === 1)
check('gap removed from timeline', (await page.locator('.timeline-gap').count()) === 0)
await shot('28-inserted-check')

// 7. Keyboard undo
await page.keyboard.press('Meta+z')
await wait(400)
check('keyboard undo restores gap', (await page.locator('.timeline-gap').count()) === 1)

// 8. Replace flow + toast undo
await page.locator('.timeline-gap').click()
await wait(200)
await page.locator('.timeline-context .btn-primary').click()
await wait(300)
await page.getByRole('button', { name: /填入示例/ }).click()
await cards.nth(2).getByRole('button', { name: /放入片段预览/ }).click()
await wait(300)
await page.locator('.context-actions .btn-primary').click()
await wait(600)
check('first clip inserted', (await page.locator('.timeline-clip.is-inserted').count()) === 1)
await page.locator('.timeline-clip.is-inserted').click()
await wait(250)
await page.getByRole('button', { name: '替换', exact: true }).click()
await wait(250)
check('replace panel title', (await page.textContent('.panel-head h1')).includes('替换'))
await page.getByRole('tab', { name: /素材库/ }).click()
await wait(200)
await cards.nth(1).getByRole('button', { name: /放入片段预览/ }).click()
await wait(300)
await page.locator('.context-actions .btn-primary').click()
await wait(600)
check('replacement inserted', (await page.locator('.timeline-clip.is-inserted .clip-copy strong').innerText()).includes('强风'))
await page.locator('.toast-action').click()
await wait(400)
check(
  'toast undo restores previous clip',
  (await page.locator('.timeline-clip.is-inserted .clip-copy strong').innerText()).includes('微风'),
)

// 9. Reset and failure branch
await page.getByRole('button', { name: '重置示例' }).click()
await wait(250)
await page.getByRole('button', { name: /确认重置/ }).click()
await wait(500)
check('reset restores gap', (await page.locator('.timeline-gap').count()) === 1)
check('reset closes panel', !(await page.locator('.side-panel').isVisible()))
await page.locator('.shot-entry').click()
await wait(250)
await page.getByRole('button', { name: /填入示例/ }).click()
await page.getByRole('tab', { name: /AI 生成/ }).click()
await wait(200)
await page.getByRole('switch', { name: '下一次生成失败' }).click()
await page.getByRole('button', { name: /生成候选镜头/ }).click()
await wait(2400)
check('failure card shown', await page.locator('.error-card').isVisible())
check('requirement retained after failure', (await page.locator('.demand-input').inputValue()).length > 0)
await shot('29-failure-check')
await page.getByRole('button', { name: '重试', exact: true }).click()
await wait(2300)
check('retry produces result', (await page.locator('.generated-result').count()) === 1)

console.log('\nConsole / network errors:')
console.log(errors.length ? errors.join('\n') : 'none')
await browser.close()
