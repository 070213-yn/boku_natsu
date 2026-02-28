export interface DialogueStage {
  thresholdMin: number
  thresholdMax: number  // -1 = 上限なし
  lines: string[]
}

export interface SpecialDialogue {
  id: string
  trigger: string
  day: number | null
  lines: string[]
}

export interface NPCDialogueData {
  npcId: string
  npcName: string
  type: 'heroine' | 'npc'
  absenceDays?: number[]
  dialogueStages: Record<string, DialogueStage>
  specialDialogues?: SpecialDialogue[]
}

export interface DialogueFileData {
  version: string
  lastModified: string
  npcs: NPCDialogueData[]
}
