import { create } from 'zustand'
import type { EventFlowData, EventListData, DialogueFileData, DiaryActionsData, ExplorationFlagsData, GameConfigData } from '../types'
import { fetchData, saveData } from '../utils/api'
import { createDefaultEventFlow, createDefaultEventList, createDefaultDialogueData, createDefaultDiaryActions, createDefaultExplorationFlags, createDefaultGameConfig } from '../utils/defaults'

// 共通のデータストアパターン
interface DataStore<T> {
  data: T | null
  isLoading: boolean
  isSaving: boolean
  isDirty: boolean
  lastSaved: string | null
  error: string | null
  load: () => Promise<void>
  save: () => Promise<void>
  update: (updater: (data: T) => T) => void
  markDirty: () => void
}

function createDataStore<T>(filename: string, defaultFactory: () => T) {
  return create<DataStore<T>>((set, get) => ({
    data: null,
    isLoading: false,
    isSaving: false,
    isDirty: false,
    lastSaved: null,
    error: null,
    load: async () => {
      set({ isLoading: true, error: null })
      try {
        const data = await fetchData<T>(filename)
        set({ data: data && Object.keys(data).length > 0 ? data : defaultFactory(), isLoading: false, isDirty: false })
      } catch {
        set({ data: defaultFactory(), isLoading: false, isDirty: false })
      }
    },
    save: async () => {
      const { data } = get()
      if (!data) return
      set({ isSaving: true })
      try {
        await saveData(filename, data)
        set({ isSaving: false, lastSaved: new Date().toISOString(), isDirty: false })
      } catch (err) {
        set({ isSaving: false, error: String(err) })
      }
    },
    update: (updater) => {
      const { data } = get()
      if (!data) return
      set({ data: updater(data), isDirty: true })
    },
    markDirty: () => set({ isDirty: true }),
  }))
}

export const useEventFlowStore = createDataStore<EventFlowData>('EventFlow', createDefaultEventFlow)
export const useEventListStore = createDataStore<EventListData>('EventList', createDefaultEventList)
export const useDialogueStore = createDataStore<DialogueFileData>('DialogueData', createDefaultDialogueData)
export const useDiaryStore = createDataStore<DiaryActionsData>('DiaryActions', createDefaultDiaryActions)
export const useExplorationStore = createDataStore<ExplorationFlagsData>('ExplorationFlags', createDefaultExplorationFlags)
export const useGameConfigStore = createDataStore<GameConfigData>('GameConfig', createDefaultGameConfig)
