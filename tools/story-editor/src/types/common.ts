// ゲーム全体で使用する共通型

export type TimePhase = 'Morning' | 'Noon' | 'Evening' | 'Night'
export type GameState = 'Title' | 'Playing' | 'Paused' | 'Diary' | 'Sleeping'

export type EventCategory = 'daily' | 'npc' | 'heroine' | 'explore' | 'play' | 'story' | 'special'

export interface Position { x: number; y: number }

// カテゴリの表示名と色
export const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; bgColor: string }> = {
  daily: { label: '日常', color: '#F97316', bgColor: '#FFF7ED' },
  npc: { label: '住民', color: '#0EA5E9', bgColor: '#F0F9FF' },
  heroine: { label: 'ヒロイン', color: '#EC4899', bgColor: '#FDF2F8' },
  explore: { label: '探索', color: '#22C55E', bgColor: '#F0FDF4' },
  play: { label: '遊び', color: '#06B6D4', bgColor: '#ECFEFF' },
  story: { label: '物語', color: '#6366F1', bgColor: '#EEF2FF' },
  special: { label: '特別', color: '#A855F7', bgColor: '#FAF5FF' },
}

// イベント発生場所の選択肢
export const LOCATION_OPTIONS = [
  'おじさんの家', '広場', '港', '堤防', '駄菓子屋', '神社',
  '浜辺', '森', '山', '川', '畑', '秘密基地', '海底', '集落',
] as const

export const TIME_PHASE_CONFIG: Record<TimePhase, { label: string; color: string }> = {
  Morning: { label: '朝', color: '#FBBF24' },
  Noon: { label: '昼', color: '#F97316' },
  Evening: { label: '夕方', color: '#EF4444' },
  Night: { label: '夜', color: '#6366F1' },
}
