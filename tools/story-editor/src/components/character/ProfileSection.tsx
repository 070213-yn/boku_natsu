import { User, Heart } from 'lucide-react';
import Card from '../common/Card';
import type { CharacterProfile } from '../../types';

interface Props {
  character: CharacterProfile;
  onUpdate: (updater: (char: CharacterProfile) => CharacterProfile) => void;
}

export default function ProfileSection({ character, onUpdate }: Props) {
  return (
    <Card>
      <h3 className="font-serif-jp text-lg font-bold text-sunset-600 mb-4 flex items-center gap-2">
        {character.type === 'heroine' ? <Heart size={20} className="text-pink-400" /> : <User size={20} className="text-ocean-400" />}
        プロフィール
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {/* キャラクターID */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">キャラクターID（英数字）</label>
          <input
            type="text"
            value={character.id}
            onChange={(e) => onUpdate((c) => ({ ...c, id: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-400/50 focus:border-sunset-400 transition-all"
            placeholder="例: hina"
          />
        </div>

        {/* 内部管理名 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">内部管理名</label>
          <input
            type="text"
            value={character.name}
            onChange={(e) => onUpdate((c) => ({ ...c, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-400/50 focus:border-sunset-400 transition-all"
            placeholder="例: ヒナ"
          />
        </div>

        {/* 表示名 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            表示名（他ページに反映）
          </label>
          <input
            type="text"
            value={character.displayName}
            onChange={(e) => onUpdate((c) => ({ ...c, displayName: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-400/50 focus:border-sunset-400 transition-all"
            placeholder="例: ヒナ"
          />
          <p className="text-[10px] text-gray-400 mt-1">変更すると会話テキスト・イベント一覧の名前も更新されます</p>
        </div>

        {/* タイプ */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">タイプ</label>
          <select
            value={character.type}
            onChange={(e) => onUpdate((c) => ({ ...c, type: e.target.value as 'heroine' | 'npc' }))}
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-400/50 focus:border-sunset-400 transition-all"
          >
            <option value="npc">NPC</option>
            <option value="heroine">ヒロイン</option>
          </select>
        </div>

        {/* 年齢 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">年齢</label>
          <input
            type="number"
            value={character.age ?? ''}
            onChange={(e) => {
              const val = e.target.value.trim();
              const num = val === '' ? undefined : parseInt(val, 10);
              onUpdate((c) => ({ ...c, age: num !== undefined && isNaN(num) ? c.age : num }));
            }}
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-400/50 focus:border-sunset-400 transition-all"
            placeholder="例: 9"
          />
        </div>

        {/* 性別 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">性別</label>
          <select
            value={character.gender ?? ''}
            onChange={(e) => onUpdate((c) => ({ ...c, gender: e.target.value as CharacterProfile['gender'] }))}
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-sunset-400/50 focus:border-sunset-400 transition-all"
          >
            <option value="">未設定</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
        </div>

        {/* プロフィール（全幅） */}
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">プロフィール</label>
          <textarea
            rows={4}
            value={character.profile}
            onChange={(e) => onUpdate((c) => ({ ...c, profile: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sunset-400/50 focus:border-sunset-400 transition-all"
            placeholder="キャラクターの詳細プロフィールを入力..."
          />
        </div>
      </div>
    </Card>
  );
}
