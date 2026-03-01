import { useState, useEffect } from 'react';
import {
  X, Plus, Star, Trash2, Copy,
  Sun, Coffee, Fish, Bug, Waves, Cat,
  ShoppingBag, Candy, BookOpen, Moon,
} from 'lucide-react';
import type { EventCategory, TimePhase } from '../../../types';

// プリセットの型定義
export interface NodePreset {
  id: string;
  name: string;
  icon: string;       // アイコン識別子
  nodeType: string;   // 'dayStart' | 'event' | 'condition' | 'choice' | 'ending'
  nodeData: Record<string, unknown>;
  isBuiltIn: boolean; // 組み込みプリセットかどうか
}

// ローカルストレージのキー
const STORAGE_KEY = 'natsu-no-shima-node-presets';

// アイコンマッピング
const ICON_MAP: Record<string, React.ReactNode> = {
  sun: <Sun size={14} />,
  coffee: <Coffee size={14} />,
  fish: <Fish size={14} />,
  bug: <Bug size={14} />,
  waves: <Waves size={14} />,
  cat: <Cat size={14} />,
  shop: <ShoppingBag size={14} />,
  candy: <Candy size={14} />,
  book: <BookOpen size={14} />,
  moon: <Moon size={14} />,
  star: <Star size={14} />,
};

// 組み込みプリセット（よく使うイベントパターン）
const BUILT_IN_PRESETS: NodePreset[] = [
  {
    id: 'preset_radio',
    name: 'ラジオ体操',
    icon: 'sun',
    nodeType: 'event',
    nodeData: {
      label: 'ラジオ体操',
      description: '朝のラジオ体操。前日22時までに就寝で参加可能。スタンプがもらえる。',
      category: 'daily' as EventCategory,
      timePhase: 'Morning' as TimePhase,
      characters: [],
      dialogues: [],
    },
    isBuiltIn: true,
  },
  {
    id: 'preset_breakfast',
    name: '朝ごはん',
    icon: 'coffee',
    nodeType: 'event',
    nodeData: {
      label: '朝ごはん',
      description: 'おばさんが作ってくれた朝ごはん。',
      category: 'daily' as EventCategory,
      timePhase: 'Morning' as TimePhase,
      characters: [],
      dialogues: [],
    },
    isBuiltIn: true,
  },
  {
    id: 'preset_karumeyaki',
    name: 'カルメ焼きお手伝い',
    icon: 'candy',
    nodeType: 'event',
    nodeData: {
      label: 'カルメ焼きお手伝い',
      description: '駄菓子屋でカルメ焼き作りのお手伝い。3個作るとカルメ焼きがもらえる。お駄賃10円。',
      category: 'npc' as EventCategory,
      timePhase: 'Noon' as TimePhase,
      characters: [],
      dialogues: [],
    },
    isBuiltIn: true,
  },
  {
    id: 'preset_bug_catching',
    name: '虫取り',
    icon: 'bug',
    nodeType: 'event',
    nodeData: {
      label: '虫取り',
      description: '島の森で虫取り。樹液ポイントを回って虫を集める。',
      category: 'play' as EventCategory,
      timePhase: 'Noon' as TimePhase,
      characters: [],
      dialogues: [],
    },
    isBuiltIn: true,
  },
  {
    id: 'preset_fishing',
    name: '釣り',
    icon: 'fish',
    nodeType: 'event',
    nodeData: {
      label: '釣り',
      description: '堤防や海で釣り。釣り老人との会話も。',
      category: 'play' as EventCategory,
      timePhase: 'Noon' as TimePhase,
      characters: [],
      dialogues: [],
    },
    isBuiltIn: true,
  },
  {
    id: 'preset_diving',
    name: '素潜り',
    icon: 'waves',
    nodeType: 'event',
    nodeData: {
      label: '素潜り',
      description: '海での素潜り。潜水時間が伸びると深場へ行ける。',
      category: 'play' as EventCategory,
      timePhase: 'Noon' as TimePhase,
      characters: [],
      dialogues: [],
    },
    isBuiltIn: true,
  },
  {
    id: 'preset_heroine_evening',
    name: '夕方の堤防（ヒロイン）',
    icon: 'star',
    nodeType: 'event',
    nodeData: {
      label: '夕方の堤防',
      description: '堤防でヒナと夕焼けを眺める。',
      category: 'heroine' as EventCategory,
      timePhase: 'Evening' as TimePhase,
      characters: [{ id: 'char_hina', name: 'ヒナ', role: '近所の女の子' }],
      dialogues: [],
    },
    isBuiltIn: true,
  },
  {
    id: 'preset_dinner',
    name: '晩ごはん',
    icon: 'coffee',
    nodeType: 'event',
    nodeData: {
      label: '晩ごはん',
      description: 'おばさんの晩ごはん。',
      category: 'daily' as EventCategory,
      timePhase: 'Evening' as TimePhase,
      characters: [],
      dialogues: [],
    },
    isBuiltIn: true,
  },
  {
    id: 'preset_cat_feeding',
    name: '猫に餌やり',
    icon: 'cat',
    nodeType: 'event',
    nodeData: {
      label: '猫に餌やり',
      description: '野良猫に餌やり。なつき度アップ。',
      category: 'npc' as EventCategory,
      timePhase: 'Night' as TimePhase,
      characters: [],
      dialogues: [],
    },
    isBuiltIn: true,
  },
  {
    id: 'preset_diary_sleep',
    name: '絵日記+就寝',
    icon: 'book',
    nodeType: 'event',
    nodeData: {
      label: '絵日記書いて就寝',
      description: '1日の終わり。絵日記を書いて就寝。',
      category: 'daily' as EventCategory,
      timePhase: 'Night' as TimePhase,
      characters: [],
      dialogues: [],
    },
    isBuiltIn: true,
  },
];

interface PresetPanelProps {
  onAddPreset: (preset: NodePreset) => void;
  onClose: () => void;
  // 現在選択中のノードからプリセット登録用
  currentNodeData?: { type: string; data: Record<string, unknown> } | null;
}

/**
 * ノードプリセットパネル
 *
 * 組み込みプリセットとユーザー定義プリセットを一覧表示。
 * クリックするとフローチャートにノードが追加される。
 * 現在のノードからプリセットを登録することも可能。
 */
export default function PresetPanel({ onAddPreset, onClose, currentNodeData }: PresetPanelProps) {
  const [customPresets, setCustomPresets] = useState<NodePreset[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('star');

  // ローカルストレージから読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCustomPresets(JSON.parse(saved));
      }
    } catch {
      // パースエラー時は空配列
    }
  }, []);

  // ローカルストレージに保存
  const saveCustomPresets = (presets: NodePreset[]) => {
    setCustomPresets(presets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  };

  // カスタムプリセットの登録
  const handleRegisterPreset = () => {
    if (!currentNodeData || !newName.trim()) return;

    const newPreset: NodePreset = {
      id: `custom_${Date.now()}`,
      name: newName.trim(),
      icon: newIcon,
      nodeType: currentNodeData.type,
      nodeData: { ...currentNodeData.data },
      isBuiltIn: false,
    };

    saveCustomPresets([...customPresets, newPreset]);
    setIsCreating(false);
    setNewName('');
    setNewIcon('star');
  };

  // カスタムプリセットの削除
  const handleDeletePreset = (id: string) => {
    saveCustomPresets(customPresets.filter((p) => p.id !== id));
  };

  return (
    <div className="absolute left-0 top-0 bottom-0 w-[300px] z-50 flex">
      {/* パネル本体 */}
      <div
        className="relative w-full h-full overflow-y-auto border-r shadow-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* ヘッダー */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
          style={{ background: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(0, 0, 0, 0.08)' }}
        >
          <div className="flex items-center gap-2">
            <Copy size={16} className="text-ocean-500" />
            <span className="text-sm font-bold text-gray-800">ノードプリセット</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-3 space-y-4">
          {/* 組み込みプリセット */}
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              よく使うイベント
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {BUILT_IN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onAddPreset(preset)}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium bg-gray-50 hover:bg-ocean-50 hover:text-ocean-700 border border-gray-100 hover:border-ocean-200 transition-all text-left group"
                >
                  <span className="text-gray-400 group-hover:text-ocean-500 flex-shrink-0">
                    {ICON_MAP[preset.icon] || <Star size={14} />}
                  </span>
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* カスタムプリセット */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                カスタムプリセット
              </div>
              {currentNodeData && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1 text-[10px] font-medium text-ocean-500 hover:text-ocean-700 transition-colors"
                >
                  <Plus size={10} />
                  選択中のノードから登録
                </button>
              )}
            </div>

            {/* プリセット登録フォーム */}
            {isCreating && (
              <div className="p-2.5 rounded-lg bg-ocean-50 border border-ocean-200 mb-2 space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="プリセット名を入力..."
                  autoFocus
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-ocean-200 bg-white focus:outline-none focus:ring-2 focus:ring-ocean-300"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRegisterPreset();
                    if (e.key === 'Escape') setIsCreating(false);
                  }}
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">アイコン:</span>
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(ICON_MAP).map(([key, icon]) => (
                      <button
                        key={key}
                        onClick={() => setNewIcon(key)}
                        className={`p-1 rounded transition-colors ${
                          newIcon === key
                            ? 'bg-ocean-200 text-ocean-700'
                            : 'bg-white text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleRegisterPreset}
                    disabled={!newName.trim()}
                    className="flex-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-ocean-500 text-white hover:bg-ocean-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    登録
                  </button>
                  <button
                    onClick={() => { setIsCreating(false); setNewName(''); }}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {customPresets.length === 0 && !isCreating ? (
              <div className="text-xs text-gray-400 text-center py-4">
                カスタムプリセットはまだありません。
                {currentNodeData ? (
                  <span className="block mt-1 text-gray-300">
                    ノードを選択して「選択中のノードから登録」で追加できます。
                  </span>
                ) : (
                  <span className="block mt-1 text-gray-300">
                    ノードを選択するとプリセット登録ができます。
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-1.5 group"
                  >
                    <button
                      onClick={() => onAddPreset(preset)}
                      className="flex-1 flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium bg-gray-50 hover:bg-purple-50 hover:text-purple-700 border border-gray-100 hover:border-purple-200 transition-all text-left"
                    >
                      <span className="text-gray-400 flex-shrink-0">
                        {ICON_MAP[preset.icon] || <Star size={14} />}
                      </span>
                      <span className="truncate">{preset.name}</span>
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
