import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Candidate, SceneSpec } from '../types'
import {
  PROJECT,
  SUBTITLES,
  TIMELINE_CLIPS,
} from '../data/project'
import { formatRuler, formatTime } from '../lib/format'
import { Icon } from './Icon'
import { SceneThumb } from './SceneCanvas'

const BAR_COUNT = 190
const BEFORE_SCENE: SceneSpec = { kind: 'city' }
const AFTER_SCENE: SceneSpec = { kind: 'avenue' }

function fallbackPeaks(): number[] {
  return Array.from({ length: BAR_COUNT }, (_, index) => {
    const time = (index / BAR_COUNT) * PROJECT.duration
    const speaking = SUBTITLES.some((item) => time >= item.start && time <= item.end)
    const wobble = Math.abs(Math.sin(index * 0.7) * Math.cos(index * 0.17))
    return speaking ? 0.3 + wobble * 0.7 : 0.06 + wobble * 0.07
  })
}

function useNarrationPeaks(): number[] {
  const [peaks, setPeaks] = useState<number[]>([])
  useEffect(() => {
    let alive = true
    let audioContext: AudioContext | null = null
    const url = `${import.meta.env.BASE_URL}audio/narration.m4a`
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('audio unavailable')
        return response.arrayBuffer()
      })
      .then((buffer) => {
        const Ctor = window.AudioContext
        audioContext = new Ctor()
        return audioContext.decodeAudioData(buffer)
      })
      .then((audio) => {
        if (!alive) return
        const data = audio.getChannelData(0)
        const bucket = Math.max(1, Math.floor(data.length / BAR_COUNT))
        const values: number[] = []
        let max = 0
        for (let i = 0; i < BAR_COUNT; i += 1) {
          let peak = 0
          const start = i * bucket
          const end = Math.min(data.length, start + bucket)
          for (let j = start; j < end; j += 8) {
            const value = Math.abs(data[j])
            if (value > peak) peak = value
          }
          values.push(peak)
          if (peak > max) max = peak
        }
        const normalized = values.map((value) =>
          max > 0 ? Math.pow(value / max, 0.78) : 0,
        )
        setPeaks(normalized)
      })
      .catch(() => {
        // The fallback pattern below still communicates that the narration is continuous.
      })
      .finally(() => {
        if (audioContext && audioContext.state !== 'closed') {
          void audioContext.close()
        }
      })
    return () => {
      alive = false
      if (audioContext && audioContext.state !== 'closed') {
        void audioContext.close()
      }
    }
  }, [])
  return peaks
}

function Waveform() {
  const peaks = useNarrationPeaks()
  const values = useMemo(
    () => (peaks.length ? peaks : fallbackPeaks()),
    [peaks],
  )
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = canvas.width
    const height = canvas.height
    ctx.clearRect(0, 0, width, height)
    const gap = 3
    const barWidth = Math.max(1.5, width / values.length - gap)
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, 'rgba(255, 206, 112, 0.9)')
    gradient.addColorStop(1, 'rgba(205, 152, 66, 0.65)')
    ctx.fillStyle = gradient
    values.forEach((value, index) => {
      const h = Math.max(2, value * height * 0.86)
      const x = index * (width / values.length) + gap / 2
      ctx.beginPath()
      ctx.roundRect(x, (height - h) / 2, barWidth, h, barWidth / 2)
      ctx.fill()
    })
  }, [values])

  return <canvas ref={canvasRef} width={1400} height={64} className="waveform" />
}

type Selection = 'none' | 'gap' | 'inserted'

type TimelineProps = {
  displayTime: number
  previewing: boolean
  inserted: Candidate | null
  selection: Selection
  canUndo: boolean
  showCoach: boolean
  onSeek: (time: number) => void
  onSelectGap: () => void
  onSelectInserted: () => void
  onClearSelection: () => void
  onOpenPanel: () => void
  onUndo: () => void
  onReplace: () => void
}

export function Timeline({
  displayTime,
  previewing,
  inserted,
  selection,
  canUndo,
  showCoach,
  onSeek,
  onSelectGap,
  onSelectInserted,
  onClearSelection,
  onOpenPanel,
  onUndo,
  onReplace,
}: TimelineProps) {
  const rulerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const percent = (time: number) => `${(time / PROJECT.duration) * 100}%`
  const gapLeft = percent(PROJECT.gapStart)
  const gapWidth = `${((PROJECT.gapEnd - PROJECT.gapStart) / PROJECT.duration) * 100}%`

  const seekFromClientX = (clientX: number) => {
    const el = rulerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    onSeek(ratio * PROJECT.duration)
  }

  const handleRulerPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    seekFromClientX(event.clientX)
  }

  const handleRulerPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    seekFromClientX(event.clientX)
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const rulerTicks = Array.from({ length: 16 }, (_, index) => index)

  return (
    <section className={`timeline-panel ${previewing ? 'is-previewing' : ''}`}>
      <header className="timeline-head">
        <div className="timeline-title">
          <span className="timeline-icon">
            <Icon name="film" size={15} />
          </span>
          <strong>时间线</strong>
          <span className="timeline-meta">{PROJECT.duration.toFixed(1)} 秒 · {PROJECT.fps} fps</span>
        </div>
        <div className="timeline-context">
          {selection === 'gap' && (
            <>
              <span className="selection-chip">
                <span className="selection-dot" />
                已选待补区间 00:05–00:09
              </span>
              <button type="button" className="btn btn-primary btn-tiny" onClick={onOpenPanel}>
                <Icon name="plus" size={14} />
                补充空镜
              </button>
            </>
          )}
          {selection === 'inserted' && inserted && (
            <>
              <span className="selection-chip is-filled">
                <Icon name="check" size={13} />
                已补入「{inserted.shortTitle}」
              </span>
              <button type="button" className="btn btn-secondary btn-tiny" onClick={onReplace}>
                替换
              </button>
              <button type="button" className="btn btn-ghost btn-tiny" onClick={onUndo}>
                <Icon name="undo" size={14} />
                撤销
              </button>
            </>
          )}
          {selection === 'none' && showCoach && (
            <span className="coach-chip">
              <span className="pulse-dot" />
              点击虚线区间补充 4 秒画面
            </span>
          )}
          {selection === 'none' && !showCoach && (
            <span className="timeline-hint">
              {previewing ? '预览模式 · 点击时间线返回' : '点击区间定位，拖拽标尺预览'}
            </span>
          )}
        </div>
        <button
          type="button"
          className="undo-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="撤销上一步插入 (⌘Z)"
          aria-label="撤销插入"
        >
          <Icon name="undo" size={16} />
          <span>撤销</span>
        </button>
      </header>

      <div className="timeline-grid">
        <div className="lane-labels">
          <div className="ruler-spacer" />
          <div className="lane-label">
            <span className="lane-badge video">V1</span>
            <span>画面</span>
          </div>
          <div className="lane-label">
            <span className="lane-badge audio">A1</span>
            <span>口播</span>
          </div>
        </div>

        <div className="lane-content">
          <div
            ref={rulerRef}
            className="ruler"
            onPointerDown={handleRulerPointerDown}
            onPointerMove={handleRulerPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {rulerTicks.map((second) => (
              <div
                key={second}
                className={`ruler-tick ${second % 3 === 0 ? 'major' : ''}`}
                style={{ left: percent(second) }}
              >
                <span className="tick-line" />
                {second % 3 === 0 && (
                  <span className="tick-label">{formatRuler(second)}</span>
                )}
              </div>
            ))}
          </div>

          <div className="video-track">
            {TIMELINE_CLIPS.map((clip) => (
              <button
                key={clip.id}
                type="button"
                className="timeline-clip"
                style={{
                  left: percent(clip.start),
                  width: percent(clip.end - clip.start),
                }}
                onClick={() => {
                  onClearSelection()
                  onSeek(clip.start + 0.02)
                }}
                title={`${clip.name} · ${formatTime(clip.start, 0)}–${formatTime(clip.end, 0)}`}
              >
                <SceneThumb
                  scene={clip.sceneId === 'city' ? BEFORE_SCENE : AFTER_SCENE}
                  time={clip.thumbTime}
                  className="clip-thumb"
                />
                <span className="clip-scrim" />
                <span className="clip-copy">
                  <strong>{clip.name}</strong>
                  <span>
                    {formatTime(clip.start, 0).replace('.0', '')}–
                    {formatTime(clip.end, 0).replace('.0', '')}
                  </span>
                </span>
              </button>
            ))}

            {!inserted && (
              <button
                type="button"
                className={`timeline-gap ${selection === 'gap' ? 'is-selected' : ''}`}
                style={{ left: gapLeft, width: gapWidth }}
                onClick={onSelectGap}
                title="待补画面 · 4.0 秒"
              >
                <span className="gap-stripes" aria-hidden="true" />
                <span className="gap-inner">
                  <span className="gap-plus">
                    <Icon name="plus" size={15} />
                  </span>
                  <span className="gap-copy">
                    <strong>待补画面</strong>
                    <em>4.0 秒 · 点击补充</em>
                  </span>
                </span>
              </button>
            )}

            {inserted && (
              <button
                type="button"
                className={`timeline-clip is-inserted ${
                  selection === 'inserted' ? 'is-selected' : ''
                }`}
                style={{
                  left: gapLeft,
                  width: gapWidth,
                }}
                onClick={onSelectInserted}
                title={`${inserted.title} · 已补入`}
              >
                <SceneThumb
                  scene={inserted.scene}
                  time={0.9}
                  className="clip-thumb"
                />
                <span className="clip-scrim is-amber" />
                <span className="clip-copy">
                  <strong>{inserted.shortTitle}</strong>
                  <span>已补入 · 4.0 秒</span>
                </span>
                <span className="inserted-badge">
                  <Icon name="check" size={11} />
                  补入
                </span>
              </button>
            )}
          </div>

          <div
            className="playhead-global"
            style={{ left: percent(displayTime) }}
            aria-hidden="true"
          >
            <span className="playhead-cap" />
            <span className="playhead-line" />
          </div>

          <div className="audio-track">
            <div
              className="audio-clip"
              style={{ left: '0%', width: '100%' }}
            >
              <div className="audio-clip-head">
                <span className="audio-title">
                  <Icon name="volume" size={11} />
                  口播 01
                </span>
                <span className="audio-source">系统 TTS 示例</span>
              </div>
              <Waveform />
            </div>
            <div
              className="audio-gap-marker"
              style={{ left: gapLeft, width: gapWidth }}
              title="口播在待补区间内保持连续"
            >
              <span>口播连续</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
