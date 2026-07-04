import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface ScoreRingProps {
  score: number;
  maxScore: number;
}

export default function ScoreRing({ score, maxScore }: ScoreRingProps) {
  const spring = useSpring(0, { stiffness: 50, damping: 15 });
  const displayScore = useTransform(spring, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(0);

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => spring.set(score), 300);
    return () => clearTimeout(timer);
  }, [score, spring]);

  useEffect(() => {
    return displayScore.on('change', (v) => setDisplayValue(v));
  }, [displayScore]);

  const isHighScore = percentage >= 80;
  const gradientId = isHighScore ? 'scoreGradientHigh' : 'scoreGradientNormal';

  return (
    <div className="relative flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="scoreGradientHigh" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="scoreGradientNormal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* Background ring */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        {/* Animated progress ring */}
        <motion.circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{
            filter: `drop-shadow(0 0 12px ${isHighScore ? 'rgba(52, 211, 153, 0.5)' : 'rgba(124, 92, 255, 0.5)'})`,
          }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex items-baseline gap-1"
        >
          <span className="text-6xl font-bold tracking-tight sm:text-7xl">{displayValue}</span>
          <span className="text-2xl font-medium text-white/40">/ {maxScore}</span>
        </motion.div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-2 text-sm font-medium text-white/50"
        >
          {isHighScore ? 'Excellent work!' : 'Room to grow'}
        </motion.span>
      </div>
    </div>
  );
}
