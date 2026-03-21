import type { ReactNode, RefObject } from 'react';
import { CheckCircle2, Shield, Sparkles } from 'lucide-react';
import ProofQrCode from './ProofQrCode';

function getBadgeTier(numTokens: number) {
  if (numTokens >= 1e9) {
    return { title: 'Token Billionaire', color: 'from-[#D4AF37] to-[#8c7324]', shadow: 'shadow-[#D4AF37]/50' };
  }

  if (numTokens >= 1e6) {
    return { title: 'Token Millionaire', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/50' };
  }

  return { title: 'Token Enthusiast', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/50' };
}

function getTokenValueClass(tokens: string) {
  const normalizedLength = tokens.replace(/,/g, '').length;

  if (normalizedLength >= 16) {
    return 'text-[1.9rem] sm:text-[2.05rem] tracking-[-0.09em]';
  }

  if (normalizedLength >= 13) {
    return 'text-[2.15rem] sm:text-[2.3rem] tracking-[-0.08em]';
  }

  if (normalizedLength >= 10) {
    return 'text-[2.35rem] sm:text-[2.5rem] tracking-[-0.07em]';
  }

  return 'text-[2.65rem] tracking-[-0.06em]';
}

function getWrappedTokenLines(tokens: string) {
  const groups = tokens.split(',');

  if (groups.length <= 4) {
    return [tokens];
  }

  const lineCount = groups.length > 8 ? 3 : 2;
  const groupsPerLine = Math.ceil(groups.length / lineCount);
  const lines: string[] = [];

  for (let index = 0; index < groups.length; index += groupsPerLine) {
    lines.push(groups.slice(index, index + groupsPerLine).join(','));
  }

  return lines;
}

function getWrappedTokenValueClass(lines: string[]) {
  const longestLineLength = lines.reduce((maxLength, line) => Math.max(maxLength, line.length), 0);

  if (lines.length >= 3 || longestLineLength >= 17) {
    return 'text-[1.4rem] sm:text-[1.6rem] tracking-[-0.06em]';
  }

  if (lines.length === 2 || longestLineLength >= 13) {
    return 'text-[1.8rem] sm:text-[2rem] tracking-[-0.07em]';
  }

  return getTokenValueClass(lines[0] || '');
}

interface ProofBadgeProps {
  name: string;
  tokens: string;
  shareUrl: string;
  badgeRef?: RefObject<HTMLDivElement | null>;
  actions?: ReactNode;
  metaLabel?: string;
  proofCode?: string;
}

export default function ProofBadge({ name, tokens, shareUrl, badgeRef, actions, metaLabel, proofCode }: ProofBadgeProps) {
  const numTokens = parseInt(tokens.replace(/,/g, ''), 10) || 0;
  const tier = getBadgeTier(numTokens);
  const tokenLines = getWrappedTokenLines(tokens);
  const tokenValueClass = getWrappedTokenValueClass(tokenLines);

  return (
    <div
      className={`relative w-full max-w-[26rem] overflow-hidden rounded-[2rem] bg-gradient-to-br ${tier.color} ${tier.shadow} p-[1px] shadow-[0_28px_80px_rgba(0,0,0,0.48)]`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.28),transparent_32%)] pointer-events-none" />

      <div ref={badgeRef} className="relative w-full overflow-hidden rounded-[calc(2rem-1px)] bg-[#050505]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.06),transparent_26%,transparent_74%,rgba(255,255,255,0.05))]" />
        <div className="absolute inset-[14px] rounded-[1.55rem] border border-white/8 pointer-events-none" />
        <div className="absolute left-7 right-7 top-[6.2rem] h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />

        <div className="relative flex min-h-[37rem] flex-col p-7 sm:min-h-[39rem] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <ProofQrCode url={shareUrl} />
            <div className="text-right">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[0.62rem] uppercase tracking-[0.28em] text-[#f0e2a4]">
                <Sparkles className="h-3 w-3" />
                Certified
              </div>
              <div className="mt-4 font-serif text-[1.1rem] font-semibold tracking-[0.08em] text-white">Token Forbes</div>
              {proofCode ? <div className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.34em] text-gray-500">{proofCode}</div> : null}
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="text-[0.62rem] font-mono uppercase tracking-[0.45em] text-gray-500">Certificate Of Compute</div>
            <h3 className="mt-4 font-serif text-[2.35rem] font-bold leading-[1.05] text-white break-words">{name}</h3>
            <div className={`mt-4 inline-flex items-center rounded-full bg-gradient-to-r ${tier.color} px-5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-black shadow-[0_10px_30px_rgba(212,175,55,0.25)]`}>
              {tier.title}
            </div>
          </div>

          <div className="mt-7 min-h-[11rem] rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-5 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-6 sm:py-6">
            <div className="text-[0.68rem] uppercase tracking-[0.32em] text-gray-500">Average Monthly Burn</div>
            <div className={`mx-auto mt-4 max-w-[16rem] font-mono font-semibold leading-[0.92] text-white whitespace-normal ${tokenValueClass}`}>
              {tokenLines.map((line, index) => (
                <span key={`${line}-${index}`} className="block break-all">
                  {line}
                </span>
              ))}
            </div>
            <div className="mt-3 text-[0.68rem] font-mono uppercase tracking-[0.3em] text-gray-400">Standard Equivalent Tokens</div>
          </div>

          <div className="mt-auto pt-6">
            <div className="grid grid-cols-1 items-start gap-4 border-t border-white/10 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.26em] text-emerald-300">
                  <Shield className="h-3.5 w-3.5" />
                  Public Certificate
                </div>
                <div className="mt-3 flex items-center gap-2 text-[0.72rem] font-mono uppercase tracking-[0.24em] text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Proof Validated
                </div>
                {metaLabel ? <div className="mt-3 text-[0.62rem] font-mono uppercase tracking-[0.3em] text-gray-500">{metaLabel}</div> : null}
              </div>
              {actions ? (
                <div className="flex gap-3" data-html2canvas-ignore>
                  {actions}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
