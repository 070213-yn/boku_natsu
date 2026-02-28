export interface UnlockCondition {
  type: 'flag' | 'intValue' | 'day' | 'composite'
  key?: string
  operator?: string
  value?: boolean | number
  logic?: 'AND' | 'OR'
  conditions?: UnlockCondition[]
}

export interface ExplorationFlag {
  key: string
  displayName: string
  description: string
  defaultValue: boolean
  unlockCondition: UnlockCondition
  unlocksArea: string
}

export interface IntCounter {
  key: string
  displayName: string
  defaultValue: number
  maxValue: number  // -1 = 上限なし
  rewards?: { threshold: number; reward: string }[]
}

export interface ExplorationFlagsData {
  version: string
  lastModified: string
  boolFlags: ExplorationFlag[]
  intCounters: IntCounter[]
}
