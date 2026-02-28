import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * テーマ対応ボタンコンポーネント
 * framer-motion の motion.button を使用し、hover時にスケールアップする。
 */
interface ButtonProps {
  /** ボタンのバリアント（見た目の種類） */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** ボタンの中身 */
  children: ReactNode;
  /** クリック時の処理 */
  onClick?: () => void;
  /** 無効状態 */
  disabled?: boolean;
  /** 左側に表示するアイコン */
  icon?: ReactNode;
  /** 追加のCSSクラス */
  className?: string;
}

/** バリアントごとのスタイル定義 */
const variantStyles: Record<string, string> = {
  primary:
    'bg-sunset-500 text-white hover:bg-sunset-600 shadow-lg shadow-sunset-500/25',
  secondary:
    'bg-ocean-500 text-white hover:bg-ocean-600 shadow-lg shadow-ocean-500/25',
  ghost:
    'bg-transparent text-gray-600 hover:bg-white/30 hover:text-gray-900',
  danger:
    'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25',
};

export default function Button({
  variant = 'primary',
  children,
  onClick,
  disabled = false,
  icon,
  className = '',
}: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.04 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}
