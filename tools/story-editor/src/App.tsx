import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// レイアウトコンポーネント
import BackgroundGradient from './components/layout/BackgroundGradient';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ToastContainer from './components/common/Toast';

// ページコンポーネント（遅延読み込み）
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EventFlowPage = lazy(() => import('./pages/EventFlowPage'));
const DialoguePage = lazy(() => import('./pages/DialoguePage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const DiaryPage = lazy(() => import('./pages/DiaryPage'));
const FlagsPage = lazy(() => import('./pages/FlagsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const EventListPage = lazy(() => import('./pages/EventListPage'));
const CharacterPage = lazy(() => import('./pages/CharacterPage'));

/**
 * ページ遷移アニメーション設定
 */
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

/**
 * ローディング表示（lazy importの読み込み中）
 */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">読み込み中...</div>
    </div>
  );
}

/**
 * ルーティングとページ遷移アニメーションを管理するコンポーネント
 * useLocation は BrowserRouter の内側で使う必要があるため分離。
 */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/event-flow" element={<EventFlowPage />} />
            <Route path="/dialogue" element={<DialoguePage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/diary" element={<DiaryPage />} />
            <Route path="/flags" element={<FlagsPage />} />
            <Route path="/events" element={<EventListPage />} />
            <Route path="/characters" element={<CharacterPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * アプリケーションのルートコンポーネント
 * BackgroundGradient（背景）、Sidebar（左）、Header（上）、コンテンツ領域で構成。
 */
export default function App() {
  return (
    <BrowserRouter>
      {/* 時間帯で変わる背景グラデーション */}
      <BackgroundGradient />

      {/* 左サイドバー */}
      <Sidebar />

      {/* 上部ヘッダー */}
      <Header />

      {/* メインコンテンツ領域（サイドバー幅 + ヘッダー高さ分オフセット） */}
      <main className="ml-56 pt-16 min-h-screen">
        <div className="p-8">
          <AnimatedRoutes />
        </div>
      </main>

      {/* トースト通知（右下に表示） */}
      <ToastContainer />
    </BrowserRouter>
  );
}
