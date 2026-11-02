import { chromium } from 'playwright-core'
import { mkdir, writeFile, copyFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const outDir = path.resolve('deliverables')
const videoDir = '/tmp/bujing-video'
await mkdir(outDir, { recursive: true })
await mkdir(videoDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required'],
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } },
})
const page = await context.newPage()
page.setDefaultTimeout(20000)
const wait = (ms) => page.waitForTimeout(ms)
const script = []
let t0 = 0

const overlayCss = `
  #demo-intro { position: fixed; inset: 0; z-index: 2147483000; display: grid; place-items: center;
    background: radial-gradient(circle at 50% 42%, rgba(32,28,20,.92), rgba(8,9,11,.97));
    color: #fff8e8; opacity: 0; pointer-events: none; transition: opacity .55s ease; }
  #demo-intro.is-visible { opacity: 1; }
  .demo-intro-card { text-align: center; }
  .demo-intro-mark { width: 62px; height: 62px; margin: 0 auto 18px; border-radius: 18px;
    display: grid; place-items: center; color: #221b0b; background: linear-gradient(145deg,#ffd782,#f5c15a);
    font-size: 30px; box-shadow: 0 18px 50px rgba(245,193,90,.25); }
  .demo-intro-card h1 { margin: 0; font-size: 52px; letter-spacing: .14em; font-weight: 700; }
  .demo-intro-card p { margin: 14px 0 0; color: rgba(255,248,232,.68); font-size: 16px; letter-spacing: .02em; }
  .demo-intro-card small { display: block; margin-top: 22px; color: rgba(255,248,232,.38);
    font-size: 11px; letter-spacing: .08em; }
  #demo-caption { position: fixed; top: 84px; left: 250px; z-index: 2147483000;
    transform: translateY(-6px); max-width: 470px; padding: 9px 16px; border-radius: 10px;
    background: rgba(14,15,18,.9); border: 1px solid rgba(245,193,90,.3);
    box-shadow: 0 12px 30px rgba(0,0,0,.3); color: #fff8e8; font-size: 14px; line-height: 1.5;
    letter-spacing: .01em; opacity: 0; pointer-events: none;
    transition: opacity .28s ease, transform .28s ease; white-space: normal; }
  #demo-caption.is-visible { opacity: 1; transform: translateY(0); }
  #demo-caption .step { color: #f5c15a; font-weight: 700; margin-right: 7px; }
  #demo-cursor { position: fixed; left: -50px; top: -50px; z-index: 2147483001; width: 21px; height: 21px;
    margin: -10.5px 0 0 -10.5px; border-radius: 50%; pointer-events: none;
    background: rgba(245,193,90,.96); border: 2px solid #201d22;
    box-shadow: 0 3px 10px rgba(0,0,0,.4), 0 0 0 4px rgba(255,248,232,.24), 0 0 0 8px rgba(245,193,90,.12);
    transition: left .3s cubic-bezier(.2,.8,.2,1), top .3s cubic-bezier(.2,.8,.2,1); }
  .demo-ripple { position: fixed; z-index: 2147483000; width: 18px; height: 18px; margin: -9px 0 0 -9px;
    border-radius: 50%; border: 2px solid rgba(245,193,90,.85); pointer-events: none;
    animation: demoRipple .55s ease-out forwards; }
  @keyframes demoRipple { from { transform: scale(.5); opacity: .9; } to { transform: scale(2.8); opacity: 0; } }
`

async function injectOverlay() {
  await page.evaluate((css) => {
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
    const intro = document.createElement('div')
    intro.id = 'demo-intro'
    intro.innerHTML = `
      <div class="demo-intro-card">
        <div class="demo-intro-mark">叶</div>
        <h1>补镜</h1>
        <p>在剪辑时间线上，补一段能用的镜头</p>
        <small>交互 DEMO · 解析、检索与生成均为预制示例</small>
      </div>`
    document.body.appendChild(intro)
    const caption = document.createElement('div')
    caption.id = 'demo-caption'
    caption.innerHTML = '<span class="step"></span><span class="text"></span>'
    document.body.appendChild(caption)
    const cursor = document.createElement('div')
    cursor.id = 'demo-cursor'
    document.body.appendChild(cursor)
  }, overlayCss)
}

async function showIntro() {
  await page.evaluate(() => document.getElementById('demo-intro')?.classList.add('is-visible'))
}
async function hideIntro() {
  await page.evaluate(() => document.getElementById('demo-intro')?.classList.remove('is-visible'))
}
async function setCaption(step, text, voice) {
  const at = (Date.now() - t0) / 1000
  if (voice) script.push({ at, step, text, voice })
  await page.evaluate(
    ({ step, text }) => {
      const caption = document.getElementById('demo-caption')
      if (!caption) return
      caption.classList.remove('is-visible')
      const stepEl = caption.querySelector('.step')
      const textEl = caption.querySelector('.text')
      if (stepEl) stepEl.textContent = step
      if (textEl) textEl.textContent = text
      window.setTimeout(() => caption.classList.add('is-visible'), 40)
    },
    { step, text },
  )
}
async function moveCursor(x, y) {
  await page.evaluate(
    ({ x, y }) => {
      const cursor = document.getElementById('demo-cursor')
      if (!cursor) return
      cursor.style.left = `${x}px`
      cursor.style.top = `${y}px`
    },
    { x, y },
  )
}
async function ripple(x, y) {
  await page.evaluate(
    ({ x, y }) => {
      const dot = document.createElement('div')
      dot.className = 'demo-ripple'
      dot.style.left = `${x}px`
      dot.style.top = `${y}px`
      document.body.appendChild(dot)
      window.setTimeout(() => dot.remove(), 650)
    },
    { x, y },
  )
}
async function clickEl(locator) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  if (box) {
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await moveCursor(x, y)
    await wait(320)
    await ripple(x, y)
  }
  await locator.click()
  await wait(150)
}
async function scrollPanel(to = 'bottom') {
  await page.locator('.panel-scroll').evaluate((el, to) => {
    el.scrollTo({ top: to === 'bottom' ? el.scrollHeight : 0, behavior: 'smooth' })
  }, to)
  await wait(900)
}

try {
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await wait(700)
  await injectOverlay()
  await wait(250)
  t0 = Date.now()
  await showIntro()
  script.push({
    at: 0.8,
    step: '',
    text: '片头',
    voice: '这是补镜，一个在剪辑时间线上补辅助画面的功能。',
  })
  await wait(4700)
  await hideIntro()
  await wait(650)

  await setCaption(
    '',
    '预设项目：15 秒漫画风城市科普',
    '预设项目是一段十五秒的漫画风城市科普视频，口播已经完成。',
  )
  await wait(800)
  await clickEl(page.locator('.transport-play'))
  await wait(3300)
  await clickEl(page.locator('.transport-play'))
  await wait(900)

  await setCaption(
    '①',
    '点击 4 秒待补区间',
    '中间有一段四秒的辅助画面还没补。点击时间线上的待补区间。',
  )
  await clickEl(page.locator('.timeline-gap'))
  await wait(4200)

  await setCaption(
    '②',
    '需求、时长、画幅从区间带入',
    '四秒时长、十六比九画幅和连续口播，会从区间自动带入补镜面板。',
  )
  await clickEl(page.locator('.gap-actions .btn-primary'))
  await wait(2200)

  await setCaption('', '使用示例需求：风吹树冠，不要人物', '输入画面需求：风吹树冠，不要人物。这里提供示例快捷入口。')
  await clickEl(page.getByRole('button', { name: /填入示例/ }))
  await wait(2600)

  await setCaption(
    '③',
    '可选：参考前后镜头',
    '原片参考默认关闭，跳过也能继续。开启后会对比前后相邻镜头，提取视频类型、表现形式和氛围。',
  )
  await clickEl(page.getByRole('switch', { name: '参考原片匹配' }))
  await wait(2800)

  await setCaption(
    '',
    '摘要可修改；关闭后不再用于新的请求',
    '摘要可以逐项修改或关闭。关闭后新的请求不再使用自动条件，已有结果不会删除。',
  )
  await wait(2800)
  await scrollPanel('bottom')

  await setCaption(
    '④',
    '候选标注来源、属性与许可',
    '素材库候选会显示来源、实拍或合成属性，以及许可说明。',
  )
  await wait(2600)
  const cards = page.locator('.candidate-card')
  await clickEl(cards.nth(0).getByRole('button', { name: /放入片段预览/ }))
  await setCaption(
    '',
    '对象匹配，但表达不匹配',
    '这条实拍观感素材有树冠，对象匹配，但写实影调和强风与漫画项目不协调。',
  )
  await wait(6900)

  await clickEl(page.locator('.context-actions .btn-secondary'))
  await wait(700)
  await clickEl(cards.nth(2).getByRole('button', { name: /放入片段预览/ }))
  await setCaption(
    '⑤',
    '放回前后镜头，判断是否协调',
    '换成漫画、微风候选，把前镜头、候选和后镜头连续播放。预览不会改动正式时间线。',
  )
  await wait(7200)

  await setCaption(
    '⑥',
    '确认后补入，口播保持连续',
    '确认后插入四秒区间，主预览和时间线同步更新，口播保持连续。',
  )
  await clickEl(page.locator('.context-actions .btn-primary'))
  await wait(6100)

  await setCaption(
    '',
    '插入可撤销、可替换',
    '结果不满意，可以撤销或替换，原项目不会丢失。',
  )
  await clickEl(page.locator('.timeline-context .btn-ghost'))
  await wait(3800)
  await page.locator('.toast-close').click().catch(() => {})
  await wait(500)

  await clickEl(page.locator('.timeline-context .btn-primary'))
  await wait(800)
  await clickEl(page.getByRole('tab', { name: /AI 生成/ }))
  await setCaption(
    '⑦',
    'AI 生成：先确认，再加载',
    '再走生成路径。切换页签不会自动开始；点击生成才进入加载，加载时仍可切回素材库。',
  )
  await wait(1200)
  await clickEl(page.getByRole('button', { name: /生成候选镜头/ }))
  await wait(3000)

  await setCaption(
    '',
    '第一版：构图可用，风力偏强',
    '这是预制生成的第一版。树冠和漫画形式可用，但风的摆动比预期剧烈。',
  )
  await wait(4300)
  await clickEl(page.getByRole('button', { name: /树摆动太剧烈/ }))
  await setCaption(
    '',
    '一句话修改：强风改微风，其他保持',
    '用一句话修改：树摆动太剧烈，改成微风，其他保持。',
  )
  await wait(1100)
  await clickEl(page.getByRole('button', { name: /按修改重新生成/ }))
  await wait(2900)

  await setCaption(
    '',
    '第二版保持构图与光线，只减弱风力',
    '第二版保持构图与光线，只把风力减弱。',
  )
  await wait(4400)
  await clickEl(page.locator('.generated-actions .btn-primary'))
  await setCaption(
    '⑧',
    '生成结果也先放回上下文',
    '生成结果同样先放回上下文确认，再决定是否替换。',
  )
  await wait(6200)

  await setCaption('', '替换当前画面，仍可撤销', '替换当前四秒画面，仍然可以撤销。')
  await clickEl(page.locator('.context-actions .btn-primary'))
  await wait(4500)

  // Reset and show the failure branch.
  await clickEl(page.getByRole('button', { name: '重置示例' }))
  await wait(700)
  await clickEl(page.getByRole('button', { name: /确认重置/ }))
  await wait(2100)
  await setCaption(
    '⑨',
    '失败可以独立演示',
    '重置后可以重新体验。失败状态通过独立演示开关触发，不在主流程随机失败。',
  )
  await clickEl(page.locator('.timeline-gap'))
  await wait(700)
  await clickEl(page.locator('.gap-actions .btn-primary'))
  await wait(700)
  await clickEl(page.getByRole('button', { name: /填入示例/ }))
  await clickEl(page.getByRole('tab', { name: /AI 生成/ }))
  await wait(500)
  await clickEl(page.getByRole('switch', { name: '下一次生成失败' }))
  await wait(500)
  await clickEl(page.getByRole('button', { name: /生成候选镜头/ }))
  await wait(2600)
  await setCaption(
    '',
    '失败保留需求与风格条件',
    '这次生成失败，但需求、时长和风格条件都保留。可以重试，或改用素材库。',
  )
  await wait(4200)
  await clickEl(page.getByRole('button', { name: '重试', exact: true }))
  await wait(2600)
  await setCaption('', '重试后得到预制结果', '重试后得到预制结果。')
  await wait(3800)

  await clickEl(page.getByRole('button', { name: '重置示例' }))
  await wait(500)
  await clickEl(page.getByRole('button', { name: /确认重置/ }))
  await wait(1400)
  await setCaption(
    '',
    '交互 Demo · 解析、检索与生成均为预制示例',
    '本 Demo 的所有解析、检索和生成都使用预制示例，不上传原片，也不调用真实模型。',
  )
  await wait(5700)
  await page.evaluate(() => {
    const caption = document.getElementById('demo-caption')
    if (caption) caption.classList.remove('is-visible')
    const cursor = document.getElementById('demo-cursor')
    if (cursor) cursor.style.left = '-50px'
  })
  await wait(700)
} finally {
  const video = page.video()
  await context.close()
  await writeFile(
    path.resolve('docs/video-script.json'),
    JSON.stringify(
      { recordedAt: new Date().toISOString(), durationHint: (Date.now() - t0) / 1000, lines: script },
      null,
      2,
    ),
  )
  if (video) {
    try {
      await video.saveAs(path.join(outDir, 'bujing-demo.webm'))
      console.log('saved video')
    } catch (error) {
      console.error('saveAs failed, trying newest temp video', error)
      const files = (await readdir(videoDir))
        .filter((name) => name.endsWith('.webm'))
        .map((name) => path.join(videoDir, name))
      if (files.length) await copyFile(files[files.length - 1], path.join(outDir, 'bujing-demo.webm'))
    }
  }
  await browser.close()
  console.log('script lines:', script.length)
}
