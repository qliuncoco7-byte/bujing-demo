import type { CanopyVariant } from './scenes/canopy'

export type SceneSpec =
  | { kind: 'city' }
  | { kind: 'avenue' }
  | { kind: 'canopy'; variant: CanopyVariant; wind: number }
  | { kind: 'real-tree'; wind: number }
  | { kind: 'gap' }

export type CandidateSource = 'self-made'

export type Candidate = {
  id: string
  title: string
  shortTitle: string
  /** What the generated asset depicts; also used by the honest asset labels. */
  form: 'comic' | 'live-look'
  tone: 'light' | 'calm' | 'tense'
  motion: 'breeze' | 'strong'
  duration: number
  scene: SceneSpec
  source: CandidateSource
  sourceLabel: string
  natureLabel: string
  licenseSummary: string
  licenseDetail: string
  note: string
  versionLabel?: string
}

export type StyleForm = 'any' | 'comic' | 'live-look' | '2d'
export type StyleTone = 'any' | 'light' | 'calm' | 'tense'

export type Analysis = {
  videoType: string
  form: Exclude<StyleForm, 'any'>
  tone: Exclude<StyleTone, 'any'>
  edited: boolean
}

export type PlayerMode =
  | { kind: 'timeline' }
  | { kind: 'candidate'; candidate: Candidate }
  | { kind: 'context'; candidate: Candidate }
