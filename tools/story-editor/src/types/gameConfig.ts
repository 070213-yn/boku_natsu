// 時間速度プリセット
export interface TimeSpeedPreset {
  name: string       // 表示名
  multiplier: number // 倍率
}

export interface GameConfigData {
  version: string
  lastModified: string
  general: {
    maxDay: number
    startMonth: number
    startDay: number
    gameName: string
  }
  protagonist: {
    gender: 'male' | 'female'
    age: number
    grade: string         // 学年（例: '小学3年生'）
    nameInputEnabled: boolean
    defaultName: string
    voiceType: 'full' | 'sfx_only' | 'none'
    arrivalReason: string // 島に来た理由
  }
  camera: {
    perspective: 'third_person' | 'first_person'
    rotation: 'fixed' | 'free'
  }
  controls: {
    supportedDevices: string[]  // ['keyboard_mouse', 'gamepad']
    keyBindings: {
      move: string        // 'WASD'
      jump: string        // 'Space'
      dash: string        // 'Shift'
      interact: string    // 'LeftClick'
      menu: string        // 'Tab'
      system: string      // 'Escape'
    }
  }
  timePhases: Record<string, { startHour: number; endHour: number; label: string }>
  timeSystem: {
    type: 'action_based'  // 行動ベース（リアルタイムではない）
    defaultStartHour: number
    areaTransitionMinutes: { min: number; max: number } // エリア移動時の経過時間（分）
    speedPresets: TimeSpeedPreset[]
  }
  menu: {
    tabMenu: string[]     // Tabメニュー項目
    escapeMenu: string[]  // Escメニュー項目
  }
  map: {
    structure: 'area_based' | 'seamless'
    totalAreas: number
    progressiveUnlock: boolean
    minimap: boolean
  }
  save: {
    anytimeSave: boolean
    autoSave: boolean
    slotCount: number
    newGamePlus: boolean
  }
  endings: {
    multipleEndings: boolean
    conditions: string[]  // エンディング分岐条件メモ
  }
  text: {
    diaryPerspective: 'first_person' | 'narrator'
    kanjiStyle: 'normal' | 'hiragana_heavy'
    furigana: boolean
  }
  heroine: {
    absenceStartDay: number
    absenceEndDay: number
    intimacyThresholds: Record<string, { min: number; max: number }>
    appearTimePhase: string
    leaveTimePhase: string
  }
  audio: { eveningChimeHour: number; bgmVolume: number; ambientVolume: number }
}
