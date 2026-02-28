import type { EventCategory } from './common'

export interface DiaryAction {
  tag: string
  displayName: string
  priority: number
  diaryText: string
  category: EventCategory | 'work' | 'play' | 'special' | 'story'
}

export interface DiaryActionsData {
  version: string
  lastModified: string
  defaultText: string
  fallbackTemplate: string
  actions: DiaryAction[]
}
