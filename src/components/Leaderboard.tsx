import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Info, ShieldCheck, Activity, Database } from 'lucide-react';
import { Entity } from '../data/mockData';
import { formatTokens } from '../utils/format';
import AssetGraph from './AssetGraph';
import clsx from 'clsx';

interface Props {
  data: Entity[];
}

export default function Leaderboard({ data }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getSourceIcon = (sourceTag: string) => {
    switch (sourceTag) {
      case 'Direct Disclosure': return <ShieldCheck className="w-4 h-4 text-green-500" />;
      case 'API Partner': return <Database className="w-4 h-4 text-blue-500" />;
      case 'Proxy Inference':
      case 'Model Estimation': return <Activity className="w-4 h-4 text-orange-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-6 border-b border-white/10 bg-[#1a1a1a] text-xs font-mono uppercase tracking-widest text-gray-400">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Entity</div>
          <div className="col-span-2 text-right">Total Tokens</div>
          <div className="col-span-2 text-right">Daily Burn</div>
          <div className="col-span-3 text-right">Source / Confidence</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/5">
          {data.map((entity, index) => (
            <div key={entity.id} className="group">
              <div 
                className={clsx(
                  "grid grid-cols-12 gap-4 p-6 items-center cursor-pointer transition-colors hover:bg-white/5",
                  expandedId === entity.id && "bg-white/5"
                )}
                onClick={() => setExpandedId(expandedId === entity.id ? null : entity.id)}
              >
                <div className="col-span-1 font-serif text-2xl font-bold text-gray-500">
                  {entity.rank}
                </div>
                
                <div className="col-span-4 flex items-center gap-4">
                  <img 
                    src={entity.avatar} 
                    alt={entity.name} 
                    className="w-12 h-12 rounded-full border border-white/20 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-sans font-semibold text-lg text-white">{entity.name}</h3>
                    <p className="text-sm text-gray-400">{entity.title}, {entity.company}</p>
                  </div>
                </div>

                <div className="col-span-2 text-right font-mono text-xl text-[#D4AF37]">
                  {formatTokens(entity.totalTokens)}
                </div>

                <div className="col-span-2 text-right font-mono text-sm text-gray-300">
                  {formatTokens(entity.tokensPerDay)}/d
                </div>

                <div className="col-span-3 flex items-center justify-end gap-3">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      {getSourceIcon(entity.sourceTag)}
                      <span>{entity.sourceTag}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono mt-1">
                      ±{entity.confidenceInterval}% Margin
                    </span>
                  </div>
                  {expandedId === entity.id ? 
                    <ChevronUp className="w-5 h-5 text-gray-500" /> : 
                    <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                  }
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedId === entity.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden bg-black/40"
                  >
                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5">
                      <div className="md:col-span-2 space-y-4">
                        <h4 className="font-serif text-lg text-[#D4AF37] italic">The Architect's Blueprint</h4>
                        <p className="text-gray-300 leading-relaxed text-sm">
                          {entity.description}
                        </p>
                        
                        <div className="grid grid-cols-3 gap-4 pt-4">
                          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Monthly Burn</div>
                            <div className="font-mono text-sm text-white">{formatTokens(entity.tokensPerMonth)}</div>
                          </div>
                          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Yearly Run Rate</div>
                            <div className="font-mono text-sm text-white">{formatTokens(entity.tokensPerYear)}</div>
                          </div>
                          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Update Freq</div>
                            <div className="font-mono text-sm text-white">{entity.updateFrequency}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Last Updated</div>
                            <div className="font-mono text-xs text-green-400">{entity.lastUpdated}</div>
                          </div>
                          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Next Update</div>
                            <div className="font-mono text-xs text-blue-400">{entity.nextUpdate}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-serif text-lg text-[#D4AF37] italic text-center">Wealth Structure</h4>
                        <AssetGraph data={entity.wealthStructure} />
                        <div className="space-y-2">
                          {entity.wealthStructure.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <span className="text-gray-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#D4AF37', '#8c7324', '#4a3d13', '#261f0a'][i % 4] }} />
                                {item.name}
                              </span>
                              <span className="font-mono text-white">{item.value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
