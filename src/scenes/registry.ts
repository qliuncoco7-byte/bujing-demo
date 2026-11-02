import type { SceneSpec } from '../types'
import { drawAvenue } from './avenue'
import { drawCanopy } from './canopy'
import { drawCityWide } from './cityWide'
import { drawGap } from './placeholder'
import { drawRealTree } from './realTree'

export function renderScene(
  ctx: CanvasRenderingContext2D,
  scene: SceneSpec,
  time: number,
): void {
  switch (scene.kind) {
    case 'city':
      drawCityWide(ctx, time)
      break
    case 'avenue':
      drawAvenue(ctx, time)
      break
    case 'canopy':
      drawCanopy(ctx, time, scene.variant, scene.wind)
      break
    case 'real-tree':
      drawRealTree(ctx, time, scene.wind)
      break
    case 'gap':
      drawGap(ctx, time)
      break
  }
}
