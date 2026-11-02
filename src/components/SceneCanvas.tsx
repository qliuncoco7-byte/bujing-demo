import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { renderScene } from '../scenes/registry'
import { H, W } from '../scenes/utils'
import type { SceneSpec } from '../types'

type Size = { width: number; height: number; dpr: number }

function paint(
  canvas: HTMLCanvasElement,
  size: Size,
  scene: SceneSpec,
  time: number,
): void {
  if (size.width === 0 || size.height === 0) return
  const pixelWidth = Math.max(1, Math.round(size.width * size.dpr))
  const pixelHeight = Math.max(1, Math.round(size.height * size.dpr))
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const scale = canvas.width / W
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  renderScene(ctx, scene, time)
}

export function SceneCanvas({
  scene,
  time,
  className,
  label,
}: {
  scene: SceneSpec
  time: number
  className?: string
  label?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0, dpr: 1 })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const update = () => {
      const rect = canvas.getBoundingClientRect()
      setSize({
        width: rect.width,
        height: rect.height,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (ref.current) paint(ref.current, size, scene, time)
  }, [scene, time, size])

  return (
    <canvas
      ref={ref}
      className={className}
      role="img"
      aria-label={label ?? '视频预览画面'}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}

export function SceneThumb({
  scene,
  time = 1,
  className,
  label,
}: {
  scene: SceneSpec
  time?: number
  className?: string
  label?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scale = canvas.width / W
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.clearRect(0, 0, W, H)
    renderScene(ctx, scene, time)
  }, [scene, time])

  return (
    <canvas
      ref={ref}
      width={640}
      height={360}
      className={className}
      role="img"
      aria-label={label ?? '画面缩略图'}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
