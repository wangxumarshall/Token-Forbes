import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Download, ExternalLink, Link2, Loader2, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { StoredProof } from '../types/storage';
import { fetchUserProof } from '../services/leaderboardStore';
import { formatNumber } from '../utils/format';
import { buildProofShareUrl, copyTextToClipboard, formatProofCode, getProofDownloadFileName } from '../utils/proofSharing';
import ProofBadge from './ProofBadge';

interface SharedProofPageProps {
  userId: string;
}

type ShareStatus = 'idle' | 'copied' | 'shared' | 'error';

export default function SharedProofPage({ userId }: SharedProofPageProps) {
  const [proof, setProof] = useState<StoredProof | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousTitle = document.title;

    async function loadProof() {
      setIsLoading(true);
      setError(null);

      try {
        const record = await fetchUserProof(userId, { allowLocalFallback: false });
        setProof(record);

        if (record?.name) {
          document.title = `${record.name} | Proof of Compute | Token Forbes`;
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load shared proof.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadProof();

    return () => {
      document.title = previousTitle;
    };
  }, [userId]);

  useEffect(() => {
    if (shareStatus === 'idle') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setShareStatus('idle'), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [shareStatus]);

  const shareUrl = useMemo(() => buildProofShareUrl(userId), [userId]);
  const proofCode = useMemo(() => formatProofCode(userId), [userId]);
  const formattedTokens = proof ? formatNumber(proof.tokens || 0) : '0';
  const updatedLabel = proof?.updatedAt ? `Updated ${new Date(proof.updatedAt).toLocaleDateString()}` : undefined;

  const handleDownload = async () => {
    if (!badgeRef.current || !proof) {
      return;
    }

    try {
      const canvas = await html2canvas(badgeRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = getProofDownloadFileName(proof.name);
      link.href = url;
      link.click();
    } catch (downloadError) {
      console.error('Failed to download shared proof:', downloadError);
      setShareStatus('error');
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyTextToClipboard(shareUrl);
      setShareStatus('copied');
    } catch (copyError) {
      console.error('Failed to copy shared proof link:', copyError);
      setShareStatus('error');
    }
  };

  const handleShareLink = async () => {
    if (!proof) {
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${proof.name}'s Proof of Compute`,
          text: `${proof.name} is ranked on Token Forbes with ${formattedTokens} monthly tokens.`,
          url: shareUrl,
        });
        setShareStatus('shared');
        return;
      }

      await handleCopyLink();
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') {
        return;
      }

      console.error('Failed to share proof link:', shareError);
      setShareStatus('error');
    }
  };

  if (isLoading) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#D4AF37]" />
          <p className="mt-4 text-sm uppercase tracking-[0.3em] text-gray-500">Loading Shared Proof</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-center sm:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-red-300">Shared Proof Error</p>
          <h1 className="mt-4 font-serif text-4xl font-bold text-white">This proof could not be loaded.</h1>
          <p className="mt-4 text-gray-300">{error}</p>
          <a
            href="/#submit-proof"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#b8952b]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back To Proof Builder
          </a>
        </div>
      </section>
    );
  }

  if (!proof) {
    return (
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#111] p-6 text-center sm:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Shared Proof</p>
          <h1 className="mt-4 font-serif text-4xl font-bold text-white">Proof not found.</h1>
          <p className="mt-4 text-gray-400">
            The public certificate behind this link does not exist yet, or it is only cached on the original device.
          </p>
          <a
            href="/#submit-proof"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#b8952b]"
          >
            <ArrowLeft className="h-4 w-4" />
            Create A New Proof
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <a href="/#submit-proof" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Claim Your Digital Wealth
        </a>

        <div className="mt-8 grid items-center gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:gap-12">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#D4AF37]">Public Certificate</p>
            <h1 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              {proof.name}&apos;s Proof of Compute
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
              This public Token Forbes certificate captures the latest submitted average monthly token burn and can be shared, downloaded, or cited directly.
            </p>

            <div className="mt-8 rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white">
                <Link2 className="h-4 w-4 text-[#D4AF37]" />
                Share Link
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black px-4 py-4 font-mono text-xs leading-relaxed text-gray-300 break-all">
                {shareUrl}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                >
                  <Link2 className="h-4 w-4" />
                  Copy Link
                </button>
                <button
                  onClick={handleShareLink}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#b8952b] sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </button>
                <a
                  href="/#rankings"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                >
                  <ExternalLink className="h-4 w-4" />
                  Explore Rankings
                </a>
              </div>

              {shareStatus !== 'idle' ? (
                <p className="mt-4 text-sm text-[#D4AF37]">
                  {shareStatus === 'copied' && 'Share link copied to clipboard.'}
                  {shareStatus === 'shared' && 'Share dialog opened successfully.'}
                  {shareStatus === 'error' && 'Share action failed. Please try copying the link manually.'}
                </p>
              ) : null}

              {updatedLabel ? <p className="mt-4 text-xs uppercase tracking-widest text-gray-500">{updatedLabel}</p> : null}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, rotateY: -12 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            >
              <ProofBadge
                name={proof.name}
                tokens={formattedTokens}
                shareUrl={shareUrl}
                badgeRef={badgeRef}
                metaLabel={updatedLabel}
                proofCode={proofCode}
                actions={
                  <>
                    <button onClick={handleShareLink} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white" title="Share link">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={handleDownload} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white" title="Download PNG">
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                }
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
