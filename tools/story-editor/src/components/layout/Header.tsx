import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Save, Download, Check, Loader2 } from 'lucide-react';

/**
 * パスからページタイトルを取得するマッピング
 */
const pageTitles: Record<string, string> = {
  '/': 'ダッシュボード',
  '/event-flow': 'ストーリー分岐',
  '/dialogue': '会話テキスト',
  '/timeline': 'タイムライン',
  '/diary': '日記システム',
  '/flags': 'フラグ管理',
  '/settings': '設定',
};

/**
 * ヘッダーコンポーネント
 * 現在のページタイトル、保存状態インジケーター、Unity書き出しボタンを表示。
 */
export default function Header() {
  const location = useLocation();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [exporting, setExporting] = useState(false);

  // 現在のパスに対応するページタイトル
  const pageTitle = pageTitles[location.pathname] || 'ページ';

  // Unity書き出し処理
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export/all', { method: 'POST' });
      if (!res.ok) throw new Error('書き出しに失敗しました');
      // 成功時の処理（Toast等で通知する想定）
    } catch (err) {
      console.error('Unity書き出しエラー:', err);
    } finally {
      setExporting(false);
    }
  }, []);

  // 保存状態のアイコンを表示
  const renderSaveIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-ocean-500 text-sm">
            <Loader2 size={16} className="animate-spin" />
            <span>自動保存中...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-green-500 text-sm">
            <Check size={16} />
            <span>保存完了</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Save size={16} />
            <span>待機中</span>
          </div>
        );
    }
  };

  return (
    <header className="fixed top-0 left-56 right-0 h-16 glass-card rounded-none border-b border-white/20 flex items-center justify-between px-8 z-30">
      {/* ページタイトル */}
      <h2 className="font-serif-jp text-xl font-bold text-gray-800">
        {pageTitle}
      </h2>

      {/* 右側: 保存状態 + 書き出しボタン */}
      <div className="flex items-center gap-6">
        {/* 保存状態インジケーター */}
        {renderSaveIndicator()}

        {/* Unity書き出しボタン */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-2 bg-sunset-500 text-white rounded-xl text-sm font-medium
                     hover:bg-sunset-600 active:scale-95 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg shadow-sunset-500/25"
        >
          {exporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          <span>Unityに書き出し</span>
        </button>
      </div>
    </header>
  );
}
