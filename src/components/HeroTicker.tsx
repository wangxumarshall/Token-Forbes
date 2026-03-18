import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { individualEntities } from '../data/mockData';
import { formatTokens } from '../utils/format';

export default function HeroTicker() {
  const [tokens, setTokens] = useState<number[]>(individualEntities.map(g => g.totalTokens));

  useEffect(() => {
    const interval = setInterval(() => {
      setTokens(prev => prev.map((t, i) => {
        // Add random tokens per second based on their daily burn rate
        const dailyBurn = individualEntities[i].tokensPerDay;
        const perSecond = dailyBurn / (24 * 60 * 60);
        return t + (perSecond * (0.8 + Math.random() * 0.4)); // add some jitter
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1a1a1a] border-y border-white/5 overflow-hidden py-3">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...individualEntities, ...individualEntities].map((giant, idx) => (
          <div key={`${giant.id}-${idx}`} className="flex items-center gap-4 px-8 border-r border-white/10 last:border-0">
            <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">{giant.company}</span>
            <span className="text-[#D4AF37] font-mono font-bold">
              {formatTokens(tokens[idx % individualEntities.length])}
            </span>
            <motion.span 
              className="text-green-500 text-xs"
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
