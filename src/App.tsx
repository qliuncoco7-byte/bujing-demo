import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './components/Icon'
import { Modal } from './components/Modal'
import {
  PreviewPlayer,
  programDuration,
} from './components/PreviewPlayer'
import { SidePanel } from './components/SidePanel'
import { Timeline } from './components/Timeline'
import { Toast } from './components/Toast'
import type { ToastData } from './components/Toast'
import { TopBar } from './components/TopBar'
import { PROJECT } from './data/project'
import type { Candidate, PlayerMode } from './types'

type TimelineState = {
  inserted: Candidate | null
  history: Array<Candidate | null>
}

type Selection = 'none' | 'gap' | 'inserted'

const INITIAL_TIMELINE: TimelineState = { inserted: null, history: [] }

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const timelineTimeRef = useRef(0)
  const previewTimeRef = useRef(0)
  const keyHandlerRef = useRef<(event: KeyboardEvent) => void>(() => {})

  const [timeline, setTimeline] = useState<TimelineState>(INITIAL_TIMELINE)
  const [mode, setMode] = useState<PlayerMode>({ kind: 'timeline' })
  const [timelineTime, setTimelineTime] = useState(0)
  const [previewTime, setPreviewTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [selection, setSelection] = useState<Selection>('none')
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelIntent, setPanelIntent] = useState<'add' | 'replace'>('add')
  const [aboutOpen, setAboutOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [licenseCandidate, setLicenseCandidate] = useState<Candidate | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [sessionKey, setSessionKey] = useState(0)

  const activeTime = mode.kind === 'timeline' ? timelineTime : previewTime
  const previewCandidateId =
    mode.kind === 'candidate' ? mode.candidate.id : null
  const contextCandidateId = mode.kind === 'context' ? mode.candidate.id : null

  const setTimelinePos = (time: number) => {
    const clamped = Math.max(0, Math.min(PROJECT.duration, time))
    timelineTimeRef.current = clamped
    setTimelineTime(clamped)
  }

  const setPreviewPos = (time: number) => {
    previewTimeRef.current = time
    setPreviewTime(time)
  }

  const pauseAudio = () => {
    audioRef.current?.pause()
  }

  const seekAudio = (time: number) => {
    const audio = audioRef.current
    if (!audio) return
    try {
      audio.currentTime = Math.max(
        0,
        Math.min(time, Math.max(0, PROJECT.duration - 0.03)),
      )
    } catch {
      // Metadata may not be ready yet; the next explicit play will resync.
    }
  }

  const playAudioAt = (time: number) => {
    const audio = audioRef.current
    if (!audio) return
    seekAudio(time)
    void audio.play().catch(() => {
      // Some browsers block autoplay; the visual demo still runs.
    })
  }

  const showToast = (
    message: string,
    actionLabel?: string,
    action?: ToastData['action'],
  ) => {
    setToast({ id: Date.now(), message, actionLabel, action })
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

  useEffect(() => {
    if (!playing) pauseAudio()
  }, [playing])

  useEffect(() => {
    if (mode.kind !== 'timeline') pauseAudio()
  }, [mode.kind])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current))
    }, 6500)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const elapsed = now - last
      if (elapsed < 30) return
      const dt = Math.min(0.08, elapsed / 1000)
      last = now
      if (mode.kind === 'timeline') {
        const next = Math.min(PROJECT.duration, timelineTimeRef.current + dt)
        timelineTimeRef.current = next
        setTimelineTime(next)
        if (next >= PROJECT.duration) setPlaying(false)
      } else {
        const duration = programDuration(mode)
        let next = previewTimeRef.current + dt
        if (mode.kind === 'candidate') {
          if (next >= duration) next %= duration
        } else if (next >= duration) {
          next = duration
          setPlaying(false)
        }
        previewTimeRef.current = next
        setPreviewTime(next)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, mode])

  const togglePlay = () => {
    const current = mode.kind === 'timeline' ? timelineTimeRef.current : previewTimeRef.current
    const duration = programDuration(mode)
    if (playing) {
      setPlaying(false)
      pauseAudio()
      return
    }
    const start = current >= duration - 0.03 ? 0 : current
    if (mode.kind === 'timeline') {
      setTimelinePos(start)
      playAudioAt(start)
    } else {
      setPreviewPos(start)
    }
    setPlaying(true)
  }

  const rewind = () => {
    if (mode.kind === 'timeline') {
      setTimelinePos(0)
      seekAudio(0)
    } else {
      setPreviewPos(0)
    }
  }

  const seekTimeline = (time: number) => {
    const clamped = Math.max(0, Math.min(PROJECT.duration, time))
    setTimelinePos(clamped)
    setSelection('none')
    if (mode.kind !== 'timeline') {
      setMode({ kind: 'timeline' })
      setPlaying(false)
      pauseAudio()
    } else if (playing) {
      seekAudio(clamped)
    }
  }

  const exitPreview = () => {
    setMode({ kind: 'timeline' })
    setPlaying(false)
    setPreviewPos(0)
    pauseAudio()
  }

  const selectGap = () => {
    setMode({ kind: 'timeline' })
    setPlaying(false)
    pauseAudio()
    setTimelinePos(PROJECT.gapStart)
    setSelection('gap')
  }

  const selectInserted = () => {
    setMode({ kind: 'timeline' })
    setPlaying(false)
    pauseAudio()
    setTimelinePos(PROJECT.gapStart)
    setSelection('inserted')
  }

  const clearSelection = () => {
    setSelection('none')
  }

  const openPanel = (intent: 'add' | 'replace') => {
    setPanelOpen(true)
    setPanelIntent(intent)
    setMode({ kind: 'timeline' })
    setPlaying(false)
    setPreviewPos(0)
    pauseAudio()
    setTimelinePos(PROJECT.gapStart)
    setSelection(intent === 'add' ? 'gap' : 'inserted')
  }

  const openShot = () => openPanel(timeline.inserted ? 'replace' : 'add')

  const closePanel = useCallback(() => {
    setPanelOpen(false)
    setMode({ kind: 'timeline' })
    setPlaying(false)
    setPreviewPos(0)
    audioRef.current?.pause()
  }, [])

  const openAbout = useCallback(() => setAboutOpen(true), [])

  const previewCandidate = useCallback((candidate: Candidate) => {
    setMode({ kind: 'candidate', candidate })
    setPreviewPos(0)
    setPlaying(true)
    audioRef.current?.pause()
  }, [])

  const previewContext = useCallback((candidate: Candidate) => {
    setMode({ kind: 'context', candidate })
    setPreviewPos(0)
    setPlaying(true)
    audioRef.current?.pause()
  }, [])

  const insertCandidate = (candidate: Candidate) => {
    const replacing = panelIntent === 'replace' && timeline.inserted !== null
    setTimeline({
      inserted: candidate,
      history: [...timeline.history, timeline.inserted],
    })
    setMode({ kind: 'timeline' })
    setSelection('inserted')
    setTimelinePos(PROJECT.gapStart)
    setPreviewPos(0)
    setPanelOpen(false)
    setPanelIntent('add')
    setPlaying(true)
    playAudioAt(PROJECT.gapStart)
    showToast(
      replacing
        ? `已替换为「${candidate.shortTitle}」`
        : `已补入「${candidate.shortTitle}」`,
      '撤销',
      'undo',
    )
  }

  const undoInsert = () => {
    if (timeline.history.length === 0) return
    const restored = timeline.history[timeline.history.length - 1]
    setTimeline({
      inserted: restored,
      history: timeline.history.slice(0, -1),
    })
    setMode({ kind: 'timeline' })
    setPlaying(false)
    setPanelOpen(false)
    setPanelIntent('add')
    setPreviewPos(0)
    setTimelinePos(PROJECT.gapStart)
    setSelection(restored ? 'inserted' : 'gap')
    pauseAudio()
    showToast(
      restored
        ? `已撤销替换，恢复「${restored.shortTitle}」`
        : '已撤销插入，恢复空档',
    )
  }

  const resetDemo = () => {
    setTimeline(INITIAL_TIMELINE)
    setMode({ kind: 'timeline' })
    setTimelinePos(0)
    setPreviewPos(0)
    setPlaying(false)
    setMuted(false)
    setSelection('none')
    setPanelOpen(false)
    setPanelIntent('add')
    setAboutOpen(false)
    setResetOpen(false)
    setLicenseCandidate(null)
    setSessionKey((value) => value + 1)
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      try {
        audio.currentTime = 0
      } catch {
        // noop
      }
      audio.muted = false
    }
    showToast('已重置示例项目')
  }

  keyHandlerRef.current = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    const typing =
      target !== null &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)

    if (event.key === 'Escape') {
      if (licenseCandidate) {
        setLicenseCandidate(null)
        return
      }
      if (resetOpen) {
        setResetOpen(false)
        return
      }
      if (aboutOpen) {
        setAboutOpen(false)
        return
      }
      if (panelOpen) {
        closePanel()
        return
      }
      if (mode.kind !== 'timeline') {
        exitPreview()
      }
      return
    }

    if (typing) return

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      undoInsert()
      return
    }

    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault()
      togglePlay()
    }
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => keyHandlerRef.current(event)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className={`app ${panelOpen ? 'with-panel' : ''}`}>
      <TopBar onReset={() => setResetOpen(true)} onAbout={openAbout} />
      <div className="workspace">
        <main className="editor-main">
          <PreviewPlayer
            mode={mode}
            time={activeTime}
            playing={playing}
            inserted={timeline.inserted}
            panelOpen={panelOpen}
            muted={muted}
            intent={panelIntent}
            onTogglePlay={togglePlay}
            onToggleMute={() => setMuted((value) => !value)}
            onOpenPanel={openShot}
            onExitPreview={exitPreview}
            onEnterContext={previewContext}
            onInsert={insertCandidate}
            onRewind={rewind}
          />
          <Timeline
            displayTime={timelineTime}
            previewing={mode.kind !== 'timeline'}
            inserted={timeline.inserted}
            selection={selection}
            canUndo={timeline.history.length > 0}
            onSeek={seekTimeline}
            onSelectGap={selectGap}
            onSelectInserted={selectInserted}
            onClearSelection={clearSelection}
            panelOpen={panelOpen}
            onOpenPanel={openShot}
            onUndo={undoInsert}
            onReplace={() => openPanel('replace')}
          />
        </main>

        <SidePanel
          key={sessionKey}
          open={panelOpen}
          intent={panelIntent}
          inserted={timeline.inserted}
          previewCandidateId={previewCandidateId}
          contextCandidateId={contextCandidateId}
          onClose={closePanel}
          onPreview={previewCandidate}
          onContextPreview={previewContext}
          onOpenLicense={setLicenseCandidate}
          onOpenAbout={openAbout}
        />
      </div>

      <audio ref={audioRef} preload="auto">
        <source
          src={`${import.meta.env.BASE_URL}audio/narration.m4a`}
          type="audio/mp4"
        />
        <source
          src={`${import.meta.env.BASE_URL}audio/narration.wav`}
          type="audio/wav"
        />
      </audio>

      <Toast
        key={toast?.id ?? 'no-toast'}
        toast={toast}
        onAction={() => {
          if (toast?.action === 'undo') {
            undoInsert()
          } else {
            setToast(null)
          }
        }}
        onClose={() => setToast(null)}
      />

      <Modal
        open={aboutOpen}
        title="关于这个交互 Demo"
        eyebrow="模拟范围"
        onClose={() => setAboutOpen(false)}
        width={640}
        footer={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAboutOpen(false)}
          >
            知道了
          </button>
        }
      >
        <div className="about-lead">
          <span className="about-mark">
            <Icon name="leaf" size={22} />
          </span>
          <div>
            <strong>补镜</strong>
            <p>在剪辑时间线中，为缺辅助画面的区间找一段更贴合原片表达的镜头。</p>
          </div>
        </div>
        <div className="about-grid">
          <div className="about-block">
            <h3>Demo 会做什么</h3>
            <ul>
              <li>从选中区间带入 4.0 秒、16:9 与保留口播。</li>
              <li>可选参考前后镜头，提取可修改的画面条件。</li>
              <li>提供素材库与 AI 生成两条路径，共用需求和条件。</li>
              <li>支持单独预览、上下文预览、插入、替换和撤销。</li>
              <li>提供一次“强风改微风”的修改与失败重试分支。</li>
            </ul>
          </div>
          <div className="about-block">
            <h3>Demo 不会做什么</h3>
            <ul>
              <li>不上传或真实分析原片，不调用任何模型或素材 API。</li>
              <li>不检索真实素材库，不生成任意新需求的结果。</li>
              <li>不包含登录、支付、后台、模型选择或完整剪辑功能。</li>
              <li>不承诺实时生成、成本或匹配分数。</li>
            </ul>
          </div>
        </div>
        <div className="about-note">
          <Icon name="info" size={15} />
          <div>
            <strong>素材与能力说明</strong>
            <p>
              示例画面均由本项目用 Canvas 程序动画制作；“实拍观感”候选刻意模拟写实画面，并非真实拍摄素材，也不代表素材库授权。口播由 macOS 系统 TTS 生成。生成结果均为随项目交付的预制示例，不是在线 AI 输出。仅覆盖“风吹树冠”这一演示场景。
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={licenseCandidate !== null}
        title="素材与使用说明"
        eyebrow="来源与许可"
        onClose={() => setLicenseCandidate(null)}
        width={560}
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setLicenseCandidate(null)}
          >
            关闭
          </button>
        }
      >
        {licenseCandidate && (
          <>
            <div className="license-title-row">
              <div>
                <h3>{licenseCandidate.title}</h3>
                <p>{licenseCandidate.natureLabel}</p>
              </div>
              <span className="preset-badge">预制示例</span>
            </div>
            <div className="license-meta">
              <div>
                <span>来源</span>
                <strong>{licenseCandidate.sourceLabel}</strong>
              </div>
              <div>
                <span>属性</span>
                <strong>{licenseCandidate.natureLabel}</strong>
              </div>
              <div>
                <span>使用范围</span>
                <strong>仅用于本次交互演示</strong>
              </div>
            </div>
            <p className="license-copy">{licenseCandidate.licenseDetail}</p>
            <p className="license-copy is-muted">
              本 Demo 不包含真实素材库或商业授权。若将类似流程用于正式产品，需要逐条核实可下载、可商用与平台接入/分发等不同权限，AI 生成也不自动等于无条件可商用。
            </p>
          </>
        )}
      </Modal>

      <Modal
        open={resetOpen}
        title="重置示例项目？"
        eyebrow="演示控制"
        onClose={() => setResetOpen(false)}
        width={480}
        footer={
          <div className="modal-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setResetOpen(false)}
            >
              取消
            </button>
            <button type="button" className="btn btn-danger" onClick={resetDemo}>
              <Icon name="refresh" size={15} />
              确认重置
            </button>
          </div>
        }
      >
        <p className="reset-copy">
          将恢复四秒空档，撤销当前插入，并清空本次补镜需求、解析条件和生成记录。此操作不可撤销。
        </p>
        <div className="reset-summary">
          <Icon name="info" size={14} />
          适合评审在完整演示后重新体验核心流程。
        </div>
      </Modal>
    </div>
  )
}
