import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flag,
  Hash,
  Plus,
  Trash2,
  Edit3,
  Save,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useExplorationStore } from '../hooks/useStores';
import { useAutoSave } from '../hooks/useAutoSave';
import { useToastStore } from '../components/common/Toast';
import type { ExplorationFlag, IntCounter, UnlockCondition } from '../types';

/* ========================================
   アニメーション設定
   ======================================== */

/** 親コンテナ: 子要素を順番にフェードインさせる */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

/** 各子要素のフェードイン */
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/** リストアイテムのアニメーション */
const listItemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

/* ========================================
   デフォルト値の生成
   ======================================== */

/** 新規フラグのデフォルト値 */
function createDefaultFlag(): ExplorationFlag {
  const id = Date.now().toString(36);
  return {
    key: `new_flag_${id}`,
    displayName: '新しいフラグ',
    description: '',
    defaultValue: false,
    unlockCondition: { type: 'flag', key: '', value: true },
    unlocksArea: '',
  };
}

/** 新規カウンターのデフォルト値 */
function createDefaultCounter(): IntCounter {
  const id = Date.now().toString(36);
  return {
    key: `new_counter_${id}`,
    displayName: '新しいカウンター',
    defaultValue: 0,
    maxValue: -1,
    rewards: [],
  };
}

/* ========================================
   解放条件の表示ユーティリティ
   ======================================== */

/** 解放条件を日本語の読みやすいテキストに変換する */
function renderConditionText(cond: UnlockCondition): string {
  switch (cond.type) {
    case 'flag':
      return `${cond.key || '(未設定)'} が ${cond.value === true ? 'ON' : cond.value === false ? 'OFF' : String(cond.value)}`;
    case 'intValue':
      return `${cond.key || '(未設定)'} ${cond.operator || '=='} ${cond.value ?? 0}`;
    case 'day':
      return `${cond.operator || '>='} Day ${cond.value ?? 1}`;
    case 'composite': {
      const logic = cond.logic || 'AND';
      const children = cond.conditions?.map(renderConditionText) ?? [];
      return `${logic}: [ ${children.join(' / ')} ]`;
    }
    default:
      return '(不明な条件)';
  }
}

/* ========================================
   タブ定義
   ======================================== */
type TabType = 'flags' | 'counters';

/* ========================================
   解放条件エディタ（サブコンポーネント）
   ======================================== */

interface ConditionEditorProps {
  condition: UnlockCondition;
  onChange: (cond: UnlockCondition) => void;
  /** ネストの深さ（composite用） */
  depth?: number;
}

/** 解放条件をインラインで編集するコンポーネント */
function ConditionEditor({ condition, onChange, depth = 0 }: ConditionEditorProps) {
  /** 条件タイプ変更時にフィールドをリセットする */
  const handleTypeChange = (newType: UnlockCondition['type']) => {
    switch (newType) {
      case 'flag':
        onChange({ type: 'flag', key: '', value: true });
        break;
      case 'intValue':
        onChange({ type: 'intValue', key: '', operator: '>=', value: 0 });
        break;
      case 'day':
        onChange({ type: 'day', operator: '>=', value: 1 });
        break;
      case 'composite':
        onChange({ type: 'composite', logic: 'AND', conditions: [] });
        break;
    }
  };

  return (
    <div className={`space-y-2 ${depth > 0 ? 'ml-4 pl-3 border-l-2 border-sunset-200' : ''}`}>
      {/* 条件タイプ選択 */}
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-xs text-gray-400">タイプ:</label>
        <select
          value={condition.type}
          onChange={(e) => handleTypeChange(e.target.value as UnlockCondition['type'])}
          className="bg-gray-800/50 text-white text-sm rounded-lg px-2 py-1 border border-white/10 focus:border-sunset-400 focus:outline-none"
        >
          <option value="flag">フラグ</option>
          <option value="intValue">数値</option>
          <option value="day">日付</option>
          <option value="composite">複合条件</option>
        </select>
      </div>

      {/* タイプごとの入力フォーム */}
      {condition.type === 'flag' && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="フラグキー"
            value={condition.key || ''}
            onChange={(e) => onChange({ ...condition, key: e.target.value })}
            className="bg-gray-800/50 text-white text-sm rounded-lg px-3 py-1 border border-white/10 focus:border-sunset-400 focus:outline-none w-40"
          />
          <span className="text-xs text-gray-400">が</span>
          <select
            value={String(condition.value ?? true)}
            onChange={(e) => onChange({ ...condition, value: e.target.value === 'true' })}
            className="bg-gray-800/50 text-white text-sm rounded-lg px-2 py-1 border border-white/10 focus:border-sunset-400 focus:outline-none"
          >
            <option value="true">ON</option>
            <option value="false">OFF</option>
          </select>
        </div>
      )}

      {condition.type === 'intValue' && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="カウンターキー"
            value={condition.key || ''}
            onChange={(e) => onChange({ ...condition, key: e.target.value })}
            className="bg-gray-800/50 text-white text-sm rounded-lg px-3 py-1 border border-white/10 focus:border-sunset-400 focus:outline-none w-40"
          />
          <select
            value={condition.operator || '>='}
            onChange={(e) => onChange({ ...condition, operator: e.target.value })}
            className="bg-gray-800/50 text-white text-sm rounded-lg px-2 py-1 border border-white/10 focus:border-sunset-400 focus:outline-none"
          >
            <option value=">=">{'>='}（以上）</option>
            <option value=">">{'>'} （超過）</option>
            <option value="==">{'=='} （等しい）</option>
            <option value="<=">{'<='} （以下）</option>
            <option value="<">{'<'} （未満）</option>
            <option value="!=">{'!='} （等しくない）</option>
          </select>
          <input
            type="number"
            value={typeof condition.value === 'number' ? condition.value : 0}
            onChange={(e) => onChange({ ...condition, value: Number(e.target.value) })}
            className="bg-gray-800/50 text-white text-sm rounded-lg px-3 py-1 border border-white/10 focus:border-sunset-400 focus:outline-none w-20"
          />
        </div>
      )}

      {condition.type === 'day' && (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={condition.operator || '>='}
            onChange={(e) => onChange({ ...condition, operator: e.target.value })}
            className="bg-gray-800/50 text-white text-sm rounded-lg px-2 py-1 border border-white/10 focus:border-sunset-400 focus:outline-none"
          >
            <option value=">=">{'>='}（以上）</option>
            <option value=">">{'>'} （超過）</option>
            <option value="==">{'=='} （ちょうど）</option>
            <option value="<=">{'<='} （以下）</option>
            <option value="<">{'<'} （未満）</option>
          </select>
          <span className="text-xs text-gray-400">Day</span>
          <input
            type="number"
            min={1}
            value={typeof condition.value === 'number' ? condition.value : 1}
            onChange={(e) => onChange({ ...condition, value: Number(e.target.value) })}
            className="bg-gray-800/50 text-white text-sm rounded-lg px-3 py-1 border border-white/10 focus:border-sunset-400 focus:outline-none w-20"
          />
        </div>
      )}

      {condition.type === 'composite' && (
        <div className="space-y-2">
          {/* 論理演算子の選択 */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">論理:</label>
            <select
              value={condition.logic || 'AND'}
              onChange={(e) =>
                onChange({ ...condition, logic: e.target.value as 'AND' | 'OR' })
              }
              className="bg-gray-800/50 text-white text-sm rounded-lg px-2 py-1 border border-white/10 focus:border-sunset-400 focus:outline-none"
            >
              <option value="AND">AND（すべて満たす）</option>
              <option value="OR">OR（いずれか満たす）</option>
            </select>
          </div>

          {/* 子条件一覧 */}
          {(condition.conditions || []).map((child, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="flex-1">
                <ConditionEditor
                  condition={child}
                  onChange={(updated) => {
                    const newChildren = [...(condition.conditions || [])];
                    newChildren[idx] = updated;
                    onChange({ ...condition, conditions: newChildren });
                  }}
                  depth={depth + 1}
                />
              </div>
              <button
                onClick={() => {
                  const newChildren = (condition.conditions || []).filter((_, i) => i !== idx);
                  onChange({ ...condition, conditions: newChildren });
                }}
                className="mt-1 p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="この子条件を削除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* 子条件追加ボタン */}
          <button
            onClick={() => {
              const newChild: UnlockCondition = { type: 'flag', key: '', value: true };
              onChange({
                ...condition,
                conditions: [...(condition.conditions || []), newChild],
              });
            }}
            className="text-xs text-sunset-400 hover:text-sunset-300 flex items-center gap-1 transition-colors"
          >
            <Plus size={12} />
            子条件を追加
          </button>
        </div>
      )}
    </div>
  );
}

/* ========================================
   フラグカード コンポーネント
   ======================================== */

interface FlagCardProps {
  flag: ExplorationFlag;
  index: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: (updated: ExplorationFlag) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

function FlagCard({
  flag,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: FlagCardProps) {
  /* 編集中の一時データ */
  const [draft, setDraft] = useState<ExplorationFlag>(flag);

  /* 編集開始時にdraftを更新する */
  useEffect(() => {
    if (isEditing) setDraft(flag);
  }, [isEditing, flag]);

  /* ----- 閲覧モード ----- */
  if (!isEditing) {
    return (
      <motion.div variants={listItemVariants} layout>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-start gap-4">
            {/* ロック / アンロック アイコン */}
            <div
              className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${
                flag.defaultValue
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {flag.defaultValue ? <Unlock size={20} /> : <Lock size={20} />}
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              {/* 表示名 + キー */}
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-serif-jp text-base font-bold text-gray-800">
                  {flag.displayName}
                </h4>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {flag.key}
                </span>
              </div>

              {/* 説明 */}
              {flag.description && (
                <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
              )}

              {/* 解放エリア */}
              {flag.unlocksArea && (
                <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-ocean-100 text-ocean-600">
                  {flag.unlocksArea}
                </span>
              )}

              {/* 解放条件 */}
              <div className="mt-2 bg-gray-900/50 rounded-lg p-2 text-sm font-mono text-gray-300">
                {renderConditionText(flag.unlockCondition)}
              </div>
            </div>

            {/* 操作ボタン */}
            <div className="flex-shrink-0 flex gap-1">
              <button
                onClick={onStartEdit}
                className="p-2 rounded-lg text-gray-400 hover:text-sunset-500 hover:bg-sunset-50 transition-colors"
                title="編集"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  /* ----- 編集モード ----- */
  return (
    <motion.div variants={listItemVariants} layout>
      <Card className="ring-2 ring-sunset-400/50">
        <div className="space-y-4">
          <h4 className="font-serif-jp text-base font-bold text-sunset-600">
            フラグを編集
          </h4>

          {/* キー */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              キー（英数字と_のみ）
            </label>
            <input
              type="text"
              value={draft.key}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                setDraft({ ...draft, key: val });
              }}
              className="w-full bg-white/5 text-gray-800 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:border-sunset-400 focus:outline-none"
            />
          </div>

          {/* 表示名 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">表示名</label>
            <input
              type="text"
              value={draft.displayName}
              onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
              className="w-full bg-white/5 text-gray-800 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:border-sunset-400 focus:outline-none"
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">説明</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              className="w-full bg-white/5 text-gray-800 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:border-sunset-400 focus:outline-none resize-none"
            />
          </div>

          {/* 初期値トグル */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400">初期値:</label>
            <button
              onClick={() => setDraft({ ...draft, defaultValue: !draft.defaultValue })}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                draft.defaultValue ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  draft.defaultValue ? 'translate-x-6' : ''
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">
              {draft.defaultValue ? 'ON（解放済み）' : 'OFF（未解放）'}
            </span>
          </div>

          {/* 解放エリア */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">解放されるエリア</label>
            <input
              type="text"
              value={draft.unlocksArea}
              onChange={(e) => setDraft({ ...draft, unlocksArea: e.target.value })}
              className="w-full bg-white/5 text-gray-800 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:border-sunset-400 focus:outline-none"
              placeholder="例: 神社裏門エリア"
            />
          </div>

          {/* 解放条件エディタ */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">解放条件</label>
            <div className="bg-gray-900/30 rounded-lg p-3">
              <ConditionEditor
                condition={draft.unlockCondition}
                onChange={(cond) => setDraft({ ...draft, unlockCondition: cond })}
              />
            </div>
          </div>

          {/* 保存 / キャンセル */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={() => onSaveEdit(draft)}
            >
              保存
            </Button>
            <Button variant="ghost" onClick={onCancelEdit}>
              キャンセル
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ========================================
   カウンターカード コンポーネント
   ======================================== */

interface CounterCardProps {
  counter: IntCounter;
  index: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: (updated: IntCounter) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

function CounterCard({
  counter,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: CounterCardProps) {
  const [draft, setDraft] = useState<IntCounter>(counter);

  useEffect(() => {
    if (isEditing) setDraft({ ...counter, rewards: counter.rewards ?? [] });
  }, [isEditing, counter]);

  /** 報酬を追加する */
  const addReward = () => {
    setDraft({
      ...draft,
      rewards: [...(draft.rewards || []), { threshold: 0, reward: '' }],
    });
  };

  /** 報酬を削除する */
  const removeReward = (idx: number) => {
    setDraft({
      ...draft,
      rewards: (draft.rewards || []).filter((_, i) => i !== idx),
    });
  };

  /** 報酬を更新する */
  const updateReward = (idx: number, field: 'threshold' | 'reward', value: number | string) => {
    const newRewards = [...(draft.rewards || [])];
    newRewards[idx] = { ...newRewards[idx], [field]: value };
    setDraft({ ...draft, rewards: newRewards });
  };

  /* ----- 閲覧モード ----- */
  if (!isEditing) {
    return (
      <motion.div variants={listItemVariants} layout>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-start gap-4">
            {/* アイコン */}
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-sunset-100 text-sunset-500">
              <Hash size={20} />
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              {/* 表示名 + キー */}
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-serif-jp text-base font-bold text-gray-800">
                  {counter.displayName}
                </h4>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {counter.key}
                </span>
              </div>

              {/* 初期値 / 最大値 */}
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-500">
                  初期値: <span className="font-medium text-gray-700">{counter.defaultValue}</span>
                </span>
                <span className="text-sm text-gray-500">
                  最大値:{' '}
                  <span className="font-medium text-gray-700">
                    {counter.maxValue === -1 ? '上限なし' : counter.maxValue}
                  </span>
                </span>
              </div>

              {/* 報酬リスト */}
              {counter.rewards && counter.rewards.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {counter.rewards.map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-sand-100 text-sand-600 font-medium"
                    >
                      <Award size={12} />
                      {r.threshold}到達: {r.reward}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 操作ボタン */}
            <div className="flex-shrink-0 flex gap-1">
              <button
                onClick={onStartEdit}
                className="p-2 rounded-lg text-gray-400 hover:text-sunset-500 hover:bg-sunset-50 transition-colors"
                title="編集"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="削除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  /* ----- 編集モード ----- */
  return (
    <motion.div variants={listItemVariants} layout>
      <Card className="ring-2 ring-sunset-400/50">
        <div className="space-y-4">
          <h4 className="font-serif-jp text-base font-bold text-sunset-600">
            カウンターを編集
          </h4>

          {/* キー */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              キー（英数字と_のみ）
            </label>
            <input
              type="text"
              value={draft.key}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                setDraft({ ...draft, key: val });
              }}
              className="w-full bg-white/5 text-gray-800 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:border-sunset-400 focus:outline-none"
            />
          </div>

          {/* 表示名 */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">表示名</label>
            <input
              type="text"
              value={draft.displayName}
              onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
              className="w-full bg-white/5 text-gray-800 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:border-sunset-400 focus:outline-none"
            />
          </div>

          {/* 初期値 / 最大値 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">初期値</label>
              <input
                type="number"
                value={draft.defaultValue}
                onChange={(e) => setDraft({ ...draft, defaultValue: Number(e.target.value) })}
                className="w-full bg-white/5 text-gray-800 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:border-sunset-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                最大値（-1 = 上限なし）
              </label>
              <input
                type="number"
                value={draft.maxValue}
                onChange={(e) => setDraft({ ...draft, maxValue: Number(e.target.value) })}
                className="w-full bg-white/5 text-gray-800 text-sm rounded-lg px-3 py-2 border border-gray-200 focus:border-sunset-400 focus:outline-none"
              />
            </div>
          </div>

          {/* 報酬リスト */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              しきい値報酬（カウンターが指定の値に達した時の報酬）
            </label>
            <div className="space-y-2">
              {(draft.rewards || []).map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="number"
                    value={r.threshold}
                    onChange={(e) => updateReward(i, 'threshold', Number(e.target.value))}
                    className="w-24 bg-white/5 text-gray-800 text-sm rounded-lg px-3 py-1.5 border border-gray-200 focus:border-sunset-400 focus:outline-none"
                    placeholder="しきい値"
                  />
                  <span className="text-xs text-gray-400">到達で</span>
                  <input
                    type="text"
                    value={r.reward}
                    onChange={(e) => updateReward(i, 'reward', e.target.value)}
                    className="flex-1 bg-white/5 text-gray-800 text-sm rounded-lg px-3 py-1.5 border border-gray-200 focus:border-sunset-400 focus:outline-none"
                    placeholder="報酬の説明"
                  />
                  <button
                    onClick={() => removeReward(i)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="この報酬を削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addReward}
              className="mt-2 text-xs text-sunset-400 hover:text-sunset-300 flex items-center gap-1 transition-colors"
            >
              <Plus size={12} />
              報酬を追加
            </button>
          </div>

          {/* 保存 / キャンセル */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={() => onSaveEdit(draft)}
            >
              保存
            </Button>
            <Button variant="ghost" onClick={onCancelEdit}>
              キャンセル
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ========================================
   メインコンポーネント
   ======================================== */

export default function FlagsPage() {
  const { data, isLoading, load, save, update } = useExplorationStore();
  const addToast = useToastStore((s) => s.addToast);

  /** 現在のタブ */
  const [activeTab, setActiveTab] = useState<TabType>('flags');
  /** 編集中のフラグインデックス（-1 = 編集なし） */
  const [editingFlagIndex, setEditingFlagIndex] = useState<number>(-1);
  /** 編集中のカウンターインデックス（-1 = 編集なし） */
  const [editingCounterIndex, setEditingCounterIndex] = useState<number>(-1);

  /* データの初回読み込み */
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 自動保存（データが変更された2秒後にサーバーへ保存） */
  useAutoSave(data, save);

  /* ---------- フラグ操作 ---------- */

  /** フラグを追加する */
  const addFlag = () => {
    if (!data) return;
    const newFlag = createDefaultFlag();
    update((prev) => ({
      ...prev,
      boolFlags: [...prev.boolFlags, newFlag],
      lastModified: new Date().toISOString(),
    }));
    // 追加した直後に編集モードにする
    setEditingFlagIndex(data.boolFlags.length);
    addToast('新しいフラグを追加しました', 'success');
  };

  /** フラグを保存する */
  const saveFlag = (index: number, updated: ExplorationFlag) => {
    if (!data) return;
    const newFlags = [...data.boolFlags];
    newFlags[index] = updated;
    update((prev) => ({
      ...prev,
      boolFlags: newFlags,
      lastModified: new Date().toISOString(),
    }));
    setEditingFlagIndex(-1);
    addToast(`「${updated.displayName}」を更新しました`, 'success');
  };

  /** フラグを削除する */
  const deleteFlag = (index: number) => {
    if (!data) return;
    const flagName = data.boolFlags[index].displayName;
    if (!window.confirm(`「${flagName}」を削除しますか？`)) return;
    update((prev) => ({
      ...prev,
      boolFlags: prev.boolFlags.filter((_, i) => i !== index),
      lastModified: new Date().toISOString(),
    }));
    setEditingFlagIndex(-1);
    addToast(`「${flagName}」を削除しました`, 'info');
  };

  /* ---------- カウンター操作 ---------- */

  /** カウンターを追加する */
  const addCounter = () => {
    if (!data) return;
    const newCounter = createDefaultCounter();
    update((prev) => ({
      ...prev,
      intCounters: [...prev.intCounters, newCounter],
      lastModified: new Date().toISOString(),
    }));
    setEditingCounterIndex(data.intCounters.length);
    addToast('新しいカウンターを追加しました', 'success');
  };

  /** カウンターを保存する */
  const saveCounter = (index: number, updated: IntCounter) => {
    if (!data) return;
    const newCounters = [...data.intCounters];
    newCounters[index] = updated;
    update((prev) => ({
      ...prev,
      intCounters: newCounters,
      lastModified: new Date().toISOString(),
    }));
    setEditingCounterIndex(-1);
    addToast(`「${updated.displayName}」を更新しました`, 'success');
  };

  /** カウンターを削除する */
  const deleteCounter = (index: number) => {
    if (!data) return;
    const counterName = data.intCounters[index].displayName;
    if (!window.confirm(`「${counterName}」を削除しますか？`)) return;
    update((prev) => ({
      ...prev,
      intCounters: prev.intCounters.filter((_, i) => i !== index),
      lastModified: new Date().toISOString(),
    }));
    setEditingCounterIndex(-1);
    addToast(`「${counterName}」を削除しました`, 'info');
  };

  /* ---------- ローディング表示 ---------- */

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="mx-auto w-8 h-8 border-2 border-sunset-300 border-t-sunset-600 rounded-full"
          />
          <p className="text-gray-400 text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  /* ---------- メイン描画 ---------- */

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ---- ページタイトル ---- */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Flag size={28} className="text-sunset-500" />
        <h2 className="font-serif-jp text-2xl font-bold text-gray-800">
          フラグ・探索管理
        </h2>
      </motion.div>

      {/* ---- 統計バー ---- */}
      <motion.div variants={itemVariants} className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Flag size={16} className="text-sunset-400" />
          <span className="text-sm text-gray-500">
            探索フラグ:{' '}
            <span className="font-bold text-gray-800">{data.boolFlags.length}</span> 件
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Hash size={16} className="text-ocean-400" />
          <span className="text-sm text-gray-500">
            カウンター:{' '}
            <span className="font-bold text-gray-800">{data.intCounters.length}</span> 件
          </span>
        </div>
      </motion.div>

      {/* ---- タブ切替 ---- */}
      <motion.div variants={itemVariants}>
        <div className="glass-card p-2">
          <div className="flex gap-1">
            {/* 探索フラグタブ */}
            <button
              onClick={() => {
                setActiveTab('flags');
                setEditingCounterIndex(-1);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'flags'
                  ? 'bg-sunset-500 text-white shadow-lg shadow-sunset-500/25'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/30'
              }`}
            >
              <Flag size={16} />
              探索フラグ
            </button>

            {/* カウンタータブ */}
            <button
              onClick={() => {
                setActiveTab('counters');
                setEditingFlagIndex(-1);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'counters'
                  ? 'bg-sunset-500 text-white shadow-lg shadow-sunset-500/25'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/30'
              }`}
            >
              <Hash size={16} />
              カウンター
            </button>
          </div>
        </div>
      </motion.div>

      {/* ---- 探索フラグセクション ---- */}
      <AnimatePresence mode="wait">
        {activeTab === 'flags' && (
          <motion.div
            key="flags-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* 追加ボタン */}
            <div className="flex justify-end">
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={addFlag}
              >
                フラグを追加
              </Button>
            </div>

            {/* フラグ一覧 */}
            {data.boolFlags.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <Flag size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">
                    探索フラグがまだありません。「フラグを追加」から作成してください。
                  </p>
                </div>
              </Card>
            ) : (
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {data.boolFlags.map((flag, index) => (
                    <FlagCard
                      key={flag.key + index}
                      flag={flag}
                      index={index}
                      isEditing={editingFlagIndex === index}
                      onStartEdit={() => setEditingFlagIndex(index)}
                      onSaveEdit={(updated) => saveFlag(index, updated)}
                      onCancelEdit={() => setEditingFlagIndex(-1)}
                      onDelete={() => deleteFlag(index)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ---- カウンターセクション ---- */}
        {activeTab === 'counters' && (
          <motion.div
            key="counters-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* 追加ボタン */}
            <div className="flex justify-end">
              <Button
                variant="secondary"
                icon={<Plus size={16} />}
                onClick={addCounter}
              >
                カウンターを追加
              </Button>
            </div>

            {/* カウンター一覧 */}
            {data.intCounters.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <Hash size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">
                    カウンターがまだありません。「カウンターを追加」から作成してください。
                  </p>
                </div>
              </Card>
            ) : (
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {data.intCounters.map((counter, index) => (
                    <CounterCard
                      key={counter.key + index}
                      counter={counter}
                      index={index}
                      isEditing={editingCounterIndex === index}
                      onStartEdit={() => setEditingCounterIndex(index)}
                      onSaveEdit={(updated) => saveCounter(index, updated)}
                      onCancelEdit={() => setEditingCounterIndex(-1)}
                      onDelete={() => deleteCounter(index)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
