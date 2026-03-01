import type { TimePhase, EventCategory, Position } from './common'

export type NodeType = 'dayStart' | 'event' | 'condition' | 'ending'

export interface EventNodeData {
  label: string
  description?: string
  day?: number
  timePhase?: TimePhase
  category?: EventCategory
  actionTag?: string
  flagsToSet?: { key: string; value: boolean }[]
  intValuesToSet?: { key: string; operation: 'set' | 'increment'; value?: number }[]
}

export interface ConditionNodeData {
  label: string
  conditions: ConditionRule[]
  logic: 'AND' | 'OR'
}

export interface ConditionRule {
  type: 'flag' | 'intValue' | 'day' | 'timePhase'
  key?: string
  operator: '==' | '!=' | '>=' | '<=' | '>' | '<'
  value: boolean | number | string
}

export interface FlowNode {
  id: string
  type: NodeType
  position: Position
  data: EventNodeData | ConditionNodeData | { label: string; day?: number }
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  data?: { label?: string; condition?: string | null }
}

/** 定期イベントや任意セルに対するメモデータ */
export interface DailyNote {
  day: number
  timePhase: string  // 'Morning' | 'Afternoon' | 'Evening' | 'Night'
  noteId: string     // 定期イベントIDまたはカスタムメモID
  text: string
}

export interface EventFlowData {
  version: string
  lastModified: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  dailyNotes?: DailyNote[]
}
