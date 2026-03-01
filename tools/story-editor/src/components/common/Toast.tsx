import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

/* ========================================
   zustand ストア: トースト通知の状態管理
   ======================================== */

/** トースト1件分の型 */
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

/** ストアの型 */
interface ToastStore {
  toasts: Toast[];
  /** トーストを追加（3秒後に自動削除） */
  addToast: (message: string, type: Toast['type']) => void;
  /** トーストを手動削除 */
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message, type) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    // 3秒後に自動削除
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

/* ========================================
   タイプ別のアイコンと色
   ======================================== */
const typeConfig = {
  success: {
    icon: <CheckCircle size={18} />,
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
    iconColor: 'text-green-500',
  },
  error: {
    icon: <XCircle size={18} />,
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    iconColor: 'text-red-500',
  },
  info: {
    icon: <Info size={18} />,
    bg: 'bg-ocean-50 border-ocean-200',
    text: 'text-ocean-700',
    iconColor: 'text-ocean-500',
  },
};

/* ========================================
   トースト表示コンポーネント
   ======================================== */

/**
 * トースト通知を右下にスライドイン/アウトで表示するコンポーネント。
 * App.tsx 等のルートに1つだけ配置する。
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = typeConfig[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' as const }}
              className={`
                pointer-events-auto flex items-center gap-3 px-5 py-3
                rounded-xl border shadow-lg backdrop-blur-sm
                min-w-[280px] max-w-[400px]
                ${config.bg}
              `}
            >
              {/* アイコン */}
              <span className={`flex-shrink-0 ${config.iconColor}`}>
                {config.icon}
              </span>

              {/* メッセージ */}
              <p className={`flex-1 text-sm font-medium ${config.text}`}>
                {toast.message}
              </p>

              {/* 閉じるボタン */}
              <button
                onClick={() => removeToast(toast.id)}
                className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors ${config.text}`}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
