import type { ReactNode } from 'react';

/**
 * ガラスモーフィズム風カードコンポーネント
 * index.css に定義された .glass-card クラスを使用。
 */
interface CardProps {
  /** カードのタイトル（省略可） */
  title?: string;
  /** カードの中身 */
  children: ReactNode;
  /** 追加のCSSクラス */
  className?: string;
  /** クリック時の処理 */
  onClick?: () => void;
}

export default function Card({ title, children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`glass-card p-6 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {title && (
        <h3 className="font-serif-jp text-lg font-bold text-sunset-700 mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
