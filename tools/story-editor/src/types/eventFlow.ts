import type { TimePhase, EventCategory, Position } from './common'

export type NodeType = 'dayStart' | 'event' | 'condition' | 'choice' | 'ending'

// イベント内の登場人物
export interface EventCharacter {
  id: string
  name: string
  role?: string  // 役割・説明（例: "主人公の友達"）
}

// イベント内のセリフ
export interface EventDialogue {
  id: string
  speaker: string   // 話者名
  text: string      // セリフテキスト
  emotion?: string  // 感情タグ（喜び、驚き、悲しみ など）
  animation?: string // セリフ中のアニメーション（例: "頷く", "手を振る"）
}

// シーン遷移（場所の移動）
export interface SceneTransition {
  fromScene: string   // 例: "おじさんの家"
  toScene: string     // 例: "広場"
  trigger?: string    // 例: "ドアをクリック"
}

// キャラクター演出
export interface CharacterDirection {
  characterId: string    // キャラクターID
  animation: string      // 例: "Walk", "Talk", "Surprised"
  movement?: string      // 例: "左から登場"
  position?: string      // 例: "画面中央"
}

export interface EventNodeData {
  label: string
  description?: string
  day?: number
  timePhase?: TimePhase
  category?: EventCategory
  actionTag?: string
  flagsToSet?: { key: string; value: boolean }[]
  intValuesToSet?: { key: string; operation: 'set' | 'increment'; value?: number }[]
  // Yes/No選択肢（イベントに分岐を持たせる）
  hasChoice?: boolean
  choiceQuestion?: string   // 質問テキスト（例: "10時までに寝た？"）
  choiceYesLabel?: string   // Yesラベル（例: "はい → ラジオ体操"）
  choiceNoLabel?: string    // Noラベル（例: "いいえ → 朝ごはん直行"）
  // 登場人物・セリフ
  characters?: EventCharacter[]
  dialogues?: EventDialogue[]
  // 場所・演出
  location?: string                      // イベント発生場所
  sceneTransitions?: SceneTransition[]   // シーン遷移リスト
  characterDirections?: CharacterDirection[] // キャラ演出リスト
}

// 独立したYes/No選択ノード
export interface ChoiceNodeData {
  label: string
  question: string
  yesLabel: string
  noLabel: string
  day?: number
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
  data: EventNodeData | ConditionNodeData | ChoiceNodeData | { label: string; day?: number }
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
