// MonthlyOverview.tsx
// 30日間の概要をグリッドカード形式で表示するコンポーネント

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Node } from '@xyflow/react';
import { CATEGORY_CONFIG } from '../../types';
import type { EventCategory } from '../../types';

/** カテゴリごとの色マッピング（ドット表示用） */
const CATEGORY_COLORS: Record<string, string> = {
  routine: CATEGORY_CONFIG.routine.color,
  interaction: CATEGORY_CONFIG.interaction.color,
  exploration: CATEGORY_CONFIG.exploration.color,
  sea: CATEGORY_CONFIG.sea.color,
  bug: CATEGORY_CONFIG.bug.color,
  heroine: CATEGORY_CONFIG.heroine.color,
  mystery: CATEGORY_CONFIG.mystery.color,
};

interface MonthlyOverviewProps {
  nodes: Node[]; // @xyflow/react の Node 型
  onDaySelect: (day: number) => void; // 日をクリックしたときのコールバック
}

/** 各日ごとの集計データ */
interface DaySummary {
  day: number;
  eventCount: number;
  categories: string[]; // ユニークなカテゴリ名の配列
}

/**
 * MonthlyOverview
 * 30日間を5行6列のグリッドで表示し、各セルにその日のイベント数と
 * カテゴリを色ドットで示す概要ビュー。
 */
export default function MonthlyOverview({ nodes, onDaySelect }: MonthlyOverviewProps) {
  // ノードから日ごとの集計データを作成
  const daySummaries = useMemo(() => {
    const dayMap = new Map<number, Set<string>>();
    const dayCountMap = new Map<number, number>();

    nodes.forEach((node) => {
      const data = node.data as Record<string, unknown>;
      const day = data?.day as number | undefined;
      if (day == null || day < 1 || day > 30) return;

      // イベント数をカウント
      dayCountMap.set(day, (dayCountMap.get(day) || 0) + 1);

      // カテゴリを収集
      const category = data?.category as string | undefined;
      if (category) {
        if (!dayMap.has(day)) dayMap.set(day, new Set());
        dayMap.get(day)!.add(category);
      }
    });

    // 1〜30日分のサマリーを生成
    const summaries: DaySummary[] = [];
    for (let d = 1; d <= 30; d++) {
      summaries.push({
        day: d,
        eventCount: dayCountMap.get(d) || 0,
        categories: dayMap.has(d) ? Array.from(dayMap.get(d)!) : [],
      });
    }
    return summaries;
  }, [nodes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' as const }}
      className="h-full overflow-auto p-4"
    >
      {/* 5行6列のグリッド */}
      <div className="grid grid-cols-6 gap-3 max-w-5xl mx-auto">
        {daySummaries.map((summary) => (
          <DayCard
            key={summary.day}
            summary={summary}
            onClick={() => onDaySelect(summary.day)}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ================================================
// DayCard コンポーネント（各日のセル）
// ================================================

interface DayCardProps {
  summary: DaySummary;
  onClick: () => void;
}

/**
 * DayCard
 * グリッド内の各日を表すカード。
 * 日番号、イベント数バッジ、カテゴリ色ドットを表示する。
 */
function DayCard({ summary, onClick }: DayCardProps) {
  const { day, eventCount, categories } = summary;
  const hasEvents = eventCount > 0;

  // 表示するドットの最大数（5個以上は +N 表示）
  const maxDots = 4;
  const visibleCategories = categories.slice(0, maxDots);
  const extraCount = categories.length - maxDots;

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        glass-card relative flex flex-col items-start p-3 rounded-xl
        text-left cursor-pointer transition-shadow
        ${hasEvents
          ? 'hover:shadow-lg'
          : 'bg-gray-100/50 opacity-60 hover:opacity-80'
        }
      `}
      style={{ minHeight: '90px' }}
    >
      {/* 上部: 日番号とイベント数バッジ */}
      <div className="flex items-start justify-between w-full mb-2">
        <span className="text-lg font-bold text-gray-700">
          {day}<span className="text-xs font-normal text-gray-400 ml-0.5">日目</span>
        </span>

        {/* イベント数バッジ */}
        {hasEvents && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ background: '#0EA5E9' }}
          >
            {eventCount}
          </span>
        )}
      </div>

      {/* カテゴリ色ドット */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mt-auto">
          {visibleCategories.map((cat) => {
            const color = CATEGORY_COLORS[cat] || '#9CA3AF';
            const catConfig = CATEGORY_CONFIG[cat as EventCategory];
            return (
              <span
                key={cat}
                className="w-3 h-3 rounded-full inline-block"
                style={{ background: color }}
                title={catConfig?.label || cat}
              />
            );
          })}
          {/* 5個以上のカテゴリがある場合は +N 表示 */}
          {extraCount > 0 && (
            <span className="text-[10px] font-medium text-gray-400">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* イベントがない場合の表示 */}
      {!hasEvents && (
        <span className="text-[10px] text-gray-300 mt-auto">
          イベントなし
        </span>
      )}
    </motion.button>
  );
}
