import { C, INK } from './palette'
import {
  H,
  W,
  clamp,
  drawCloud,
  drawLeafClump,
  drawLeafShape,
  drawSky,
  drawSpeedLines,
  drawSun,
  halftoneRect,
  inkFill,
  makeClump,
  seeded,
  strokeInk,
} from './utils'

export type CanopyVariant = 'gen' | 'street' | 'dense'

type Clump = {
  x: number
  y: number
  rx: number
  ry: number
  count: number
  seed: number
  tone: number
}

const BASE_X = 420
const BASE_Y = 800

function branchPath(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  width: number,
  color = C.trunk,
): void {
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length - 1; i += 1) {
    const [cx, cy] = points[i]
    const [nx, ny] = points[i + 1]
    ctx.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2)
  }
  const last = points[points.length - 1]
  ctx.lineTo(last[0], last[1])
  strokeInk(ctx, INK, width + 9)
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length - 1; i += 1) {
    const [cx, cy] = points[i]
    const [nx, ny] = points[i + 1]
    ctx.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2)
  }
  ctx.lineTo(last[0], last[1])
  strokeInk(ctx, color, width)
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  variant: CanopyVariant,
  t: number,
): void {
  drawSky(ctx, '#ffe8b4', '#ffc59d')
  drawSun(ctx, 1060, 150, 62, t)
  drawCloud(ctx, 180, 130, 0.85)
  drawCloud(ctx, 900, 260, 0.45)
  halftoneRect(ctx, 0, 0, W, 320, '#e99766', 0.08, 10, 1.8)

  if (variant === 'street') {
    // A comic building edge grounds the shot in the project's city.
    ctx.beginPath()
    ctx.rect(-40, 230, 300, 430)
    inkFill(ctx, C.cream, 5)
    ctx.beginPath()
    ctx.rect(-40, 210, 320, 26)
    inkFill(ctx, C.mustard, 4)
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        ctx.beginPath()
        ctx.rect(26 + col * 106, 286 + row * 118, 76, 74)
        inkFill(ctx, C.window, 3.5)
        ctx.beginPath()
        ctx.moveTo(64 + col * 106, 286 + row * 118)
        ctx.lineTo(64 + col * 106, 360 + row * 118)
        strokeInk(ctx, C.paper, 2.5)
      }
    }
    // striped awning
    ctx.beginPath()
    ctx.rect(-40, 498, 286, 62)
    inkFill(ctx, C.coral, 4)
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath()
      ctx.rect(-18 + i * 64, 500, 32, 58)
      ctx.fillStyle = C.paper
      ctx.globalAlpha = 0.55
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.beginPath()
    for (let i = 0; i < 5; i += 1) {
      ctx.arc(-2 + i * 64, 560, 30, 0, Math.PI)
    }
    inkFill(ctx, C.coral, 4)
    // sidewalk and railing hints
    ctx.beginPath()
    ctx.rect(-40, 618, 380, 104)
    inkFill(ctx, C.sidewalk, 0)
    ctx.beginPath()
    ctx.moveTo(190, 480)
    ctx.lineTo(190, 600)
    strokeInk(ctx, INK, 4)
    ctx.beginPath()
    ctx.moveTo(190, 486)
    ctx.lineTo(282, 486)
    strokeInk(ctx, INK, 4)
    // shop sign
    ctx.save()
    ctx.translate(38, 448)
    ctx.rotate(-0.02)
    ctx.beginPath()
    ctx.rect(0, 0, 150, 38)
    inkFill(ctx, C.paper, 3.5)
    ctx.fillStyle = INK
    ctx.font = '700 22px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('街边小铺', 75, 20)
    ctx.restore()
  } else if (variant === 'dense') {
    // Warm sky peeks through the canopy.
    halftoneRect(ctx, 700, 80, 580, 260, '#ffd66e', 0.16, 9, 2)
  } else {
    // Distant city roofline, kept quiet behind the branch.
    const roofGradient = ctx.createLinearGradient(0, 560, 0, 720)
    roofGradient.addColorStop(0, 'rgba(255, 236, 202, 0)')
    roofGradient.addColorStop(1, 'rgba(255, 236, 202, 0.7)')
    ctx.fillStyle = roofGradient
    ctx.fillRect(0, 500, W, 220)
    ctx.fillStyle = 'rgba(154, 175, 192, 0.35)'
    for (let i = 0; i < 8; i += 1) {
      ctx.fillRect(760 + i * 70, 520 - (i % 3) * 30, 54, 200)
    }
  }
}

function drawBranches(
  ctx: CanvasRenderingContext2D,
  variant: CanopyVariant,
): void {
  if (variant === 'street') {
    branchPath(ctx, [[BASE_X + 140, 820], [BASE_X + 90, 620], [BASE_X + 120, 440], [BASE_X + 40, 300]], 34)
    branchPath(ctx, [[BASE_X + 112, 470], [BASE_X + 30, 390], [BASE_X - 40, 330]], 20)
    branchPath(ctx, [[BASE_X + 100, 560], [BASE_X + 250, 500], [BASE_X + 330, 430]], 18)
    branchPath(ctx, [[BASE_X + 120, 440], [BASE_X + 240, 360], [BASE_X + 300, 260]], 16)
    branchPath(ctx, [[BASE_X + 120, 440], [BASE_X + 30, 340], [BASE_X + 10, 230]], 14)
  } else if (variant === 'dense') {
    branchPath(ctx, [[BASE_X, 820], [BASE_X + 30, 600], [BASE_X + 80, 400], [BASE_X + 60, 250]], 46)
    branchPath(ctx, [[BASE_X + 70, 460], [BASE_X - 80, 350], [BASE_X - 170, 300]], 24)
    branchPath(ctx, [[BASE_X + 74, 390], [BASE_X + 250, 320], [BASE_X + 380, 250]], 24)
    branchPath(ctx, [[BASE_X + 62, 300], [BASE_X + 20, 180], [BASE_X - 30, 110]], 18)
    branchPath(ctx, [[BASE_X + 68, 270], [BASE_X + 190, 160], [BASE_X + 300, 100]], 16)
  } else {
    branchPath(ctx, [[BASE_X, 820], [BASE_X + 34, 610], [BASE_X + 90, 430], [BASE_X + 110, 300]], 40)
    branchPath(ctx, [[BASE_X + 86, 470], [BASE_X - 30, 370], [BASE_X - 120, 320]], 22)
    branchPath(ctx, [[BASE_X + 92, 400], [BASE_X + 240, 350], [BASE_X + 360, 280]], 22)
    branchPath(ctx, [[BASE_X + 102, 330], [BASE_X + 60, 210], [BASE_X + 40, 140]], 15)
    branchPath(ctx, [[BASE_X + 104, 320], [BASE_X + 220, 230], [BASE_X + 330, 180]], 14)
  }
}

function clumpsFor(variant: CanopyVariant): Clump[] {
  if (variant === 'street') {
    return [
      { x: 560, y: 190, rx: 220, ry: 130, count: 14, seed: 711, tone: 0 },
      { x: 330, y: 270, rx: 190, ry: 130, count: 12, seed: 712, tone: 1 },
      { x: 740, y: 280, rx: 210, ry: 140, count: 13, seed: 713, tone: 0 },
      { x: 190, y: 390, rx: 160, ry: 110, count: 9, seed: 714, tone: 1 },
      { x: 540, y: 360, rx: 210, ry: 130, count: 12, seed: 715, tone: 0 },
      { x: 860, y: 400, rx: 140, ry: 100, count: 8, seed: 716, tone: 1 },
      { x: 400, y: 170, rx: 140, ry: 84, count: 8, seed: 717, tone: 2 },
    ]
  }
  if (variant === 'dense') {
    return [
      { x: 320, y: 200, rx: 240, ry: 170, count: 15, seed: 721, tone: 0 },
      { x: 640, y: 150, rx: 280, ry: 170, count: 16, seed: 722, tone: 1 },
      { x: 950, y: 190, rx: 240, ry: 170, count: 15, seed: 723, tone: 0 },
      { x: 300, y: 420, rx: 220, ry: 160, count: 12, seed: 724, tone: 1 },
      { x: 630, y: 380, rx: 260, ry: 170, count: 15, seed: 725, tone: 0 },
      { x: 980, y: 420, rx: 220, ry: 150, count: 11, seed: 726, tone: 1 },
      { x: 490, y: 260, rx: 170, ry: 100, count: 9, seed: 727, tone: 2 },
      { x: 810, y: 280, rx: 180, ry: 110, count: 9, seed: 728, tone: 2 },
    ]
  }
  return [
    { x: 310, y: 240, rx: 210, ry: 150, count: 13, seed: 731, tone: 0 },
    { x: 590, y: 170, rx: 240, ry: 150, count: 15, seed: 732, tone: 1 },
    { x: 860, y: 260, rx: 210, ry: 140, count: 12, seed: 733, tone: 0 },
    { x: 420, y: 420, rx: 200, ry: 140, count: 11, seed: 734, tone: 1 },
    { x: 720, y: 400, rx: 210, ry: 140, count: 12, seed: 735, tone: 0 },
    { x: 560, y: 300, rx: 190, ry: 110, count: 10, seed: 736, tone: 2 },
  ]
}

function clumpColors(tone: number): [string, string] {
  if (tone === 0) return [C.greenDark, C.greenLight]
  if (tone === 1) return [C.green, C.greenHighlight]
  return [C.greenDark, C.green]
}

function drawCanopyMass(
  ctx: CanvasRenderingContext2D,
  variant: CanopyVariant,
  wind: number,
  t: number,
): void {
  const sway =
    Math.sin(t * (1.1 + wind * 1.6)) * (0.006 + wind * 0.04) +
    Math.sin(t * (2.3 + wind * 1.2) + 0.7) * wind * 0.012
  ctx.save()
  ctx.translate(BASE_X, BASE_Y)
  ctx.rotate(sway)
  ctx.translate(-BASE_X, -BASE_Y)

  drawBranches(ctx, variant)

  const clumps = clumpsFor(variant)
  clumps.forEach((clump, index) => {
    const phase = t * (1.4 + wind * 1.8) + index * 0.9
    const localSway =
      Math.sin(phase) * (4 + wind * 24) +
      Math.sin(phase * 2.2 + index) * (1 + wind * 8)
    const localRotate = Math.sin(phase * 1.1 + index) * (0.006 + wind * 0.035)
    const circles = makeClump(clump.seed, clump.count, clump.rx, clump.ry, 34, 78)
    const [base, light] = clumpColors(clump.tone)
    ctx.save()
    ctx.translate(clump.x + localSway, clump.y + Math.abs(localSway) * 0.1)
    ctx.rotate(localRotate)
    drawLeafClump(ctx, circles, base, light, 5, clump.seed)
    ctx.restore()
  })

  ctx.restore()

  if (wind > 0.55) {
    drawSpeedLines(
      ctx,
      430,
      300,
      Math.round(4 + wind * 8),
      t,
      901,
      '#fff4d6',
      0.32,
    )
  }
}

function drawWindLeaves(
  ctx: CanvasRenderingContext2D,
  wind: number,
  t: number,
  variant: CanopyVariant,
): void {
  const count = variant === 'dense' ? 42 : 30
  const rand = seeded(931)
  for (let i = 0; i < count; i += 1) {
    const active = rand() < 0.2 + wind * 0.8
    if (!active) continue
    const speed = 30 + rand() * 90 + wind * 140
    const startX = 160 + rand() * 1160
    const startY = 90 + rand() * 560
    const x = startX - ((t * speed + rand() * 200) % 1180)
    const y =
      startY +
      Math.sin(t * (1.2 + rand() * 2) + i) * (12 + wind * 38) +
      t * (4 + rand() * 8)
    const size = 4 + rand() * 7
    if (wind > 0.6) {
      ctx.save()
      ctx.globalAlpha = 0.2
      ctx.strokeStyle = '#fff2cf'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + 44, y - 2)
      ctx.lineTo(x + 8, y + 4)
      ctx.stroke()
      ctx.restore()
    }
    drawLeafShape(
      ctx,
      x,
      y,
      size,
      t * (2 + rand() * 4) + i,
      i % 5 === 0 ? C.leafWarm : i % 2 === 0 ? C.greenLight : C.greenHighlight,
      0.85,
    )
  }
}

function drawLightRays(
  ctx: CanvasRenderingContext2D,
  t: number,
  strength = 0.2,
): void {
  ctx.save()
  ctx.globalAlpha = strength + Math.sin(t * 0.6) * 0.03
  const gradient = ctx.createLinearGradient(1050, 0, 520, 700)
  gradient.addColorStop(0, '#fff7cf')
  gradient.addColorStop(1, 'rgba(255, 247, 207, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(880, -20)
  ctx.lineTo(1010, -20)
  ctx.lineTo(540, 720)
  ctx.lineTo(390, 720)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(1100, -20)
  ctx.lineTo(1160, -20)
  ctx.lineTo(820, 720)
  ctx.lineTo(730, 720)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawForegroundTwig(ctx: CanvasRenderingContext2D, t: number): void {
  const sway = Math.sin(t * 0.9) * 0.02
  ctx.save()
  ctx.translate(1180, 680)
  ctx.rotate(sway - 0.25)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(-30, -120, -70, -190, -150, -280)
  strokeInk(ctx, INK, 16)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(-30, -120, -70, -190, -150, -280)
  strokeInk(ctx, C.trunkDark, 9)
  for (let i = 0; i < 5; i += 1) {
    const x = -30 - i * 24
    const y = -100 - i * 34
    drawLeafShape(ctx, x, y, 16, -0.7 + i * 0.4, C.greenDark, 0.95)
    drawLeafShape(ctx, x + 14, y - 12, 11, 0.2 + i * 0.3, C.green, 0.95)
  }
  ctx.restore()
}

export function drawCanopy(
  ctx: CanvasRenderingContext2D,
  time: number,
  variant: CanopyVariant,
  wind: number,
): void {
  const t = ((time % 4) + 4) % 4
  const strength = clamp(wind, 0, 1)
  ctx.save()
  const shakeX = Math.sin(t * 9) * strength * 1.2
  const shakeY = Math.cos(t * 7.3) * strength * 0.8
  ctx.translate(shakeX, shakeY)

  drawBackdrop(ctx, variant, t)
  drawLightRays(ctx, t, 0.18 + strength * 0.06)
  drawCanopyMass(ctx, variant, strength, t)
  drawWindLeaves(ctx, strength, t, variant)
  drawForegroundTwig(ctx, t)
  halftoneRect(ctx, 0, H - 60, W, 60, '#e99766', 0.05, 10)
  ctx.restore()
}
