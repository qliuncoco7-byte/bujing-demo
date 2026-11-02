import { C, INK } from './palette'
import {
  W,
  drawBird,
  drawCloud,
  drawGroundShadow,
  drawLeafShape,
  drawPerson,
  drawSky,
  drawSun,
  drawTree,
  drawWindowGrid,
  halftoneRect,
  inkFill,
  roundRect,
  seeded,
  strokeInk,
} from './utils'

function shopSign(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  bg: string,
  fg: string,
  rotate = 0,
): void {
  ctx.save()
  ctx.translate(x + w / 2, y + h / 2)
  ctx.rotate(rotate)
  roundRect(ctx, -w / 2, -h / 2, w, h, 7)
  inkFill(ctx, bg, 3.5)
  ctx.fillStyle = fg
  ctx.font = `700 ${Math.floor(h * 0.48)}px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, 1)
  ctx.restore()
}

function drawLeftBuilding(ctx: CanvasRenderingContext2D): void {
  // Main coral facade
  ctx.beginPath()
  ctx.rect(-60, 176, 332, 400)
  inkFill(ctx, C.coral, 5)
  halftoneRect(ctx, 60, 400, 210, 176, INK, 0.1, 9)

  // Roof lip
  ctx.beginPath()
  ctx.rect(-72, 162, 356, 26)
  inkFill(ctx, C.coralDark, 4)

  drawWindowGrid(ctx, -22, 212, 260, 158, 4, 3, C.window, C.paper, 10)
  // Warm lit windows
  ctx.fillStyle = C.windowWarm
  ctx.fillRect(38, 238, 44, 34)
  ctx.fillRect(152, 326, 44, 34)

  // Awning
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(-46, 398)
  ctx.lineTo(248, 398)
  ctx.lineTo(262, 444)
  ctx.lineTo(-58, 444)
  ctx.closePath()
  inkFill(ctx, C.paper, 4)
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath()
    ctx.moveTo(-22 + i * 54, 400)
    ctx.lineTo(4 + i * 54, 400)
    ctx.lineTo(12 + i * 54, 442)
    ctx.lineTo(-14 + i * 54, 442)
    ctx.closePath()
    ctx.fillStyle = i % 2 === 0 ? C.green : C.greenDark
    ctx.fill()
  }
  // Awning scallops
  ctx.beginPath()
  for (let i = 0; i < 6; i += 1) {
    ctx.arc(-36 + i * 54, 444, 27, 0, Math.PI)
  }
  ctx.fillStyle = C.paper
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.restore()

  // Storefront
  ctx.beginPath()
  ctx.rect(-44, 448, 286, 108)
  inkFill(ctx, '#fbe9c8', 4)
  ctx.beginPath()
  ctx.rect(-20, 462, 150, 78)
  ctx.fillStyle = C.window
  ctx.fill()
  ctx.lineWidth = 3.5
  ctx.strokeStyle = INK
  ctx.stroke()
  // door
  ctx.beginPath()
  ctx.rect(168, 462, 50, 94)
  ctx.fillStyle = C.tealDark
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.fillStyle = C.mustard
  ctx.beginPath()
  ctx.arc(206, 510, 4, 0, Math.PI * 2)
  ctx.fill()

  shopSign(ctx, -6, 330, 190, 54, '街角咖啡', C.paper, INK)

  // Roof water tank / antenna
  ctx.beginPath()
  ctx.moveTo(60, 162)
  ctx.lineTo(60, 126)
  ctx.moveTo(190, 162)
  ctx.lineTo(190, 140)
  strokeInk(ctx, INK, 4)
  ctx.beginPath()
  ctx.arc(60, 116, 12, 0, Math.PI * 2)
  inkFill(ctx, C.mustard, 3)
}

function drawRightBuilding(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath()
  ctx.rect(996, 112, 340, 460)
  inkFill(ctx, C.teal, 5)
  halftoneRect(ctx, 1040, 330, 220, 210, INK, 0.1, 9)

  ctx.beginPath()
  ctx.rect(984, 98, 364, 26)
  inkFill(ctx, C.tealDark, 4)

  drawWindowGrid(ctx, 1032, 154, 256, 208, 4, 4, C.window, C.paper, 10)

  // Vertical book-shop sign, characters stacked upright.
  ctx.save()
  roundRect(ctx, 944, 214, 54, 190, 8)
  inkFill(ctx, C.mustard, 4)
  ctx.fillStyle = INK
  ctx.font = '700 26px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ;['城', '市', '书', '店'].forEach((character, index) => {
    ctx.fillText(character, 971, 248 + index * 42)
  })
  ctx.restore()

  // Balconies
  for (let i = 0; i < 2; i += 1) {
    const y = 380 + i * 72
    ctx.beginPath()
    ctx.rect(1032, y, 256, 12)
    inkFill(ctx, C.tealDark, 3.5)
    for (let j = 0; j < 12; j += 1) {
      ctx.beginPath()
      ctx.moveTo(1040 + j * 21, y + 12)
      ctx.lineTo(1040 + j * 21, y + 26)
      strokeInk(ctx, INK, 2.5)
    }
  }

  // Storefront
  ctx.beginPath()
  ctx.rect(1018, 500, 284, 74)
  inkFill(ctx, '#f6e0b8', 4)
  ctx.beginPath()
  ctx.rect(1040, 514, 150, 48)
  ctx.fillStyle = C.window
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 3
  ctx.stroke()

  shopSign(ctx, 1110, 458, 168, 34, 'BOOKS & 绿意', C.paper, INK)

  // rooftop tree
  drawTree(ctx, 1190, 102, 0.34, Math.sin(0.4) * 0.1, 41, false)

  // Antenna + clothesline
  ctx.beginPath()
  ctx.moveTo(1290, 98)
  ctx.lineTo(1290, 42)
  strokeInk(ctx, INK, 4)
  ctx.beginPath()
  ctx.moveTo(1272, 66)
  ctx.lineTo(1308, 66)
  strokeInk(ctx, INK, 3)
}

function drawBillboard(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.translate(556, 268)
  ctx.rotate(-0.015)
  ctx.beginPath()
  ctx.rect(-10, -10, 232, 122)
  ctx.fillStyle = INK
  ctx.fill()
  ctx.beginPath()
  ctx.rect(0, 0, 212, 102)
  inkFill(ctx, C.paper, 3)
  ctx.fillStyle = C.greenDark
  ctx.fillRect(10, 10, 46, 82)
  // leaf mark
  ctx.save()
  ctx.translate(33, 51)
  ctx.beginPath()
  ctx.moveTo(0, -24)
  ctx.bezierCurveTo(22, -16, 22, 18, 0, 26)
  ctx.bezierCurveTo(-22, 18, -22, -16, 0, -24)
  ctx.fillStyle = C.greenLight
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = INK
  ctx.font = '700 28px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('给城市', 72, 38)
  ctx.fillText('多一点绿', 72, 74)
  // poles
  ctx.beginPath()
  ctx.moveTo(30, 102)
  ctx.lineTo(30, 230)
  ctx.moveTo(182, 102)
  ctx.lineTo(182, 230)
  strokeInk(ctx, INK, 6)
  ctx.restore()
}

function drawSkyline(ctx: CanvasRenderingContext2D): void {
  const rand = seeded(7)
  let x = -220
  while (x < W + 200) {
    const w = 54 + rand() * 90
    const h = 54 + rand() * 145
    const baseY = 520
    ctx.beginPath()
    ctx.rect(x, baseY - h, w, h)
    ctx.fillStyle = rand() > 0.5 ? C.farBuilding : C.farBuilding2
    ctx.fill()
    if (rand() > 0.35) {
      ctx.fillStyle = 'rgba(255,247,233,0.4)'
      const cols = Math.max(2, Math.floor(w / 26))
      const rows = Math.max(2, Math.floor(h / 34))
      for (let c = 0; c < cols; c += 1) {
        for (let r = 1; r < rows; r += 1) {
          ctx.fillRect(x + 8 + c * 24, baseY - h + 10 + r * 28, 10, 14)
        }
      }
    }
    x += w + 8 + rand() * 22
  }
  // Haze band
  const haze = ctx.createLinearGradient(0, 400, 0, 530)
  haze.addColorStop(0, 'rgba(255, 236, 202, 0)')
  haze.addColorStop(1, 'rgba(255, 236, 202, 0.55)')
  ctx.fillStyle = haze
  ctx.fillRect(-220, 400, W + 440, 140)
}

function drawStreet(ctx: CanvasRenderingContext2D): void {
  // Sidewalk background band
  ctx.beginPath()
  ctx.rect(-220, 512, W + 440, 208)
  inkFill(ctx, C.sidewalk, 0)

  // Road trapezoid
  ctx.beginPath()
  ctx.moveTo(350, 512)
  ctx.lineTo(930, 512)
  ctx.lineTo(1120, 720)
  ctx.lineTo(160, 720)
  ctx.closePath()
  inkFill(ctx, C.road, 0)

  // Perspective sidewalk strips and curbs
  ctx.beginPath()
  ctx.moveTo(350, 512)
  ctx.lineTo(160, 720)
  strokeInk(ctx, C.paper, 4)
  ctx.beginPath()
  ctx.moveTo(930, 512)
  ctx.lineTo(1120, 720)
  strokeInk(ctx, C.paper, 4)

  // Curb shadow
  ctx.beginPath()
  ctx.moveTo(358, 512)
  ctx.lineTo(172, 720)
  ctx.lineTo(160, 720)
  ctx.lineTo(350, 512)
  ctx.closePath()
  ctx.fillStyle = 'rgba(32,29,34,0.16)'
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(922, 512)
  ctx.lineTo(1108, 720)
  ctx.lineTo(1120, 720)
  ctx.lineTo(930, 512)
  ctx.closePath()
  ctx.fill()

  // Lane dashes
  const dashes = [
    { y: 548, w: 34, h: 9 },
    { y: 586, w: 44, h: 12 },
    { y: 636, w: 58, h: 15 },
    { y: 700, w: 76, h: 18 },
  ]
  for (const dash of dashes) {
    ctx.beginPath()
    ctx.roundRect ? ctx.roundRect(640 - dash.w / 2, dash.y, dash.w, dash.h, 3) : ctx.rect(640 - dash.w / 2, dash.y, dash.w, dash.h)
    ctx.fillStyle = C.paper
    ctx.fill()
  }

  // Sidewalk paving lines
  ctx.strokeStyle = 'rgba(96, 76, 52, 0.28)'
  ctx.lineWidth = 2
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath()
    ctx.moveTo(-220, 540 + i * 44)
    ctx.lineTo(160 + i * 30, 540 + i * 44)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(W + 220, 540 + i * 44)
    ctx.lineTo(1120 - i * 30, 540 + i * 44)
    ctx.stroke()
  }

  // Crosswalk in the foreground
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(420, 668)
  ctx.lineTo(850, 668)
  ctx.lineTo(900, 720)
  ctx.lineTo(370, 720)
  ctx.closePath()
  ctx.clip()
  ctx.fillStyle = 'rgba(255,247,233,0.9)'
  for (let i = 0; i < 7; i += 1) {
    ctx.save()
    ctx.translate(390 + i * 76, 690)
    ctx.rotate(0.02)
    ctx.fillRect(0, -40, 34, 120)
    ctx.restore()
  }
  ctx.restore()

  // Tree pits
  ctx.fillStyle = 'rgba(72, 55, 38, 0.3)'
  ctx.fillRect(70, 650, 150, 50)
  ctx.fillRect(1060, 650, 150, 50)

  // Storm drain
  ctx.beginPath()
  ctx.roundRect ? ctx.roundRect(330, 590, 54, 18, 5) : ctx.rect(330, 590, 54, 18)
  inkFill(ctx, C.roadDark, 3)
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath()
    ctx.moveTo(338 + i * 12, 594)
    ctx.lineTo(338 + i * 12, 604)
    strokeInk(ctx, C.paper, 2)
  }
}

function drawStreetLamp(ctx: CanvasRenderingContext2D): void {
  ctx.save()
  ctx.translate(320, 610)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -260)
  ctx.quadraticCurveTo(0, -302, 52, -302)
  strokeInk(ctx, INK, 10)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -260)
  ctx.quadraticCurveTo(0, -302, 52, -302)
  strokeInk(ctx, C.greenDark, 5)
  ctx.beginPath()
  ctx.moveTo(52, -302)
  ctx.lineTo(52, -278)
  strokeInk(ctx, INK, 4)
  roundRect(ctx, 34, -282, 38, 30, 8)
  inkFill(ctx, C.mustard, 4)
  ctx.fillStyle = '#fff4c9'
  ctx.beginPath()
  ctx.arc(53, -266, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawBus(ctx: CanvasRenderingContext2D, t: number): void {
  const x = 470 + Math.sin(t * 0.35) * 8
  const y = 490
  ctx.save()
  ctx.translate(x, y)
  // shadow
  ctx.globalAlpha = 0.18
  ctx.beginPath()
  ctx.ellipse(82, 40, 100, 14, 0, 0, Math.PI * 2)
  ctx.fillStyle = INK
  ctx.fill()
  ctx.globalAlpha = 1
  // body
  roundRect(ctx, 0, 0, 164, 46, 12)
  inkFill(ctx, C.mustard, 4)
  roundRect(ctx, 12, 8, 124, 24, 6)
  inkFill(ctx, C.window, 2.5)
  ctx.fillStyle = 'rgba(255,247,233,0.45)'
  ctx.fillRect(18, 13, 36, 14)
  ctx.fillRect(62, 13, 22, 14)
  ctx.fillStyle = C.greenDark
  ctx.fillRect(8, 28, 148, 7)
  // wheels
  for (const wx of [36, 128]) {
    ctx.beginPath()
    ctx.arc(wx, 47, 10, 0, Math.PI * 2)
    inkFill(ctx, INK, 0)
    ctx.beginPath()
    ctx.arc(wx, 47, 4, 0, Math.PI * 2)
    ctx.fillStyle = C.paper
    ctx.fill()
  }
  ctx.restore()
}

function drawForegroundEdgeLeaves(
  ctx: CanvasRenderingContext2D,
  t: number,
): void {
  const rand = seeded(88)
  for (let i = 0; i < 14; i += 1) {
    const x = rand() * W
    const y = 40 + rand() * 150
    const drift = Math.sin(t * 0.5 + i) * 10
    drawLeafShape(
      ctx,
      x + drift,
      y,
      6 + rand() * 6,
      rand() * Math.PI,
      i % 3 === 0 ? C.leafWarm : C.greenLight,
      0.9,
    )
  }
}

export function drawCityWide(ctx: CanvasRenderingContext2D, time: number): void {
  const t = ((time % 5) + 5) % 5
  const pan = -12 * t

  ctx.save()
  ctx.translate(pan, Math.sin(t * 0.7) * 2.5)
  drawSky(ctx, C.skyTop, C.skyBottom)
  drawSun(ctx, 1080, 150, 56, t)
  drawCloud(ctx, 220, 148, 1.1)
  drawCloud(ctx, 700, 92, 0.75)
  drawCloud(ctx, 1020, 246, 0.5)
  drawBird(ctx, 380, 190, 0.8, t * 3)
  drawBird(ctx, 424, 168, 0.6, t * 3 + 1)
  drawBird(ctx, 458, 196, 0.5, t * 3 + 2)

  drawSkyline(ctx)
  drawBillboard(ctx)
  drawLeftBuilding(ctx)
  drawRightBuilding(ctx)

  drawStreet(ctx)
  drawBus(ctx, t)

  // Midground trees
  drawTree(ctx, 402, 574, 0.6, Math.sin(t * 0.9 + 1) * 0.09, 21)
  drawTree(ctx, 874, 578, 0.55, Math.sin(t * 0.8 + 2.2) * 0.08, 22)

  drawStreetLamp(ctx)

  // People
  drawPerson(ctx, 244, 632, 0.84, C.mustard, t * 4.2, 1)
  drawPerson(ctx, 292, 650, 0.9, C.blue, t * 4.2 + 2.1, 1)
  drawPerson(ctx, 1032, 650, 0.96, C.coral, t * 3.8 + 0.6, -1)

  // Foreground trees frame the shot
  drawTree(ctx, 140, 748, 1.28, Math.sin(t * 0.85) * 0.1, 11)
  drawTree(ctx, 1170, 752, 1.34, Math.sin(t * 0.9 + 1.8) * 0.1, 14)

  drawGroundShadow(ctx, 640, 600, 280, 26, 0.08)
  drawForegroundEdgeLeaves(ctx, t)

  // Foreground grain of ink dots near ground
  halftoneRect(ctx, -200, 600, 1700, 140, INK, 0.04, 11, 1.4)

  ctx.restore()
}
