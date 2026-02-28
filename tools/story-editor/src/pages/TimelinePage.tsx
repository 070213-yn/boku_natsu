import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Sun, Sunset, Moon, Cloud, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useEventFlowStore, useGameConfigStore, useToastStore } from '../hooks/useStores';
import { useAutoSave } from '../hooks/useAutoSave';
import type { FlowNode, EventNodeData, TimePhase, EventCategory } from '../types';
import { CATEGORY_CONFIG, TIME_PHASE_CONFIG } from '../types';

/** 時間帯の順序定義 */
const TIME_PHASES: TimePhase[] = ['Morning', 'Noon', 'Evening', 'Night'];

/** 時間帯ごとのアイコンコンポーネント */
const TIME_PHASE_ICONS: Record<TimePhase, React.ReactNode> = {
  Morning: <Sun size={16} />,
  Noon: <Cloud size={16} />,
  Evening: <Sunset size={16} />,
  Night: <Moon size={16} />,
};

/** 1ページあたりの日数 */
const DAYS_PER_PAGE = 10;

/** イベント追加/編集フォームの型 */
interface EventFormData {
  label: string;
  category: EventCategory;
  description: string;
}

/** フォームの初期値 */
const EMPTY_FORM: EventFormData = {
  label: '',
  category: 'routine',
  description: '',
};

/**
 * 30日タイムラインページ
 * 30日間×4時間帯のグリッドにイベントを配置・管理する
 */
export default function TimelinePage() {
  const eventFlow = useEventFlowStore();
  const gameConfig = useGameConfigStore();
  const addToast = useToastStore((s) => s.addToast);

  // 現在のページ (0, 1, 2 = 1-10日, 11-20日, 21-30日)
  const [currentPage, setCurrentPage] = useState(0);

  // イベント追加モーダルの状態
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTargetDay, setAddTargetDay] = useState<number>(1);
  const [addTargetPhase, setAddTargetPhase] = useState<TimePhase>('Morning');
  const [formData, setFormData] = useState<EventFormData>({ ...EMPTY_FORM });

  // 既存イベント編集モーダルの状態
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EventFormData>({ ...EMPTY_FORM });

  // 初回読み込み
  useEffect(() => {
    eventFlow.load();
    gameConfig.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自動保存（データが変更されたら2秒後に保存）
  useAutoSave(eventFlow.data, eventFlow.save);

  // ゲーム設定からの値を取得
  const maxDay = gameConfig.data?.general.maxDay ?? 30;
  const startMonth = gameConfig.data?.general.startMonth ?? 8;
  const startDay = gameConfig.data?.general.startDay ?? 1;
  const absenceStart = gameConfig.data?.heroine.absenceStartDay ?? 16;
  const absenceEnd = gameConfig.data?.heroine.absenceEndDay ?? 19;

  // 総ページ数
  const totalPages = Math.ceil(maxDay / DAYS_PER_PAGE);

  // 現在ページに表示する日の配列を生成
  const currentDays = useMemo(() => {
    const start = currentPage * DAYS_PER_PAGE + 1;
    const end = Math.min(start + DAYS_PER_PAGE - 1, maxDay);
    const days: number[] = [];
    for (let d = start; d <= end; d++) {
      days.push(d);
    }
    return days;
  }, [currentPage, maxDay]);

  // イベントノードだけを抽出し、日付×時間帯でマッピング
  const eventsByCell = useMemo(() => {
    if (!eventFlow.data?.nodes) return new Map<string, FlowNode[]>();

    const map = new Map<string, FlowNode[]>();
    for (const node of eventFlow.data.nodes) {
      if (node.type !== 'event') continue;
      const data = node.data as EventNodeData;
      if (data.day == null || data.timePhase == null) continue;

      const key = `${data.day}-${data.timePhase}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(node);
    }
    return map;
  }, [eventFlow.data?.nodes]);

  // ヒロイン不在日かどうか判定
  const isAbsenceDay = useCallback(
    (day: number) => day >= absenceStart && day <= absenceEnd,
    [absenceStart, absenceEnd]
  );

  // セルクリック → 追加モーダルを開く
  const handleCellClick = (day: number, phase: TimePhase) => {
    setAddTargetDay(day);
    setAddTargetPhase(phase);
    setFormData({ ...EMPTY_FORM });
    setShowAddModal(true);
  };

  // イベント追加処理
  const handleAddEvent = () => {
    if (!formData.label.trim()) {
      addToast('ラベルを入力してください', 'error');
      return;
    }

    // ユニークIDを生成
    const newId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newNode: FlowNode = {
      id: newId,
      type: 'event',
      position: { x: 0, y: 0 }, // タイムライン上では座標は使わない
      data: {
        label: formData.label.trim(),
        description: formData.description.trim() || undefined,
        day: addTargetDay,
        timePhase: addTargetPhase,
        category: formData.category,
      } as EventNodeData,
    };

    eventFlow.update((data) => ({
      ...data,
      lastModified: new Date().toISOString(),
      nodes: [...data.nodes, newNode],
    }));

    setShowAddModal(false);
    addToast(`イベント「${formData.label}」を追加しました`, 'success');
  };

  // 既存イベントクリック → 編集モーダルを開く
  const handleEventClick = (e: React.MouseEvent, node: FlowNode) => {
    e.stopPropagation(); // セルのクリックイベントが発火しないようにする
    const data = node.data as EventNodeData;
    setEditingNodeId(node.id);
    setEditFormData({
      label: data.label,
      category: data.category ?? 'routine',
      description: data.description ?? '',
    });
    setShowEditModal(true);
  };

  // イベント更新処理
  const handleUpdateEvent = () => {
    if (!editingNodeId || !editFormData.label.trim()) {
      addToast('ラベルを入力してください', 'error');
      return;
    }

    eventFlow.update((data) => ({
      ...data,
      lastModified: new Date().toISOString(),
      nodes: data.nodes.map((node) =>
        node.id === editingNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                label: editFormData.label.trim(),
                description: editFormData.description.trim() || undefined,
                category: editFormData.category,
              },
            }
          : node
      ),
    }));

    setShowEditModal(false);
    setEditingNodeId(null);
    addToast('イベントを更新しました', 'success');
  };

  // イベント削除処理
  const handleDeleteEvent = () => {
    if (!editingNodeId) return;

    const targetNode = eventFlow.data?.nodes.find((n) => n.id === editingNodeId);
    const label = targetNode ? (targetNode.data as EventNodeData).label : '';

    eventFlow.update((data) => ({
      ...data,
      lastModified: new Date().toISOString(),
      // ノード削除
      nodes: data.nodes.filter((n) => n.id !== editingNodeId),
      // 関連エッジも削除
      edges: data.edges.filter(
        (e) => e.source !== editingNodeId && e.target !== editingNodeId
      ),
    }));

    setShowEditModal(false);
    setEditingNodeId(null);
    addToast(`イベント「${label}」を削除しました`, 'info');
  };

  // ページ切り替え
  const goNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };
  const goPrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  // イベント総数の統計
  const totalEvents = useMemo(() => {
    if (!eventFlow.data?.nodes) return 0;
    return eventFlow.data.nodes.filter((n) => n.type === 'event').length;
  }, [eventFlow.data?.nodes]);

  // 読み込み中の表示
  if (eventFlow.isLoading || gameConfig.isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="animate-spin mr-3 h-5 w-5 border-2 border-sunset-400 border-t-transparent rounded-full" />
            データを読み込み中...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar size={24} className="text-sunset-500" />
          <h2 className="font-serif-jp text-2xl font-bold text-sunset-700">
            タイムライン
          </h2>
          <span className="text-sm text-gray-500 ml-2">
            {startMonth}月{startDay}日 〜 {startMonth}月{startDay + maxDay - 1}日（全{maxDay}日間）
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>登録イベント数:</span>
          <span className="font-bold text-sunset-600">{totalEvents}</span>
        </div>
      </div>

      {/* ページネーション */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          onClick={goPrevPage}
          disabled={currentPage === 0}
          icon={<ChevronLeft size={18} />}
          className="!px-3"
        >
          前へ
        </Button>

        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`
                w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  currentPage === i
                    ? 'bg-sunset-500 text-white shadow-lg shadow-sunset-500/25'
                    : 'bg-white/20 text-gray-600 hover:bg-white/40'
                }
              `}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <span className="text-sm text-gray-500">
          {currentDays[0]}日 〜 {currentDays[currentDays.length - 1]}日
        </span>

        <Button
          variant="ghost"
          onClick={goNextPage}
          disabled={currentPage >= totalPages - 1}
          icon={<ChevronRight size={18} />}
          className="!px-3"
        >
          次へ
        </Button>
      </div>

      {/* メインのグリッドテーブル */}
      <Card className="!p-4 overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '800px' }}>
          {/* ヘッダー行: 日付 */}
          <thead>
            <tr>
              {/* 左上の空セル（時間帯ラベル用） */}
              <th className="w-20 min-w-[80px] p-2 text-left text-xs text-gray-400 font-normal border-b border-white/10">
                時間帯
              </th>
              {currentDays.map((day) => (
                <th
                  key={day}
                  className={`
                    p-2 text-center text-xs font-medium border-b border-white/10 min-w-[100px]
                    ${isAbsenceDay(day) ? 'bg-pink-100/40' : ''}
                  `}
                >
                  <div className="text-gray-700">
                    {startMonth}/{startDay + day - 1}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Day {day}
                  </div>
                  {isAbsenceDay(day) && (
                    <div className="text-[10px] text-pink-500 font-bold mt-0.5">
                      ヒナ不在
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* 本体: 4時間帯 × N日 */}
          <tbody>
            {TIME_PHASES.map((phase) => {
              const phaseConfig = TIME_PHASE_CONFIG[phase];
              return (
                <tr key={phase}>
                  {/* 時間帯ラベル */}
                  <td
                    className="p-2 text-xs font-medium whitespace-nowrap"
                    style={{
                      borderLeft: `3px solid ${phaseConfig.color}`,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: phaseConfig.color }}>
                        {TIME_PHASE_ICONS[phase]}
                      </span>
                      <span className="text-gray-600">{phaseConfig.label}</span>
                    </div>
                  </td>

                  {/* 各日のセル */}
                  {currentDays.map((day) => {
                    const cellKey = `${day}-${phase}`;
                    const events = eventsByCell.get(cellKey) ?? [];
                    const absence = isAbsenceDay(day);

                    return (
                      <td
                        key={cellKey}
                        className={`
                          p-1.5 min-h-[60px] align-top cursor-pointer
                          transition-colors duration-150
                          hover:bg-white/20
                          ${absence ? 'bg-pink-50/30' : ''}
                          ${events.length === 0 ? 'border border-dashed border-white/20' : 'border border-white/10'}
                        `}
                        style={{ minHeight: '60px', height: '60px' }}
                        onClick={() => handleCellClick(day, phase)}
                      >
                        <div className="flex flex-col gap-1 min-h-[52px]">
                          {events.map((node) => {
                            const data = node.data as EventNodeData;
                            const catConfig = data.category
                              ? CATEGORY_CONFIG[data.category]
                              : null;

                            return (
                              <motion.div
                                key={node.id}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="group relative"
                                onClick={(e) => handleEventClick(e, node)}
                              >
                                <div
                                  className="
                                    flex items-center gap-1 px-1.5 py-1 rounded-md text-[11px]
                                    leading-tight cursor-pointer
                                    transition-all duration-150
                                    hover:shadow-md hover:scale-[1.02]
                                  "
                                  style={{
                                    backgroundColor: catConfig?.bgColor ?? '#F3F4F6',
                                    border: `1px solid ${catConfig?.color ?? '#D1D5DB'}20`,
                                  }}
                                >
                                  {/* カテゴリカラーのドット */}
                                  <span
                                    className="flex-shrink-0 w-2 h-2 rounded-full"
                                    style={{ backgroundColor: catConfig?.color ?? '#9CA3AF' }}
                                  />
                                  {/* ラベル（長い場合は省略） */}
                                  <span
                                    className="truncate font-medium"
                                    style={{ color: catConfig?.color ?? '#4B5563', maxWidth: '80px' }}
                                    title={data.label}
                                  >
                                    {data.label}
                                  </span>
                                </div>
                              </motion.div>
                            );
                          })}

                          {/* 空セルのプラスアイコン（ホバーで表示） */}
                          {events.length === 0 && (
                            <div className="flex items-center justify-center h-full opacity-0 hover:opacity-40 transition-opacity">
                              <Plus size={14} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* 凡例 */}
      <Card className="!p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-gray-500">カテゴリ凡例</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(
            ([key, config]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-gray-600">{config.label}</span>
              </div>
            )
          )}
          <div className="ml-4 flex items-center gap-1.5 text-xs">
            <span className="w-4 h-3 rounded-sm bg-pink-100 border border-pink-200" />
            <span className="text-gray-600">ヒロイン不在期間</span>
          </div>
        </div>
      </Card>

      {/* --- イベント追加モーダル --- */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowAddModal(false)}
          >
            {/* 背景オーバーレイ */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            {/* モーダル本体 */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative glass-card p-6 w-full max-w-md mx-4 bg-white/90"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 閉じるボタン */}
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="font-serif-jp text-lg font-bold text-sunset-700 mb-1">
                イベントを追加
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                {startMonth}/{startDay + addTargetDay - 1}（Day {addTargetDay}）
                {TIME_PHASE_CONFIG[addTargetPhase].label}
                {isAbsenceDay(addTargetDay) && (
                  <span className="text-pink-500 ml-1">- ヒナ不在日</span>
                )}
              </p>

              {/* ラベル入力 */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  イベント名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="例: ラジオ体操、釣り大会..."
                  className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-white/60 border border-white/30
                    focus:outline-none focus:ring-2 focus:ring-sunset-400/50
                    placeholder-gray-300
                  "
                  autoFocus
                />
              </div>

              {/* カテゴリ選択 */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  カテゴリ
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(
                    ([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setFormData({ ...formData, category: key as EventCategory })}
                        className={`
                          flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium
                          transition-all duration-150 border
                          ${
                            formData.category === key
                              ? 'shadow-sm scale-[1.02]'
                              : 'opacity-60 hover:opacity-80'
                          }
                        `}
                        style={{
                          backgroundColor:
                            formData.category === key ? config.bgColor : 'transparent',
                          borderColor:
                            formData.category === key ? config.color : 'rgba(255,255,255,0.2)',
                          color: config.color,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: config.color }}
                        />
                        {config.label}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* 説明入力 */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  説明（任意）
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="イベントの詳細を記載..."
                  rows={2}
                  className="
                    w-full px-3 py-2 rounded-lg text-sm resize-none
                    bg-white/60 border border-white/30
                    focus:outline-none focus:ring-2 focus:ring-sunset-400/50
                    placeholder-gray-300
                  "
                />
              </div>

              {/* アクションボタン */}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddEvent}
                  icon={<Plus size={16} />}
                >
                  追加する
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- イベント編集モーダル --- */}
      <AnimatePresence>
        {showEditModal && editingNodeId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowEditModal(false)}
          >
            {/* 背景オーバーレイ */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            {/* モーダル本体 */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative glass-card p-6 w-full max-w-md mx-4 bg-white/90"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 閉じるボタン */}
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="font-serif-jp text-lg font-bold text-sunset-700 mb-4">
                イベントを編集
              </h3>

              {/* ラベル入力 */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  イベント名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.label}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, label: e.target.value })
                  }
                  className="
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-white/60 border border-white/30
                    focus:outline-none focus:ring-2 focus:ring-sunset-400/50
                  "
                  autoFocus
                />
              </div>

              {/* カテゴリ選択 */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  カテゴリ
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(
                    ([key, config]) => (
                      <button
                        key={key}
                        onClick={() =>
                          setEditFormData({ ...editFormData, category: key as EventCategory })
                        }
                        className={`
                          flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium
                          transition-all duration-150 border
                          ${
                            editFormData.category === key
                              ? 'shadow-sm scale-[1.02]'
                              : 'opacity-60 hover:opacity-80'
                          }
                        `}
                        style={{
                          backgroundColor:
                            editFormData.category === key ? config.bgColor : 'transparent',
                          borderColor:
                            editFormData.category === key
                              ? config.color
                              : 'rgba(255,255,255,0.2)',
                          color: config.color,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: config.color }}
                        />
                        {config.label}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* 説明入力 */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  説明（任意）
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  rows={2}
                  className="
                    w-full px-3 py-2 rounded-lg text-sm resize-none
                    bg-white/60 border border-white/30
                    focus:outline-none focus:ring-2 focus:ring-sunset-400/50
                  "
                />
              </div>

              {/* アクションボタン */}
              <div className="flex justify-between">
                <Button
                  variant="danger"
                  onClick={handleDeleteEvent}
                  icon={<X size={16} />}
                >
                  削除
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                    キャンセル
                  </Button>
                  <Button variant="primary" onClick={handleUpdateEvent}>
                    更新する
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
