import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, MessageSquare, User, Heart, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useDialogueStore } from '../hooks/useStores';
import { useToastStore } from '../components/common/Toast';
import type { NPCDialogueData, DialogueStage, SpecialDialogue } from '../types';

/** フェードインアニメーション設定 */
const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
};

/** 新規NPCのデフォルトデータを生成 */
function createNewNpc(): NPCDialogueData {
  const id = `npc_${Date.now().toString(36)}`;
  return {
    npcId: id,
    npcName: '新しいNPC',
    type: 'npc',
    dialogueStages: {
      default: { thresholdMin: 0, thresholdMax: -1, lines: ['こんにちは。'] },
    },
    specialDialogues: [],
  };
}

/** 新規特殊会話のデフォルトデータを生成 */
function createNewSpecialDialogue(): SpecialDialogue {
  return {
    id: `sp_${Date.now().toString(36)}`,
    trigger: '',
    day: null,
    lines: [''],
  };
}

/**
 * 会話テキスト編集ページ
 * NPC一覧（左）と詳細編集（右）の2カラムレイアウト
 */
export default function DialoguePage() {
  const { data, isLoading, load, save, update } = useDialogueStore();
  const addToast = useToastStore((s) => s.addToast);

  // 選択中のNPCインデックス
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  // アコーディオンで開いている段階名のセット
  const [openStages, setOpenStages] = useState<Set<string>>(new Set());
  // 特殊会話セクションの開閉
  const [specialOpen, setSpecialOpen] = useState(false);
  // 削除ボタンの確認状態（NPCインデックス）
  const [confirmDeleteNpc, setConfirmDeleteNpc] = useState<number | null>(null);

  // 初回読み込み
  useEffect(() => {
    load();
  }, [load]);

  // ローディング中
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 font-sans-jp">読み込み中...</div>
      </div>
    );
  }

  const npcs = data.npcs;
  const selectedNpc = npcs[selectedIndex] ?? null;

  // ---------- NPC一覧操作 ----------

  /** NPCを追加 */
  const handleAddNpc = () => {
    const newNpc = createNewNpc();
    update((prev) => ({
      ...prev,
      lastModified: new Date().toISOString(),
      npcs: [...prev.npcs, newNpc],
    }));
    // 追加したNPCを選択
    setSelectedIndex(npcs.length);
    addToast('NPCを追加しました', 'success');
  };

  /** NPCを削除 */
  const handleDeleteNpc = (index: number) => {
    if (confirmDeleteNpc !== index) {
      // 1回目のクリック: 確認状態にする
      setConfirmDeleteNpc(index);
      // 3秒後に確認状態をリセット
      setTimeout(() => setConfirmDeleteNpc(null), 3000);
      return;
    }
    // 2回目のクリック: 実際に削除
    update((prev) => ({
      ...prev,
      lastModified: new Date().toISOString(),
      npcs: prev.npcs.filter((_, i) => i !== index),
    }));
    setConfirmDeleteNpc(null);
    // 選択インデックスを調整
    if (selectedIndex >= npcs.length - 1) {
      setSelectedIndex(Math.max(0, npcs.length - 2));
    }
    addToast('NPCを削除しました', 'info');
  };

  // ---------- NPC詳細編集 ----------

  /** NPC基本情報を更新するヘルパー */
  const updateNpc = (updater: (npc: NPCDialogueData) => NPCDialogueData) => {
    update((prev) => ({
      ...prev,
      lastModified: new Date().toISOString(),
      npcs: prev.npcs.map((npc, i) => (i === selectedIndex ? updater(npc) : npc)),
    }));
  };

  /** NPC IDの更新 */
  const handleNpcIdChange = (value: string) => {
    updateNpc((npc) => ({ ...npc, npcId: value }));
  };

  /** NPC名の更新 */
  const handleNpcNameChange = (value: string) => {
    updateNpc((npc) => ({ ...npc, npcName: value }));
  };

  /** NPCタイプの更新 */
  const handleTypeChange = (value: 'heroine' | 'npc') => {
    updateNpc((npc) => ({
      ...npc,
      type: value,
      // ヒロインからNPCに変更した場合は不在日をクリア
      absenceDays: value === 'npc' ? undefined : npc.absenceDays,
    }));
  };

  /** 不在日の更新（カンマ区切りテキスト→数値配列） */
  const handleAbsenceDaysChange = (value: string) => {
    const days = value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '')
      .map(Number)
      .filter((n) => !isNaN(n));
    updateNpc((npc) => ({ ...npc, absenceDays: days }));
  };

  // ---------- 会話段階操作 ----------

  /** アコーディオンの開閉トグル */
  const toggleStage = (stageKey: string) => {
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageKey)) {
        next.delete(stageKey);
      } else {
        next.add(stageKey);
      }
      return next;
    });
  };

  /** 段階名を変更（キー名のリネーム） */
  const handleStageKeyRename = (oldKey: string, newKey: string) => {
    if (!newKey || newKey === oldKey) return;
    updateNpc((npc) => {
      const entries = Object.entries(npc.dialogueStages);
      const newStages: Record<string, DialogueStage> = {};
      for (const [key, val] of entries) {
        newStages[key === oldKey ? newKey : key] = val;
      }
      return { ...npc, dialogueStages: newStages };
    });
    // アコーディオンの開閉状態も更新
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(oldKey)) {
        next.delete(oldKey);
        next.add(newKey);
      }
      return next;
    });
  };

  /** 段階のしきい値を更新 */
  const handleThresholdChange = (stageKey: string, field: 'thresholdMin' | 'thresholdMax', value: string) => {
    const num = value === '' ? 0 : parseInt(value, 10);
    if (isNaN(num)) return;
    updateNpc((npc) => ({
      ...npc,
      dialogueStages: {
        ...npc.dialogueStages,
        [stageKey]: {
          ...npc.dialogueStages[stageKey],
          [field]: num,
        },
      },
    }));
  };

  /** セリフを更新 */
  const handleLineChange = (stageKey: string, lineIndex: number, value: string) => {
    updateNpc((npc) => ({
      ...npc,
      dialogueStages: {
        ...npc.dialogueStages,
        [stageKey]: {
          ...npc.dialogueStages[stageKey],
          lines: npc.dialogueStages[stageKey].lines.map((l, i) => (i === lineIndex ? value : l)),
        },
      },
    }));
  };

  /** セリフを追加 */
  const handleAddLine = (stageKey: string) => {
    updateNpc((npc) => ({
      ...npc,
      dialogueStages: {
        ...npc.dialogueStages,
        [stageKey]: {
          ...npc.dialogueStages[stageKey],
          lines: [...npc.dialogueStages[stageKey].lines, ''],
        },
      },
    }));
  };

  /** セリフを削除 */
  const handleRemoveLine = (stageKey: string, lineIndex: number) => {
    updateNpc((npc) => ({
      ...npc,
      dialogueStages: {
        ...npc.dialogueStages,
        [stageKey]: {
          ...npc.dialogueStages[stageKey],
          lines: npc.dialogueStages[stageKey].lines.filter((_, i) => i !== lineIndex),
        },
      },
    }));
  };

  /** 段階を追加 */
  const handleAddStage = () => {
    const key = `stage_${Date.now().toString(36)}`;
    updateNpc((npc) => ({
      ...npc,
      dialogueStages: {
        ...npc.dialogueStages,
        [key]: { thresholdMin: 0, thresholdMax: -1, lines: [''] },
      },
    }));
    setOpenStages((prev) => new Set(prev).add(key));
  };

  /** 段階を削除 */
  const handleDeleteStage = (stageKey: string) => {
    updateNpc((npc) => {
      const { [stageKey]: _, ...rest } = npc.dialogueStages;
      return { ...npc, dialogueStages: rest };
    });
    setOpenStages((prev) => {
      const next = new Set(prev);
      next.delete(stageKey);
      return next;
    });
  };

  // ---------- 特殊会話操作 ----------

  /** 特殊会話を追加 */
  const handleAddSpecial = () => {
    updateNpc((npc) => ({
      ...npc,
      specialDialogues: [...(npc.specialDialogues ?? []), createNewSpecialDialogue()],
    }));
  };

  /** 特殊会話のフィールドを更新 */
  const updateSpecial = (spIndex: number, updater: (sp: SpecialDialogue) => SpecialDialogue) => {
    updateNpc((npc) => ({
      ...npc,
      specialDialogues: (npc.specialDialogues ?? []).map((sp, i) => (i === spIndex ? updater(sp) : sp)),
    }));
  };

  /** 特殊会話を削除 */
  const handleDeleteSpecial = (spIndex: number) => {
    updateNpc((npc) => ({
      ...npc,
      specialDialogues: (npc.specialDialogues ?? []).filter((_, i) => i !== spIndex),
    }));
  };

  /** 特殊会話のセリフを更新 */
  const handleSpecialLineChange = (spIndex: number, lineIndex: number, value: string) => {
    updateSpecial(spIndex, (sp) => ({
      ...sp,
      lines: sp.lines.map((l, i) => (i === lineIndex ? value : l)),
    }));
  };

  /** 特殊会話にセリフを追加 */
  const handleAddSpecialLine = (spIndex: number) => {
    updateSpecial(spIndex, (sp) => ({ ...sp, lines: [...sp.lines, ''] }));
  };

  /** 特殊会話のセリフを削除 */
  const handleRemoveSpecialLine = (spIndex: number, lineIndex: number) => {
    updateSpecial(spIndex, (sp) => ({
      ...sp,
      lines: sp.lines.filter((_, i) => i !== lineIndex),
    }));
  };

  // ---------- 手動保存 ----------
  const handleManualSave = async () => {
    await save();
    addToast('保存しました', 'success');
  };

  // ---------- 描画 ----------
  return (
    <motion.div className="flex gap-6 h-[calc(100vh-8rem)]" {...fadeIn}>
      {/* ====== 左カラム: NPC一覧 ====== */}
      <div className="w-1/4 min-w-[240px] flex flex-col gap-4">
        {/* ヘッダー */}
        <Card className="!p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif-jp text-lg font-bold text-sunset-600 flex items-center gap-2">
              <MessageSquare size={20} />
              NPC一覧
            </h2>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleAddNpc} className="!px-3 !py-1.5 !text-xs">
              追加
            </Button>
          </div>

          {/* NPC リスト */}
          <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
            {npcs.map((npc, index) => {
              const isSelected = index === selectedIndex;
              const isHeroine = npc.type === 'heroine';
              return (
                <motion.div
                  key={npc.npcId + index}
                  layout
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                    ${isSelected
                      ? 'bg-sunset-500/20 border border-sunset-400/40 shadow-sm'
                      : 'bg-white/5 hover:bg-white/15 border border-transparent'
                    }
                  `}
                  onClick={() => setSelectedIndex(index)}
                >
                  {/* タイプアイコン */}
                  <span className={`flex-shrink-0 ${isHeroine ? 'text-pink-400' : 'text-ocean-400'}`}>
                    {isHeroine ? <Heart size={18} /> : <User size={18} />}
                  </span>

                  {/* NPC名とID */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-sunset-600' : 'text-gray-700'}`}>
                      {npc.npcName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{npc.npcId}</p>
                  </div>

                  {/* タイプバッジ */}
                  <span
                    className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium
                      ${isHeroine
                        ? 'bg-pink-100 text-pink-600 border border-pink-200'
                        : 'bg-ocean-100 text-ocean-600 border border-ocean-200'
                      }
                    `}
                  >
                    {isHeroine ? 'ヒロイン' : 'NPC'}
                  </span>

                  {/* 削除ボタン */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNpc(index);
                    }}
                    className={`flex-shrink-0 p-1 rounded-lg transition-colors
                      ${confirmDeleteNpc === index
                        ? 'bg-red-500 text-white'
                        : 'text-gray-300 hover:text-red-400 hover:bg-red-50'
                      }
                    `}
                    title={confirmDeleteNpc === index ? 'もう一度クリックで削除' : '削除'}
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              );
            })}

            {/* NPCが0件の場合 */}
            {npcs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                NPCがいません。「追加」ボタンでNPCを作成してください。
              </p>
            )}
          </div>
        </Card>

        {/* 手動保存ボタン */}
        <Button variant="secondary" icon={<Save size={16} />} onClick={handleManualSave} className="w-full">
          手動保存
        </Button>
      </div>

      {/* ====== 右カラム: 詳細編集エリア ====== */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-5">
        <AnimatePresence mode="wait">
          {selectedNpc ? (
            <motion.div
              key={selectedNpc.npcId + selectedIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* ---- 基本情報セクション ---- */}
              <Card>
                <h3 className="font-serif-jp text-lg font-bold text-sunset-600 mb-4 flex items-center gap-2">
                  {selectedNpc.type === 'heroine' ? <Heart size={20} className="text-pink-400" /> : <User size={20} className="text-ocean-400" />}
                  基本情報
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* NPC ID */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">NPC ID（英数字）</label>
                    <input
                      type="text"
                      value={selectedNpc.npcId}
                      onChange={(e) => handleNpcIdChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-400/50 focus:border-sunset-400 transition-all"
                      placeholder="例: npc_fishing_old_man"
                    />
                  </div>
                  {/* NPC名 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">NPC名</label>
                    <input
                      type="text"
                      value={selectedNpc.npcName}
                      onChange={(e) => handleNpcNameChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-400/50 focus:border-sunset-400 transition-all"
                      placeholder="例: 釣りの老人"
                    />
                  </div>
                  {/* タイプ選択 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">タイプ</label>
                    <select
                      value={selectedNpc.type}
                      onChange={(e) => handleTypeChange(e.target.value as 'heroine' | 'npc')}
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-400/50 focus:border-sunset-400 transition-all"
                    >
                      <option value="npc">NPC</option>
                      <option value="heroine">ヒロイン</option>
                    </select>
                  </div>
                  {/* 不在日（ヒロインのみ） */}
                  {selectedNpc.type === 'heroine' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        不在日（カンマ区切り、例: 16,17,18,19）
                      </label>
                      <input
                        type="text"
                        value={(selectedNpc.absenceDays ?? []).join(', ')}
                        onChange={(e) => handleAbsenceDaysChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-400/50 focus:border-sunset-400 transition-all"
                        placeholder="16, 17, 18, 19"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* ---- 会話段階セクション ---- */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif-jp text-lg font-bold text-sunset-600 flex items-center gap-2">
                    <MessageSquare size={20} />
                    会話段階
                  </h3>
                  <Button variant="ghost" icon={<Plus size={16} />} onClick={handleAddStage} className="!text-xs">
                    段階を追加
                  </Button>
                </div>

                <div className="space-y-3">
                  {Object.entries(selectedNpc.dialogueStages).map(([stageKey, stage]) => {
                    const isOpen = openStages.has(stageKey);
                    return (
                      <div key={stageKey} className="bg-white/10 rounded-xl overflow-hidden">
                        {/* アコーディオンヘッダー */}
                        <button
                          onClick={() => toggleStage(stageKey)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                        >
                          <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
                          <span className="flex-1 text-sm font-medium text-gray-700">{stageKey}</span>
                          <span className="text-xs text-gray-400 mr-2">
                            好感度 {stage.thresholdMin} ~ {stage.thresholdMax === -1 ? '上限なし' : stage.thresholdMax}
                          </span>
                          <span className="text-xs text-gray-400 mr-2">{stage.lines.length}行</span>
                          {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </button>

                        {/* アコーディオン中身 */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' as const }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-4">
                                {/* 段階名・しきい値の編集行 */}
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">段階名</label>
                                    <input
                                      type="text"
                                      value={stageKey}
                                      onChange={(e) => handleStageKeyRename(stageKey, e.target.value)}
                                      className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400/50 transition-all"
                                      placeholder="例: distant"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">好感度 下限</label>
                                    <input
                                      type="number"
                                      value={stage.thresholdMin}
                                      onChange={(e) => handleThresholdChange(stageKey, 'thresholdMin', e.target.value)}
                                      className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400/50 transition-all"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">好感度 上限（-1=無限）</label>
                                    <input
                                      type="number"
                                      value={stage.thresholdMax}
                                      onChange={(e) => handleThresholdChange(stageKey, 'thresholdMax', e.target.value)}
                                      className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400/50 transition-all"
                                    />
                                  </div>
                                </div>

                                {/* セリフ一覧 */}
                                <div className="space-y-2">
                                  <label className="block text-xs text-gray-400">セリフ一覧</label>
                                  {stage.lines.map((line, lineIdx) => (
                                    <div key={lineIdx} className="flex items-start gap-2">
                                      <span className="text-xs text-gray-300 pt-2 w-6 text-right flex-shrink-0">
                                        {lineIdx + 1}.
                                      </span>
                                      <textarea
                                        rows={2}
                                        value={line}
                                        onChange={(e) => handleLineChange(stageKey, lineIdx, e.target.value)}
                                        className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ocean-400/50 transition-all"
                                        placeholder="セリフを入力..."
                                      />
                                      <button
                                        onClick={() => handleRemoveLine(stageKey, lineIdx)}
                                        className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors mt-0.5"
                                        title="このセリフを削除"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}

                                  {/* セリフ追加ボタン */}
                                  <button
                                    onClick={() => handleAddLine(stageKey)}
                                    className="flex items-center gap-1.5 text-xs text-ocean-500 hover:text-ocean-600 transition-colors mt-1 px-1"
                                  >
                                    <Plus size={14} />
                                    セリフを追加
                                  </button>
                                </div>

                                {/* 段階削除ボタン */}
                                <div className="flex justify-end pt-2 border-t border-white/10">
                                  <button
                                    onClick={() => handleDeleteStage(stageKey)}
                                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                    この段階を削除
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {/* 段階が0件の場合 */}
                  {Object.keys(selectedNpc.dialogueStages).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      会話段階がありません。「段階を追加」で作成してください。
                    </p>
                  )}
                </div>
              </Card>

              {/* ---- 特殊会話セクション ---- */}
              <Card>
                <button
                  onClick={() => setSpecialOpen(!specialOpen)}
                  className="w-full flex items-center justify-between"
                >
                  <h3 className="font-serif-jp text-lg font-bold text-sunset-600 flex items-center gap-2">
                    <MessageSquare size={20} />
                    特殊会話
                    <span className="text-xs font-normal text-gray-400 ml-1">
                      ({(selectedNpc.specialDialogues ?? []).length}件)
                    </span>
                  </h3>
                  {specialOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>

                <AnimatePresence>
                  {specialOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' as const }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-4">
                        {(selectedNpc.specialDialogues ?? []).map((sp, spIdx) => (
                          <div key={sp.id} className="bg-white/10 rounded-xl p-4 space-y-3">
                            {/* 特殊会話ヘッダー */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-600">特殊会話 #{spIdx + 1}</span>
                              <button
                                onClick={() => handleDeleteSpecial(spIdx)}
                                className="p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                                title="この特殊会話を削除"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {/* トリガーと日付 */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                  トリガー条件（例: heroine_conversation &gt;= 8）
                                </label>
                                <input
                                  type="text"
                                  value={sp.trigger}
                                  onChange={(e) =>
                                    updateSpecial(spIdx, (s) => ({ ...s, trigger: e.target.value }))
                                  }
                                  className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400/50 transition-all"
                                  placeholder="heroine_conversation >= 8"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                  日付指定（空欄 = 指定なし）
                                </label>
                                <input
                                  type="text"
                                  value={sp.day === null ? '' : String(sp.day)}
                                  onChange={(e) => {
                                    const val = e.target.value.trim();
                                    const num = val === '' ? null : parseInt(val, 10);
                                    updateSpecial(spIdx, (s) => ({
                                      ...s,
                                      day: num !== null && isNaN(num) ? s.day : num,
                                    }));
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400/50 transition-all"
                                  placeholder="例: 15"
                                />
                              </div>
                            </div>

                            {/* 特殊会話セリフ一覧 */}
                            <div className="space-y-2">
                              <label className="block text-xs text-gray-400">セリフ</label>
                              {sp.lines.map((line, lineIdx) => (
                                <div key={lineIdx} className="flex items-start gap-2">
                                  <span className="text-xs text-gray-300 pt-2 w-6 text-right flex-shrink-0">
                                    {lineIdx + 1}.
                                  </span>
                                  <textarea
                                    rows={2}
                                    value={line}
                                    onChange={(e) => handleSpecialLineChange(spIdx, lineIdx, e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ocean-400/50 transition-all"
                                    placeholder="セリフを入力..."
                                  />
                                  <button
                                    onClick={() => handleRemoveSpecialLine(spIdx, lineIdx)}
                                    className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors mt-0.5"
                                    title="このセリフを削除"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => handleAddSpecialLine(spIdx)}
                                className="flex items-center gap-1.5 text-xs text-ocean-500 hover:text-ocean-600 transition-colors mt-1 px-1"
                              >
                                <Plus size={14} />
                                セリフを追加
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* 特殊会話が0件の場合 */}
                        {(selectedNpc.specialDialogues ?? []).length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">
                            特殊会話がありません。
                          </p>
                        )}

                        {/* 特殊会話追加ボタン */}
                        <Button variant="ghost" icon={<Plus size={16} />} onClick={handleAddSpecial} className="!text-xs">
                          特殊会話を追加
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ) : (
            /* NPC未選択時 */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-64"
            >
              <p className="text-gray-400 font-sans-jp">
                左のNPC一覧からキャラクターを選択してください。
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
