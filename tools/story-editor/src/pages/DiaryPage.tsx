import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Trash2, GripVertical, ArrowUpDown, Edit3, Save } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useDiaryStore } from '../hooks/useStores';
import { useToastStore } from '../components/common/Toast';
import type { DiaryAction } from '../types';

/**
 * カテゴリの設定一覧
 * selectボックスの選択肢として使用
 */
const CATEGORY_OPTIONS: Record<string, { label: string; color: string; bgColor: string }> = {
  routine:      { label: 'ルーチン',   color: '#F97316', bgColor: '#FFF7ED' },
  interaction:  { label: '交流',       color: '#0EA5E9', bgColor: '#F0F9FF' },
  exploration:  { label: '探索',       color: '#22C55E', bgColor: '#F0FDF4' },
  sea:          { label: '海',         color: '#06B6D4', bgColor: '#ECFEFF' },
  bug:          { label: '虫・成長',   color: '#A855F7', bgColor: '#FAF5FF' },
  heroine:      { label: 'ヒロイン',   color: '#EC4899', bgColor: '#FDF2F8' },
  mystery:      { label: '謎・考察',   color: '#6366F1', bgColor: '#EEF2FF' },
  work:         { label: '仕事',       color: '#78716C', bgColor: '#F5F5F4' },
  play:         { label: '遊び',       color: '#FBBF24', bgColor: '#FFFBEB' },
  special:      { label: '特別',       color: '#EF4444', bgColor: '#FEF2F2' },
  story:        { label: 'ストーリー', color: '#8B5CF6', bgColor: '#F5F3FF' },
};

/**
 * 新規アクションのデフォルト値
 */
function createNewAction(): DiaryAction {
  return {
    tag: 'NewAction',
    displayName: '新しいアクション',
    priority: 50,
    diaryText: 'ここに日記テキストを入力...',
    category: 'routine',
  };
}

/**
 * 優先度に応じたバーの色クラスを返す
 * 低(0-25): グレー, 中(26-50): ocean系, 高(51-75): sunset系, 最高(76-100): 赤系
 */
function getPriorityBarColor(priority: number): string {
  if (priority <= 25) return 'bg-gray-400';
  if (priority <= 50) return 'bg-ocean-500';
  if (priority <= 75) return 'bg-sunset-500';
  return 'bg-red-500';
}

/**
 * 優先度に応じたテキスト色を返す
 */
function getPriorityTextColor(priority: number): string {
  if (priority <= 25) return 'text-gray-500';
  if (priority <= 50) return 'text-ocean-600';
  if (priority <= 75) return 'text-sunset-600';
  return 'text-red-600';
}

/**
 * 日記システム管理ページ
 * ゲーム内日記に関するアクションタグの管理、
 * デフォルトテキストの設定、プレビューを行う
 */
export default function DiaryPage() {
  const { data, isLoading, load, save, update } = useDiaryStore();
  const addToast = useToastStore((s) => s.addToast);

  // 編集中のアクションのインデックス（-1なら編集なし）
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  // ソート方向（true=降順: 優先度高い順、false=昇順）
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  // プレビュー用に選択されたアクションのタグ集合
  const [previewSelected, setPreviewSelected] = useState<Set<string>>(new Set());

  // 初回ロード
  useEffect(() => {
    load();
  }, [load]);

  // ローディング中の表示
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-4 border-sunset-300 border-t-sunset-600 rounded-full"
        />
      </div>
    );
  }

  // ソート済みアクション一覧を取得
  const sortedActions = [...data.actions].sort((a, b) =>
    sortDesc ? b.priority - a.priority : a.priority - b.priority
  );

  // --- ハンドラ関数群 ---

  /** デフォルトテキストを更新 */
  const handleDefaultTextChange = (value: string) => {
    update((prev) => ({ ...prev, defaultText: value }));
  };

  /** フォールバックテンプレートを更新 */
  const handleFallbackChange = (value: string) => {
    update((prev) => ({ ...prev, fallbackTemplate: value }));
  };

  /** アクションのフィールドを更新 */
  const handleActionChange = (
    index: number,
    field: keyof DiaryAction,
    value: string | number
  ) => {
    update((prev) => {
      const newActions = [...prev.actions];
      // ソート後のインデックスから実際のインデックスを逆引き
      const targetTag = sortedActions[index].tag;
      const realIndex = prev.actions.findIndex((a) => a.tag === targetTag);
      if (realIndex === -1) return prev;
      newActions[realIndex] = { ...newActions[realIndex], [field]: value };
      return { ...prev, actions: newActions, lastModified: new Date().toISOString() };
    });
  };

  /** 新しいアクションを追加 */
  const handleAddAction = () => {
    update((prev) => ({
      ...prev,
      actions: [...prev.actions, createNewAction()],
      lastModified: new Date().toISOString(),
    }));
    addToast('アクションを追加しました', 'success');
  };

  /** アクションを削除（ソート済みインデックス指定） */
  const handleDeleteAction = (sortedIndex: number) => {
    const targetTag = sortedActions[sortedIndex].tag;
    update((prev) => ({
      ...prev,
      actions: prev.actions.filter((a) => a.tag !== targetTag),
      lastModified: new Date().toISOString(),
    }));
    // 編集中だったら編集解除
    if (editingIndex === sortedIndex) setEditingIndex(-1);
    // プレビュー選択からも除去
    setPreviewSelected((prev) => {
      const next = new Set(prev);
      next.delete(targetTag);
      return next;
    });
    addToast('アクションを削除しました', 'info');
  };

  /** ソート方向を切り替え */
  const toggleSort = () => {
    setSortDesc((prev) => !prev);
    setEditingIndex(-1); // ソート変更時に編集解除
  };

  /** プレビュー用のチェックボックスを切り替え */
  const togglePreviewAction = (tag: string) => {
    setPreviewSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  /**
   * プレビューテキストを生成
   * 選択されたアクションの中で最も優先度が高いものの日記テキストを表示
   */
  const getPreviewText = (): string => {
    if (previewSelected.size === 0) return data.defaultText;
    const selected = data.actions.filter((a) => previewSelected.has(a.tag));
    if (selected.length === 0) return data.defaultText;
    // 優先度の最も高いアクションを取得
    const topAction = selected.reduce((best, cur) =>
      cur.priority > best.priority ? cur : best
    );
    return topAction.diaryText;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* ===== ページヘッダー ===== */}
      <div className="flex items-center gap-3">
        <BookOpen className="text-sunset-500" size={28} />
        <h1 className="text-2xl font-bold text-gray-800">日記システム管理</h1>
      </div>

      {/* ===== セクション1: デフォルトテキスト設定 ===== */}
      <Card title="何も起きなかった日の日記">
        <div className="space-y-4">
          {/* デフォルト日記テキスト */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              デフォルトテキスト
              <span className="text-gray-400 text-xs ml-2">
                &#8213; 何もしなかった日に表示される日記
              </span>
            </label>
            <textarea
              value={data.defaultText}
              onChange={(e) => handleDefaultTextChange(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-sand-200 bg-white/60 backdrop-blur-sm
                         text-gray-700 focus:outline-none focus:ring-2 focus:ring-sunset-300 focus:border-transparent
                         transition-all duration-200 resize-none"
              placeholder="例: 今日は静かな一日だった。"
            />
          </div>

          {/* フォールバックテンプレート */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              フォールバックテンプレート
              <span className="text-gray-400 text-xs ml-2">
                &#8213; テンプレート未定義時に使われる書式（{'{actionTag}'}で置換）
              </span>
            </label>
            <textarea
              value={data.fallbackTemplate}
              onChange={(e) => handleFallbackChange(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-sand-200 bg-white/60 backdrop-blur-sm
                         text-gray-700 focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-transparent
                         transition-all duration-200 resize-none"
              placeholder={'例: 今日は「{actionTag}」をした。'}
            />
          </div>
        </div>
      </Card>

      {/* ===== セクション2: 行動タグ一覧テーブル ===== */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif-jp text-lg font-bold text-sunset-700 flex items-center gap-2">
            <GripVertical size={18} className="text-sunset-400" />
            行動タグ一覧
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({data.actions.length}件)
            </span>
          </h3>
          <div className="flex items-center gap-2">
            {/* ソート切り替えボタン */}
            <Button
              variant="ghost"
              onClick={toggleSort}
              icon={<ArrowUpDown size={16} />}
              className="text-sm"
            >
              優先度{sortDesc ? '高い順' : '低い順'}
            </Button>
            {/* アクション追加ボタン */}
            <Button
              variant="primary"
              onClick={handleAddAction}
              icon={<Plus size={16} />}
              className="text-sm"
            >
              アクション追加
            </Button>
          </div>
        </div>

        {/* テーブルヘッダー */}
        <div className="hidden md:grid md:grid-cols-[1fr_1fr_100px_120px_2fr_80px] gap-2 px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200/50">
          <span>タグ名</span>
          <span>表示名</span>
          <span>優先度</span>
          <span>カテゴリ</span>
          <span>日記テキスト</span>
          <span className="text-center">操作</span>
        </div>

        {/* アクション行 */}
        <div className="divide-y divide-gray-100/50">
          <AnimatePresence mode="popLayout">
            {sortedActions.map((action, idx) => {
              const isEditing = editingIndex === idx;
              const catConfig = CATEGORY_OPTIONS[action.category];

              return (
                <motion.div
                  key={action.tag + '-' + idx}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    group px-4 py-3 transition-colors duration-150
                    ${isEditing ? 'bg-sunset-50/40' : 'hover:bg-white/10'}
                    ${action.priority >= 80 ? 'border-l-4 border-l-red-400' : action.priority >= 60 ? 'border-l-4 border-l-sunset-400' : 'border-l-4 border-l-transparent'}
                  `}
                >
                  {isEditing ? (
                    /* ===== 編集モード ===== */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* タグ名入力 */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">タグ名（英語）</label>
                          <input
                            type="text"
                            value={action.tag}
                            onChange={(e) => handleActionChange(idx, 'tag', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-sand-200 bg-white/70
                                       text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sunset-300"
                          />
                        </div>
                        {/* 表示名入力 */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">表示名</label>
                          <input
                            type="text"
                            value={action.displayName}
                            onChange={(e) => handleActionChange(idx, 'displayName', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-sand-200 bg-white/70
                                       text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sunset-300"
                          />
                        </div>
                        {/* 優先度入力 */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">優先度 (0-100)</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={action.priority}
                            onChange={(e) =>
                              handleActionChange(
                                idx,
                                'priority',
                                Math.min(100, Math.max(0, Number(e.target.value)))
                              )
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-sand-200 bg-white/70
                                       text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sunset-300"
                          />
                        </div>
                        {/* カテゴリ選択 */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">カテゴリ</label>
                          <select
                            value={action.category}
                            onChange={(e) => handleActionChange(idx, 'category', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-sand-200 bg-white/70
                                       text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sunset-300"
                          >
                            {Object.entries(CATEGORY_OPTIONS).map(([key, cfg]) => (
                              <option key={key} value={key}>
                                {cfg.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {/* 日記テキスト入力 */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">日記テキスト</label>
                        <textarea
                          value={action.diaryText}
                          onChange={(e) => handleActionChange(idx, 'diaryText', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-1.5 rounded-lg border border-sand-200 bg-white/70
                                     text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sunset-300
                                     resize-none"
                        />
                      </div>
                      {/* 編集完了ボタン */}
                      <div className="flex justify-end">
                        <Button
                          variant="secondary"
                          onClick={() => setEditingIndex(-1)}
                          icon={<Save size={14} />}
                          className="text-xs"
                        >
                          編集完了
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ===== 表示モード ===== */
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px_120px_2fr_80px] gap-2 items-center">
                      {/* タグ名 */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-700 bg-gray-100/60 px-2 py-0.5 rounded">
                          {action.tag}
                        </span>
                      </div>
                      {/* 表示名 */}
                      <span className="text-sm text-gray-700 font-medium">
                        {action.displayName}
                      </span>
                      {/* 優先度 + バー */}
                      <div className="flex flex-col gap-1">
                        <span className={`text-sm font-bold ${getPriorityTextColor(action.priority)}`}>
                          {action.priority}
                        </span>
                        <div className="w-full h-2 rounded-full bg-gray-200/60 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${action.priority}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={`h-full rounded-full ${getPriorityBarColor(action.priority)}`}
                          />
                        </div>
                      </div>
                      {/* カテゴリバッジ */}
                      <div>
                        <span
                          className="inline-block text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{
                            color: catConfig?.color ?? '#666',
                            backgroundColor: catConfig?.bgColor ?? '#f5f5f5',
                          }}
                        >
                          {catConfig?.label ?? action.category}
                        </span>
                      </div>
                      {/* 日記テキスト */}
                      <p className="text-sm text-gray-600 truncate" title={action.diaryText}>
                        {action.diaryText}
                      </p>
                      {/* 操作ボタン */}
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingIndex(idx)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-ocean-600 hover:bg-ocean-50
                                     transition-colors duration-150"
                          title="編集"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteAction(idx)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50
                                     transition-colors duration-150"
                          title="削除"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* アクションが0件の場合 */}
        {data.actions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
            <p>アクションがまだありません</p>
            <p className="text-sm mt-1">「アクション追加」ボタンで追加してください</p>
          </div>
        )}
      </Card>

      {/* ===== セクション3: 日記プレビュー ===== */}
      <Card title="日記プレビュー">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側: アクション選択チェックボックス */}
          <div>
            <p className="text-sm text-gray-500 mb-3">
              アクションを選択すると、その日の日記テキストのプレビューが表示されます。
              最も優先度が高いアクションのテキストが採用されます。
            </p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2">
              {data.actions
                .sort((a, b) => b.priority - a.priority)
                .map((action) => {
                  const catConfig = CATEGORY_OPTIONS[action.category];
                  return (
                    <label
                      key={action.tag}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                        transition-colors duration-150
                        ${previewSelected.has(action.tag)
                          ? 'bg-sunset-50/60 border border-sunset-200'
                          : 'hover:bg-white/20 border border-transparent'}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={previewSelected.has(action.tag)}
                        onChange={() => togglePreviewAction(action.tag)}
                        className="w-4 h-4 rounded border-gray-300 text-sunset-500 focus:ring-sunset-300"
                      />
                      <span className="text-sm text-gray-700 flex-1">
                        {action.displayName}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          color: catConfig?.color ?? '#666',
                          backgroundColor: catConfig?.bgColor ?? '#f5f5f5',
                        }}
                      >
                        {action.priority}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>

          {/* 右側: 日記テキストプレビュー */}
          <div>
            <div className="glass-card p-5 min-h-[160px] flex flex-col">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sand-200/50">
                <BookOpen size={16} className="text-sunset-400" />
                <span className="text-sm font-medium text-sunset-600">8月X日の日記</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={getPreviewText()}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap flex-1"
                  style={{ fontFamily: '"Noto Serif JP", serif' }}
                >
                  {getPreviewText()}
                </motion.p>
              </AnimatePresence>
              {/* 選択中のアクション情報 */}
              {previewSelected.size > 0 && (
                <div className="mt-4 pt-3 border-t border-sand-200/50">
                  <p className="text-xs text-gray-400">
                    選択中: {previewSelected.size}件のアクション
                    {' / '}
                    採用:「
                    {(() => {
                      const selected = data.actions.filter((a) => previewSelected.has(a.tag));
                      if (selected.length === 0) return '-';
                      return selected.reduce((best, cur) =>
                        cur.priority > best.priority ? cur : best
                      ).displayName;
                    })()}
                    」(最高優先度)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
