// キャラクター設定の型定義
import type { TimePhase } from './common'

// 特別なやり取り
export interface SpecialInteraction {
  id: string
  title: string
  description: string
  day?: number                    // 何日目
  timePhase?: TimePhase           // どの時間帯
  dialogueLines: string[]         // 会話内容
  linkedFlowNodeIds?: string[]    // EventFlowノードへのリンク
  linkedEventIds?: string[]       // EventListイベントへのリンク
}

// キャラクタープロフィール
export interface CharacterProfile {
  id: string                      // npcIdと一致
  name: string                    // 内部管理名
  displayName: string             // ゲーム内表示名（伝播対象）
  age?: number
  gender?: 'male' | 'female' | 'other' | ''
  profile: string                 // 詳細プロフィール
  images: string[]                // 画像パス配列
  type: 'heroine' | 'npc'
  specialInteractions: SpecialInteraction[]
}

// キャラクターデータファイル全体
export interface CharacterFileData {
  version: string
  lastModified: string
  characters: CharacterProfile[]
}
