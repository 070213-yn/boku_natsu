import { useState } from 'react';
import type { Node } from '@xyflow/react';
import { X, Plus, Trash2, Users, MessageSquare, HelpCircle, ChevronDown, ChevronUp, MapPin, Clapperboard } from 'lucide-react';
import type { EventCategory, TimePhase, EventCharacter, EventDialogue, SceneTransition, CharacterDirection } from '../../../types';
import { CATEGORY_CONFIG, TIME_PHASE_CONFIG, LOCATION_OPTIONS } from '../../../types';

interface NodeDetailPanelProps {
  node: Node;
  onUpdateNode: (id: string, data: Record<string, unknown>) => void;
  onClose: () => void;
}

// ノードタイプの表示名
const NODE_TYPE_LABELS: Record<string, string> = {
  dayStart: '日の始まり',
  event: 'イベント',
  condition: '条件分岐',
  choice: 'Yes/No選択',
  ending: 'エンディング',
};

/**
 * ノード詳細編集パネル
 * ノードをクリックすると右側にスライドインし、
 * ラベル・説明・カテゴリ・登場人物・セリフなどを編集できる。
 */
export default function NodeDetailPanel({ node, onUpdateNode, onClose }: NodeDetailPanelProps) {
  const data = node.data as Record<string, unknown>;
  const nodeType = node.type || 'event';

  // セクション開閉状態
  const [showCharacters, setShowCharacters] = useState(true);
  const [showDialogues, setShowDialogues] = useState(true);
  const [showChoice, setShowChoice] = useState(true);
  const [showSceneDirection, setShowSceneDirection] = useState(false);

  // データ更新ヘルパー
  const updateField = (field: string, value: unknown) => {
    onUpdateNode(node.id, { ...data, [field]: value });
  };

  // 登場人物の追加
  const addCharacter = () => {
    const characters = ((data.characters as EventCharacter[]) || []).slice();
    characters.push({
      id: `char_${Date.now()}`,
      name: '',
      role: '',
    });
    updateField('characters', characters);
  };

  // 登場人物の更新
  const updateCharacter = (index: number, field: keyof EventCharacter, value: string) => {
    const characters = ((data.characters as EventCharacter[]) || []).slice();
    characters[index] = { ...characters[index], [field]: value };
    updateField('characters', characters);
  };

  // 登場人物の削除
  const removeCharacter = (index: number) => {
    const characters = ((data.characters as EventCharacter[]) || []).filter((_, i) => i !== index);
    updateField('characters', characters);
  };

  // セリフの追加
  const addDialogue = () => {
    const dialogues = ((data.dialogues as EventDialogue[]) || []).slice();
    dialogues.push({
      id: `dlg_${Date.now()}`,
      speaker: '',
      text: '',
      emotion: '',
    });
    updateField('dialogues', dialogues);
  };

  // セリフの更新
  const updateDialogue = (index: number, field: keyof EventDialogue, value: string) => {
    const dialogues = ((data.dialogues as EventDialogue[]) || []).slice();
    dialogues[index] = { ...dialogues[index], [field]: value };
    updateField('dialogues', dialogues);
  };

  // セリフの削除
  const removeDialogue = (index: number) => {
    const dialogues = ((data.dialogues as EventDialogue[]) || []).filter((_, i) => i !== index);
    updateField('dialogues', dialogues);
  };

  // シーン遷移の追加
  const addSceneTransition = () => {
    const transitions = ((data.sceneTransitions as SceneTransition[]) || []).slice();
    transitions.push({ fromScene: '', toScene: '' });
    updateField('sceneTransitions', transitions);
  };

  // シーン遷移の更新
  const updateSceneTransition = (index: number, field: keyof SceneTransition, value: string) => {
    const transitions = ((data.sceneTransitions as SceneTransition[]) || []).slice();
    transitions[index] = { ...transitions[index], [field]: value };
    updateField('sceneTransitions', transitions);
  };

  // シーン遷移の削除
  const removeSceneTransition = (index: number) => {
    const transitions = ((data.sceneTransitions as SceneTransition[]) || []).filter((_, i) => i !== index);
    updateField('sceneTransitions', transitions);
  };

  // キャラ演出の追加
  const addCharacterDirection = () => {
    const directions = ((data.characterDirections as CharacterDirection[]) || []).slice();
    directions.push({ characterId: '', animation: '' });
    updateField('characterDirections', directions);
  };

  // キャラ演出の更新
  const updateCharacterDirection = (index: number, field: keyof CharacterDirection, value: string) => {
    const directions = ((data.characterDirections as CharacterDirection[]) || []).slice();
    directions[index] = { ...directions[index], [field]: value };
    updateField('characterDirections', directions);
  };

  // キャラ演出の削除
  const removeCharacterDirection = (index: number) => {
    const directions = ((data.characterDirections as CharacterDirection[]) || []).filter((_, i) => i !== index);
    updateField('characterDirections', directions);
  };

  // 登場人物名のリスト（セリフの話者選択用）
  const characterNames = ((data.characters as EventCharacter[]) || [])
    .map(c => c.name)
    .filter(n => n.length > 0);

  const characters = (data.characters as EventCharacter[]) || [];
  const dialogues = (data.dialogues as EventDialogue[]) || [];
  const sceneTransitions = (data.sceneTransitions as SceneTransition[]) || [];
  const characterDirections = (data.characterDirections as CharacterDirection[]) || [];

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[380px] z-50 flex">
      {/* 半透明背景クリックで閉じる */}
      <div
        className="absolute inset-0 -left-[9999px]"
        onClick={onClose}
        style={{ background: 'transparent' }}
      />

      {/* パネル本体 */}
      <div
        className="relative w-full h-full overflow-y-auto border-l shadow-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
          style={{ background: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(0, 0, 0, 0.08)' }}
        >
          <div>
            <div className="text-sm font-bold text-gray-800">ノード詳細</div>
            <div className="text-[10px] text-gray-400">
              {NODE_TYPE_LABELS[nodeType] || nodeType} / {node.id}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* === 基本情報 === */}
          <Section title="基本情報">
            {/* ラベル */}
            <Field label="ラベル">
              <input
                type="text"
                value={(data.label as string) || ''}
                onChange={(e) => updateField('label', e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-transparent"
              />
            </Field>

            {/* 説明（event, choiceノードのみ）- 行数に応じて自動リサイズ */}
            {(nodeType === 'event' || nodeType === 'choice') && (
              <Field label="説明">
                <textarea
                  ref={(el) => {
                    if (el) {
                      el.style.height = 'auto';
                      el.style.height = Math.max(el.scrollHeight, 40) + 'px';
                    }
                  }}
                  value={(data.description as string) || ''}
                  onChange={(e) => {
                    updateField('description', e.target.value);
                    // 入力に合わせて高さを自動調整
                    const el = e.target;
                    el.style.height = 'auto';
                    el.style.height = Math.max(el.scrollHeight, 40) + 'px';
                  }}
                  rows={1}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-transparent resize-none overflow-hidden"
                  style={{ minHeight: '40px' }}
                />
              </Field>
            )}

            {/* Day */}
            <Field label="Day">
              <input
                type="number"
                value={(data.day as number) ?? ''}
                onChange={(e) => updateField('day', e.target.value === '' ? undefined : Number(e.target.value))}
                min={1}
                max={30}
                className="w-20 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-transparent"
              />
            </Field>

            {/* カテゴリ（eventノードのみ） */}
            {nodeType === 'event' && (
              <Field label="カテゴリ">
                <select
                  value={(data.category as string) || ''}
                  onChange={(e) => updateField('category', e.target.value || undefined)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-transparent"
                >
                  <option value="">未設定</option>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </Field>
            )}

            {/* 時間帯（eventノードのみ） */}
            {nodeType === 'event' && (
              <Field label="時間帯">
                <select
                  value={(data.timePhase as string) || ''}
                  onChange={(e) => updateField('timePhase', e.target.value || undefined)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-transparent"
                >
                  <option value="">未設定</option>
                  {Object.entries(TIME_PHASE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </Field>
            )}

            {/* 場所（eventノードのみ） */}
            {nodeType === 'event' && (
              <Field label="場所">
                <select
                  value={(data.location as string) || ''}
                  onChange={(e) => updateField('location', e.target.value || undefined)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-transparent"
                >
                  <option value="">未設定</option>
                  {LOCATION_OPTIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </Field>
            )}
          </Section>

          {/* === Yes/No選択肢（event, choiceノード） === */}
          {(nodeType === 'event' || nodeType === 'choice') && (
            <CollapsibleSection
              title="Yes/No 選択肢"
              icon={<HelpCircle size={14} />}
              isOpen={showChoice}
              onToggle={() => setShowChoice(!showChoice)}
              count={nodeType === 'choice' ? 1 : (data.hasChoice ? 1 : 0)}
            >
              {nodeType === 'event' && (
                <div className="flex items-center gap-2 mb-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!data.hasChoice}
                      onChange={(e) => updateField('hasChoice', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-ocean-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-ocean-500" />
                  </label>
                  <span className="text-xs text-gray-600">選択肢分岐を有効にする</span>
                </div>
              )}

              {(nodeType === 'choice' || data.hasChoice) && (
                <div className="space-y-2">
                  <Field label="質問テキスト">
                    <input
                      type="text"
                      value={nodeType === 'choice'
                        ? (data.question as string) || ''
                        : (data.choiceQuestion as string) || ''
                      }
                      onChange={(e) => updateField(
                        nodeType === 'choice' ? 'question' : 'choiceQuestion',
                        e.target.value
                      )}
                      placeholder="例: 10時までに寝た？"
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-transparent"
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Field label="Yesラベル" className="flex-1">
                      <input
                        type="text"
                        value={nodeType === 'choice'
                          ? (data.yesLabel as string) || ''
                          : (data.choiceYesLabel as string) || ''
                        }
                        onChange={(e) => updateField(
                          nodeType === 'choice' ? 'yesLabel' : 'choiceYesLabel',
                          e.target.value
                        )}
                        placeholder="はい"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-green-200 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
                      />
                    </Field>
                    <Field label="Noラベル" className="flex-1">
                      <input
                        type="text"
                        value={nodeType === 'choice'
                          ? (data.noLabel as string) || ''
                          : (data.choiceNoLabel as string) || ''
                        }
                        onChange={(e) => updateField(
                          nodeType === 'choice' ? 'noLabel' : 'choiceNoLabel',
                          e.target.value
                        )}
                        placeholder="いいえ"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-red-200 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent"
                      />
                    </Field>
                  </div>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* === 登場人物（event, choiceノード） === */}
          {(nodeType === 'event' || nodeType === 'choice') && (
            <CollapsibleSection
              title="登場人物"
              icon={<Users size={14} />}
              isOpen={showCharacters}
              onToggle={() => setShowCharacters(!showCharacters)}
              count={characters.length}
            >
              {characters.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-2">
                  登場人物がまだ追加されていません
                </div>
              ) : (
                <div className="space-y-2">
                  {characters.map((char, i) => (
                    <div key={char.id} className="flex items-start gap-1.5 p-2 rounded-lg bg-gray-50">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={char.name}
                          onChange={(e) => updateCharacter(i, 'name', e.target.value)}
                          placeholder="名前"
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-ocean-300"
                        />
                        <input
                          type="text"
                          value={char.role || ''}
                          onChange={(e) => updateCharacter(i, 'role', e.target.value)}
                          placeholder="役割・説明"
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-ocean-300"
                        />
                      </div>
                      <button
                        onClick={() => removeCharacter(i)}
                        className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={addCharacter}
                className="mt-2 w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-ocean-400 hover:text-ocean-600 hover:bg-ocean-50 transition-colors"
              >
                <Plus size={12} />
                登場人物を追加
              </button>
            </CollapsibleSection>
          )}

          {/* === セリフ（event, choiceノード） === */}
          {(nodeType === 'event' || nodeType === 'choice') && (
            <CollapsibleSection
              title="セリフ"
              icon={<MessageSquare size={14} />}
              isOpen={showDialogues}
              onToggle={() => setShowDialogues(!showDialogues)}
              count={dialogues.length}
            >
              {dialogues.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-2">
                  セリフがまだ追加されていません
                </div>
              ) : (
                <div className="space-y-2">
                  {dialogues.map((dlg, i) => (
                    <div key={dlg.id} className="p-2 rounded-lg bg-gray-50 space-y-1">
                      <div className="flex items-center gap-1.5">
                        {/* 話者（登場人物から選択 or 自由入力） */}
                        <div className="flex-1">
                          <input
                            type="text"
                            list={`speakers-${node.id}`}
                            value={dlg.speaker}
                            onChange={(e) => updateDialogue(i, 'speaker', e.target.value)}
                            placeholder="話者名"
                            className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-ocean-300"
                          />
                        </div>
                        {/* 感情タグ */}
                        <input
                          type="text"
                          value={dlg.emotion || ''}
                          onChange={(e) => updateDialogue(i, 'emotion', e.target.value)}
                          placeholder="感情"
                          className="w-16 px-2 py-1 text-xs rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-ocean-300"
                        />
                        <button
                          onClick={() => removeDialogue(i)}
                          className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {/* セリフテキスト */}
                      <textarea
                        value={dlg.text}
                        onChange={(e) => updateDialogue(i, 'text', e.target.value)}
                        placeholder="セリフテキスト..."
                        rows={2}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-ocean-300 resize-y"
                      />
                      {/* アニメーション */}
                      <input
                        type="text"
                        value={dlg.animation || ''}
                        onChange={(e) => updateDialogue(i, 'animation', e.target.value)}
                        placeholder="アニメーション（例: 頷く、手を振る）"
                        className="w-full px-2 py-1 text-xs rounded border border-purple-200 bg-purple-50 focus:outline-none focus:ring-1 focus:ring-purple-300"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 話者候補のデータリスト */}
              <datalist id={`speakers-${node.id}`}>
                {characterNames.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>

              <button
                onClick={addDialogue}
                className="mt-2 w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-ocean-400 hover:text-ocean-600 hover:bg-ocean-50 transition-colors"
              >
                <Plus size={12} />
                セリフを追加
              </button>
            </CollapsibleSection>
          )}

          {/* === 場所・演出（eventノードのみ） === */}
          {nodeType === 'event' && (
            <CollapsibleSection
              title="場所・演出"
              icon={<Clapperboard size={14} />}
              isOpen={showSceneDirection}
              onToggle={() => setShowSceneDirection(!showSceneDirection)}
              count={sceneTransitions.length + characterDirections.length}
            >
              {/* シーン遷移 */}
              <div className="mb-3">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin size={10} />
                  シーン遷移
                </div>
                {sceneTransitions.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-1">
                    シーン遷移がまだありません
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sceneTransitions.map((st, i) => (
                      <div key={i} className="flex items-start gap-1.5 p-2 rounded-lg bg-gray-50">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-1">
                            <select
                              value={st.fromScene}
                              onChange={(e) => updateSceneTransition(i, 'fromScene', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-ocean-300"
                            >
                              <option value="">移動元</option>
                              {LOCATION_OPTIONS.map((loc) => (
                                <option key={loc} value={loc}>{loc}</option>
                              ))}
                            </select>
                            <span className="text-xs text-gray-400">→</span>
                            <select
                              value={st.toScene}
                              onChange={(e) => updateSceneTransition(i, 'toScene', e.target.value)}
                              className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-ocean-300"
                            >
                              <option value="">移動先</option>
                              {LOCATION_OPTIONS.map((loc) => (
                                <option key={loc} value={loc}>{loc}</option>
                              ))}
                            </select>
                          </div>
                          <input
                            type="text"
                            value={st.trigger || ''}
                            onChange={(e) => updateSceneTransition(i, 'trigger', e.target.value)}
                            placeholder="トリガー（例: ドアをクリック）"
                            className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-ocean-300"
                          />
                        </div>
                        <button
                          onClick={() => removeSceneTransition(i)}
                          className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={addSceneTransition}
                  className="mt-1.5 w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-ocean-400 hover:text-ocean-600 hover:bg-ocean-50 transition-colors"
                >
                  <Plus size={12} />
                  シーン遷移を追加
                </button>
              </div>

              {/* キャラクター演出 */}
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Users size={10} />
                  キャラクター演出
                </div>
                {characterDirections.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-1">
                    キャラクター演出がまだありません
                  </div>
                ) : (
                  <div className="space-y-2">
                    {characterDirections.map((cd, i) => (
                      <div key={i} className="flex items-start gap-1.5 p-2 rounded-lg bg-gray-50">
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            list={`direction-chars-${node.id}`}
                            value={cd.characterId}
                            onChange={(e) => updateCharacterDirection(i, 'characterId', e.target.value)}
                            placeholder="キャラクター名/ID"
                            className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-ocean-300"
                          />
                          <input
                            type="text"
                            value={cd.animation}
                            onChange={(e) => updateCharacterDirection(i, 'animation', e.target.value)}
                            placeholder="アニメーション（例: Walk, Talk, Surprised）"
                            className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-ocean-300"
                          />
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={cd.movement || ''}
                              onChange={(e) => updateCharacterDirection(i, 'movement', e.target.value)}
                              placeholder="移動（例: 左から登場）"
                              className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-ocean-300"
                            />
                            <input
                              type="text"
                              value={cd.position || ''}
                              onChange={(e) => updateCharacterDirection(i, 'position', e.target.value)}
                              placeholder="位置（例: 画面中央）"
                              className="flex-1 px-2 py-1 text-xs rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-ocean-300"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeCharacterDirection(i)}
                          className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* キャラ名候補 */}
                <datalist id={`direction-chars-${node.id}`}>
                  {characterNames.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>

                <button
                  onClick={addCharacterDirection}
                  className="mt-1.5 w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-ocean-400 hover:text-ocean-600 hover:bg-ocean-50 transition-colors"
                >
                  <Plus size={12} />
                  キャラクター演出を追加
                </button>
              </div>
            </CollapsibleSection>
          )}

          {/* === 条件分岐（conditionノードのみ） === */}
          {nodeType === 'condition' && (
            <Section title="条件設定">
              <Field label="論理演算">
                <select
                  value={(data.logic as string) || 'AND'}
                  onChange={(e) => updateField('logic', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-transparent"
                >
                  <option value="AND">AND（全条件を満たす）</option>
                  <option value="OR">OR（いずれかを満たす）</option>
                </select>
              </Field>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

// === ユーティリティコンポーネント ===

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-medium text-gray-500 mb-0.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">{icon}</span>
          <span className="text-xs font-bold text-gray-600">{title}</span>
          {count > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ocean-100 text-ocean-600 font-medium">
              {count}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {isOpen && (
        <div className="px-3 py-2">
          {children}
        </div>
      )}
    </div>
  );
}
