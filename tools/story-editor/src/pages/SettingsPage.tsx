import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Download,
  Save,
  Clock,
  Volume2,
  Heart,
  Gamepad2,
  Sun,
  Moon,
  RefreshCw,
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useGameConfigStore } from '../hooks/useStores';
import { useAutoSave } from '../hooks/useAutoSave';
import { useToastStore } from '../components/common/Toast';
import { exportAll } from '../utils/api';
import type { GameConfigData } from '../types';

/** 時間帯ごとの色ドット（視認性のため色分け） */
const phaseColors: Record<string, string> = {
  Morning: 'bg-yellow-400',
  Noon: 'bg-orange-400',
  Evening: 'bg-sunset-500',
  Night: 'bg-indigo-500',
};

/** 時間帯キーの表示順 */
const phaseOrder = ['Morning', 'Noon', 'Evening', 'Night'] as const;

/** 共通の入力フィールドスタイル */
const inputClass =
  'bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-sunset-400 transition-colors';

/** 共通のラベルスタイル */
const labelClass = 'text-sm text-gray-500 mb-1 block';

/**
 * 設定・エクスポートページ
 * ゲーム全体の設定値を編集し、Unityへデータを書き出す。
 */
export default function SettingsPage() {
  const { data, isLoading, load, save, update } = useGameConfigStore();
  const addToast = useToastStore((s) => s.addToast);

  // エクスポート関連のローカル状態
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportedAt, setLastExportedAt] = useState<string | null>(null);

  // 初回マウント時にデータを読み込む
  useEffect(() => {
    load();
  }, [load]);

  // 自動保存（データ変更の2秒後に保存）
  useAutoSave(data, save);

  /** Unityへ全データを書き出す */
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exported = await exportAll();
      addToast(`${exported.length}個のファイルを書き出しました`, 'success');
      setLastExportedAt(new Date().toLocaleString('ja-JP'));
    } catch (err) {
      addToast('書き出しに失敗しました', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  /** データ更新のヘルパー関数 */
  const updateGeneral = (patch: Partial<GameConfigData['general']>) => {
    update((prev) => ({
      ...prev,
      general: { ...prev.general, ...patch },
    }));
  };

  const updateTimeSystem = (patch: Partial<GameConfigData['timeSystem']>) => {
    update((prev) => ({
      ...prev,
      timeSystem: { ...prev.timeSystem, ...patch },
    }));
  };

  const updateHeroine = (patch: Partial<GameConfigData['heroine']>) => {
    update((prev) => ({
      ...prev,
      heroine: { ...prev.heroine, ...patch },
    }));
  };

  const updateAudio = (patch: Partial<GameConfigData['audio']>) => {
    update((prev) => ({
      ...prev,
      audio: { ...prev.audio, ...patch },
    }));
  };

  const updateTimePhase = (
    key: string,
    patch: Partial<{ startHour: number; endHour: number; label: string }>
  ) => {
    update((prev) => ({
      ...prev,
      timePhases: {
        ...prev.timePhases,
        [key]: { ...prev.timePhases[key], ...patch },
      },
    }));
  };

  const updateIntimacy = (
    level: string,
    patch: Partial<{ min: number; max: number }>
  ) => {
    update((prev) => ({
      ...prev,
      heroine: {
        ...prev.heroine,
        intimacyThresholds: {
          ...prev.heroine.intimacyThresholds,
          [level]: { ...prev.heroine.intimacyThresholds[level], ...patch },
        },
      },
    }));
  };

  // ローディング中の表示
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-sunset-500" size={32} />
        <span className="ml-3 text-gray-500">設定を読み込み中...</span>
      </div>
    );
  }

  /** 日付の計算（開始日 + 日数 → 「X月Y日」表記） */
  const calcDate = (dayOffset: number) => {
    const month = data.general.startMonth;
    const day = data.general.startDay + dayOffset - 1;
    return `${month}月${day}日`;
  };

  /** ゲーム期間の表示テキスト */
  const periodText = `${data.general.startMonth}月${data.general.startDay}日 〜 ${data.general.startMonth}月${data.general.startDay + data.general.maxDay - 1}日（${data.general.maxDay}日間）`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* ページヘッダー */}
      <div className="flex items-center gap-3 mb-2">
        <Settings className="text-sunset-500" size={28} />
        <h1 className="font-serif-jp text-2xl font-bold text-sunset-700">
          ゲーム設定
        </h1>
      </div>

      {/* ============================================================
         1. 基本設定カード
         ============================================================ */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Gamepad2 className="text-sunset-500" size={20} />
          <h3 className="font-serif-jp text-lg font-bold text-sunset-700">
            基本設定
          </h3>
        </div>

        <div className="space-y-4">
          {/* ゲーム名 */}
          <div>
            <label className={labelClass}>ゲーム名</label>
            <input
              type="text"
              className={inputClass}
              value={data.general.gameName}
              onChange={(e) => updateGeneral({ gameName: e.target.value })}
            />
          </div>

          {/* 開始月 / 開始日 */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className={labelClass}>開始月</label>
              <input
                type="number"
                className={inputClass}
                min={1}
                max={12}
                value={data.general.startMonth}
                onChange={(e) =>
                  updateGeneral({ startMonth: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex-1">
              <label className={labelClass}>開始日</label>
              <input
                type="number"
                className={inputClass}
                min={1}
                max={31}
                value={data.general.startDay}
                onChange={(e) =>
                  updateGeneral({ startDay: Number(e.target.value) })
                }
              />
            </div>
          </div>

          {/* 最大日数 */}
          <div>
            <label className={labelClass}>最大日数</label>
            <input
              type="number"
              className={inputClass}
              min={1}
              max={365}
              value={data.general.maxDay}
              onChange={(e) =>
                updateGeneral({ maxDay: Number(e.target.value) })
              }
            />
          </div>

          {/* ゲーム期間の表示 */}
          <div className="bg-sunset-50 rounded-lg px-4 py-3 text-sm text-sunset-700">
            {periodText}
          </div>
        </div>
      </Card>

      {/* ============================================================
         2. 時間帯設定カード
         ============================================================ */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="text-ocean-500" size={20} />
          <h3 className="font-serif-jp text-lg font-bold text-sunset-700">
            時間帯設定
          </h3>
        </div>

        {/* 4つの時間帯（Morning / Noon / Evening / Night） */}
        <div className="space-y-3 mb-6">
          {phaseOrder.map((key) => {
            const phase = data.timePhases[key];
            if (!phase) return null;
            return (
              <div
                key={key}
                className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3"
              >
                {/* 色ドット */}
                <span
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${phaseColors[key]}`}
                />
                {/* ラベル */}
                <span className="text-sm font-medium w-16 flex-shrink-0">
                  {phase.label}
                </span>
                {/* 開始時刻 */}
                <div className="flex-1">
                  <label className={labelClass}>開始</label>
                  <input
                    type="number"
                    className={inputClass}
                    min={0}
                    max={24}
                    value={phase.startHour}
                    onChange={(e) =>
                      updateTimePhase(key, {
                        startHour: Number(e.target.value),
                      })
                    }
                  />
                </div>
                {/* 終了時刻 */}
                <div className="flex-1">
                  <label className={labelClass}>終了</label>
                  <input
                    type="number"
                    className={inputClass}
                    min={0}
                    max={24}
                    value={phase.endHour}
                    onChange={(e) =>
                      updateTimePhase(key, {
                        endHour: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 時間システム設定 */}
        <div className="border-t border-white/10 pt-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-600">時間システム</h4>

          {/* 時間倍率 */}
          <div>
            <label className={labelClass}>時間倍率</label>
            <input
              type="number"
              className={inputClass}
              min={1}
              max={120}
              value={data.timeSystem.timeScale}
              onChange={(e) =>
                updateTimeSystem({ timeScale: Number(e.target.value) })
              }
            />
            <p className="text-xs text-gray-400 mt-1">
              現実{data.timeSystem.timeScale}秒 = ゲーム1時間
            </p>
          </div>

          {/* デフォルト開始時刻 */}
          <div>
            <label className={labelClass}>デフォルト開始時刻</label>
            <input
              type="number"
              className={inputClass}
              min={0}
              max={24}
              step={0.5}
              value={data.timeSystem.defaultStartHour}
              onChange={(e) =>
                updateTimeSystem({
                  defaultStartHour: Number(e.target.value),
                })
              }
            />
          </div>
        </div>
      </Card>

      {/* ============================================================
         3. ヒロイン設定カード
         ============================================================ */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Heart className="text-pink-500" size={20} />
          <h3 className="font-serif-jp text-lg font-bold text-sunset-700">
            ヒロイン設定
          </h3>
        </div>

        <div className="space-y-4">
          {/* 不在期間 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">
              不在期間
            </h4>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={labelClass}>開始日（日目）</label>
                <input
                  type="number"
                  className={inputClass}
                  min={1}
                  max={data.general.maxDay}
                  value={data.heroine.absenceStartDay}
                  onChange={(e) =>
                    updateHeroine({
                      absenceStartDay: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex-1">
                <label className={labelClass}>終了日（日目）</label>
                <input
                  type="number"
                  className={inputClass}
                  min={1}
                  max={data.general.maxDay}
                  value={data.heroine.absenceEndDay}
                  onChange={(e) =>
                    updateHeroine({
                      absenceEndDay: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            {/* 不在期間の表示 */}
            <div className="bg-pink-50 rounded-lg px-4 py-2 mt-2 text-sm text-pink-700">
              {calcDate(data.heroine.absenceStartDay)}〜
              {calcDate(data.heroine.absenceEndDay)}
            </div>
          </div>

          {/* 出現 / 退場 時間帯 */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className={labelClass}>出現時間帯</label>
              <select
                className={inputClass}
                value={data.heroine.appearTimePhase}
                onChange={(e) =>
                  updateHeroine({ appearTimePhase: e.target.value })
                }
              >
                {phaseOrder.map((key) => (
                  <option key={key} value={key}>
                    {data.timePhases[key]?.label ?? key}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className={labelClass}>退場時間帯</label>
              <select
                className={inputClass}
                value={data.heroine.leaveTimePhase}
                onChange={(e) =>
                  updateHeroine({ leaveTimePhase: e.target.value })
                }
              >
                {phaseOrder.map((key) => (
                  <option key={key} value={key}>
                    {data.timePhases[key]?.label ?? key}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 親密度しきい値 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">
              親密度しきい値
            </h4>
            <div className="space-y-3">
              {Object.entries(data.heroine.intimacyThresholds).map(
                ([level, threshold]) => {
                  /** 親密度レベルの日本語ラベル */
                  const levelLabels: Record<string, string> = {
                    distant: 'よそよそしい',
                    friendly: '友好的',
                    close: '親密',
                  };
                  return (
                    <div
                      key={level}
                      className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3"
                    >
                      <span className="text-sm font-medium w-28 flex-shrink-0">
                        {levelLabels[level] ?? level}
                      </span>
                      <div className="flex-1">
                        <label className={labelClass}>最小値</label>
                        <input
                          type="number"
                          className={inputClass}
                          value={threshold.min}
                          onChange={(e) =>
                            updateIntimacy(level, {
                              min: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <label className={labelClass}>最大値</label>
                        <input
                          type="number"
                          className={inputClass}
                          value={threshold.max}
                          onChange={(e) =>
                            updateIntimacy(level, {
                              max: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      {/* max が -1 の場合は「上限なし」を表示 */}
                      {threshold.max === -1 && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          上限なし
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================================
         4. オーディオ設定カード
         ============================================================ */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="text-ocean-500" size={20} />
          <h3 className="font-serif-jp text-lg font-bold text-sunset-700">
            オーディオ設定
          </h3>
        </div>

        <div className="space-y-4">
          {/* 夕方チャイム時刻 */}
          <div>
            <label className={labelClass}>夕方チャイム時刻</label>
            <input
              type="number"
              className={inputClass}
              min={0}
              max={24}
              value={data.audio.eveningChimeHour}
              onChange={(e) =>
                updateAudio({ eveningChimeHour: Number(e.target.value) })
              }
            />
          </div>

          {/* BGM音量スライダー */}
          <div>
            <label className={labelClass}>
              BGM音量:{' '}
              <span className="text-sunset-600 font-medium">
                {data.audio.bgmVolume.toFixed(1)}
              </span>
            </label>
            <input
              type="range"
              className="w-full accent-sunset-500"
              min={0}
              max={1}
              step={0.1}
              value={data.audio.bgmVolume}
              onChange={(e) =>
                updateAudio({ bgmVolume: Number(e.target.value) })
              }
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0</span>
              <span>1.0</span>
            </div>
          </div>

          {/* 環境音量スライダー */}
          <div>
            <label className={labelClass}>
              環境音量:{' '}
              <span className="text-sunset-600 font-medium">
                {data.audio.ambientVolume.toFixed(1)}
              </span>
            </label>
            <input
              type="range"
              className="w-full accent-sunset-500"
              min={0}
              max={1}
              step={0.1}
              value={data.audio.ambientVolume}
              onChange={(e) =>
                updateAudio({ ambientVolume: Number(e.target.value) })
              }
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0</span>
              <span>1.0</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================================
         5. エクスポートセクション
         ============================================================ */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Download className="text-sunset-500" size={20} />
          <h3 className="font-serif-jp text-lg font-bold text-sunset-700">
            Unityへ書き出し
          </h3>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          全てのJSONデータをUnityプロジェクトの
          Assets/_Project/Data/ にコピーします
        </p>

        <Button
          variant="primary"
          icon={
            isExporting ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Download size={16} />
            )
          }
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? '書き出し中...' : '書き出し実行'}
        </Button>

        {/* 最終書き出し日時 */}
        {lastExportedAt && (
          <p className="text-xs text-gray-400 mt-3">
            最終書き出し: {lastExportedAt}
          </p>
        )}
      </Card>
    </motion.div>
  );
}
