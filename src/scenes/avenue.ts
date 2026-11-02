import { C, INK } from './palette'
import {
  W,
  clamp,
  drawCloud,
  drawLeafClump,
  drawLeafShape,
  drawSky,
  drawSun,
  drawTree,
  easeInOut,
  halftoneRect,
  inkFill,
  makeClump,
  roundRect,
  seeded,
  strokeInk,
} from './utils'

function drawFarBlocks(ctx: CanvasRenderingContext2D): void {
  // Far end of the avenue, softened by haze.
  const blocks = [
    { x: 520, y: 318, w: 72, h: 130, color: '#d8c6ae' },
    { x: 596, y: 288, w: 88, h: 160, color: '#c7b9aa' },
    { x: 690, y: 330, w: 68, h: 118, color: '#d9c9b6' },
    { x: 440, y: 356, w: 66, h: 92, color: '#cbbdab' },
    { x: 772, y: 350, w: 82, h: 98, color: '#c2b4a5' },
  ]
  for (const block of blocks) {
    ctx.beginPath()
    ctx.rect(block.x, block.y, block.w, block.h)
    ctx.fillStyle = block.color
    ctx.fill()
  }
  ctx.fillStyle = 'rgba(255,244,223,0.38)'
  for (const block of blocks) {
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        ctx.fillRect(block.x + 12 + col * 30, block.y + 16 + row * 30, 14, 16)
      }
    }
  }
  ctx.beginPath()
  ctx.moveTo(600, 288)
  ctx.lineTo(600, 250)
  strokeInk(ctx, INK, 3)
  ctx.beginPath()
  ctx.arc(600, 250, 4, 0, Math.PI * 2)
  ctx.fillStyle = C.mustard
  ctx.fill()

  // haze
  const haze = ctx.createLinearGradient(0, 300, 0, 470)
  haze.addColorStop(0, 'rgba(255, 240, 212, 0.1)')
  haze.addColorStop(1, 'rgba(255, 240, 212, 0.65)')
  ctx.fillStyle = haze
  ctx.fillRect(0, 300, W, 180)
}

function drawSideBuilding(
  ctx: CanvasRenderingContext2D,
  side: 'left' | 'right',
): void {
  ctx.save()
  if (side === 'right') {
    ctx.translate(W, 0)
    ctx.scale(-1, 1)
  }

  // Near facade
  ctx.beginPath()
  ctx.moveTo(-40, 170)
  ctx.lineTo(214, 236)
  ctx.lineTo(214, 610)
  ctx.lineTo(-40, 680)
  ctx.closePath()
  inkFill(ctx, side === 'left' ? C.cream : C.coral, 5)
  halftoneRect(ctx, 0, 440, 210, 210, INK, 0.08, 9)

  // Roofline
  ctx.beginPath()
  ctx.moveTo(-52, 160)
  ctx.lineTo(224, 230)
  ctx.lineTo(224, 252)
  ctx.lineTo(-52, 182)
  ctx.closePath()
  inkFill(ctx, C.mustard, 4)

  // Perspective windows
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const x = 36 + col * 58 + row * 4
      const y = 300 + row * 76 + col * 16
      const h = 34 - row * 2
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + 36, y + 5)
      ctx.lineTo(x + 36, y + 5 + h)
      ctx.lineTo(x, y + h)
      ctx.closePath()
      inkFill(ctx, col === 1 && row === 0 ? C.windowWarm : C.window, 3)
    }
  }

  // Shop awnings
  ctx.beginPath()
  ctx.moveTo(8, 538)
  ctx.lineTo(178, 560)
  ctx.lineTo(190, 600)
  ctx.lineTo(-8, 576)
  ctx.closePath()
  inkFill(ctx, side === 'left' ? C.teal : C.mustard, 4)
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath()
    ctx.moveTo(22 + i * 40, 540 + i * 5)
    ctx.lineTo(42 + i * 40, 543 + i * 5)
    ctx.lineTo(50 + i * 40, 596 + i * 5)
    ctx.lineTo(28 + i * 40, 592 + i * 5)
    ctx.closePath()
    ctx.fillStyle = C.paper
    ctx.globalAlpha = 0.8
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // Wall lamp
  ctx.beginPath()
  ctx.moveTo(190, 420)
  ctx.quadraticCurveTo(218, 424, 216, 448)
  strokeInk(ctx, INK, 4)
  roundRect(ctx, 202, 448, 28, 22, 7)
  inkFill(ctx, C.mustard, 3)

  ctx.restore()
}

function drawRoad(ctx: CanvasRenderingContext2D): void {
  // sidewalk slabs
  ctx.beginPath()
  ctx.moveTo(-20, 560)
  ctx.lineTo(470, 430)
  ctx.lineTo(540, 720)
  ctx.lineTo(-20, 720)
  ctx.closePath()
  inkFill(ctx, C.sidewalk, 0)

  ctx.beginPath()
  ctx.moveTo(1300, 560)
  ctx.lineTo(810, 430)
  ctx.lineTo(740, 720)
  ctx.lineTo(1300, 720)
  ctx.closePath()
  inkFill(ctx, C.sidewalk, 0)

  // road
  ctx.beginPath()
  ctx.moveTo(470, 430)
  ctx.lineTo(810, 430)
  ctx.lineTo(940, 720)
  ctx.lineTo(340, 720)
  ctx.closePath()
  inkFill(ctx, C.road, 0)

  // side curbs
  ctx.beginPath()
  ctx.moveTo(470, 430)
  ctx.lineTo(340, 720)
  strokeInk(ctx, C.paper, 5)
  ctx.beginPath()
  ctx.moveTo(810, 430)
  ctx.lineTo(940, 720)
  strokeInk(ctx, C.paper, 5)

  // center dashes
  const dashes = [
    { y: 470, w: 10, h: 18 },
    { y: 510, w: 14, h: 24 },
    { y: 560, w: 20, h: 34 },
    { y: 626, w: 28, h: 46 },
    { y: 700, w: 38, h: 60 },
  ]
  for (const dash of dashes) {
    ctx.beginPath()
    ctx.rect(640 - dash.w / 2, dash.y, dash.w, dash.h)
    ctx.fillStyle = C.paper
    ctx.fill()
  }

  // sidewalk joints
  ctx.strokeStyle = 'rgba(103, 80, 54, 0.28)'
  ctx.lineWidth = 2
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath()
    ctx.moveTo(-20 + i * 100, 620 + i * 10)
    ctx.lineTo(340 - i * 30, 720)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(1300 - i * 100, 620 + i * 10)
    ctx.lineTo(940 + i * 30, 720)
    ctx.stroke()
  }

  // Warm reflected light on the road
  const glow = ctx.createLinearGradient(560, 430, 680, 720)
  glow.addColorStop(0, 'rgba(255, 214, 110, 0)')
  glow.addColorStop(0.55, 'rgba(255, 214, 110, 0.16)')
  glow.addColorStop(1, 'rgba(255, 214, 110, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(430, 430, 420, 300)
}

function drawCyclist(ctx: CanvasRenderingContext2D, t: number): void {
  const progress = clamp(t / 6, 0, 1)
  const x = 640 + Math.sin(t * 0.8) * 10
  const y = 452 + progress * 44
  const scale = 0.3 + progress * 0.12
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.globalAlpha = 0.92

  // wheels
  for (const wx of [-34, 36]) {
    ctx.beginPath()
    ctx.arc(wx, 0, 18, 0, Math.PI * 2)
    strokeInk(ctx, INK, 4)
    const spin = t * 5 + (wx > 0 ? 0 : 1)
    for (let i = 0; i < 4; i += 1) {
      const angle = spin + (i / 4) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(wx, 0)
      ctx.lineTo(wx + Math.cos(angle) * 15, Math.sin(angle) * 15)
      ctx.strokeStyle = C.paper
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }
  // frame
  ctx.beginPath()
  ctx.moveTo(-34, 0)
  ctx.lineTo(-4, -30)
  ctx.lineTo(24, -4)
  ctx.lineTo(-34, 0)
  ctx.lineTo(0, 0)
  ctx.lineTo(36, 0)
  strokeInk(ctx, C.coral, 6)
  // handlebar and seat
  ctx.beginPath()
  ctx.moveTo(24, -4)
  ctx.lineTo(30, -28)
  ctx.moveTo(-4, -30)
  ctx.lineTo(-10, -38)
  strokeInk(ctx, INK, 4)
  // rider
  ctx.beginPath()
  ctx.arc(-2, -66, 10, 0, Math.PI * 2)
  inkFill(ctx, '#f2c7a4', 3)
  ctx.beginPath()
  ctx.moveTo(-2, -56)
  ctx.lineTo(6, -32)
  ctx.lineTo(-8, -14)
  ctx.moveTo(6, -32)
  ctx.lineTo(24, -22)
  ctx.moveTo(6, -32)
  ctx.lineTo(-14, -42)
  strokeInk(ctx, INK, 5)
  ctx.fillStyle = C.tealDark
  ctx.beginPath()
  ctx.ellipse(-2, -44, 11, 14, -0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawFallingLeaves(ctx: CanvasRenderingContext2D, t: number): void {
  const rand = seeded(503)
  for (let i = 0; i < 16; i += 1) {
    const startX = rand() * (W + 200)
    const startY = rand() * 440
    const speed = 12 + rand() * 24
    const x = ((startX + t * speed) % (W + 220)) - 110
    const flutter = Math.sin(t * 1.8 + i * 1.4) * 26
    const y = startY + t * (8 + rand() * 16) + flutter
    drawLeafShape(
      ctx,
      x,
      ((y % 700) + 700) % 700 - 20,
      4.5 + rand() * 5,
      t * (0.8 + rand()) + i,
      i % 4 === 0 ? C.leafWarm : C.greenLight,
      0.75,
    )
  }
}

function drawTopCanopy(ctx: CanvasRenderingContext2D, t: number): void {
  const sway = Math.sin(t * 0.85) * 0.04
  const groups = [
    { x: 70, y: 30, rx: 210, ry: 130, seed: 301, count: 12 },
    { x: 380, y: -12, rx: 190, ry: 120, seed: 302, count: 10 },
    { x: 930, y: -20, rx: 210, ry: 130, seed: 303, count: 11 },
    { x: 1220, y: 50, rx: 200, ry: 150, seed: 304, count: 12 },
  ]
  for (const group of groups) {
    ctx.save()
    ctx.translate(group.x, group.y)
    ctx.rotate(sway * (group.x < 640 ? -1 : 1))
    const circles = makeClump(group.seed, group.count, group.rx, group.ry, 44, 78)
    drawLeafClump(ctx, circles, C.greenDark, C.green, 5, group.seed)
    // lighter tops
    const light = makeClump(group.seed + 7, 6, group.rx * 0.7, group.ry * 0.6, 22, 42)
    for (const circle of light) {
      ctx.beginPath()
      ctx.arc(circle.x + 10, circle.y - 20, circle.r * 0.7, 0, Math.PI * 2)
      ctx.fillStyle = C.greenLight
      ctx.globalAlpha = 0.6
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.restore()
  }

  // hanging leaf threads
  const rand = seeded(666)
  for (let i = 0; i < 8; i += 1) {
    const x = 60 + rand() * 1160
    const len = 16 + rand() * 34
    ctx.beginPath()
    ctx.moveTo(x, 116 + rand() * 24)
    ctx.quadraticCurveTo(x + 8, 150, x + Math.sin(t + i) * 6, 150 + len)
    strokeInk(ctx, C.greenDark, 2)
    drawLeafShape(ctx, x + Math.sin(t + i) * 6, 150 + len, 5, rand() * 3, C.greenLight, 0.9)
  }
}

function drawSunRays(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.save()
  ctx.globalAlpha = 0.16 + Math.sin(t * 0.5) * 0.02
  ctx.fillStyle = '#fff2b8'
  const rays = [
    { x1: 990, w: 48, x2: 610 },
    { x1: 1060, w: 32, x2: 760 },
    { x1: 1130, w: 26, x2: 930 },
  ]
  for (const ray of rays) {
    ctx.beginPath()
    ctx.moveTo(ray.x1, -20)
    ctx.lineTo(ray.x1 + ray.w, -20)
    ctx.lineTo(ray.x2 + ray.w * 1.8, 620)
    ctx.lineTo(ray.x2, 620)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

export function drawAvenue(ctx: CanvasRenderingContext2D, time: number): void {
  const t = ((time % 6) + 6) % 6
  const zoom = 1 + easeInOut(t / 6) * 0.045

  ctx.save()
  ctx.translate(640, 360)
  ctx.scale(zoom, zoom)
  ctx.translate(-640, -360 + Math.sin(t * 0.6) * 1.5)

  drawSky(ctx, '#ffe3ad', '#ffc39b')
  drawSun(ctx, 1010, 150, 50, t)
  drawCloud(ctx, 220, 150, 0.95)
  drawCloud(ctx, 760, 92, 0.55)
  drawFarBlocks(ctx)
  drawSideBuilding(ctx, 'left')
  drawSideBuilding(ctx, 'right')

  // back rows of trees
  drawTree(ctx, 462, 470, 0.4, Math.sin(t * 0.8 + 0.4) * 0.07, 31)
  drawTree(ctx, 818, 470, 0.4, Math.sin(t * 0.8 + 2.1) * 0.07, 32)
  drawTree(ctx, 360, 560, 0.62, Math.sin(t * 0.9 + 1.3) * 0.08, 33)
  drawTree(ctx, 920, 560, 0.62, Math.sin(t * 0.9 + 2.8) * 0.08, 34)

  drawRoad(ctx)
  drawCyclist(ctx, t)

  // mid trees
  drawTree(ctx, 218, 700, 0.95, Math.sin(t * 0.85 + 0.4) * 0.1, 35)
  drawTree(ctx, 1062, 700, 0.95, Math.sin(t * 0.85 + 1.9) * 0.1, 36)

  // pedestrians in the distance
  ctx.save()
  ctx.translate(500, 466)
  ctx.scale(0.28, 0.28)
  ctx.beginPath()
  ctx.arc(0, -88, 13, 0, Math.PI * 2)
  ctx.fillStyle = '#f2c7a4'
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(0, -72)
  ctx.lineTo(0, -30)
  ctx.lineTo(-10, 0)
  ctx.moveTo(0, -30)
  ctx.lineTo(10, 0)
  ctx.moveTo(0, -62)
  ctx.lineTo(-14, -42)
  ctx.moveTo(0, -62)
  ctx.lineTo(14, -42)
  strokeInk(ctx, INK, 5)
  ctx.restore()

  drawSunRays(ctx, t)
  drawTopCanopy(ctx, t)
  drawFallingLeaves(ctx, t)

  // foreground tree trunks
  ctx.beginPath()
  ctx.moveTo(48, 720)
  ctx.bezierCurveTo(60, 610, 34, 500, 70, 420)
  ctx.lineTo(130, 420)
  ctx.bezierCurveTo(100, 520, 124, 620, 136, 720)
  ctx.closePath()
  inkFill(ctx, C.trunk, 5)
  ctx.beginPath()
  ctx.moveTo(1150, 720)
  ctx.bezierCurveTo(1140, 600, 1178, 500, 1144, 410)
  ctx.lineTo(1206, 410)
  ctx.bezierCurveTo(1218, 510, 1190, 620, 1218, 720)
  ctx.closePath()
  inkFill(ctx, C.trunk, 5)

  // warm ground light
  halftoneRect(ctx, 0, 610, W, 110, '#ffd66e', 0.08, 10)
  ctx.restore()
}
