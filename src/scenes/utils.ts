import { C, INK } from './palette'

export const W = 1280
export const H = 720

export type Random = () => number

export function seeded(seed: number): Random {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function easeInOut(t: number): number {
  const x = clamp(t, 0, 1)
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export function inkFill(
  ctx: CanvasRenderingContext2D,
  fill: string,
  lineWidth = 4,
  stroke = INK,
): void {
  ctx.fillStyle = fill
  ctx.fill()
  if (lineWidth > 0) {
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = stroke
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
}

export function strokeInk(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  cap: CanvasLineCap = 'round',
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = cap
  ctx.lineJoin = 'round'
  ctx.stroke()
}

const patternCache = new WeakMap<
  CanvasRenderingContext2D,
  Map<string, CanvasPattern>
>()

function getDotPattern(
  ctx: CanvasRenderingContext2D,
  color: string,
  size: number,
  radius: number,
): CanvasPattern | null {
  let cache = patternCache.get(ctx)
  if (!cache) {
    cache = new Map()
    patternCache.set(ctx, cache)
  }
  const key = `${color}:${size}:${radius}`
  const cached = cache.get(key)
  if (cached) return cached

  const tile = document.createElement('canvas')
  tile.width = size
  tile.height = size
  const tctx = tile.getContext('2d')
  if (!tctx) return null
  tctx.fillStyle = color
  tctx.beginPath()
  tctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2)
  tctx.fill()
  const pattern = ctx.createPattern(tile, 'repeat')
  if (pattern) cache.set(key, pattern)
  return pattern
}

export function halftoneRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color = INK,
  alpha = 0.16,
  size = 8,
  radius = 1.6,
): void {
  const pattern = getDotPattern(ctx, color, size, radius)
  if (!pattern) return
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = pattern
  ctx.fillRect(x, y, w, h)
  ctx.restore()
}

export function halftoneEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color = INK,
  alpha = 0.18,
  size = 8,
): void {
  const pattern = getDotPattern(ctx, color, size, 1.6)
  if (!pattern) return
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.clip()
  ctx.globalAlpha = alpha
  ctx.fillStyle = pattern
  ctx.fillRect(cx - rx, cy - ry, rx * 2, ry * 2)
  ctx.restore()
}

export function drawSky(
  ctx: CanvasRenderingContext2D,
  top: string,
  bottom: string,
  extra = 220,
): void {
  const gradient = ctx.createLinearGradient(0, -40, 0, H * 0.72)
  gradient.addColorStop(0, top)
  gradient.addColorStop(1, bottom)
  ctx.fillStyle = gradient
  ctx.fillRect(-extra, -extra, W + extra * 2, H + extra * 2)
}

export function drawSun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  t: number,
  color = C.sun,
  opacity = 1,
): void {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.translate(x, y)
  ctx.rotate(t * 0.08)
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2
    const inner = r + 16 + (i % 2) * 9
    const outer = r + (i % 2 === 0 ? 44 : 28)
    ctx.beginPath()
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.restore()
}

export function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  fill = C.cloud,
  outline = true,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.beginPath()
  ctx.arc(-56, 6, 34, 0, Math.PI * 2)
  ctx.arc(-18, -14, 46, 0, Math.PI * 2)
  ctx.arc(30, -4, 38, 0, Math.PI * 2)
  ctx.arc(66, 12, 26, 0, Math.PI * 2)
  ctx.rect(-88, 6, 176, 32)
  ctx.fillStyle = fill
  ctx.fill()
  if (outline) {
    ctx.lineWidth = 3.5
    ctx.strokeStyle = INK
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
  ctx.restore()
}

export function drawWindowGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  rows: number,
  fill: string,
  frame = C.paper,
  gap = 6,
): void {
  const cellW = (w - gap * (cols + 1)) / cols
  const cellH = (h - gap * (rows + 1)) / rows
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const wx = x + gap + col * (cellW + gap)
      const wy = y + gap + row * (cellH + gap)
      ctx.fillStyle = frame
      ctx.fillRect(wx - 2, wy - 2, cellW + 4, cellH + 4)
      ctx.fillStyle = fill
      ctx.fillRect(wx, wy, cellW, cellH)
    }
  }
}

/** A comic leaf cluster: overlapping circles with a single union-like ink rim. */
export function drawLeafClump(
  ctx: CanvasRenderingContext2D,
  circles: Array<{ x: number; y: number; r: number }>,
  base: string,
  light: string,
  inkWidth = 4,
  highlightSeed = 1,
): void {
  if (circles.length === 0) return

  // Build the ink rim by dilating the union silhouette in eight directions.
  // The base fill then covers the centre, so no circular internal outlines
  // show through (the previous per-circle rings made the canopy look bubbly).
  const rim = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [0.707, 0.707],
    [-0.707, 0.707],
    [0.707, -0.707],
    [-0.707, -0.707],
    [0, 0],
  ] as const
  ctx.beginPath()
  for (const [dx, dy] of rim) {
    for (const circle of circles) {
      const x = circle.x + dx * inkWidth
      const y = circle.y + dy * inkWidth
      ctx.moveTo(x + circle.r, y)
      ctx.arc(x, y, circle.r, 0, Math.PI * 2)
    }
  }
  ctx.fillStyle = INK
  ctx.fill()

  ctx.beginPath()
  for (const circle of circles) {
    ctx.moveTo(circle.x + circle.r, circle.y)
    ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2)
  }
  ctx.fillStyle = base
  ctx.fill()
  const rand = seeded(highlightSeed)

  // Soft internal shading so the union of circles reads as a mass, not bubbles.
  for (const circle of circles) {
    if (rand() < 0.3) continue
    ctx.save()
    ctx.globalAlpha = 0.05
    ctx.fillStyle = INK
    ctx.beginPath()
    ctx.ellipse(
      circle.x,
      circle.y + circle.r * 0.34,
      circle.r * 0.78,
      circle.r * 0.42,
      0,
      0,
      Math.PI * 2,
    )
    ctx.fill()
    ctx.restore()
  }

  // Leaf-shaped highlights instead of large flat dots.
  for (const circle of circles) {
    const count = 1 + Math.floor(rand() * 2)
    for (let i = 0; i < count; i += 1) {
      const lx = circle.x + (rand() - 0.5) * circle.r * 1.15
      const ly = circle.y - circle.r * (0.06 + rand() * 0.38)
      const size = circle.r * (0.09 + rand() * 0.11)
      drawLeafShape(
        ctx,
        lx,
        ly,
        size,
        (rand() - 0.5) * 2.2,
        light,
        0.55 + rand() * 0.28,
      )
    }
  }

  // Leaf fringes break the circular silhouette and add a drawn comic edge.
  for (const circle of circles) {
    const fringes = rand() < 0.55 ? 2 : 1
    for (let i = 0; i < fringes; i += 1) {
      const angle = rand() * Math.PI * 2
      const dist = circle.r * (0.8 + rand() * 0.24)
      const size = 5 + rand() * 8
      drawLeafWithOutline(
        ctx,
        circle.x + Math.cos(angle) * dist,
        circle.y + Math.sin(angle) * dist,
        size,
        angle + (rand() - 0.5) * 0.8,
        rand() > 0.58 ? light : base,
        0.82 + rand() * 0.16,
      )
    }
  }
}

function drawLeafWithOutline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
  fill: string,
  alpha = 1,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.moveTo(-size, 0)
  ctx.quadraticCurveTo(0, -size * 0.62, size, 0)
  ctx.quadraticCurveTo(0, size * 0.62, -size, 0)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = 1.3
  ctx.strokeStyle = INK
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.restore()
}

export function makeClump(
  seed: number,
  count: number,
  spreadX: number,
  spreadY: number,
  radiusMin: number,
  radiusMax: number,
): Array<{ x: number; y: number; r: number }> {
  const rand = seeded(seed)
  const circles: Array<{ x: number; y: number; r: number }> = []
  for (let i = 0; i < count; i += 1) {
    const angle = rand() * Math.PI * 2
    const dist = Math.sqrt(rand())
    circles.push({
      x: Math.cos(angle) * spreadX * dist,
      y: Math.sin(angle) * spreadY * dist,
      r: lerp(radiusMin, radiusMax, rand()),
    })
  }
  return circles
}

export function drawLeafShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
  fill: string,
  alpha = 1,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.moveTo(-size, 0)
  ctx.quadraticCurveTo(0, -size * 0.62, size, 0)
  ctx.quadraticCurveTo(0, size * 0.62, -size, 0)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.restore()
}

export function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  phase: number,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  const flap = Math.sin(phase) * 4
  ctx.beginPath()
  ctx.moveTo(-16, flap)
  ctx.quadraticCurveTo(-8, -6, 0, 0)
  ctx.quadraticCurveTo(8, -6, 16, flap)
  ctx.lineWidth = 2.6
  ctx.strokeStyle = INK
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()
}

export function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number,
  sway: number,
  seed: number,
  shadow = true,
): void {
  const rand = seeded(seed)
  if (shadow) {
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.beginPath()
    ctx.ellipse(x + 24 * scale, baseY + 8 * scale, 94 * scale, 20 * scale, 0, 0, Math.PI * 2)
    ctx.fillStyle = INK
    ctx.fill()
    ctx.restore()
  }

  ctx.save()
  ctx.translate(x, baseY)
  ctx.scale(scale, scale)

  // trunk
  ctx.beginPath()
  ctx.moveTo(-26, 0)
  ctx.bezierCurveTo(-20, -90, -14, -170, -18 + sway * 22, -252)
  ctx.lineTo(18 + sway * 22, -252)
  ctx.bezierCurveTo(16, -170, 24, -90, 28, 0)
  ctx.closePath()
  inkFill(ctx, C.trunk, 5)

  // branches
  ctx.beginPath()
  ctx.moveTo(-6, -170)
  ctx.quadraticCurveTo(-62, -214, -102 + sway * 30, -236)
  ctx.moveTo(8, -192)
  ctx.quadraticCurveTo(70, -222, 112 + sway * 30, -252)
  ctx.moveTo(-12, -140)
  ctx.quadraticCurveTo(-70, -160, -118 + sway * 20, -186)
  strokeInk(ctx, INK, 11)
  ctx.beginPath()
  ctx.moveTo(-6, -170)
  ctx.quadraticCurveTo(-62, -214, -102 + sway * 30, -236)
  ctx.moveTo(8, -192)
  ctx.quadraticCurveTo(70, -222, 112 + sway * 30, -252)
  ctx.moveTo(-12, -140)
  ctx.quadraticCurveTo(-70, -160, -118 + sway * 20, -186)
  strokeInk(ctx, C.trunk, 6)

  // canopy groups
  const groups = [
    { cx: -76, cy: -288, rx: 96, ry: 74, count: 8, seed: seed + 1 },
    { cx: 58, cy: -306, rx: 105, ry: 78, count: 9, seed: seed + 2 },
    { cx: -6, cy: -370, rx: 92, ry: 64, count: 7, seed: seed + 3 },
    { cx: 104, cy: -352, rx: 62, ry: 48, count: 5, seed: seed + 4 },
  ]
  for (const group of groups) {
    const circles = makeClump(group.seed, group.count, group.rx, group.ry, 28, 55)
    ctx.save()
    ctx.translate(group.cx + sway * 34, group.cy)
    ctx.rotate(sway * 0.4)
    drawLeafClump(
      ctx,
      circles,
      rand() > 0.5 ? C.green : C.greenDark,
      C.greenLight,
      4,
      group.seed,
    )
    ctx.restore()
  }

  // a couple of hanging leaves
  for (let i = 0; i < 4; i += 1) {
    const lx = (rand() - 0.5) * 220
    const ly = -220 + rand() * 70
    drawLeafShape(ctx, lx + sway * 14, ly, 9, rand() * 3, C.greenDark, 0.85)
  }
  ctx.restore()
}

export function drawPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number,
  body: string,
  phase: number,
  facing = 1,
): void {
  const swing = Math.sin(phase) * 8
  ctx.save()
  ctx.translate(x, baseY)
  ctx.scale(scale * facing, scale)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // legs
  ctx.beginPath()
  ctx.moveTo(-4, -40)
  ctx.lineTo(-8 + swing, 0)
  ctx.moveTo(4, -40)
  ctx.lineTo(8 - swing, 0)
  strokeInk(ctx, INK, 10)
  ctx.beginPath()
  ctx.moveTo(-4, -40)
  ctx.lineTo(-8 + swing, 0)
  ctx.moveTo(4, -40)
  ctx.lineTo(8 - swing, 0)
  strokeInk(ctx, '#3b4657', 5)

  // body
  roundRect(ctx, -15, -88, 30, 52, 12)
  inkFill(ctx, body, 4)

  // arm
  ctx.beginPath()
  ctx.moveTo(10, -76)
  ctx.quadraticCurveTo(24, -58, 20 + swing * 0.6, -44)
  strokeInk(ctx, INK, 9)
  ctx.beginPath()
  ctx.moveTo(10, -76)
  ctx.quadraticCurveTo(24, -58, 20 + swing * 0.6, -44)
  strokeInk(ctx, body, 4)

  // head
  ctx.beginPath()
  ctx.arc(0, -108, 16, 0, Math.PI * 2)
  inkFill(ctx, '#f4c9a5', 4)
  ctx.beginPath()
  ctx.arc(0, -112, 17, Math.PI * 1.02, Math.PI * 1.98)
  ctx.fillStyle = '#3a2c2c'
  ctx.fill()
  ctx.restore()
}

export function drawGroundShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  alpha = 0.16,
): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = INK
  ctx.fill()
  ctx.restore()
}

export function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  t: number,
  seed: number,
  color = '#fff6df',
  alpha = 0.5,
): void {
  const rand = seeded(seed)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  for (let i = 0; i < count; i += 1) {
    const angle = (rand() - 0.5) * 0.8
    const length = 40 + rand() * 120
    const sx = x + (rand() - 0.5) * 520
    const sy = y + (rand() - 0.5) * 340
    const offset = Math.sin(t * 2 + i) * 14
    ctx.lineWidth = 1 + rand() * 2.2
    ctx.beginPath()
    ctx.moveTo(sx + offset, sy)
    ctx.quadraticCurveTo(
      sx + offset + length * 0.55,
      sy - 6 + angle * 20,
      sx + offset + length,
      sy + angle * 8,
    )
    ctx.stroke()
  }
  ctx.restore()
}
