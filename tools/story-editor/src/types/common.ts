// ゲーム全体で使用する共通型

export type TimePhase = 'Morning' | 'Noon' | 'Evening' | 'Night'
export type GameState = 'Title' | 'Playing' | 'Paused' | 'Diary' | 'Sleeping'

export type EventCategory = 'routine' | 'interaction' | 'exploration' | 'sea' | 'bug' | 'heroine' | 'mystery'

export interface Position { x: number; y: number }

// カテゴリの表示名と色
export const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; bgColor: string }> = {
  routine: { label: 'ルーチン', color: '#F97316', bgColor: '#FFF7ED' },
  interaction: { label: '交流', color: '#0EA5E9', bgColor: '#F0F9FF' },
  exploration: { label: '探索', color: '#22C55E', bgColor: '#F0FDF4' },
  sea: { label: '海', color: '#06B6D4', bgColor: '#ECFEFF' },
  bug: { label: '虫・成長', color: '#A855F7', bgColor: '#FAF5FF' },
  heroine: { label: 'ヒロイン', color: '#EC4899', bgColor: '#FDF2F8' },
  mystery: { label: '謎・考察', color: '#6366F1', bgColor: '#EEF2FF' },
}

export const TIME_PHASE_CONFIG: Record<TimePhase, { label: string; color: string }> = {
  Morning: { label: '朝', color: '#FBBF24' },
  Noon: { label: '昼', color: '#F97316' },
  Evening: { label: '夕方', color: '#EF4444' },
  Night: { label: '夜', color: '#6366F1' },
}
