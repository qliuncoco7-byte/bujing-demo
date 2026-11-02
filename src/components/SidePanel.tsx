import { memo, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ANALYSIS_DEFAULT,
  DEFAULT_REQUIREMENT,
  FORM_OPTIONS,
  GEN_V1,
  GEN_V2,
  LIBRARY_CANDIDATES,
  PROJECT,
  REFINE_SUGGESTION,
  TONE_OPTIONS,
  VIDEO_TYPE_OPTIONS,
} from '../data/project'
import type {
  Analysis,
  Candidate,
  StyleForm,
  StyleTone,
} from '../types'
import { Icon } from './Icon'
import { SceneThumb } from './SceneCanvas'
import type { SceneSpec } from '../types'

type Tab = 'library' | 'ai'
type AnalysisStatus = 'idle' | 'analyzing' | 'ready'
type GenAttempt = 'initial' | 'refine'

const REF_BEFORE: SceneSpec = { kind: 'city' }
const REF_AFTER: SceneSpec = { kind: 'avenue' }

const formLabel = (form: Candidate['form'] | StyleForm): string => {
  if (form === 'comic') return '漫画'
  if (form === 'live-look') return '实拍观感'
  if (form === '2d') return '二维动画'
  return '不限'
}

const toneLabel = (tone: Candidate['tone'] | StyleTone): string => {
  if (tone === 'light') return '轻松'
  if (tone === 'calm') return '沉稳'
  if (tone === 'tense') return '紧张'
  return '不限'
}

const motionLabel = (motion: Candidate['motion']): string =>
  motion === 'strong' ? '强风' : '微风'

function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`switch ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className="switch-knob" />
    </button>
  )
}

function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'comic' | 'live' | 'motion' }) {
  return <span className={`tag tag-${tone}`}>{children}</span>
}

function candidateCompare(
  candidate: Candidate,
  form: StyleForm,
  tone: StyleTone,
): string[] {
  const notes: string[] = []
  if (form !== 'any' && candidate.form !== form) notes.push('形式不同')
  if (tone !== 'any' && candidate.tone !== tone) notes.push('氛围不同')
  if (candidate.motion === 'strong') notes.push('风力偏强')
  return notes
}

type SidePanelProps = {
  open: boolean
  intent: 'add' | 'replace'
  inserted: Candidate | null
  previewCandidateId: string | null
  contextCandidateId: string | null
  onClose: () => void
  onPreview: (candidate: Candidate) => void
  onContextPreview: (candidate: Candidate) => void
  onOpenLicense: (candidate: Candidate) => void
  onOpenAbout: () => void
}

export const SidePanel = memo(function SidePanel({
  open,
  intent,
  inserted,
  previewCandidateId,
  contextCandidateId,
  onClose,
  onPreview,
  onContextPreview,
  onOpenLicense,
  onOpenAbout,
}: SidePanelProps) {
  const [tab, setTab] = useState<Tab>('library')
  const [requirement, setRequirement] = useState('')
  const [analysisEnabled, setAnalysisEnabled] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle')
  const [analysis, setAnalysis] = useState<Analysis>(ANALYSIS_DEFAULT)
  const [manualForm, setManualForm] = useState<StyleForm>('any')
  const [manualTone, setManualTone] = useState<StyleTone>('any')
  const [versions, setVersions] = useState<Candidate[]>([])
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(false)
  const [lastAttempt, setLastAttempt] = useState<GenAttempt>('initial')
  const [refineUsed, setRefineUsed] = useState(false)
  const [refineText, setRefineText] = useState('')
  const [failureArmed, setFailureArmed] = useState(false)
  const [unseen, setUnseen] = useState(false)
  const analysisTimer = useRef<number | null>(null)
  const genTimer = useRef<number | null>(null)
  const requirementInput = useRef<HTMLTextAreaElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const versionBlockRef = useRef<HTMLDivElement>(null)
  const pendingReveal = useRef(false)
  const [revealTick, setRevealTick] = useState(0)

  useEffect(() => {
    return () => {
      if (analysisTimer.current) window.clearTimeout(analysisTimer.current)
      if (genTimer.current) window.clearTimeout(genTimer.current)
    }
  }, [])

  useEffect(() => {
    if (tab === 'ai' && unseen) setUnseen(false)
  }, [tab, unseen])

  const analysisReady = analysisEnabled && analysisStatus === 'ready'
  const effectiveForm: StyleForm = analysisReady ? analysis.form : manualForm
  const effectiveTone: StyleTone = analysisReady ? analysis.tone : manualTone
  const hasStyleContext =
    analysisReady || manualForm !== 'any' || manualTone !== 'any'

  const requirementTrimmed = requirement.trim()
  const hasRequirement = requirementTrimmed.length > 0
  const requirementInScope =
    !hasRequirement || /(树|风|绿|叶|街|冠)/.test(requirementTrimmed)
  const conditionInScope =
    (effectiveForm === 'any' || effectiveForm === 'comic') &&
    (effectiveTone === 'any' || effectiveTone === 'light')
  const canRequest = hasRequirement && requirementInScope && conditionInScope
  const refineInScope = /微风|强风|摆动|风力/.test(refineText.trim())
  const activeVersion =
    versions.find((item) => item.id === activeVersionId) ??
    versions[versions.length - 1] ??
    null

  const startAnalysis = (fresh: boolean) => {
    if (analysisTimer.current) window.clearTimeout(analysisTimer.current)
    setAnalysisEnabled(true)
    setAnalysisStatus('analyzing')
    analysisTimer.current = window.setTimeout(() => {
      setAnalysis((current) =>
        fresh
          ? { ...ANALYSIS_DEFAULT }
          : current.edited || current.videoType !== ANALYSIS_DEFAULT.videoType
            ? current
            : { ...ANALYSIS_DEFAULT },
      )
      setAnalysisStatus('ready')
      analysisTimer.current = null
    }, 950)
  }

  const handleToggleAnalysis = (value: boolean) => {
    if (!value) {
      if (analysisTimer.current) {
        window.clearTimeout(analysisTimer.current)
        analysisTimer.current = null
      }
      setAnalysisEnabled(false)
      if (analysisStatus === 'analyzing') setAnalysisStatus('idle')
      return
    }
    if (analysisStatus === 'ready') {
      setAnalysisEnabled(true)
      return
    }
    startAnalysis(false)
  }

  const runGenerate = (attempt: GenAttempt) => {
    if (generating || !canRequest) return
    if (genTimer.current) window.clearTimeout(genTimer.current)
    setGenerating(true)
    setGenError(false)
    setLastAttempt(attempt)
    genTimer.current = window.setTimeout(() => {
      setGenerating(false)
      genTimer.current = null
      if (failureArmed) {
        setFailureArmed(false)
        setGenError(true)
        setUnseen(true)
        setRevealTick((value) => value + 1)
        return
      }
      if (attempt === 'refine') {
        setVersions((current) =>
          current.some((item) => item.id === GEN_V2.id)
            ? current
            : [...current, GEN_V2],
        )
        setActiveVersionId(GEN_V2.id)
        setRefineUsed(true)
      } else {
        setVersions((current) =>
          current.some((item) => item.id === GEN_V1.id)
            ? current
            : [...current, GEN_V1],
        )
        setActiveVersionId(GEN_V1.id)
      }
      setGenError(false)
      setUnseen(true)
      setRevealTick((value) => value + 1)
    }, attempt === 'refine' ? 1700 : 2100)
  }

  const handlePrimaryGenerate = () => {
    if (versions.length === 0) runGenerate('initial')
  }

  const handleRefine = () => {
    if (!refineInScope || refineUsed) return
    runGenerate('refine')
  }

  const fillExample = () => {
    setRequirement(DEFAULT_REQUIREMENT)
    requirementInput.current?.focus()
  }

  const warningMessage = useMemo(() => {
    if (!requirementInScope)
      return '当前交互 Demo 只覆盖「风吹树冠」类需求，这段描述不会得到真实处理。'
    if (!conditionInScope)
      return '预制生成示例只覆盖「漫画 · 轻松」条件；当前条件修改后，生成不可用，可改用素材库。'
    return null
  }, [conditionInScope, requirementInScope])

  useEffect(() => {
    if (revealTick === 0) return
    const target = genError ? errorRef.current : versionBlockRef.current
    if (!target) {
      pendingReveal.current = true
      return
    }
    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
    return () => window.clearTimeout(timer)
  }, [revealTick, genError])

  useEffect(() => {
    if (tab !== 'ai' || !pendingReveal.current) return
    const target = genError ? errorRef.current : versionBlockRef.current
    if (!target) return
    pendingReveal.current = false
    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [tab, genError, versions.length])

  const libraryCount = LIBRARY_CANDIDATES.length

  return (
    <aside className={`side-panel ${open ? 'is-open' : 'is-closed'}`} aria-hidden={!open}>
      <header className="panel-head">
        <div className="panel-head-top">
          <span className="panel-eyebrow">
            <Icon name="sparkles" size={13} />
            {intent === 'replace' ? '替换空镜' : '补镜'}
          </span>
          <button
            type="button"
            className="icon-btn panel-close"
            onClick={onClose}
            aria-label="关闭补镜面板"
            title="关闭"
          >
            <Icon name="close" size={17} />
          </button>
        </div>
        <h1>{intent === 'replace' ? '替换这段画面' : '补充一段空镜'}</h1>
        <p className="panel-sub">
          区间 00:05–00:09 · 4.0 秒 · {PROJECT.aspect} · 口播继续
        </p>
        {intent === 'replace' && inserted && (
          <div className="current-clip">
            <span>当前画面</span>
            <strong>{inserted.shortTitle}</strong>
            <span className="current-clip-note">插入后覆盖，仍可撤销</span>
          </div>
        )}
      </header>

      <div className="panel-scroll">
        <section className="panel-section">
          <div className="section-head">
            <span className="section-index">01</span>
            <h2>画面需求</h2>
            <span className="section-hint">从当前区间带入时长与画幅</span>
          </div>
          <div className="demand-card">
            <label className="sr-only" htmlFor="shot-requirement">
              画面需求
            </label>
            <textarea
              id="shot-requirement"
              ref={requirementInput}
              value={requirement}
              onChange={(event) => setRequirement(event.target.value)}
              placeholder="描述这段画面要什么，例如：风吹树冠，不要人物。"
              rows={2}
              maxLength={80}
              className="demand-input"
            />
            <div className="demand-footer">
              <button type="button" className="example-link" onClick={fillExample}>
                <Icon name="sparkles" size={13} />
                填入示例：风吹树冠，不要人物。
              </button>
              <span className="char-count">{requirement.length} / 80</span>
            </div>
            <div className="constraint-row">
              <span>
                <Icon name="clock" size={12} /> 4.0 秒
              </span>
              <span>
                <Icon name="aspect" size={12} /> {PROJECT.aspect}
              </span>
              <span>
                <Icon name="leaf" size={12} /> 轻微运动
              </span>
              <span>
                <Icon name="volume" size={12} /> 保留口播
              </span>
            </div>
          </div>
          {warningMessage && (
            <div className="inline-warning">
              <Icon name="alert" size={14} />
              <span>{warningMessage}</span>
            </div>
          )}
          <p className="scope-note">
            预制示例仅覆盖“风吹树冠”类需求，结果不随任意描述变化。
          </p>
        </section>

        <section className="panel-section">
          <div className="section-head">
            <span className="section-index">02</span>
            <h2>参考原片</h2>
            <span className="section-hint">可选</span>
          </div>
          <div className={`analysis-card ${analysisEnabled ? 'is-enabled' : ''}`}>
            <div className="analysis-switch-row">
              <div className="analysis-switch-copy">
                <div className="analysis-title-line">
                  <strong>参考原片匹配</strong>
                  <span className="optional-tag">{analysisEnabled ? '已开启' : '默认关闭'}</span>
                </div>
                <p>
                  对比前后相邻镜头，提取视频类型、画面形式与氛围。仅在本机模拟，不上传原片。
                </p>
              </div>
              <Switch
                checked={analysisEnabled}
                onChange={handleToggleAnalysis}
                label="参考原片匹配"
              />
            </div>

            {analysisEnabled && analysisStatus === 'analyzing' && (
              <div className="analysis-loading">
                <div className="analysis-loading-line">
                  <span className="mini-spinner" />
                  正在对比前后镜头…
                </div>
                <div className="ref-skeleton-row">
                  <div className="ref-skeleton" />
                  <div className="ref-skeleton" />
                </div>
                <p>参考范围：前一个镜头与后一个镜头</p>
              </div>
            )}

            {analysisReady && (
              <div className="analysis-result">
                <div className="analysis-result-head">
                  <span className="analysis-badge">
                    <Icon name="check" size={12} />
                    已提取参考条件
                  </span>
                  <span className="analysis-edited">
                    {analysis.edited ? '已手动修正' : '可修改'}
                  </span>
                  <button
                    type="button"
                    className="reanalyze-btn"
                    onClick={() => startAnalysis(true)}
                  >
                    <Icon name="refresh" size={12} />
                    重新分析
                  </button>
                </div>
                <div className="analysis-rows">
                  <label className="analysis-row">
                    <span>视频类型</span>
                    <span className="select-wrap">
                      <select
                        value={analysis.videoType}
                        onChange={(event) =>
                          setAnalysis((current) => ({
                            ...current,
                            videoType: event.target.value,
                            edited: true,
                          }))
                        }
                      >
                        {VIDEO_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <Icon name="chevron-down" size={13} />
                    </span>
                  </label>
                  <label className="analysis-row">
                    <span>表现形式</span>
                    <span className="select-wrap">
                      <select
                        value={analysis.form}
                        onChange={(event) =>
                          setAnalysis((current) => ({
                            ...current,
                            form: event.target.value as Analysis['form'],
                            edited: true,
                          }))
                        }
                      >
                        {FORM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Icon name="chevron-down" size={13} />
                    </span>
                  </label>
                  <label className="analysis-row">
                    <span>调性与氛围</span>
                    <span className="select-wrap">
                      <select
                        value={analysis.tone}
                        onChange={(event) =>
                          setAnalysis((current) => ({
                            ...current,
                            tone: event.target.value as Analysis['tone'],
                            edited: true,
                          }))
                        }
                      >
                        {TONE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Icon name="chevron-down" size={13} />
                    </span>
                  </label>
                </div>
                <div className="reference-scope">
                  <div className="reference-thumbs">
                    <div className="reference-thumb">
                      <SceneThumb scene={REF_BEFORE} time={3.1} label="前镜头缩略图" />
                      <span>前 · 城市街道全景</span>
                    </div>
                    <span className="reference-arrow">
                      <Icon name="arrow-right" size={13} />
                    </span>
                    <div className="reference-thumb">
                      <SceneThumb scene={REF_AFTER} time={1.6} label="后镜头缩略图" />
                      <span>后 · 林荫道 · 行人</span>
                    </div>
                  </div>
                </div>
                <p className="analysis-footnote">
                  视频类型不会唯一决定表现形式；“科普”也不自动等于实拍。
                </p>
              </div>
            )}

            {!analysisEnabled && (
              <div className="manual-style">
                <p className="manual-hint">
                  跳过解析也可以继续。需要时手动指定风格；随时可以再开启。
                </p>
                <div className="manual-fields">
                  <label className="manual-field">
                    <span>表现形式</span>
                    <span className="select-wrap">
                      <select
                        value={manualForm}
                        onChange={(event) =>
                          setManualForm(event.target.value as StyleForm)
                        }
                      >
                        <option value="any">不限</option>
                        {FORM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Icon name="chevron-down" size={13} />
                    </span>
                  </label>
                  <label className="manual-field">
                    <span>氛围</span>
                    <span className="select-wrap">
                      <select
                        value={manualTone}
                        onChange={(event) =>
                          setManualTone(event.target.value as StyleTone)
                        }
                      >
                        <option value="any">不限</option>
                        {TONE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Icon name="chevron-down" size={13} />
                    </span>
                  </label>
                </div>
                {analysisStatus === 'ready' && (
                  <p className="manual-note">
                    自动解析条件已停止用于新请求；已生成或已插入的结果保留。
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="panel-section results-section">
          <div className="path-tabs" role="tablist" aria-label="补镜来源">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'library'}
              className={`path-tab ${tab === 'library' ? 'is-active' : ''}`}
              onClick={() => setTab('library')}
            >
              <Icon name="film" size={15} />
              素材库
              <span className="tab-count">{libraryCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'ai'}
              className={`path-tab ${tab === 'ai' ? 'is-active' : ''}`}
              onClick={() => setTab('ai')}
            >
              <Icon name="sparkles" size={15} />
              AI 生成
              {versions.length > 0 && (
                <span className="tab-count is-ready">{versions.length}</span>
              )}
              {unseen && <span className="tab-dot" />}
              {generating && tab === 'library' && (
                <span className="tab-dot is-loading" title="生成进行中" />
              )}
            </button>
          </div>

          <div className="conditions-strip">
            <span className="conditions-label">本次条件</span>
            <span className={`condition-chip ${hasStyleContext ? 'is-set' : ''}`}>
              {hasStyleContext ? formLabel(effectiveForm) : '形式不限'}
            </span>
            <span className={`condition-chip ${hasStyleContext ? 'is-set' : ''}`}>
              {hasStyleContext ? toneLabel(effectiveTone) : '氛围不限'}
            </span>
            <span className="condition-chip">轻微运动</span>
            <span className="condition-source">
              {analysisReady
                ? '来自原片参考'
                : hasStyleContext
                  ? '手动补充'
                  : '风格未限定'}
            </span>
          </div>

          {tab === 'library' && (
            <div className="tab-content">
              <div className="result-head">
                <div>
                  <h3>示例素材候选</h3>
                  <p>共 {libraryCount} 条 · 先单独预览，再看片段上下文</p>
                </div>
                <span className="preset-badge">预制示例</span>
              </div>
              <div className="candidate-list">
                {LIBRARY_CANDIDATES.map((candidate) => {
                  const active =
                    previewCandidateId === candidate.id ||
                    contextCandidateId === candidate.id
                  const compare = hasStyleContext
                    ? candidateCompare(candidate, effectiveForm, effectiveTone)
                    : []
                  const isInserted = inserted?.id === candidate.id
                  return (
                    <article
                      key={candidate.id}
                      className={`candidate-card ${active ? 'is-active' : ''}`}
                    >
                      <button
                        type="button"
                        className="candidate-thumb"
                        onClick={() => onPreview(candidate)}
                        aria-label={`单独预览 ${candidate.title}`}
                      >
                        <SceneThumb
                          scene={candidate.scene}
                          time={0.9}
                          label={`${candidate.title} 缩略图`}
                        />
                        <span className="thumb-shade" />
                        <span className="thumb-play">
                          <Icon name="play" size={16} />
                        </span>
                        <span className="thumb-duration">4.0s</span>
                        <span className="thumb-nature">{candidate.natureLabel}</span>
                        {isInserted && <span className="thumb-in-use">使用中</span>}
                      </button>
                      <div className="candidate-body">
                        <div className="candidate-title-row">
                          <h4>{candidate.title}</h4>
                          <span className="candidate-source-inline">
                            {candidate.sourceLabel}
                          </span>
                        </div>
                        <div className="tag-row">
                          <Tag tone={candidate.form === 'comic' ? 'comic' : 'live'}>
                            {formLabel(candidate.form)}
                          </Tag>
                          <Tag>{toneLabel(candidate.tone)}</Tag>
                          <Tag tone="motion">{motionLabel(candidate.motion)}</Tag>
                          <span className="tag-duration">4.0 秒</span>
                        </div>
                        {hasStyleContext && (
                          <div
                            className={`compare-line ${compare.length === 0 ? 'is-match' : ''}`}
                            title="按画面形式、氛围与风力属性对照，不代表相关性评分"
                          >
                            <span className="compare-dot" />
                            {compare.length === 0
                              ? '与当前条件相符'
                              : `条件对照：${compare.join(' · ')}`}
                          </div>
                        )}
                        <p className="candidate-note">{candidate.note}</p>
                        <div className="source-line">
                          <span>
                            来源：{candidate.sourceLabel} · {candidate.natureLabel}
                          </span>
                          <button
                            type="button"
                            className="text-link"
                            onClick={() => onOpenLicense(candidate)}
                          >
                            许可说明
                          </button>
                        </div>
                        <div className="candidate-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={() => onPreview(candidate)}
                          >
                            <Icon name="play" size={14} />
                            单独预览
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary-soft btn-small"
                            onClick={() => onContextPreview(candidate)}
                          >
                            <Icon name="film" size={14} />
                            放入片段预览
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
              <div className="path-switch">
                <span>都不合适？</span>
                <button type="button" className="text-link" onClick={() => setTab('ai')}>
                  切到 AI 生成
                  <Icon name="arrow-right" size={13} />
                </button>
              </div>
              <p className="results-note">
                候选是固定示例，不随需求或风格条件重新检索。
              </p>
            </div>
          )}

          {tab === 'ai' && (
            <div className="tab-content">
              {warningMessage && !genError && (
                <div className="inline-warning compact">
                  <Icon name="alert" size={14} />
                  <span>{warningMessage}</span>
                </div>
              )}
              {genError && (
                <div className="error-card" ref={errorRef}>
                  <div className="error-icon">
                    <Icon name="alert" size={18} />
                  </div>
                  <div className="error-copy">
                    <div className="error-title-line">
                      <strong>生成失败</strong>
                      <span className="demo-tag">演示状态</span>
                    </div>
                    <p>本次没有产出可用镜头。需求、时长和风格条件都已保留。</p>
                    <div className="error-actions">
                      <button
                        type="button"
                        className="btn btn-primary-soft btn-small"
                        onClick={() => runGenerate(lastAttempt)}
                        disabled={!canRequest}
                      >
                        <Icon name="refresh" size={14} />
                        重试
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => setTab('library')}
                      >
                        改用素材库
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {versions.length > 0 && (
                <div ref={versionBlockRef}>
                  {versions.length > 1 && (
                    <div className="version-tabs">
                      {versions.map((version) => (
                        <button
                          key={version.id}
                          type="button"
                          className={`version-tab ${
                            activeVersion?.id === version.id ? 'is-active' : ''
                          }`}
                          onClick={() => setActiveVersionId(version.id)}
                        >
                          {version.versionLabel ?? version.title}
                        </button>
                      ))}
                      <span className="version-note">同一构图，风力不同</span>
                    </div>
                  )}
                  {activeVersion && (
                    <div className="generated-result">
                      <div className="generated-result-head">
                        <div>
                          <div className="result-kicker">
                            <span className="preset-badge">预制示例</span>
                            <span className="version-badge">
                              {activeVersion.versionLabel}
                            </span>
                          </div>
                          <h3>{activeVersion.title}</h3>
                        </div>
                        <span className="result-duration">4.0 秒 · 16:9</span>
                      </div>
                      <button
                        type="button"
                        className="generated-thumb"
                        onClick={() => onPreview(activeVersion)}
                        aria-label={`预览 ${activeVersion.title}`}
                      >
                        <SceneThumb
                          scene={activeVersion.scene}
                          time={0.9}
                          label={`${activeVersion.title} 缩略图`}
                        />
                        <span className="thumb-shade" />
                        <span className="thumb-play">
                          <Icon name="play" size={18} />
                        </span>
                        <span className="thumb-nature">{activeVersion.natureLabel}</span>
                      </button>
                      <div className="tag-row generated-tags">
                        <Tag tone="comic">{formLabel(activeVersion.form)}</Tag>
                        <Tag>{toneLabel(activeVersion.tone)}</Tag>
                        <Tag tone="motion">{motionLabel(activeVersion.motion)}</Tag>
                        <span className="tag-duration">程序动画</span>
                      </div>
                      <p className="generated-note">{activeVersion.note}</p>
                      <div className="source-line">
                        <span>来源：{activeVersion.sourceLabel} · 非在线模型输出</span>
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => onOpenLicense(activeVersion)}
                        >
                          许可说明
                        </button>
                      </div>
                      <div className="generated-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => onPreview(activeVersion)}
                        >
                          <Icon name="play" size={14} />
                          单独预览
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-small"
                          onClick={() => onContextPreview(activeVersion)}
                        >
                          <Icon name="film" size={14} />
                          放入片段预览
                        </button>
                      </div>

                      {versions.length === 1 && !refineUsed ? (
                        <div className="refine-card">
                          <div className="refine-head">
                            <strong>继续修改</strong>
                            <span>本示例支持一次</span>
                          </div>
                          <textarea
                            className="refine-input"
                            rows={2}
                            value={refineText}
                            onChange={(event) => setRefineText(event.target.value)}
                            placeholder="例如：树摆动太剧烈，改成微风，其他保持"
                          />
                          <button
                            type="button"
                            className="suggestion-chip"
                            onClick={() => setRefineText(REFINE_SUGGESTION)}
                          >
                            <Icon name="sparkles" size={12} />
                            {REFINE_SUGGESTION}
                          </button>
                          {refineText.trim() && !refineInScope && (
                            <p className="refine-warning">
                              当前 Demo 只预制了“强风改微风”这一条修改分支。
                            </p>
                          )}
                          <button
                            type="button"
                            className="btn btn-primary-soft btn-block"
                            onClick={handleRefine}
                            disabled={!refineInScope || !canRequest || generating}
                          >
                            <Icon name="refresh" size={15} />
                            按修改重新生成
                          </button>
                          <p className="refine-note">
                            修改只改变风力，构图与光线保持；更多轮次不在 Demo 范围内。
                          </p>
                        </div>
                      ) : (
                        <div className="refine-done">
                          <Icon name="check" size={14} />
                          <div>
                            <strong>已完成一次修改</strong>
                            <p>已按“强风改微风”调整，构图与光线保持。可切换版本对照。</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {generating && (
                <div className="generating-card">
                  <div className="generating-orb">
                    <Icon name="spinner" size={22} className="spin" />
                  </div>
                  <div>
                    <div className="generating-title-line">
                      <strong>
                        {lastAttempt === 'refine' ? '正在按修改重新生成…' : '正在生成示例镜头…'}
                      </strong>
                      <span className="demo-tag">预制流程</span>
                    </div>
                    <p>理解需求、组合画面、输出 4 秒候选。可切到素材库，生成会继续。</p>
                    <div className="generating-steps">
                      <span className="is-done">理解条件</span>
                      <span className="is-active">组合画面</span>
                      <span>生成预览</span>
                    </div>
                  </div>
                </div>
              )}

              {!generating && !genError && versions.length === 0 && (
                <div className="generate-card">
                  <div className="generate-visual">
                    <span className="generate-halo" />
                    <Icon name="sparkles" size={28} />
                  </div>
                  <h3>生成更贴合当前镜头的画面</h3>
                  <p>
                    结合画面需求与视频表达条件，生成一段 4 秒漫画风候选。示例结果可预览、修改后再补入。
                  </p>
                  <div className="prompt-box">
                    <span className="prompt-label">当前需求</span>
                    <span className="prompt-text">
                      {hasRequirement ? `“${requirementTrimmed}”` : '尚未填写需求'}
                    </span>
                    {!hasRequirement && (
                      <button type="button" className="text-link" onClick={fillExample}>
                        使用示例
                      </button>
                    )}
                  </div>
                  <div className="generate-conditions">
                    <span>4.0 秒</span>
                    <span>16:9</span>
                    <span>{formLabel(effectiveForm)}</span>
                    <span>{toneLabel(effectiveTone)}</span>
                    <span>轻微运动</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={handlePrimaryGenerate}
                    disabled={!canRequest || generating}
                  >
                    <Icon name="sparkles" size={16} />
                    生成候选镜头
                  </button>
                  <p className="generate-note">
                    交互 Demo 使用预制结果，不调用模型；点击后模拟一段生成过程。
                  </p>
                </div>
              )}

              {!refineUsed && (
                <div className="demo-control">
                  <div>
                    <strong>演示控制</strong>
                    <p>开启后，下一次生成会展示失败与重试流程。</p>
                  </div>
                  <Switch
                    checked={failureArmed}
                    onChange={setFailureArmed}
                    label="下一次生成失败"
                    disabled={generating}
                  />
                </div>
              )}
              <p className="results-note">
                当前生成示例为预制程序动画，不代表在线 AI 能力。切换页签不会自动发起生成。
              </p>
            </div>
          )}
        </section>
      </div>

      <footer className="panel-foot">
        <span>
          <Icon name="info" size={12} />
          交互 Demo · 分析、检索与生成均为预制示例
        </span>
        <button type="button" className="text-link" onClick={onOpenAbout}>
          模拟范围
        </button>
      </footer>
    </aside>
  )
})
