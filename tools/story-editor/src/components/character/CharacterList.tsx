import { motion } from 'framer-motion';
import { Plus, Trash2, User, Heart, Users } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import type { CharacterProfile } from '../../types';

interface Props {
  characters: CharacterProfile[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
  confirmDeleteIndex: number | null;
}

export default function CharacterList({ characters, selectedIndex, onSelect, onAdd, onDelete, confirmDeleteIndex }: Props) {
  return (
    <div className="w-1/4 min-w-[240px] flex flex-col gap-4">
      <Card className="!p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif-jp text-lg font-bold text-sunset-600 flex items-center gap-2">
            <Users size={20} />
            キャラクター
          </h2>
          <Button variant="primary" icon={<Plus size={16} />} onClick={onAdd} className="!px-3 !py-1.5 !text-xs">
            追加
          </Button>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
          {characters.map((char, index) => {
            const isSelected = index === selectedIndex;
            const isHeroine = char.type === 'heroine';
            // サムネイル: 最初の画像があれば使う
            const thumbnail = char.images.length > 0 ? char.images[0] : null;

            return (
              <motion.div
                key={char.id + index}
                layout
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                  ${isSelected
                    ? 'bg-sunset-500/20 border border-sunset-400/40 shadow-sm'
                    : 'bg-white/5 hover:bg-white/15 border border-transparent'
                  }
                `}
                onClick={() => onSelect(index)}
              >
                {/* サムネイルまたはアイコン */}
                {thumbnail ? (
                  <img src={thumbnail} alt={char.displayName} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <span className={`flex-shrink-0 ${isHeroine ? 'text-pink-400' : 'text-ocean-400'}`}>
                    {isHeroine ? <Heart size={18} /> : <User size={18} />}
                  </span>
                )}

                {/* 名前とID */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-sunset-600' : 'text-gray-700'}`}>
                    {char.displayName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{char.id}</p>
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
                    onDelete(index);
                  }}
                  className={`flex-shrink-0 p-1 rounded-lg transition-colors
                    ${confirmDeleteIndex === index
                      ? 'bg-red-500 text-white'
                      : 'text-gray-300 hover:text-red-400 hover:bg-red-50'
                    }
                  `}
                  title={confirmDeleteIndex === index ? 'もう一度クリックで削除' : '削除'}
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            );
          })}

          {characters.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">
              キャラクターがいません。「追加」ボタンで作成してください。
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
