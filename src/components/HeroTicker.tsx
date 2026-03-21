import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Entity, individualEntities } from '../data/mockData';
import { formatTokens } from '../utils/format';

interface Props {
  data?: Entity[];
}

export default function HeroTicker({ data }: Props) {
  const sourceEntities = data && data.length > 0 ? data : individualEntities;
  const [tokens, setTokens] = useState<number[]>(sourceEntities.map((entity) => entity.totalTokens));

  useEffect(() => {
    setTokens(sourceEntities.map((entity) => entity.totalTokens));
  }, [sourceEntities]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTokens(prev => prev.map((t, i) => {
        const monthlyBurn = sourceEntities[i]?.tokensPerMonth ?? 0;
        const perSecond = monthlyBurn / (30 * 24 * 60 * 60);
        return t + (perSecond * (0.8 + Math.random() * 0.4)); // add some jitter
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [sourceEntities]);

  return (
    <div className="overflow-hidden border-y border-white/5 bg-[#1a1a1a] py-2 sm:py-3">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...sourceEntities, ...sourceEntities].map((giant, idx) => (
          <div key={`${giant.id}-${idx}`} className="flex items-center gap-2 border-r border-white/10 px-4 last:border-0 sm:gap-4 sm:px-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500 sm:text-xs sm:tracking-widest">{giant.company}</span>
            <span className="font-mono text-sm font-bold text-[#D4AF37] sm:text-base">
              {formatTokens(tokens[idx % sourceEntities.length])}
            </span>
            <motion.span 
              className="text-[10px] text-green-500 sm:text-xs"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              ▲
            </motion.span>
          </div>
        ))}
      </div>
    </div>
  );
}
