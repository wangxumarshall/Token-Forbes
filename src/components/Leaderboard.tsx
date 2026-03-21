import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Info, ShieldCheck, Activity, Database, ExternalLink } from 'lucide-react';
import { Entity } from '../data/mockData';
import { formatTokens } from '../utils/format';
import { extractGitHubLogin, getGitHubProfileUrl, normalizeAvatarUrl } from '../utils/avatar';
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
      case 'Public GitHub Proxy': return <Database className="w-4 h-4 text-violet-400" />;
      case 'Proxy Inference':
      case 'Model Estimation': return <Activity className="w-4 h-4 text-orange-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEntityProfileUrl = (entity: Entity) => {
    if (entity.entityType !== 'individual') {
      return null;
    }

    if (entity.profileUrl?.trim()) {
      return entity.profileUrl.trim();
    }

    const avatarLogin = extractGitHubLogin(entity.avatar);
    if (avatarLogin) {
      return getGitHubProfileUrl(avatarLogin);
    }

    if (entity.sourceTag === 'Public GitHub Proxy' && /^[a-z\d](?:[a-z\d-]{0,38})$/i.test(entity.name)) {
      return getGitHubProfileUrl(entity.name);
    }

    return null;
  };

  const renderExpandedContent = (entity: Entity) => (
    <div className="grid grid-cols-1 gap-6 border-t border-white/5 p-5 sm:gap-8 sm:p-8 md:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        <h4 className="font-serif text-lg italic text-[#D4AF37]">The Architect&apos;s Blueprint</h4>
        <p className="text-sm leading-relaxed text-gray-300">
          {entity.description}
        </p>

        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3 sm:gap-4 sm:pt-4">
          <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">Avg Monthly Burn</div>
            <div className="font-mono text-sm text-white break-all">{formatTokens(entity.tokensPerMonth)}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">Annualized Burn</div>
            <div className="font-mono text-sm text-white break-all">{formatTokens(entity.tokensPerYear)}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">Update Freq</div>
            <div className="font-mono text-sm text-white">{entity.updateFrequency}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 sm:gap-4 sm:pt-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Last Updated</div>
            <div className="font-mono text-xs text-green-400">{entity.lastUpdated}</div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Next Update</div>
            <div className="font-mono text-xs text-blue-400">{entity.nextUpdate}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-center font-serif text-lg italic text-[#D4AF37]">Wealth Structure</h4>
        <AssetGraph data={entity.wealthStructure} />
        <div className="space-y-2">
          {entity.wealthStructure.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-gray-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ['#D4AF37', '#8c7324', '#4a3d13', '#261f0a'][i % 4] }} />
                {item.name}
              </span>
              <span className="font-mono text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="divide-y divide-white/5 md:hidden">
          {data.map((entity) => {
            const profileUrl = getEntityProfileUrl(entity);

            return (
              <div key={entity.id} className="group">
                <div
                  className={clsx(
                    'cursor-pointer p-4 transition-colors hover:bg-white/5',
                    expandedId === entity.id && 'bg-white/5',
                  )}
                  onClick={() => setExpandedId(expandedId === entity.id ? null : entity.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-1 font-serif text-2xl font-bold text-gray-500">{entity.rank}</div>
                    <img
                      src={normalizeAvatarUrl(entity.avatar, entity.name)}
                      alt={entity.name}
                      className="h-12 w-12 rounded-full border border-white/20 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {profileUrl ? (
                            <a
                              href={profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex max-w-full items-center gap-1 font-sans text-base font-semibold text-white transition-colors hover:text-[#D4AF37]"
                            >
                              <span className="truncate">{entity.name}</span>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            </a>
                          ) : (
                            <h3 className="truncate font-sans text-base font-semibold text-white">{entity.name}</h3>
                          )}
                          <p className="mt-1 text-sm text-gray-400">{entity.title}, {entity.company}</p>
                        </div>
                        {expandedId === entity.id ? (
                          <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-gray-500" />
                        ) : (
                          <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-gray-500 transition-colors group-hover:text-white" />
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/5 bg-black/40 p-3">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Total Tokens</div>
                          <div className="mt-2 break-all font-mono text-lg text-[#D4AF37]">{formatTokens(entity.totalTokens)}</div>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-black/40 p-3">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-gray-500">Avg Monthly Burn</div>
                          <div className="mt-2 break-all font-mono text-sm text-gray-200">{formatTokens(entity.tokensPerMonth)}/mo</div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-gray-300">
                          {getSourceIcon(entity.sourceTag)}
                          {entity.sourceTag}
                        </span>
                        <span className="text-[11px] font-mono text-gray-500">±{entity.confidenceInterval}% Margin</span>
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === entity.id ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden bg-black/40"
                    >
                      {renderExpandedContent(entity)}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-4 border-b border-white/10 bg-[#1a1a1a] p-6 text-xs font-mono uppercase tracking-widest text-gray-400">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Entity</div>
            <div className="col-span-2 text-right">Total Tokens</div>
            <div className="col-span-2 text-right">Avg Monthly Burn</div>
            <div className="col-span-3 text-right">Source / Confidence</div>
          </div>

          <div className="divide-y divide-white/5">
          {data.map((entity) => {
            const profileUrl = getEntityProfileUrl(entity);

            return (
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
                      src={normalizeAvatarUrl(entity.avatar, entity.name)} 
                      alt={entity.name} 
                      className="w-12 h-12 rounded-full border border-white/20 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      {profileUrl ? (
                        <a
                          href={profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1 font-sans text-lg font-semibold text-white transition-colors hover:text-[#D4AF37]"
                        >
                          {entity.name}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <h3 className="font-sans font-semibold text-lg text-white">{entity.name}</h3>
                      )}
                      <p className="text-sm text-gray-400">{entity.title}, {entity.company}</p>
                    </div>
                  </div>

                  <div className="col-span-2 text-right font-mono text-xl text-[#D4AF37]">
                    {formatTokens(entity.totalTokens)}
                  </div>

                  <div className="col-span-2 text-right font-mono text-sm text-gray-300">
                    {formatTokens(entity.tokensPerMonth)}/mo
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

                <AnimatePresence>
                  {expandedId === entity.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden bg-black/40"
                    >
                      {renderExpandedContent(entity)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}
