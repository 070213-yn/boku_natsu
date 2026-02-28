// イベント一覧管理用の型定義
import type { EventCategory, TimePhase } from './common'

// イベントの発動条件
export interface EventTrigger {
  type: 'day' | 'timePhase' | 'flag' | 'intValue' | 'always'
  // day条件
  day?: number
  dayOperator?: '>=' | '<=' | '==' | '>' | '<'
  // timePhase条件
  timePhase?: TimePhase
  // flag条件
  flagKey?: string
  flagValue?: boolean
  // intValue条件
  intKey?: string
  intOperator?: '>=' | '<=' | '==' | '>' | '<'
  intValue?: number
}

// イベント実行時のアクション
export interface EventAction {
  type: 'dialogue' | 'setFlag' | 'setInt' | 'incrementInt' | 'movePlayer' | 'giveItem' | 'playSound' | 'logAction'
  // dialogue用
  dialogueLines?: string[]
  speakerName?: string
  // flag用
  flagKey?: string
  flagValue?: boolean
  // int用
  intKey?: string
  intValue?: number
  // movePlayer用
  targetLocation?: string
  // giveItem用
  itemId?: string
  // playSound用
  soundId?: string
  // logAction用
  actionTag?: string
}

// 個別イベントの定義
export interface GameEvent {
  id: string
  name: string
  description: string
  category: EventCategory
  triggers: EventTrigger[]
  actions: EventAction[]
  scriptName: string
  isRepeatable: boolean
  priority: number
  enabled: boolean
}

// イベント一覧データ全体
export interface EventListData {
  version: string
  lastModified: string
  events: GameEvent[]
}
