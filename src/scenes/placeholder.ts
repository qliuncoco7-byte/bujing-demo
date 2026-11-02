import { C, INK } from './palette'
import { H, W, halftoneRect, seeded, strokeInk } from './utils'

/**
 * The visual bed for the unfilled 4 s range. It reads as a missing slot,
 * not as existing footage: desaturated paper, dashed guides, no subject.
 */
export function drawGap(ctx: CanvasRenderingContext2D, time: number): void {
  const t = ((time % 4) + 4) % 4
  const gradient = ctx.createLinearGradient(0, 0, 0, H)
  gradient.addColorStop(0, '#4a4540')
  gradient.addColorStop(0.6, '#36322e')
  gradient.addColorStop(1, '#2b2824')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, W, H)

  // Ghosted city silhouette
  ctx.save()
  ctx.globalAlpha = 0.24
  const rand = seeded(221)
  let x = -40
  while (x < W + 40) {
    const w = 80 + rand() * 130
    const h = 140 + rand() * 260
    ctx.fillStyle = '#d9cdb5'
    ctx.fillRect(x, H - 120 - h, w, h)
    ctx.fillStyle = '#45413c'
    for (let row = 0; row < Math.floor(h / 52); row += 1) {
      for (let col = 0; col < Math.floor(w / 48); col += 1) {
        ctx.fillRect(x + 18 + col * 48, H - 100 - h + row * 52, 18, 24)
      }
    }
    x += w + 18
  }
  // Ghosted storyboard trees, strokes only.
  ctx.strokeStyle = '#d9cdb5'
  ctx.lineWidth = 2
  ctx.setLineDash([7, 8])
  for (const [tx, s] of [
    [148, 1.05],
    [1090, 1.2],
  ] as const) {
    ctx.beginPath()
    ctx.moveTo(tx, H)
    ctx.lineTo(tx + 10, H - 210 * s)
    ctx.lineTo(tx + 34, H - 210 * s)
    ctx.lineTo(tx + 46, H)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(tx + 24, H - 306 * s, 178 * s, 118 * s, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(tx + 22, H - 220 * s)
    ctx.lineTo(tx - 46 * s, H - 286 * s)
    ctx.moveTo(tx + 24, H - 238 * s)
    ctx.lineTo(tx + 96 * s, H - 300 * s)
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.restore()

  // Paper grid and hatch
  ctx.save()
  ctx.strokeStyle = 'rgba(238, 227, 207, 0.045)'
  ctx.lineWidth = 1
  for (let gx = 0; gx < W; gx += 48) {
    ctx.beginPath()
    ctx.moveTo(gx, 0)
    ctx.lineTo(gx, H)
    ctx.stroke()
  }
  for (let gy = 0; gy < H; gy += 48) {
    ctx.beginPath()
    ctx.moveTo(0, gy)
    ctx.lineTo(W, gy)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(238, 227, 207, 0.055)'
  for (let i = -H; i < W; i += 34) {
    ctx.beginPath()
    ctx.moveTo(i + ((t * 4) % 34), 0)
    ctx.lineTo(i + H + ((t * 4) % 34), H)
    ctx.stroke()
  }
  ctx.restore()

  // Dashed centre guide
  ctx.save()
  ctx.setLineDash([14, 12])
  ctx.strokeStyle = 'rgba(255, 201, 87, 0.26)'
  ctx.lineWidth = 2
  ctx.strokeRect(150, 96, W - 300, H - 192)
  ctx.restore()

  // Halftone edge
  halftoneRect(ctx, 0, 0, 130, H, INK, 0.12, 10, 1.6)
  halftoneRect(ctx, W - 130, 0, 130, H, INK, 0.12, 10, 1.6)

  // A soft moving sheen, so the paused slot still feels like a player.
  const sheen = ctx.createLinearGradient(0, 0, W, H)
  sheen.addColorStop(0, 'rgba(255, 201, 87, 0)')
  sheen.addColorStop(0.48 + Math.sin(t * 0.6) * 0.06, 'rgba(255, 201, 87, 0.05)')
  sheen.addColorStop(1, 'rgba(255, 201, 87, 0)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, W, H)

  // Small corner ticks
  ctx.strokeStyle = 'rgba(238, 227, 207, 0.4)'
  ctx.lineWidth = 3
  const tick = 22
  const corners: Array<[number, number, number, number]> = [
    [80, 80, 1, 1],
    [W - 80, 80, -1, 1],
    [80, H - 80, 1, -1],
    [W - 80, H - 80, -1, -1],
  ]
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath()
    ctx.moveTo(cx + sx * tick, cy)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx, cy + sy * tick)
    ctx.stroke()
  }

  // subtle centre cross for storyboard feel
  ctx.save()
  ctx.globalAlpha = 0.3
  ctx.beginPath()
  ctx.arc(640, 360, 42, 0, Math.PI * 2)
  strokeInk(ctx, C.paper, 1.5)
  ctx.beginPath()
  ctx.moveTo(640 - 62, 360)
  ctx.lineTo(640 - 24, 360)
  ctx.moveTo(640 + 24, 360)
  ctx.lineTo(640 + 62, 360)
  ctx.moveTo(640, 298)
  ctx.lineTo(640, 332)
  ctx.moveTo(640, 388)
  ctx.lineTo(640, 422)
  strokeInk(ctx, C.paper, 1.5)
  ctx.restore()

}
