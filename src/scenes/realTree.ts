import { NATURAL } from './palette'
import { H, W, clamp, seeded } from './utils'

type Sprite = HTMLCanvasElement

const spriteCache = new Map<string, Sprite>()
let noisePattern: CanvasPattern | null = null

function makeFoliageSprite(seed: number, size: number): Sprite {
  const cacheKey = `foliage-${seed}-${size}`
  const cached = spriteCache.get(cacheKey)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = Math.round(size * 0.74)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const rand = seeded(seed)
  const palette = [
    NATURAL.foliageDark,
    NATURAL.foliage,
    NATURAL.foliageLight,
    NATURAL.foliageWarm,
  ]

  // Soft, irregular mass of leaves with no ink outline.
  for (let i = 0; i < 180; i += 1) {
    const angle = rand() * Math.PI * 2
    const dist = Math.sqrt(rand())
    const x = canvas.width / 2 + Math.cos(angle) * dist * canvas.width * 0.42
    const y = canvas.height / 2 + Math.sin(angle) * dist * canvas.height * 0.36
    const rx = 9 + rand() * 22
    const ry = rx * (0.38 + rand() * 0.32)
    const base = palette[Math.floor(rand() * palette.length)]
    const grad = ctx.createRadialGradient(
      x - rx * 0.25,
      y - ry * 0.4,
      ry * 0.15,
      x,
      y,
      rx,
    )
    grad.addColorStop(0, rand() > 0.55 ? 'rgba(190, 198, 136, 0.92)' : base)
    grad.addColorStop(1, 'rgba(34, 51, 34, 0.92)')
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((rand() - 0.5) * 2)
    ctx.fillStyle = grad
    ctx.globalAlpha = 0.55 + rand() * 0.35
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    // leaf midrib
    if (rand() > 0.6) {
      ctx.strokeStyle = 'rgba(38, 56, 38, 0.25)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(-rx * 0.7, 0)
      ctx.lineTo(rx * 0.7, 0)
      ctx.stroke()
    }
    ctx.restore()
  }

  // Sparse highlights toward the light side.
  for (let i = 0; i < 26; i += 1) {
    const x = canvas.width * (0.45 + rand() * 0.5)
    const y = canvas.height * (0.08 + rand() * 0.45)
    ctx.fillStyle = `rgba(186, 196, 129, ${0.08 + rand() * 0.18})`
    ctx.beginPath()
    ctx.ellipse(x, y, 8 + rand() * 18, 3 + rand() * 8, rand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  // A few crisper leaves on top read as in-focus detail against the soft depth.
  for (let i = 0; i < 46; i += 1) {
    const x = canvas.width * (0.3 + rand() * 0.65)
    const y = canvas.height * (0.08 + rand() * 0.62)
    const rx = 4 + rand() * 10
    const ry = rx * (0.35 + rand() * 0.3)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rand() * Math.PI)
    ctx.globalAlpha = 0.5 + rand() * 0.4
    ctx.fillStyle = palette[Math.floor(rand() * palette.length)]
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    if (rand() > 0.45) {
      ctx.strokeStyle = 'rgba(44, 58, 38, 0.35)'
      ctx.lineWidth = 0.7
      ctx.stroke()
    }
    ctx.restore()
  }

  spriteCache.set(cacheKey, canvas)
  return canvas
}

function makeBokehSprite(seed: number): Sprite {
  const cacheKey = `bokeh-${seed}`
  const cached = spriteCache.get(cacheKey)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = 180
  canvas.height = 180
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const rand = seeded(seed)
  const grad = ctx.createRadialGradient(90, 90, 10, 90, 90, 82)
  grad.addColorStop(0, 'rgba(219, 222, 176, 0.28)')
  grad.addColorStop(0.72, 'rgba(210, 216, 174, 0.14)')
  grad.addColorStop(1, 'rgba(210, 216, 174, 0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(90, 90, 84, 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = `rgba(255, 247, 214, ${0.03 + rand() * 0.05})`
    ctx.beginPath()
    ctx.arc(40 + rand() * 100, 40 + rand() * 100, 8 + rand() * 18, 0, Math.PI * 2)
    ctx.fill()
  }
  spriteCache.set(cacheKey, canvas)
  return canvas
}

function getNoisePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (noisePattern) return noisePattern
  const tile = document.createElement('canvas')
  tile.width = 140
  tile.height = 140
  const tctx = tile.getContext('2d')
  if (!tctx) return null
  const image = tctx.createImageData(tile.width, tile.height)
  const rand = seeded(1001)
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.floor(rand() * 255)
    image.data[i] = value
    image.data[i + 1] = value
    image.data[i + 2] = value
    image.data[i + 3] = 22 + Math.floor(rand() * 24)
  }
  tctx.putImageData(image, 0, 0)
  noisePattern = ctx.createPattern(tile, 'repeat')
  return noisePattern
}

function drawSoftCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  alpha: number,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.globalAlpha = alpha
  const gradient = ctx.createRadialGradient(0, 0, 8, 0, 0, 140)
  gradient.addColorStop(0, 'rgba(255, 252, 242, 0.9)')
  gradient.addColorStop(0.55, 'rgba(255, 250, 238, 0.4)')
  gradient.addColorStop(1, 'rgba(255, 250, 238, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.ellipse(0, 0, 170, 64, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(-70, 14, 90, 44, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(76, 12, 100, 40, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawBackground(ctx: CanvasRenderingContext2D, t: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, NATURAL.skyTop)
  sky.addColorStop(0.55, '#d7dfd9')
  sky.addColorStop(1, NATURAL.skyBottom)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  const sunGlow = ctx.createRadialGradient(1000, 120, 10, 1000, 120, 330)
  sunGlow.addColorStop(0, 'rgba(255, 249, 218, 0.95)')
  sunGlow.addColorStop(0.22, 'rgba(255, 244, 202, 0.5)')
  sunGlow.addColorStop(1, 'rgba(255, 244, 202, 0)')
  ctx.fillStyle = sunGlow
  ctx.fillRect(620, -80, 660, 520)

  drawSoftCloud(ctx, 300 + Math.sin(t * 0.05) * 6, 142, 1.25, 0.7)
  drawSoftCloud(ctx, 640, 82, 0.72, 0.55)
  drawSoftCloud(ctx, 880, 220, 0.5, 0.38)

  // Blurred street behind the tree.
  ctx.save()
  ctx.filter = 'blur(7px)'
  ctx.globalAlpha = 0.78
  const blocks = [
    { x: -30, y: 320, w: 250, h: 300, c: '#a0a59c' },
    { x: 190, y: 360, w: 190, h: 260, c: '#b0aea1' },
    { x: 850, y: 300, w: 240, h: 340, c: '#9fa6a0' },
    { x: 1050, y: 350, w: 220, h: 290, c: '#b5b0a3' },
    { x: 380, y: 405, w: 160, h: 220, c: '#c0b8a6' },
  ]
  for (const block of blocks) {
    ctx.fillStyle = block.c
    ctx.fillRect(block.x, block.y, block.w, block.h)
    ctx.fillStyle = 'rgba(82, 94, 94, 0.3)'
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        ctx.fillRect(block.x + 18 + col * 42, block.y + 22 + row * 48, 20, 26)
      }
    }
  }
  // soft street/pavement
  const ground = ctx.createLinearGradient(0, 560, 0, H)
  ground.addColorStop(0, '#a7a89a')
  ground.addColorStop(1, '#7d7f72')
  ctx.fillStyle = ground
  ctx.fillRect(-20, 560, W + 40, H - 540)
  ctx.fillStyle = 'rgba(52, 56, 50, 0.35)'
  ctx.fillRect(-20, 690, W + 40, 60)
  // moving traffic glow
  ctx.fillStyle = 'rgba(214, 200, 162, 0.45)'
  ctx.fillRect(280 + Math.sin(t * 0.3) * 60, 600, 130, 34)
  ctx.fillRect(880 - Math.sin(t * 0.24) * 50, 618, 170, 30)
  ctx.restore()
}

function drawBranch(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  width: number,
  control?: [number, number],
): void {
  const gradient = ctx.createLinearGradient(from[0], from[1], to[0], to[1])
  gradient.addColorStop(0, NATURAL.trunk)
  gradient.addColorStop(1, NATURAL.trunkLight)
  ctx.beginPath()
  ctx.moveTo(from[0], from[1])
  if (control) {
    ctx.quadraticCurveTo(control[0], control[1], to[0], to[1])
  } else {
    ctx.lineTo(to[0], to[1])
  }
  ctx.strokeStyle = 'rgba(35, 38, 30, 0.55)'
  ctx.lineWidth = width + 5
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.strokeStyle = gradient
  ctx.lineWidth = width
  ctx.stroke()

  // bark texture
  ctx.strokeStyle = 'rgba(44, 42, 32, 0.22)'
  ctx.lineWidth = 1.4
  const rand = seeded(Math.round(from[0] + to[1]))
  for (let i = 0; i < 4; i += 1) {
    const sx = from[0] + rand() * (to[0] - from[0])
    const sy = from[1] + rand() * (to[1] - from[1])
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + 6, sy - 20 - rand() * 30)
    ctx.stroke()
  }
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  wind: number,
  t: number,
): void {
  const sway =
    Math.sin(t * (0.9 + wind * 1.4)) * (0.008 + wind * 0.018) +
    Math.sin(t * 2.1) * wind * 0.006

  ctx.save()
  ctx.translate(360, 800)
  ctx.rotate(sway)
  ctx.translate(-360, -800)

  // main trunk at the left edge
  ctx.beginPath()
  ctx.moveTo(130, 780)
  ctx.bezierCurveTo(180, 650, 214, 470, 268, 300)
  ctx.bezierCurveTo(292, 240, 310, 160, 300, 70)
  ctx.lineTo(370, 60)
  ctx.bezierCurveTo(366, 170, 354, 250, 330, 318)
  ctx.bezierCurveTo(292, 470, 264, 620, 238, 800)
  ctx.closePath()
  const trunkGradient = ctx.createLinearGradient(160, 0, 330, 0)
  trunkGradient.addColorStop(0, '#4b4034')
  trunkGradient.addColorStop(0.5, NATURAL.trunk)
  trunkGradient.addColorStop(1, '#6f5c48')
  ctx.fillStyle = trunkGradient
  ctx.fill()
  ctx.strokeStyle = 'rgba(36, 38, 30, 0.45)'
  ctx.lineWidth = 2
  ctx.stroke()

  drawBranch(ctx, [280, 380], [480, 180], 30, [330, 250])
  drawBranch(ctx, [300, 320], [620, 120], 24, [420, 170])
  drawBranch(ctx, [292, 300], [160, 140], 20, [210, 210])
  drawBranch(ctx, [260, 560], [470, 410], 16, [360, 470])
  ctx.restore()

  // Foliage sprites: back layer first.
  const rand = seeded(1207)
  const back = [
    { x: 320, y: 120, s: 1.18, seed: 21, a: 0.78 },
    { x: 610, y: 80, s: 1.33, seed: 22, a: 0.72 },
    { x: 860, y: 170, s: 1.18, seed: 23, a: 0.65 },
    { x: 450, y: 260, s: 1.25, seed: 24, a: 0.8 },
    { x: 760, y: 320, s: 1.02, seed: 25, a: 0.6 },
    { x: 190, y: 250, s: 1.06, seed: 26, a: 0.7 },
  ]
  for (const item of back) {
    const sprite = makeFoliageSprite(item.seed, 360)
    const phase = rand() * Math.PI * 2
    const dx = Math.sin(t * (1.1 + wind * 2.2) + phase) * (3 + wind * 22)
    const dy = Math.cos(t * (0.9 + wind * 1.8) + phase) * (1 + wind * 8)
    const rot = Math.sin(t * (0.8 + wind) + phase) * (0.004 + wind * 0.02)
    ctx.save()
    ctx.globalAlpha = item.a
    ctx.translate(item.x + dx, item.y + dy)
    ctx.rotate(rot)
    ctx.scale(item.s, item.s)
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2)
    ctx.restore()
  }

  // Near foliage, slightly larger and lighter.
  const front = [
    { x: 380, y: 350, s: 1.18, seed: 31, a: 0.86 },
    { x: 640, y: 390, s: 1.05, seed: 32, a: 0.8 },
    { x: 250, y: 390, s: 0.9, seed: 33, a: 0.7 },
  ]
  for (const item of front) {
    const sprite = makeFoliageSprite(item.seed, 380)
    const phase = rand() * Math.PI * 2
    const dx = Math.sin(t * (1.2 + wind * 2.4) + phase) * (4 + wind * 28)
    const dy = Math.cos(t * (1 + wind * 2) + phase) * (1 + wind * 9)
    const rot = Math.sin(t * (0.9 + wind * 1.2) + phase) * (0.005 + wind * 0.025)
    ctx.save()
    ctx.globalAlpha = item.a
    ctx.translate(item.x + dx, item.y + dy)
    ctx.rotate(rot)
    ctx.scale(item.s, item.s)
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2)
    ctx.restore()
  }
}

function drawWindParticles(
  ctx: CanvasRenderingContext2D,
  wind: number,
  t: number,
): void {
  const rand = seeded(811)
  const count = Math.round(4 + wind * 22)
  for (let i = 0; i < count; i += 1) {
    const startX = 520 + rand() * 760
    const startY = 70 + rand() * 420
    const speed = 40 + rand() * 80 + wind * 130
    const x = startX - ((t * speed + rand() * 300) % 900)
    const y =
      startY +
      Math.sin(t * (1.2 + rand() * 2) + i) * (8 + wind * 26) +
      t * (4 + rand() * 10)
    ctx.save()
    ctx.globalAlpha = 0.35 + rand() * 0.35
    if (wind > 0.55) {
      ctx.strokeStyle = 'rgba(193, 200, 155, 0.28)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(x + 36, y - 2)
      ctx.lineTo(x + 4, y + 4)
      ctx.stroke()
    }
    ctx.fillStyle = i % 3 === 0 ? '#a4a969' : '#7e8d57'
    ctx.translate(x, y)
    ctx.rotate(t * (1 + rand() * 2) + i)
    ctx.beginPath()
    ctx.ellipse(0, 0, 3 + rand() * 4, 1 + rand() * 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  t: number,
  wind: number,
): void {
  // Lens flare from the upper-right sun.
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  const flare = ctx.createRadialGradient(1000, 120, 8, 1000, 120, 170)
  flare.addColorStop(0, 'rgba(255, 252, 230, 0.5)')
  flare.addColorStop(1, 'rgba(255, 252, 230, 0)')
  ctx.fillStyle = flare
  ctx.fillRect(800, -60, 480, 400)
  const flareDots = [
    { x: 870, y: 250, r: 34, a: 0.06 },
    { x: 790, y: 330, r: 18, a: 0.08 },
    { x: 720, y: 400, r: 52, a: 0.04 },
    { x: 640, y: 470, r: 12, a: 0.1 },
  ]
  for (const dot of flareDots) {
    ctx.fillStyle = `rgba(255, 236, 186, ${dot.a})`
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // Bokeh foreground.
  const bokeh = makeBokehSprite(51)
  const rand = seeded(712)
  for (let i = 0; i < 6; i += 1) {
    const x = 40 + rand() * 1180
    const y = 260 + rand() * 420
    const scale = 0.7 + rand() * 1.5
    ctx.save()
    ctx.globalAlpha = 0.11 + rand() * 0.13
    ctx.translate(x + Math.sin(t * 0.4 + i) * 8, y)
    ctx.scale(scale, scale)
    ctx.drawImage(bokeh, -bokeh.width / 2, -bokeh.height / 2)
    ctx.restore()
  }

  // Exposure lift and vignette.
  const lift = ctx.createLinearGradient(0, 0, W, H)
  lift.addColorStop(0, 'rgba(255, 247, 220, 0.1)')
  lift.addColorStop(0.55, 'rgba(255, 247, 220, 0)')
  ctx.fillStyle = lift
  ctx.fillRect(0, 0, W, H)

  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.86)
  vignette.addColorStop(0, 'rgba(30, 32, 26, 0)')
  vignette.addColorStop(1, `rgba(30, 32, 26, ${0.29 + wind * 0.03})`)
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, W, H)

  const noise = getNoisePattern(ctx)
  if (noise) {
    ctx.save()
    ctx.globalAlpha = 0.4
    ctx.fillStyle = noise
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  }
}

export function drawRealTree(
  ctx: CanvasRenderingContext2D,
  time: number,
  windValue: number,
): void {
  const t = ((time % 4) + 4) % 4
  const wind = clamp(windValue, 0, 1)
  const handheldX = Math.sin(t * 2.1) * 1.2 + Math.sin(t * 5.3) * 0.5
  const handheldY = Math.cos(t * 1.7) * 0.9

  ctx.save()
  ctx.translate(handheldX, handheldY)
  drawBackground(ctx, t)
  drawTree(ctx, wind, t)
  drawWindParticles(ctx, wind, t)
  drawAtmosphere(ctx, t, wind)
  ctx.restore()
}
