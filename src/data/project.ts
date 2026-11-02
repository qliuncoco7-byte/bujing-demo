import type { Analysis, Candidate } from '../types'

export const PROJECT = {
  title: '城市里的树',
  subtitle: '城市绿化科普 · 漫画风',
  duration: 15,
  width: 1280,
  height: 720,
  aspect: '16:9',
  gapStart: 5,
  gapEnd: 9,
  fps: 25,
}

export type TimelineClip = {
  id: 'before' | 'after'
  name: string
  start: number
  end: number
  thumbTime: number
  sceneId: 'city' | 'avenue'
}

export const TIMELINE_CLIPS: TimelineClip[] = [
  {
    id: 'before',
    name: '城市街道全景',
    start: 0,
    end: 5,
    thumbTime: 1.4,
    sceneId: 'city',
  },
  {
    id: 'after',
    name: '林荫道 · 行人',
    start: 9,
    end: 15,
    thumbTime: 0.8,
    sceneId: 'avenue',
  },
]

export const SUBTITLES = [
  { start: 0.55, end: 4.55, text: '每天的通勤路上，我们会经过许多街道。' },
  { start: 5.0, end: 8.95, text: '说到城市绿化，我们先看看街边的树。' },
  { start: 9.4, end: 13.2, text: '它们为城市降温，也让行人放慢脚步。' },
]

export const DEFAULT_REQUIREMENT = '风吹树冠，不要人物。'

export const ANALYSIS_DEFAULT: Analysis = {
  videoType: '科普讲解',
  form: 'comic',
  tone: 'light',
  edited: false,
}

export const VIDEO_TYPE_OPTIONS = ['科普讲解', '生活记录', '品牌广告']
export const FORM_OPTIONS = [
  { value: 'comic', label: '漫画表现' },
  { value: 'live-look', label: '实拍' },
  { value: '2d', label: '二维动画' },
] as const
export const TONE_OPTIONS = [
  { value: 'light', label: '轻松' },
  { value: 'calm', label: '沉稳' },
  { value: 'tense', label: '紧张' },
] as const

export const LIBRARY_CANDIDATES: Candidate[] = [
  {
    id: 'lib-live-wind',
    title: '街边树冠 · 强风',
    shortTitle: '街边树冠 · 强风',
    form: 'live-look',
    tone: 'calm',
    motion: 'strong',
    duration: 4,
    scene: { kind: 'real-tree', wind: 1 },
    source: 'self-made',
    sourceLabel: '本项目自制',
    natureLabel: '合成 · 模拟实拍观感',
    licenseSummary: '自制演示素材，仅用于本 Demo',
    licenseDetail:
      '这段画面由本项目以程序动画方式制作，刻意模拟实拍观感，并非真实拍摄素材，也不代表素材库中真实授权的实拍内容。仅用于本次交互演示视频。',
    note: '有树冠对象，但写实影调、强风与当前漫画项目差异明显。',
  },
  {
    id: 'lib-comic-strong',
    title: '树冠特写 · 强风',
    shortTitle: '树冠特写 · 强风',
    form: 'comic',
    tone: 'light',
    motion: 'strong',
    duration: 4,
    scene: { kind: 'canopy', variant: 'dense', wind: 1 },
    source: 'self-made',
    sourceLabel: '本项目自制',
    natureLabel: '合成动画 · 漫画',
    licenseSummary: '自制演示素材，仅用于本 Demo',
    licenseDetail:
      '由本项目用 Canvas 程序动画绘制的漫画示例，不是真实素材库内容。仅用于本次交互演示视频。',
    note: '对象与漫画形式相符，但风力过强，不适合轻松讲解。',
  },
  {
    id: 'lib-comic-breeze',
    title: '街边树冠 · 微风',
    shortTitle: '街边树冠 · 微风',
    form: 'comic',
    tone: 'light',
    motion: 'breeze',
    duration: 4,
    scene: { kind: 'canopy', variant: 'street', wind: 0.24 },
    source: 'self-made',
    sourceLabel: '本项目自制',
    natureLabel: '合成动画 · 漫画',
    licenseSummary: '自制演示素材，仅用于本 Demo',
    licenseDetail:
      '由本项目用 Canvas 程序动画绘制的漫画示例，不是真实素材库内容。仅用于本次交互演示视频。',
    note: '对象、漫画形式和轻松氛围都与当前项目接近。',
  },
]

export const GEN_V1: Candidate = {
  id: 'gen-v1',
  title: '生成镜头 · 街边树冠',
  shortTitle: '街边树冠 · 有风',
  form: 'comic',
  tone: 'light',
  motion: 'strong',
  duration: 4,
  scene: { kind: 'canopy', variant: 'gen', wind: 0.92 },
  source: 'self-made',
  sourceLabel: '预制生成示例',
  natureLabel: '程序动画 · 漫画',
  licenseSummary: '预制示例结果，不是在线 AI 生成',
  licenseDetail:
    '这是随项目交付的预制程序动画，用来模拟“AI 生成”后的预览结果。当前 Demo 不调用任何生成模型，因此不能把它当作真实 AI 产出或素材授权。',
  note: '树冠、构图和漫画形式可用，但风的摆动比预期剧烈。',
  versionLabel: '版本 1',
}

export const GEN_V2: Candidate = {
  id: 'gen-v2',
  title: '生成镜头 · 微风版',
  shortTitle: '街边树冠 · 微风',
  form: 'comic',
  tone: 'light',
  motion: 'breeze',
  duration: 4,
  scene: { kind: 'canopy', variant: 'gen', wind: 0.16 },
  source: 'self-made',
  sourceLabel: '预制生成示例',
  natureLabel: '程序动画 · 漫画',
  licenseSummary: '预制示例结果，不是在线 AI 生成',
  licenseDetail:
    '这是随项目交付的预制程序动画，用来模拟“AI 生成”后的预览结果。当前 Demo 不调用任何生成模型，因此不能把它当作真实 AI 产出或素材授权。',
  note: '构图与色调保持，风力已减弱为微风。',
  versionLabel: '版本 2',
}

export const REFINE_SUGGESTION = '树摆动太剧烈，改成微风，其他保持'
