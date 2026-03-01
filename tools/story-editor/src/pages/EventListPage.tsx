import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Copy, Search, Filter, ChevronDown, ChevronUp,
  Play, Code, X, Save, Zap, Hash
} from 'lucide-react'
import { useEventListStore } from '../hooks/useStores'
import { useAutoSave } from '../hooks/useAutoSave'
import { useToastStore } from '../components/common/Toast'
import type { GameEvent, EventTrigger, EventAction, EventCategory, TimePhase } from '../types'
import { CATEGORY_CONFIG, TIME_PHASE_CONFIG } from '../types'

/* ========================================
   定数・ヘルパー
   ======================================== */

const TRIGGER_LABELS: Record<EventTrigger['type'], string> = {
  always: '常時',
  day: '日付',
  timePhase: '時間帯',
  flag: 'フラグ',
  intValue: '数値',
}

const ACTION_LABELS: Record<EventAction['type'], string> = {
  dialogue: '会話',
  setFlag: 'フラグ設定',
  setInt: '数値設定',
  incrementInt: '数値加算',
  movePlayer: '移動',
  giveItem: 'アイテム',
  playSound: 'サウンド',
  logAction: 'ログ記録',
}

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
}

const cardVariants = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -12 },
}

/** 新規イベントを生成 */
function createNewEvent(): GameEvent {
  const id = `evt_${Date.now().toString(36)}`
  return {
    id, name: '新しいイベント', description: '', category: 'routine',
    triggers: [], actions: [], scriptName: `Event_${id}`,
    isRepeatable: false, priority: 50, enabled: true,
  }
}

/* ========================================
   メインページコンポーネント
   ======================================== */

export default function EventListPage() {
  const { data, isLoading, isSaving, save, update } = useEventListStore()
  const addToast = useToastStore(s => s.addToast)

  // 自動保存（データ変更時に2秒デバウンスで保存）
  useAutoSave(data, save, 2000)

  // フィルター状態
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all')
  const [showFilter, setShowFilter] = useState(false)

  // 編集モーダル
  const [editingEvent, setEditingEvent] = useState<GameEvent | null>(null)
  const [isNewEvent, setIsNewEvent] = useState(false)

  // 同期結果
  const [syncResults, setSyncResults] = useState<{ scriptName: string; status: string; reason?: string }[] | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // 初回ロード
  useEffect(() => { useEventListStore.getState().load() }, [])

  const events = data?.events ?? []

  // フィルタリング
  const filtered = events.filter(e => {
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.id.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false
    return true
  })

  // イベント追加
  const handleAdd = useCallback(() => {
    const newEvt = createNewEvent()
    setEditingEvent(newEvt)
    setIsNewEvent(true)
  }, [])

  // イベント編集
  const handleEdit = useCallback((evt: GameEvent) => {
    setEditingEvent({ ...evt, triggers: evt.triggers.map(t => ({ ...t })), actions: evt.actions.map(a => ({ ...a })) })
    setIsNewEvent(false)
  }, [])

  // イベント複製
  const handleDuplicate = useCallback((evt: GameEvent) => {
    const id = `evt_${Date.now().toString(36)}`
    const dup: GameEvent = {
      ...evt, id, name: `${evt.name}（コピー）`, scriptName: `Event_${id}`,
      triggers: evt.triggers.map(t => ({ ...t })), actions: evt.actions.map(a => ({ ...a })),
    }
    update(d => ({ ...d, events: [...d.events, dup] }))
    save().then(() => addToast('イベントを複製しました', 'success'))
  }, [update, save, addToast])

  // イベント削除
  const handleDelete = useCallback((id: string) => {
    update(d => ({ ...d, events: d.events.filter(e => e.id !== id) }))
    save().then(() => addToast('イベントを削除しました', 'success'))
  }, [update, save, addToast])

  // 有効/無効トグル
  const handleToggle = useCallback((id: string) => {
    update(d => ({
      ...d,
      events: d.events.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e),
    }))
    save()
  }, [update, save])

  // 編集保存
  const handleSaveEvent = useCallback(() => {
    if (!editingEvent) return
    if (isNewEvent) {
      update(d => ({ ...d, events: [...d.events, editingEvent] }))
    } else {
      update(d => ({
        ...d,
        events: d.events.map(e => e.id === editingEvent.id ? editingEvent : e),
      }))
    }
    save().then(() => addToast(isNewEvent ? 'イベントを追加しました' : 'イベントを更新しました', 'success'))
    setEditingEvent(null)
  }, [editingEvent, isNewEvent, update, save, addToast])

  // C#スクリプト同期
  const handleSync = useCallback(async () => {
    if (!data) return
    setIsSyncing(true)
    setSyncResults(null)
    try {
      const res = await fetch('/api/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: data.events.filter(e => e.enabled) }),
      })
      const result = await res.json()
      if (result.success) {
        setSyncResults(result.results)
        const created = result.results.filter((r: { status: string }) => r.status === 'created').length
        const updated = result.results.filter((r: { status: string }) => r.status === 'updated').length
        addToast(`C#スクリプト同期完了 (生成: ${created}, 更新: ${updated})`, 'success')
      } else {
        addToast(`同期エラー: ${result.error}`, 'error')
      }
    } catch (err) {
      addToast(`同期に失敗: ${String(err)}`, 'error')
    } finally {
      setIsSyncing(false)
    }
  }, [data, addToast])

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">読み込み中...</div>
  }

  return (
    <motion.div {...fadeIn} className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif-jp text-2xl font-bold text-gray-800">イベント一覧</h2>
          <p className="text-sm text-gray-500 mt-1">ゲーム内イベントの管理とC#スクリプト自動生成</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{events.length} イベント</span>
          {isSaving && <span className="text-xs text-sunset-500">保存中...</span>}
        </div>
      </div>

      {/* ツールバー */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* 検索 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="イベント名で検索..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-sunset-500/30"
            />
          </div>

          {/* カテゴリフィルター */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors ${
              categoryFilter !== 'all' ? 'border-sunset-500 text-sunset-600 bg-sunset-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={14} />
            フィルター
          </button>

          {/* C#同期ボタン */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ocean-500 text-white hover:bg-ocean-600 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Code size={14} />
            {isSyncing ? '同期中...' : 'C#同期'}
          </button>

          {/* 新規追加ボタン */}
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sunset-500 text-white hover:bg-sunset-600 transition-colors text-sm font-medium"
          >
            <Plus size={14} />
            新規イベント
          </button>
        </div>

        {/* カテゴリフィルター展開 */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    categoryFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  すべて
                </button>
                {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(
                  ([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setCategoryFilter(key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: categoryFilter === key ? cfg.color : cfg.bgColor,
                        color: categoryFilter === key ? '#fff' : cfg.color,
                      }}
                    >
                      {cfg.label}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 同期結果パネル */}
      <AnimatePresence>
        {syncResults && (
          <motion.div {...cardVariants} className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Code size={14} />
                C#同期結果
              </h3>
              <button onClick={() => setSyncResults(null)} className="p-1 rounded hover:bg-gray-100">
                <X size={14} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {syncResults.map((r, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className={`px-2 py-0.5 rounded font-medium ${
                    r.status === 'created' ? 'bg-green-100 text-green-700' :
                    r.status === 'updated' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {r.status === 'created' ? '生成' : r.status === 'updated' ? '更新' : 'スキップ'}
                  </span>
                  <span className="font-mono text-gray-600">{r.scriptName}.cs</span>
                  {r.reason && <span className="text-gray-400">({r.reason})</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* イベントカード一覧 */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map(evt => (
            <motion.div
              key={evt.id}
              layout
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className={`glass-card rounded-2xl p-4 transition-opacity ${!evt.enabled ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* 左: カテゴリバッジ + メイン情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {/* カテゴリバッジ */}
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: CATEGORY_CONFIG[evt.category]?.bgColor, color: CATEGORY_CONFIG[evt.category]?.color }}
                    >
                      {CATEGORY_CONFIG[evt.category]?.label}
                    </span>
                    {/* 優先度 */}
                    <span className="text-xs text-gray-400">優先度: {evt.priority}</span>
                    {/* 繰り返し */}
                    {evt.isRepeatable && <span className="text-xs text-ocean-500">繰返し可</span>}
                    {/* 無効 */}
                    {!evt.enabled && <span className="text-xs text-red-400">無効</span>}
                  </div>

                  {/* イベント名 */}
                  <h3 className="font-bold text-gray-800 text-sm">{evt.name}</h3>
                  {evt.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{evt.description}</p>}

                  {/* トリガーバッジ */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {evt.triggers.map((t, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-600">
                        <Zap size={10} />
                        {TRIGGER_LABELS[t.type]}
                        {t.type === 'day' && ` ${t.dayOperator ?? '=='} ${t.day}`}
                        {t.type === 'timePhase' && `: ${TIME_PHASE_CONFIG[t.timePhase as TimePhase]?.label ?? t.timePhase}`}
                        {t.type === 'flag' && `: ${t.flagKey}`}
                        {t.type === 'intValue' && `: ${t.intKey} ${t.intOperator} ${t.intValue}`}
                      </span>
                    ))}
                    {evt.triggers.length === 0 && <span className="text-xs text-gray-300">条件なし</span>}
                  </div>

                  {/* スクリプト名 */}
                  <div className="mt-1.5">
                    <span className="text-xs text-gray-400 font-mono">{evt.scriptName}.cs</span>
                  </div>
                </div>

                {/* 右: アクションボタン */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(evt.id)}
                    className={`p-2 rounded-xl transition-colors ${evt.enabled ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-50'}`}
                    title={evt.enabled ? '無効にする' : '有効にする'}
                  >
                    <Play size={14} />
                  </button>
                  <button
                    onClick={() => handleEdit(evt)}
                    className="p-2 rounded-xl text-gray-400 hover:text-sunset-500 hover:bg-sunset-50 transition-colors"
                    title="編集"
                  >
                    <Hash size={14} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(evt)}
                    className="p-2 rounded-xl text-gray-400 hover:text-ocean-500 hover:bg-ocean-50 transition-colors"
                    title="複製"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(evt.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            {search || categoryFilter !== 'all' ? 'フィルター条件に一致するイベントがありません' : 'イベントがまだ登録されていません'}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      <AnimatePresence>
        {editingEvent && (
          <EventEditModal
            event={editingEvent}
            isNew={isNewEvent}
            onChange={setEditingEvent}
            onSave={handleSaveEvent}
            onClose={() => setEditingEvent(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ========================================
   編集モーダル
   ======================================== */

interface EventEditModalProps {
  event: GameEvent
  isNew: boolean
  onChange: (event: GameEvent) => void
  onSave: () => void
  onClose: () => void
}

function EventEditModal({ event, isNew, onChange, onSave, onClose }: EventEditModalProps) {
  const [triggersOpen, setTriggersOpen] = useState(true)
  const [actionsOpen, setActionsOpen] = useState(true)

  const updateField = <K extends keyof GameEvent>(key: K, value: GameEvent[K]) => {
    onChange({ ...event, [key]: value })
  }

  // IDからスクリプト名を自動生成
  const handleIdChange = (id: string) => {
    const scriptName = `Event_${id.replace(/^evt_/, '').replace(/[^a-zA-Z0-9_]/g, '_')}`
    onChange({ ...event, id, scriptName })
  }

  // トリガー操作
  const addTrigger = () => updateField('triggers', [...event.triggers, { type: 'always' as const }])
  const updateTrigger = (i: number, t: EventTrigger) => {
    const arr = [...event.triggers]; arr[i] = t; updateField('triggers', arr)
  }
  const removeTrigger = (i: number) => updateField('triggers', event.triggers.filter((_, idx) => idx !== i))

  // アクション操作
  const addAction = () => updateField('actions', [...event.actions, { type: 'dialogue' as const, dialogueLines: [''], speakerName: '' }])
  const updateAction = (i: number, a: EventAction) => {
    const arr = [...event.actions]; arr[i] = a; updateField('actions', arr)
  }
  const removeAction = (i: number) => updateField('actions', event.actions.filter((_, idx) => idx !== i))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-serif-jp text-lg font-bold text-gray-800">
            {isNew ? '新規イベント' : 'イベント編集'}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sunset-500 text-white hover:bg-sunset-600 transition-colors text-sm font-medium">
              <Save size={14} />
              {isNew ? '追加' : '更新'}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2"><Hash size={14} />基本情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">イベントID</label>
                <input type="text" value={event.id} onChange={e => handleIdChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-500/30"
                  placeholder="evt_example" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">イベント名</label>
                <input type="text" value={event.name} onChange={e => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-500/30"
                  placeholder="朝の挨拶イベント" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">説明</label>
              <textarea value={event.description} onChange={e => updateField('description', e.target.value)} rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sunset-500/30"
                placeholder="このイベントの説明..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">カテゴリ</label>
                <select value={event.category} onChange={e => updateField('category', e.target.value as EventCategory)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-500/30">
                  {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(
                    ([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">スクリプト名</label>
                <input type="text" value={event.scriptName} onChange={e => updateField('scriptName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-500/30"
                  placeholder="Event_example" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">優先度 (0-100)</label>
                <input type="number" min={0} max={100} value={event.priority}
                  onChange={e => updateField('priority', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-500/30" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={event.isRepeatable} onChange={e => updateField('isRepeatable', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-sunset-500" />
                  <span className="text-sm text-gray-700">繰り返し可能</span>
                </label>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={event.enabled} onChange={e => updateField('enabled', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-green-500" />
                  <span className="text-sm text-gray-700">有効</span>
                </label>
              </div>
            </div>
          </div>

          {/* トリガー条件 */}
          <div className="space-y-3">
            <button onClick={() => setTriggersOpen(!triggersOpen)} className="flex items-center gap-2 w-full text-left">
              {triggersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Zap size={14} />トリガー条件 ({event.triggers.length})
              </h3>
            </button>
            <AnimatePresence>
              {triggersOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-3">
                  {event.triggers.map((trigger, i) => (
                    <TriggerEditor key={i} trigger={trigger} onChange={t => updateTrigger(i, t)} onRemove={() => removeTrigger(i)} />
                  ))}
                  <button onClick={addTrigger}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm hover:border-sunset-500 hover:text-sunset-500 transition-colors w-full justify-center">
                    <Plus size={14} />条件を追加
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* アクション */}
          <div className="space-y-3">
            <button onClick={() => setActionsOpen(!actionsOpen)} className="flex items-center gap-2 w-full text-left">
              {actionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Play size={14} />アクション ({event.actions.length})
              </h3>
            </button>
            <AnimatePresence>
              {actionsOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-3">
                  {event.actions.map((action, i) => (
                    <ActionEditor key={i} action={action} index={i} onChange={a => updateAction(i, a)} onRemove={() => removeAction(i)} />
                  ))}
                  <button onClick={addAction}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm hover:border-ocean-500 hover:text-ocean-500 transition-colors w-full justify-center">
                    <Plus size={14} />アクションを追加
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ========================================
   トリガー条件エディタ
   ======================================== */

function TriggerEditor({ trigger, onChange, onRemove }: { trigger: EventTrigger; onChange: (t: EventTrigger) => void; onRemove: () => void }) {
  const handleTypeChange = (type: EventTrigger['type']) => {
    const base: EventTrigger = { type }
    if (type === 'day') { base.day = 1; base.dayOperator = '==' }
    if (type === 'timePhase') { base.timePhase = 'Morning' }
    if (type === 'flag') { base.flagKey = ''; base.flagValue = true }
    if (type === 'intValue') { base.intKey = ''; base.intOperator = '>='; base.intValue = 0 }
    onChange(base)
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
      <select value={trigger.type} onChange={e => handleTypeChange(e.target.value as EventTrigger['type'])}
        className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none flex-shrink-0">
        {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>

      <div className="flex-1 flex items-center gap-2 flex-wrap">
        {trigger.type === 'day' && (
          <>
            <select value={trigger.dayOperator ?? '=='} onChange={e => onChange({ ...trigger, dayOperator: e.target.value as EventTrigger['dayOperator'] })}
              className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white">
              <option value="==">==</option><option value=">=">{'>='}</option><option value="<=">{'<='}</option>
              <option value=">">{'>'}</option><option value="<">{'<'}</option>
            </select>
            <input type="number" min={1} value={trigger.day ?? 1} onChange={e => onChange({ ...trigger, day: Number(e.target.value) })}
              className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm" />
            <span className="text-xs text-gray-400">日目</span>
          </>
        )}
        {trigger.type === 'timePhase' && (
          <select value={trigger.timePhase ?? 'Morning'} onChange={e => onChange({ ...trigger, timePhase: e.target.value as TimePhase })}
            className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white">
            {(Object.entries(TIME_PHASE_CONFIG) as [TimePhase, typeof TIME_PHASE_CONFIG[TimePhase]][]).map(
              ([k, c]) => <option key={k} value={k}>{c.label}</option>
            )}
          </select>
        )}
        {trigger.type === 'flag' && (
          <>
            <input type="text" value={trigger.flagKey ?? ''} onChange={e => onChange({ ...trigger, flagKey: e.target.value })}
              className="flex-1 min-w-[120px] px-2 py-1.5 rounded-lg border border-gray-200 text-sm" placeholder="フラグ名" />
            <select value={trigger.flagValue ? 'true' : 'false'} onChange={e => onChange({ ...trigger, flagValue: e.target.value === 'true' })}
              className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white">
              <option value="true">true</option><option value="false">false</option>
            </select>
          </>
        )}
        {trigger.type === 'intValue' && (
          <>
            <input type="text" value={trigger.intKey ?? ''} onChange={e => onChange({ ...trigger, intKey: e.target.value })}
              className="flex-1 min-w-[100px] px-2 py-1.5 rounded-lg border border-gray-200 text-sm" placeholder="変数名" />
            <select value={trigger.intOperator ?? '>='} onChange={e => onChange({ ...trigger, intOperator: e.target.value as EventTrigger['intOperator'] })}
              className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white">
              <option value="==">==</option><option value=">=">{'>='}</option><option value="<=">{'<='}</option>
              <option value=">">{'>'}</option><option value="<">{'<'}</option>
            </select>
            <input type="number" value={trigger.intValue ?? 0} onChange={e => onChange({ ...trigger, intValue: Number(e.target.value) })}
              className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm" />
          </>
        )}
        {trigger.type === 'always' && <span className="text-xs text-gray-400">常に発動（条件なし）</span>}
      </div>

      <button onClick={onRemove} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

/* ========================================
   アクションエディタ
   ======================================== */

function ActionEditor({ action, index, onChange, onRemove }: { action: EventAction; index: number; onChange: (a: EventAction) => void; onRemove: () => void }) {
  const handleTypeChange = (type: EventAction['type']) => {
    const base: EventAction = { type }
    if (type === 'dialogue') { base.dialogueLines = ['']; base.speakerName = '' }
    if (type === 'setFlag') { base.flagKey = ''; base.flagValue = true }
    if (type === 'setInt' || type === 'incrementInt') { base.intKey = ''; base.intValue = 0 }
    if (type === 'movePlayer') base.targetLocation = ''
    if (type === 'giveItem') base.itemId = ''
    if (type === 'playSound') base.soundId = ''
    if (type === 'logAction') base.actionTag = ''
    onChange(base)
  }

  const updateLine = (i: number, v: string) => {
    const lines = [...(action.dialogueLines ?? [])]; lines[i] = v
    onChange({ ...action, dialogueLines: lines })
  }
  const addLine = () => onChange({ ...action, dialogueLines: [...(action.dialogueLines ?? []), ''] })
  const removeLine = (i: number) => {
    const lines = (action.dialogueLines ?? []).filter((_, idx) => idx !== i)
    onChange({ ...action, dialogueLines: lines.length > 0 ? lines : [''] })
  }

  return (
    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 font-mono w-6 text-center">#{index + 1}</span>
        <select value={action.type} onChange={e => handleTypeChange(e.target.value as EventAction['type'])}
          className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none flex-shrink-0">
          {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={onRemove} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      {action.type === 'dialogue' && (
        <div className="space-y-2 ml-9">
          <div>
            <label className="block text-xs text-gray-500 mb-1">話者名</label>
            <input type="text" value={action.speakerName ?? ''} onChange={e => onChange({ ...action, speakerName: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none" placeholder="キャラクター名" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">セリフ</label>
            {(action.dialogueLines ?? ['']).map((line, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-gray-300 w-4 text-right">{i + 1}</span>
                <input type="text" value={line} onChange={e => updateLine(i, e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none" placeholder="セリフ..." />
                <button onClick={() => removeLine(i)} className="p-1 text-gray-300 hover:text-red-400"><X size={12} /></button>
              </div>
            ))}
            <button onClick={addLine} className="flex items-center gap-1 text-xs text-gray-400 hover:text-ocean-500 mt-1">
              <Plus size={12} />行を追加
            </button>
          </div>
        </div>
      )}

      {action.type === 'setFlag' && (
        <div className="flex items-center gap-3 ml-9">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">フラグ名</label>
            <input type="text" value={action.flagKey ?? ''} onChange={e => onChange({ ...action, flagKey: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none" placeholder="flag_name" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">値</label>
            <select value={action.flagValue ? 'true' : 'false'} onChange={e => onChange({ ...action, flagValue: e.target.value === 'true' })}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white">
              <option value="true">true</option><option value="false">false</option>
            </select>
          </div>
        </div>
      )}

      {(action.type === 'setInt' || action.type === 'incrementInt') && (
        <div className="flex items-center gap-3 ml-9">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">変数名</label>
            <input type="text" value={action.intKey ?? ''} onChange={e => onChange({ ...action, intKey: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none" placeholder="variable_name" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{action.type === 'incrementInt' ? '加算値' : '設定値'}</label>
            <input type="number" value={action.intValue ?? 0} onChange={e => onChange({ ...action, intValue: Number(e.target.value) })}
              className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none" />
          </div>
        </div>
      )}

      {action.type === 'movePlayer' && (
        <div className="ml-9">
          <label className="block text-xs text-gray-500 mb-1">移動先</label>
          <input type="text" value={action.targetLocation ?? ''} onChange={e => onChange({ ...action, targetLocation: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none" placeholder="beach, shrine, house" />
        </div>
      )}

      {action.type === 'giveItem' && (
        <div className="ml-9">
          <label className="block text-xs text-gray-500 mb-1">アイテムID</label>
          <input type="text" value={action.itemId ?? ''} onChange={e => onChange({ ...action, itemId: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none" placeholder="item_seashell" />
        </div>
      )}

      {action.type === 'playSound' && (
        <div className="ml-9">
          <label className="block text-xs text-gray-500 mb-1">サウンドID</label>
          <input type="text" value={action.soundId ?? ''} onChange={e => onChange({ ...action, soundId: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none" placeholder="se_wave" />
        </div>
      )}

      {action.type === 'logAction' && (
        <div className="ml-9">
          <label className="block text-xs text-gray-500 mb-1">アクションタグ</label>
          <input type="text" value={action.actionTag ?? ''} onChange={e => onChange({ ...action, actionTag: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none" placeholder="talked_to_npc" />
        </div>
      )}
    </div>
  )
}
