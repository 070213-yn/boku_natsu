export interface GameConfigData {
  version: string
  lastModified: string
  general: {
    maxDay: number
    startMonth: number
    startDay: number
    gameName: string
  }
  timePhases: Record<string, { startHour: number; endHour: number; label: string }>
  timeSystem: { timeScale: number; defaultStartHour: number }
  heroine: {
    absenceStartDay: number
    absenceEndDay: number
    intimacyThresholds: Record<string, { min: number; max: number }>
    appearTimePhase: string
    leaveTimePhase: string
  }
  audio: { eveningChimeHour: number; bgmVolume: number; ambientVolume: number }
}
