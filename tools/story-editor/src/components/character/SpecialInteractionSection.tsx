import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Link2, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Card from '../common/Card';
import Button from '../common/Button';
import type { CharacterProfile, SpecialInteraction, TimePhase } from '../../types';

interface Props {
  character: CharacterProfile;
  onUpdate: (updater: (char: CharacterProfile) => CharacterProfile) => void;
  flowNodes: { id: string; label: string }[];
  eventListItems: { id: string; name: string }[];
}

function createNewInteraction(): SpecialInteraction {
  return {
    id: `si_${Date.now().toString(36)}`,
    title: '新しいやり取り',
    description: '',
    dialogueLines: [''],
    linkedFlowNodeIds: [],
    linkedEventIds: [],
  };
}

const TIME_PHASES: { value: TimePhase; label: string }[] = [
  { value: 'Morning', label: '朝' },
  { value: 'Noon', label: '昼' },
  { value: 'Evening', label: '夕方' },
  { value: 'Night', label: '夜' },
];

export default function SpecialInteractionSection({ character, onUpdate, flowNodes, eventListItems }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const interactions = character.specialInteractions;

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // やり取り追加
  const handleAdd = () => {
    const newItem = createNewInteraction();
    onUpdate((c) => ({ ...c, specialInteractions: [...c.specialInteractions, newItem] }));
    setOpenItems((prev) => new Set(prev).add(newItem.id));
  };

  // やり取り削除
  const handleDelete = (index: number) => {
    onUpdate((c) => ({
      ...c,
      specialInteractions: c.specialInteractions.filter((_, i) => i !== index),
    }));
  };

  // やり取り更新ヘルパー
  const updateInteraction = (index: number, updater: (si: SpecialInteraction) => SpecialInteraction) => {
    onUpdate((c) => ({
      ...c,
      specialInteractions: c.specialInteractions.map((si, i) => (i === index ? updater(si) : si)),
    }));
  };

  // セリフ操作
  const handleLineChange = (siIndex: number, lineIndex: number, value: string) => {
    updateInteraction(siIndex, (si) => ({
      ...si,
      dialogueLines: si.dialogueLines.map((l, i) => (i === lineIndex ? value : l)),
    }));
  };

  const handleAddLine = (siIndex: number) => {
    updateInteraction(siIndex, (si) => ({
      ...si,
      dialogueLines: [...si.dialogueLines, ''],
    }));
  };

  const handleRemoveLine = (siIndex: number, lineIndex: number) => {
    updateInteraction(siIndex, (si) => ({
      ...si,
      dialogueLines: si.dialogueLines.filter((_, i) => i !== lineIndex),
    }));
  };

  // リンク操作
  const toggleFlowNodeLink = (siIndex: number, nodeId: string) => {
    updateInteraction(siIndex, (si) => {
      const linked = si.linkedFlowNodeIds ?? [];
      return {
        ...si,
        linkedFlowNodeIds: linked.includes(nodeId)
          ? linked.filter((id) => id !== nodeId)
          : [...linked, nodeId],
      };
    });
  };

  const toggleEventLink = (siIndex: number, eventId: string) => {
    updateInteraction(siIndex, (si) => {
      const linked = si.linkedEventIds ?? [];
      return {
        ...si,
        linkedEventIds: linked.includes(eventId)
          ? linked.filter((id) => id !== eventId)
          : [...linked, eventId],
      };
    });
  };

  return (
    <Card>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between">
        <h3 className="font-serif-jp text-lg font-bold text-sunset-600 flex items-center gap-2">
          <Sparkles size={20} />
          特別なやり取り
          <span className="text-xs font-normal text-gray-400 ml-1">({interactions.length}件)</span>
        </h3>
        {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              {interactions.map((si, siIdx) => {
                const itemOpen = openItems.has(si.id);
                return (
                  <div key={si.id} className="bg-white/10 rounded-xl overflow-hidden">
                    {/* ヘッダー */}
                    <button
                      onClick={() => toggleItem(si.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <span className="flex-1 text-sm font-medium text-gray-700">{si.title || '（無題）'}</span>
                      {si.day && <span className="text-xs text-gray-400">Day {si.day}</span>}
                      {si.timePhase && <span className="text-xs text-gray-400">{TIME_PHASES.find((t) => t.value === si.timePhase)?.label}</span>}
                      <span className="text-xs text-gray-400">{si.dialogueLines.length}行</span>
                      {itemOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </button>

                    <AnimatePresence>
                      {itemOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-4">
                            {/* 基本情報 */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">タイトル</label>
                                <input
                                  type="text"
                                  value={si.title}
                                  onChange={(e) => updateInteraction(siIdx, (s) => ({ ...s, title: e.target.value }))}
                                  className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400/50 transition-all"
                                  placeholder="やり取りのタイトル"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">日付</label>
                                  <input
                                    type="number"
                                    value={si.day ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value.trim();
                                      const num = val === '' ? undefined : parseInt(val, 10);
                                      updateInteraction(siIdx, (s) => ({ ...s, day: num !== undefined && isNaN(num) ? s.day : num }));
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400/50 transition-all"
                                    placeholder="Day"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">時間帯</label>
                                  <select
                                    value={si.timePhase ?? ''}
                                    onChange={(e) => updateInteraction(siIdx, (s) => ({ ...s, timePhase: (e.target.value || undefined) as TimePhase | undefined }))}
                                    className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400/50 transition-all"
                                  >
                                    <option value="">指定なし</option>
                                    {TIME_PHASES.map((tp) => (
                                      <option key={tp.value} value={tp.value}>{tp.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* 説明 */}
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">説明</label>
                              <textarea
                                rows={2}
                                value={si.description}
                                onChange={(e) => updateInteraction(siIdx, (s) => ({ ...s, description: e.target.value }))}
                                className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ocean-400/50 transition-all"
                                placeholder="このやり取りの説明..."
                              />
                            </div>

                            {/* セリフ一覧 */}
                            <div className="space-y-2">
                              <label className="block text-xs text-gray-400">セリフ</label>
                              {si.dialogueLines.map((line, lineIdx) => (
                                <div key={lineIdx} className="flex items-start gap-2">
                                  <span className="text-xs text-gray-300 pt-2 w-6 text-right flex-shrink-0">{lineIdx + 1}.</span>
                                  <textarea
                                    rows={2}
                                    value={line}
                                    onChange={(e) => handleLineChange(siIdx, lineIdx, e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ocean-400/50 transition-all"
                                    placeholder="セリフを入力..."
                                  />
                                  <button
                                    onClick={() => handleRemoveLine(siIdx, lineIdx)}
                                    className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors mt-0.5"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                              <button onClick={() => handleAddLine(siIdx)} className="flex items-center gap-1.5 text-xs text-ocean-500 hover:text-ocean-600 transition-colors mt-1 px-1">
                                <Plus size={14} />
                                セリフを追加
                              </button>
                            </div>

                            {/* EventFlowリンク */}
                            {flowNodes.length > 0 && (
                              <div>
                                <label className="block text-xs text-gray-400 mb-2 flex items-center gap-1">
                                  <Link2 size={12} />
                                  ストーリー分岐ノードとリンク
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {flowNodes.map((node) => {
                                    const isLinked = (si.linkedFlowNodeIds ?? []).includes(node.id);
                                    return (
                                      <button
                                        key={node.id}
                                        onClick={() => toggleFlowNodeLink(siIdx, node.id)}
                                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                                          isLinked
                                            ? 'bg-ocean-500 text-white border-ocean-500'
                                            : 'bg-white/10 text-gray-500 border-white/20 hover:border-ocean-300'
                                        }`}
                                      >
                                        {node.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* EventListリンク */}
                            {eventListItems.length > 0 && (
                              <div>
                                <label className="block text-xs text-gray-400 mb-2 flex items-center gap-1">
                                  <Link2 size={12} />
                                  イベント一覧とリンク
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {eventListItems.map((evt) => {
                                    const isLinked = (si.linkedEventIds ?? []).includes(evt.id);
                                    return (
                                      <button
                                        key={evt.id}
                                        onClick={() => toggleEventLink(siIdx, evt.id)}
                                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                                          isLinked
                                            ? 'bg-sunset-500 text-white border-sunset-500'
                                            : 'bg-white/10 text-gray-500 border-white/20 hover:border-sunset-300'
                                        }`}
                                      >
                                        {evt.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 削除ボタン */}
                            <div className="flex justify-end pt-2 border-t border-white/10">
                              <button
                                onClick={() => handleDelete(siIdx)}
                                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                                このやり取りを削除
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {interactions.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">特別なやり取りがありません。</p>
              )}

              <Button variant="ghost" icon={<Plus size={16} />} onClick={handleAdd} className="!text-xs">
                やり取りを追加
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
