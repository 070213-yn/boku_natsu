import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  MessageSquare,
  Calendar,
  BookOpen,
  Flag,
  Settings,
} from 'lucide-react';
import type { ReactNode } from 'react';

/** ナビゲーション項目の型 */
interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

/** サイドバーに表示するページ一覧 */
const navItems: NavItem[] = [
  { to: '/', label: 'ダッシュボード', icon: <LayoutDashboard size={20} /> },
  { to: '/event-flow', label: 'ストーリー分岐', icon: <GitBranch size={20} /> },
  { to: '/dialogue', label: '会話テキスト', icon: <MessageSquare size={20} /> },
  { to: '/timeline', label: 'タイムライン', icon: <Calendar size={20} /> },
  { to: '/diary', label: '日記システム', icon: <BookOpen size={20} /> },
  { to: '/flags', label: 'フラグ管理', icon: <Flag size={20} /> },
  { to: '/settings', label: '設定', icon: <Settings size={20} /> },
];

/**
 * 左サイドバー
 * ガラスモーフィズム風デザイン。NavLinkで現在ページをハイライト。
 */
export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 glass-card rounded-none border-r border-white/20 flex flex-col z-40">
      {/* ロゴ: 「なつのしま」縦書き風 */}
      <div className="flex items-center justify-center py-8 border-b border-white/10">
        <h1
          className="font-serif-jp text-2xl font-bold text-sunset-600 tracking-widest"
          style={{ writingMode: 'vertical-rl' }}
        >
          なつのしま
        </h1>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sunset-500 text-white shadow-lg shadow-sunset-500/25'
                  : 'text-gray-600 hover:bg-white/30 hover:text-gray-900'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* フッター */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-gray-400 text-center">
          Story Editor v0.1
        </p>
      </div>
    </aside>
  );
}
