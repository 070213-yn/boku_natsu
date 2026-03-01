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
  useCharacterStore,
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
  '/characters': 'キャラクター',
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
  const characterSaving = useCharacterStore((s) => s.isSaving);

  // 最終保存日時を集約（最も新しいもの）
  const eventFlowLastSaved = useEventFlowStore((s) => s.lastSaved);
  const eventListLastSaved = useEventListStore((s) => s.lastSaved);
  const dialogueLastSaved = useDialogueStore((s) => s.lastSaved);
  const diaryLastSaved = useDiaryStore((s) => s.lastSaved);
  const explorationLastSaved = useExplorationStore((s) => s.lastSaved);
  const gameConfigLastSaved = useGameConfigStore((s) => s.lastSaved);
  const characterLastSaved = useCharacterStore((s) => s.lastSaved);

  // 全ストアのisDirty状態を取得
  const eventFlowDirty = useEventFlowStore((s) => s.isDirty);
  const eventListDirty = useEventListStore((s) => s.isDirty);
  const dialogueDirty = useDialogueStore((s) => s.isDirty);
  const diaryDirty = useDiaryStore((s) => s.isDirty);
  const explorationDirty = useExplorationStore((s) => s.isDirty);
  const gameConfigDirty = useGameConfigStore((s) => s.isDirty);
  const characterDirty = useCharacterStore((s) => s.isDirty);

  const isAnyDirty = eventFlowDirty || eventListDirty || dialogueDirty
    || diaryDirty || explorationDirty || gameConfigDirty || characterDirty;

  // 全ストアのsave関数を取得
  const eventFlowSave = useEventFlowStore((s) => s.save);
  const eventListSave = useEventListStore((s) => s.save);
  const dialogueSave = useDialogueStore((s) => s.save);
  const diarySave = useDiaryStore((s) => s.save);
  const explorationSave = useExplorationStore((s) => s.save);
  const gameConfigSave = useGameConfigStore((s) => s.save);
  const characterSave = useCharacterStore((s) => s.save);

  // いずれかのストアが保存中か判定
  const isAnySaving = eventFlowSaving || eventListSaving || dialogueSaving
    || diarySaving || explorationSaving || gameConfigSaving || characterSaving;

  // 最終保存日時（最も新しいもの）
  const lastSaved = useMemo(() => {
    const dates = [
      eventFlowLastSaved, eventListLastSaved, dialogueLastSaved,
      diaryLastSaved, explorationLastSaved, gameConfigLastSaved,
      characterLastSaved,
    ].filter(Boolean) as string[];
    if (dates.length === 0) return null;
    return dates.sort().reverse()[0];
  }, [eventFlowLastSaved, eventListLastSaved, dialogueLastSaved,
      diaryLastSaved, explorationLastSaved, gameConfigLastSaved,
      characterLastSaved]);

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

  // 変更があるストアだけを一括保存する
  const handleSaveAll = useCallback(async () => {
    const saves: Promise<void>[] = [];
    if (eventFlowDirty) saves.push(eventFlowSave());
    if (eventListDirty) saves.push(eventListSave());
    if (dialogueDirty) saves.push(dialogueSave());
    if (diaryDirty) saves.push(diarySave());
    if (explorationDirty) saves.push(explorationSave());
    if (gameConfigDirty) saves.push(gameConfigSave());
    if (characterDirty) saves.push(characterSave());
    if (saves.length > 0) {
      await Promise.all(saves);
      addToast('保存しました', 'success');
    }
  }, [eventFlowDirty, eventListDirty, dialogueDirty, diaryDirty, explorationDirty, gameConfigDirty, characterDirty,
      eventFlowSave, eventListSave, dialogueSave, diarySave, explorationSave, gameConfigSave, characterSave, addToast]);

  // Ctrl+S キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveAll]);

  // 保存ボタンを表示
  const renderSaveButton = () => {
    if (isAnySaving) {
      return (
        <button disabled className="flex items-center gap-1.5 px-4 py-2 bg-ocean-400 text-white rounded-xl text-sm font-medium opacity-70">
          <Loader2 size={16} className="animate-spin" />
          <span>保存中...</span>
        </button>
      );
    }
    return (
      <button
        onClick={handleSaveAll}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isAnyDirty
            ? 'bg-ocean-500 text-white hover:bg-ocean-600 shadow-lg shadow-ocean-500/25'
            : 'bg-gray-200 text-gray-500'
        }`}
      >
        {isAnyDirty ? (
          <>
            <Save size={16} />
            <span>保存</span>
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          </>
        ) : showSaved ? (
          <>
            <Check size={16} />
            <span>保存済み</span>
          </>
        ) : (
          <>
            <Save size={16} />
            <span>保存済み</span>
          </>
        )}
      </button>
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
        {renderSaveButton()}

        {/* Unity書き出しボタン */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-2 bg-ocean-500 text-white rounded-xl text-sm font-medium
                     hover:bg-ocean-600 active:scale-95 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg shadow-ocean-500/25"
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
