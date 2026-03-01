import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Save, Download, Check, Loader2 } from 'lucide-react';
import {
  useEventFlowStore,
  useEventListStore,
  useDialogueStore,
  useDiaryStore,
  useExplorationStore,
  useGameConfigStore,
} from '../../hooks/useStores';
import { useToastStore } from '../common/Toast';
import { exportAll } from '../../utils/api';

/**
 * パスからページタイトルを取得するマッピング
 */
const pageTitles: Record<string, string> = {
  '/': 'ダッシュボード',
  '/event-flow': 'ストーリー分岐',
  '/events': 'イベント一覧',
  '/dialogue': '会話テキスト',
  '/timeline': 'タイムライン',
  '/diary': '日記システム',
  '/flags': 'フラグ管理',
  '/settings': '設定',
};

/**
 * ヘッダーコンポーネント
 * 現在のページタイトル、保存状態インジケーター、Unity書き出しボタンを表示。
 * 全ストアのisSaving/lastSavedを集約して保存状態を表示する。
 */
export default function Header() {
  const location = useLocation();
  const [exporting, setExporting] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  // 全ストアの保存状態を取得
  const eventFlowSaving = useEventFlowStore((s) => s.isSaving);
  const eventListSaving = useEventListStore((s) => s.isSaving);
  const dialogueSaving = useDialogueStore((s) => s.isSaving);
  const diarySaving = useDiaryStore((s) => s.isSaving);
  const explorationSaving = useExplorationStore((s) => s.isSaving);
  const gameConfigSaving = useGameConfigStore((s) => s.isSaving);

  // 最終保存日時を集約（最も新しいもの）
  const eventFlowLastSaved = useEventFlowStore((s) => s.lastSaved);
  const eventListLastSaved = useEventListStore((s) => s.lastSaved);
  const dialogueLastSaved = useDialogueStore((s) => s.lastSaved);
  const diaryLastSaved = useDiaryStore((s) => s.lastSaved);
  const explorationLastSaved = useExplorationStore((s) => s.lastSaved);
  const gameConfigLastSaved = useGameConfigStore((s) => s.lastSaved);

  // いずれかのストアが保存中か判定
  const isAnySaving = eventFlowSaving || eventListSaving || dialogueSaving
    || diarySaving || explorationSaving || gameConfigSaving;

  // 最終保存日時（最も新しいもの）
  const lastSaved = useMemo(() => {
    const dates = [
      eventFlowLastSaved, eventListLastSaved, dialogueLastSaved,
      diaryLastSaved, explorationLastSaved, gameConfigLastSaved,
    ].filter(Boolean) as string[];
    if (dates.length === 0) return null;
    return dates.sort().reverse()[0];
  }, [eventFlowLastSaved, eventListLastSaved, dialogueLastSaved,
      diaryLastSaved, explorationLastSaved, gameConfigLastSaved]);

  // 「保存完了」表示を3秒後に消すための状態
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (lastSaved) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  // 現在のパスに対応するページタイトル
  const pageTitle = pageTitles[location.pathname] || 'ページ';

  // Unity書き出し処理
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const exported = await exportAll();
      addToast(`${exported.length}ファイルをUnityに書き出しました`, 'success');
    } catch (err) {
      console.error('Unity書き出しエラー:', err);
      addToast('Unity書き出しに失敗しました', 'error');
    } finally {
      setExporting(false);
    }
  }, [addToast]);

  // 保存状態のアイコンを表示
  const renderSaveIndicator = () => {
    if (isAnySaving) {
      return (
        <div className="flex items-center gap-1.5 text-ocean-500 text-sm">
          <Loader2 size={16} className="animate-spin" />
          <span>自動保存中...</span>
        </div>
      );
    }
    if (showSaved) {
      return (
        <div className="flex items-center gap-1.5 text-green-500 text-sm">
          <Check size={16} />
          <span>保存完了</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-gray-400 text-sm">
        <Save size={16} />
        <span>待機中</span>
      </div>
    );
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
