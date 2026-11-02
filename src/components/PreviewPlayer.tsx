import type { Candidate, PlayerMode, SceneSpec } from '../types'
import { PROJECT, SUBTITLES } from '../data/project'
import { Icon } from './Icon'
import { SceneCanvas } from './SceneCanvas'
import { formatTime } from '../lib/format'

export const CONTEXT_LEAD = 2.5
export const CONTEXT_CANDIDATE = 4
export const CONTEXT_TAIL = 2.5

type Resolved = {
  scene: SceneSpec
  sceneTime: number
  clipLabel: string
  isGap: boolean
  subtitle: string | null
}

function resolveScene(
  mode: PlayerMode,
  time: number,
  inserted: Candidate | null,
): Resolved {
  if (mode.kind === 'candidate') {
    return {
      scene: mode.candidate.scene,
      sceneTime: time,
      clipLabel: mode.candidate.shortTitle,
      isGap: false,
      subtitle: null,
    }
  }

  if (mode.kind === 'context') {
    if (time < CONTEXT_LEAD) {
      return {
        scene: { kind: 'city' },
        sceneTime: PROJECT.gapStart - CONTEXT_LEAD + time,
        clipLabel: '前镜头 · 城市街道全景',
        isGap: false,
        subtitle: null,
      }
    }
    if (time < CONTEXT_LEAD + CONTEXT_CANDIDATE) {
      return {
        scene: mode.candidate.scene,
        sceneTime: time - CONTEXT_LEAD,
        clipLabel: `候选 · ${mode.candidate.shortTitle}`,
        isGap: false,
        subtitle: null,
      }
    }
    return {
      scene: { kind: 'avenue' },
      sceneTime: time - CONTEXT_LEAD - CONTEXT_CANDIDATE,
      clipLabel: '后镜头 · 林荫道 · 行人',
      isGap: false,
      subtitle: null,
    }
  }

  if (time < PROJECT.gapStart) {
    const subtitle =
      SUBTITLES.find((item) => time >= item.start && time <= item.end)?.text ?? null
    return {
      scene: { kind: 'city' },
      sceneTime: time,
      clipLabel: '城市街道全景',
      isGap: false,
      subtitle,
    }
  }

  if (time < PROJECT.gapEnd) {
    const subtitle =
      SUBTITLES.find((item) => time >= item.start && time <= item.end)?.text ?? null
    if (inserted) {
      return {
        scene: inserted.scene,
        sceneTime: time - PROJECT.gapStart,
        clipLabel: inserted.shortTitle,
        isGap: false,
        subtitle,
      }
    }
    return {
      scene: { kind: 'gap' },
      sceneTime: time - PROJECT.gapStart,
      clipLabel: '待补画面',
      isGap: true,
      subtitle,
    }
  }

  const subtitle =
    SUBTITLES.find((item) => time >= item.start && time <= item.end)?.text ?? null
  return {
    scene: { kind: 'avenue' },
    sceneTime: time - PROJECT.gapEnd,
    clipLabel: '林荫道 · 行人',
    isGap: false,
    subtitle,
  }
}

export function programDuration(mode: PlayerMode): number {
  if (mode.kind === 'timeline') return PROJECT.duration
  if (mode.kind === 'candidate') return mode.candidate.duration
  return CONTEXT_LEAD + CONTEXT_CANDIDATE + CONTEXT_TAIL
}

type PreviewPlayerProps = {
  mode: PlayerMode
  time: number
  playing: boolean
  inserted: Candidate | null
  panelOpen: boolean
  muted: boolean
  onTogglePlay: () => void
  onToggleMute: () => void
  onOpenPanel: () => void
  onExitPreview: () => void
  onEnterContext: (candidate: Candidate) => void
  onInsert: (candidate: Candidate) => void
  intent: 'add' | 'replace'
  onRewind: () => void
}

function phaseProgress(mode: PlayerMode, time: number) {
  if (mode.kind === 'timeline') {
    return { current: time, total: PROJECT.duration, label: '时间线' }
  }
  if (mode.kind === 'candidate') {
    return { current: time, total: mode.candidate.duration, label: '单独预览' }
  }
  return {
    current: time,
    total: CONTEXT_LEAD + CONTEXT_CANDIDATE + CONTEXT_TAIL,
    label: '片段预览',
  }
}

function ContextStrip({
  time,
  candidate,
  ended,
  intent,
  onInsert,
  onExitPreview,
}: {
  time: number
  candidate: Candidate
  ended: boolean
  intent: 'add' | 'replace'
  onInsert: (candidate: Candidate) => void
  onExitPreview: () => void
}) {
  const total = CONTEXT_LEAD + CONTEXT_CANDIDATE + CONTEXT_TAIL
  const leadPct = (CONTEXT_LEAD / total) * 100
  const candidatePct = (CONTEXT_CANDIDATE / total) * 100
  const tailPct = (CONTEXT_TAIL / total) * 100
  const leadActive = time < CONTEXT_LEAD
  const candidateActive =
    time >= CONTEXT_LEAD && time < CONTEXT_LEAD + CONTEXT_CANDIDATE
  const tailActive = time >= CONTEXT_LEAD + CONTEXT_CANDIDATE
  const leadFill = leadActive ? Math.min(1, time / CONTEXT_LEAD) : 1
  const candidateFill = candidateActive
    ? Math.min(1, (time - CONTEXT_LEAD) / CONTEXT_CANDIDATE)
    : tailActive || ended
      ? 1
      : 0
  const tailFill = tailActive
    ? Math.min(1, (time - CONTEXT_LEAD - CONTEXT_CANDIDATE) / CONTEXT_TAIL)
    : 0

  return (
    <div className="context-dock">
      <div className="context-top">
        <div className="segment-labels">
          <span className={`seg-label ${leadActive ? 'is-active' : ''}`}>前镜头</span>
          <span className={`seg-label ${candidateActive ? 'is-active' : ''}`}>
            候选 · 4.0s
          </span>
          <span className={`seg-label ${tailActive ? 'is-active' : ''}`}>后镜头</span>
        </div>
        <span className="preview-safe-note">预览静音 · 不改动时间线</span>
      </div>
      <div className="segment-bar" aria-hidden="true">
        <div className="segment" style={{ width: `${leadPct}%` }}>
          <span style={{ transform: `scaleX(${leadFill})` }} />
        </div>
        <div className="segment candidate-segment" style={{ width: `${candidatePct}%` }}>
          <span style={{ transform: `scaleX(${candidateFill})` }} />
        </div>
        <div className="segment" style={{ width: `${tailPct}%` }}>
          <span style={{ transform: `scaleX(${tailFill})` }} />
        </div>
      </div>
      <div className="context-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onInsert(candidate)}
        >
          <Icon name={intent === 'replace' ? 'refresh' : 'check'} size={16} />
          {intent === 'replace' ? '替换当前画面' : '插入到 00:05–00:09'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onExitPreview}>
          返回时间线
        </button>
        <span className="context-hint">
          {ended ? '播放结束，可重播或直接插入' : `正在试放「${candidate.shortTitle}」`}
        </span>
      </div>
    </div>
  )
}

export function PreviewPlayer({
  mode,
  time,
  playing,
  inserted,
  panelOpen,
  muted,
  onTogglePlay,
  onToggleMute,
  onOpenPanel,
  onExitPreview,
  onEnterContext,
  onInsert,
  intent,
  onRewind,
}: PreviewPlayerProps) {
  const resolved = resolveScene(mode, time, inserted)
  const program = phaseProgress(mode, time)
  const ended = time >= program.total - 0.01
  const showGapCard =
    mode.kind === 'timeline' && resolved.isGap && !inserted && !panelOpen
  const showGapHint =
    mode.kind === 'timeline' && resolved.isGap && !inserted && panelOpen
  const showStartOverlay =
    mode.kind === 'timeline' &&
    !playing &&
    time < 0.08 &&
    !inserted &&
    !resolved.isGap

  return (
    <section className={`preview-shell ${panelOpen ? 'with-panel' : ''}`}>
      <div className="stage-frame">
        <div className="stage-aspect">
          <SceneCanvas
            scene={resolved.scene}
            time={resolved.sceneTime}
            className="stage-canvas"
            label={resolved.clipLabel}
          />
          <div className="stage-shade" aria-hidden="true" />

          <div className="stage-top">
            <span className={`clip-chip ${resolved.isGap || mode.kind !== 'timeline' ? 'is-attention' : ''}`}>
              <span className="status-dot" />
              {mode.kind === 'context'
                ? '片段预览 · 未插入'
                : mode.kind === 'candidate'
                  ? `候选预览 · ${mode.candidate.shortTitle}`
                  : resolved.clipLabel}
            </span>
            <div className="stage-top-right">
              {mode.kind !== 'timeline' && (
                <button type="button" className="glass-btn" onClick={onExitPreview}>
                  <Icon name="close" size={14} />
                  退出预览
                </button>
              )}
              <span className="glass-tag">16:9</span>
            </div>
          </div>

          {showStartOverlay && (
            <div className="start-overlay">
              <button
                type="button"
                className="big-play"
                onClick={onTogglePlay}
                aria-label="播放项目"
              >
                <Icon name="play" size={30} />
              </button>
              <div className="start-copy">
                <strong>{PROJECT.title}</strong>
                <span>城市绿化科普 · 15 秒示例项目</span>
              </div>
            </div>
          )}

          {showGapCard && (
            <div className="gap-overlay">
              <div className="gap-card">
                <div className="gap-kicker">
                  <span className="pulse-dot" />
                  待补画面 · 00:05–00:09
                </div>
                <h2>这里还缺一段辅助画面</h2>
                <p>
                  口播正说到城市绿化。补一段“风吹树冠”的镜头，让前后画面接得上。
                </p>
                <div className="gap-actions">
                  <button type="button" className="btn btn-primary" onClick={onOpenPanel}>
                    <Icon name="plus" size={16} />
                    补充空镜
                  </button>
                  <button type="button" className="btn btn-glass" onClick={onTogglePlay}>
                    <Icon name="play" size={15} />
                    {playing ? '暂停' : '播放口播'}
                  </button>
                </div>
                <div className="gap-meta">
                  <span>4.0 秒</span>
                  <span>16:9</span>
                  <span>口播继续</span>
                  <span className="gap-meta-muted">当前区间未被占用</span>
                </div>
              </div>
            </div>
          )}

          {showGapHint && (
            <div className="gap-hint">
              <span className="pulse-dot" />
              正在为 00:05–00:09 选择画面
              <b>在右侧比较候选，先预览再插入</b>
            </div>
          )}

          {resolved.subtitle && (
            <div className="subtitle-wrap">
              <span className="subtitle">{resolved.subtitle}</span>
            </div>
          )}

          {mode.kind === 'candidate' && (
            <div className="candidate-dock">
              <div className="candidate-dock-copy">
                <span className="eyebrow">单独预览 · 未插入</span>
                <strong>{mode.candidate.shortTitle}</strong>
              </div>
              <div className="candidate-dock-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  onClick={() => onEnterContext(mode.candidate)}
                >
                  <Icon name="film" size={15} />
                  放入片段预览
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={onExitPreview}
                >
                  返回时间线
                </button>
              </div>
            </div>
          )}

          {mode.kind === 'context' && (
            <ContextStrip
              time={time}
              candidate={mode.candidate}
              ended={ended}
              intent={intent}
              onInsert={onInsert}
              onExitPreview={onExitPreview}
            />
          )}
        </div>
      </div>

      <div className="transport">
        <div className="transport-left">
          <button
            type="button"
            className="transport-btn"
            onClick={onRewind}
            aria-label="回到开始"
            title="回到开始"
          >
            <Icon name="restart" size={17} />
          </button>
          <button
            type="button"
            className="transport-play"
            onClick={onTogglePlay}
            aria-label={playing ? '暂停' : '播放'}
            title={playing ? '暂停' : '播放'}
          >
            <Icon name={playing ? 'pause' : 'play'} size={18} />
          </button>
          <span className="time-readout">
            <b>{formatTime(time)}</b>
            <span>/</span>
            <span>{formatTime(program.total)}</span>
          </span>
          <span className="mode-readout">{program.label}</span>
        </div>
        <div className="transport-right">
          <span className="demand-note">口播为系统 TTS 示例</span>
          <button
            type="button"
            className="transport-btn"
            onClick={onToggleMute}
            aria-label={muted ? '打开口播声音' : '静音口播'}
            title={muted ? '打开口播声音' : '静音口播'}
          >
            <Icon name={muted ? 'muted' : 'volume'} size={17} />
          </button>
        </div>
      </div>
    </section>
  )
}
