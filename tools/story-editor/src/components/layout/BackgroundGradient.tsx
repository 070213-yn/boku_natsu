import { useEffect, useState, useMemo } from 'react';

/**
 * 時間帯で変わる背景グラデーション + 光の粒子エフェクト
 * 朝(6-12): 澄んだ水色
 * 昼(12-17): 明るいパステルブルー
 * 夕方(17-20): パステルブルー→薄い紫
 * 夜(20-6): 紺色→暗い青
 */

// 時間帯に応じたグラデーション色を返す
function getGradientByHour(hour: number): string {
  if (hour >= 6 && hour < 12) {
    // 朝: 澄んだ水色
    return 'linear-gradient(180deg, #DBEAFE 0%, #E0F2FE 40%, #F0F9FF 100%)';
  } else if (hour >= 12 && hour < 17) {
    // 昼: 明るいパステルブルー
    return 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 40%, #DBEAFE 100%)';
  } else if (hour >= 17 && hour < 20) {
    // 夕方: パステルブルー→薄い紫→薄いピンク
    return 'linear-gradient(180deg, #BAE6FD 0%, #A5B4FC 30%, #C4B5FD 55%, #DDD6FE 80%, #EDE9FE 100%)';
  } else {
    // 夜: 紺色→暗い青
    return 'linear-gradient(180deg, #1E3A5F 0%, #1E293B 50%, #0F172A 100%)';
  }
}

// 光の粒子を生成（ランダム配置）
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100, // %単位
    size: Math.random() * 3 + 2, // 2~5px
    duration: Math.random() * 10 + 12, // 12~22秒
    delay: Math.random() * 15, // 0~15秒のディレイ
    opacity: Math.random() * 0.4 + 0.2, // 0.2~0.6
  }));
}

export default function BackgroundGradient() {
  const [hour, setHour] = useState(() => new Date().getHours());

  // 1分ごとに時刻を更新
  useEffect(() => {
    const interval = setInterval(() => {
      setHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 粒子はマウント時に一度だけ生成
  const particles = useMemo(() => generateParticles(15), []);

  const gradient = getGradientByHour(hour);

  return (
    <div
      className="fixed inset-0 -z-10 transition-all duration-[3000ms]"
      style={{ background: gradient }}
    >
      {/* 光の粒子エフェクト */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
