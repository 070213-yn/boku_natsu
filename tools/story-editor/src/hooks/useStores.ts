import { create } from 'zustand'
import type { EventFlowData, DialogueFileData, DiaryActionsData, ExplorationFlagsData, GameConfigData } from '../types'
import { fetchData, saveData } from '../utils/api'
import { createDefaultEventFlow, createDefaultDialogueData, createDefaultDiaryActions, createDefaultExplorationFlags, createDefaultGameConfig } from '../utils/defaults'

// 共通のデータストアパターン
interface DataStore<T> {
  data: T | null
  isLoading: boolean
  isSaving: boolean
  lastSaved: string | null
  error: string | null
  load: () => Promise<void>
  save: () => Promise<void>
  update: (updater: (data: T) => T) => void
}

function createDataStore<T>(filename: string, defaultFactory: () => T) {
  return create<DataStore<T>>((set, get) => ({
    data: null,
    isLoading: false,
    isSaving: false,
    lastSaved: null,
    error: null,
    load: async () => {
      set({ isLoading: true, error: null })
      try {
        const data = await fetchData<T>(filename)
        set({ data: data && Object.keys(data).length > 0 ? data : defaultFactory(), isLoading: false })
      } catch {
        set({ data: defaultFactory(), isLoading: false })
      }
    },
    save: async () => {
      const { data } = get()
      if (!data) return
      set({ isSaving: true })
      try {
        await saveData(filename, data)
        set({ isSaving: false, lastSaved: new Date().toISOString() })
      } catch (err) {
        set({ isSaving: false, error: String(err) })
      }
    },
    update: (updater) => {
      const { data } = get()
      if (!data) return
      set({ data: updater(data) })
    },
  }))
}

export const useEventFlowStore = createDataStore<EventFlowData>('EventFlow', createDefaultEventFlow)
export const useDialogueStore = createDataStore<DialogueFileData>('DialogueData', createDefaultDialogueData)
export const useDiaryStore = createDataStore<DiaryActionsData>('DiaryActions', createDefaultDiaryActions)
export const useExplorationStore = createDataStore<ExplorationFlagsData>('ExplorationFlags', createDefaultExplorationFlags)
export const useGameConfigStore = createDataStore<GameConfigData>('GameConfig', createDefaultGameConfig)

// Toast通知ストア
interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Date.now().toString()
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}))
