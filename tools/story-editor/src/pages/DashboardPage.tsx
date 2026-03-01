import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  GitBranch,
  List,
  MessageSquare,
  Calendar,
  BookOpen,
  Flag,
  Settings,
  Activity,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Card from '../components/common/Card';
import {
  useEventFlowStore,
  useEventListStore,
  useDialogueStore,
  useDiaryStore,
  useExplorationStore,
  useGameConfigStore,
} from '../hooks/useStores';

/* ---------- アニメーション設定 ---------- */

/** 親コンテナ: 子要素を順番にフェードインさせる */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

/** 各子要素のフェードイン */
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

/* ---------- 統計カード ---------- */

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string; // Tailwind のテキストカラークラス
  bgColor: string; // アイコン背景のカラークラス
}

/** 統計数値を大きく表示するカード */
function StatCard({ icon, value, label, color, bgColor }: StatCardProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="flex items-center gap-4">
        {/* アイコン */}
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${bgColor}`}>
          <span className={color}>{icon}</span>
        </div>
        {/* 数値とラベル */}
        <div>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        </div>
      </Card>
    </motion.div>
  );
}

/* ---------- クイックアクションカード ---------- */

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  color: string;
  bgColor: string;
}

/** 各エディタページへのショートカットカード */
function QuickActionCard({ icon, title, description, path, color, bgColor }: QuickActionProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <Card className="cursor-pointer h-full" onClick={() => navigate(path)}>
        <div className="flex items-start gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${bgColor} flex-shrink-0`}>
            <span className={color}>{icon}</span>
          </div>
          <div>
            <h4 className="font-serif-jp font-bold text-gray-800 text-base">{title}</h4>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ---------- 日時フォーマット ---------- */

/** ISO文字列を「YYYY/MM/DD HH:mm」形式に変換する */
function formatDate(isoString: string | undefined | null): string {
  if (!isoString) return '---';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '---';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
  } catch {
    return '---';
  }
}

/* ---------- メインコンポーネント ---------- */

export default function DashboardPage() {
  // 各データストア
  const eventFlow = useEventFlowStore();
  const eventList = useEventListStore();
  const dialogue = useDialogueStore();
  const diary = useDiaryStore();
  const exploration = useExplorationStore();
  const gameConfig = useGameConfigStore();

  // 初回マウント時に全ストアを読み込む
  useEffect(() => {
    eventFlow.load();
    eventList.load();
    dialogue.load();
    diary.load();
    exploration.load();
    gameConfig.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // いずれかのストアが読み込み中か判定
  const isLoading =
    eventFlow.isLoading ||
    eventList.isLoading ||
    dialogue.isLoading ||
    diary.isLoading ||
    exploration.isLoading ||
    gameConfig.isLoading;

  // 読み込み中の表示
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="mx-auto w-8 h-8 border-2 border-sunset-300 border-t-sunset-600 rounded-full"
          />
          <p className="text-gray-400 text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  /* --- 統計値の算出 --- */
  const nodeCount = eventFlow.data?.nodes.length ?? 0;
  const eventCount = eventList.data?.events.length ?? 0;
  const npcCount = dialogue.data?.npcs.length ?? 0;
  const actionCount = diary.data?.actions.length ?? 0;
  const flagCount =
    (exploration.data?.boolFlags.length ?? 0) +
    (exploration.data?.intCounters.length ?? 0);

  /* --- ゲーム設定の取得 --- */
  const general = gameConfig.data?.general;
  const timeSystem = gameConfig.data?.timeSystem;
  const heroine = gameConfig.data?.heroine;
  const timePhases = gameConfig.data?.timePhases;

  /* --- クイックアクション定義 --- */
  const quickActions: QuickActionProps[] = [
    {
      icon: <GitBranch size={20} />,
      title: 'ストーリー分岐',
      description: 'イベントの流れと分岐条件をフローチャートで編集',
      path: '/event-flow',
      color: 'text-sunset-500',
      bgColor: 'bg-sunset-100',
    },
    {
      icon: <List size={20} />,
      title: 'イベント一覧',
      description: 'イベントの追加・編集とC#スクリプト自動生成',
      path: '/events',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: <MessageSquare size={20} />,
      title: '会話テキスト',
      description: 'NPCごとの会話データと特殊セリフを管理',
      path: '/dialogue',
      color: 'text-ocean-500',
      bgColor: 'bg-ocean-100',
    },
    {
      icon: <Calendar size={20} />,
      title: 'タイムライン',
      description: '30日間のイベント配置を時系列で確認',
      path: '/timeline',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: <BookOpen size={20} />,
      title: '日記システム',
      description: '日記に表示されるアクションテキストを編集',
      path: '/diary',
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
    },
    {
      icon: <Flag size={20} />,
      title: 'フラグ管理',
      description: '探索フラグとカウンターの定義と条件を設定',
      path: '/flags',
      color: 'text-pink-500',
      bgColor: 'bg-pink-100',
    },
    {
      icon: <Settings size={20} />,
      title: '設定',
      description: 'ゲーム全体の時間・音声・キャラ設定を調整',
      path: '/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ];

  /* --- 最終更新情報 --- */
  const updateEntries = [
    { label: 'イベントフロー', date: eventFlow.data?.lastModified },
    { label: 'イベント一覧', date: eventList.data?.lastModified },
    { label: '会話データ', date: dialogue.data?.lastModified },
    { label: '日記アクション', date: diary.data?.lastModified },
    { label: '探索フラグ', date: exploration.data?.lastModified },
    { label: 'ゲーム設定', date: gameConfig.data?.lastModified },
  ];

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ---- ページタイトル ---- */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <LayoutDashboard size={28} className="text-sunset-500" />
        <h2 className="font-serif-jp text-2xl font-bold text-gray-800">
          ダッシュボード
        </h2>
      </motion.div>

      {/* ---- 統計カード（5列グリッド） ---- */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          icon={<GitBranch size={24} />}
          value={nodeCount}
          label="ストーリーノード"
          color="text-sunset-500"
          bgColor="bg-sunset-100"
        />
        <StatCard
          icon={<List size={24} />}
          value={eventCount}
          label="イベント"
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          icon={<MessageSquare size={24} />}
          value={npcCount}
          label="会話NPC"
          color="text-ocean-500"
          bgColor="bg-ocean-100"
        />
        <StatCard
          icon={<BookOpen size={24} />}
          value={actionCount}
          label="日記アクション"
          color="text-purple-500"
          bgColor="bg-purple-100"
        />
        <StatCard
          icon={<Flag size={24} />}
          value={flagCount}
          label="探索フラグ"
          color="text-pink-500"
          bgColor="bg-pink-100"
        />
      </div>

      {/* ---- ゲーム情報カード ---- */}
      <motion.div variants={itemVariants}>
        <Card title="ゲーム情報">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* 左列: 基本情報 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-sunset-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">ゲーム名:</span>
                <span className="text-sm font-medium text-gray-800">
                  {general?.gameName ?? '---'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-sunset-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">ゲーム期間:</span>
                <span className="text-sm font-medium text-gray-800">
                  {general
                    ? `${general.startMonth}月${general.startDay}日 〜 ${general.startMonth}月${general.startDay + (general.maxDay - 1)}日（${general.maxDay}日間）`
                    : '---'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-sunset-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">時間倍率:</span>
                <span className="text-sm font-medium text-gray-800">
                  {timeSystem ? `行動ベース（開始 ${timeSystem.defaultStartHour}時）` : '---'}
                </span>
              </div>
            </div>

            {/* 右列: ヒロイン・時間帯 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-pink-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">ヒロイン不在:</span>
                <span className="text-sm font-medium text-gray-800">
                  {heroine
                    ? `${heroine.absenceStartDay}日目 〜 ${heroine.absenceEndDay}日目`
                    : '---'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-pink-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">ヒロイン出現:</span>
                <span className="text-sm font-medium text-gray-800">
                  {heroine
                    ? `${heroine.appearTimePhase} 〜 ${heroine.leaveTimePhase}`
                    : '---'}
                </span>
              </div>
              {/* 時間帯一覧 */}
              {timePhases && (
                <div className="flex items-start gap-2">
                  <Clock size={16} className="text-ocean-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500">時間帯:</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(timePhases).map(([key, phase]) => (
                      <span
                        key={key}
                        className="inline-block text-xs px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-600 font-medium"
                      >
                        {phase.label}（{phase.startHour}時〜{phase.endHour}時）
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ---- クイックアクション ---- */}
      <motion.div variants={itemVariants}>
        <h3 className="font-serif-jp text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-sunset-400" />
          クイックアクション
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <QuickActionCard key={action.path} {...action} />
          ))}
        </div>
      </motion.div>

      {/* ---- 最終更新情報 ---- */}
      <motion.div variants={itemVariants}>
        <Card title="最終更新">
          <div className="space-y-3">
            {updateEntries.map((entry) => (
              <div
                key={entry.label}
                className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0"
              >
                <span className="text-sm text-gray-600">{entry.label}</span>
                <span className="text-sm text-gray-400 font-mono">
                  {formatDate(entry.date)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
