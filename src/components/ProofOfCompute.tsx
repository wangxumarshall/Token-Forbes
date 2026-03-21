import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Cpu, Share2, Download, ExternalLink, Link2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { formatNumber } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserProofRecord, getBrowserGuestId, saveUserProof } from '../services/leaderboardStore';
import LoginMenu from './LoginMenu';
import type { ServerStorageProvider } from '../types/storage';
import { buildProofShareUrl, copyTextToClipboard, formatProofCode, getProofDownloadFileName } from '../utils/proofSharing';
import ProofBadge from './ProofBadge';

export default function ProofOfCompute() {
  const { currentUser, login, isLoggingIn, activeProvider } = useAuth();
  const [tokens, setTokens] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [storageProvider, setStorageProvider] = useState<ServerStorageProvider | null>(null);
  const [proofUserId, setProofUserId] = useState<string>('');
  const [proofUpdatedAt, setProofUpdatedAt] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared' | 'error'>('idle');
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchExistingProof() {
      setIsLoadingData(true);
      setStorageError(null);
      setShareStatus('idle');

      const activeUserId = currentUser?.uid ?? getBrowserGuestId();
      setProofUserId(activeUserId);

      try {
        const result = await fetchUserProofRecord(activeUserId, { allowLocalFallback: true });
        const proof = result.record;

        if (proof) {
          setName(proof.name || '');
          setTokens(formatNumber(proof.tokens || 0));
          setIsGenerated(true);
          setStorageProvider(result.provider === 'local-storage' ? null : result.provider);
          setProofUpdatedAt(proof.updatedAt || null);

          if (result.provider === 'local-storage') {
            void saveUserProof({
              name: proof.name,
              tokens: proof.tokens,
              userId: proof.userId,
              photoURL: proof.photoURL || null,
            })
              .then((provider) => {
                setStorageProvider(provider);
                setProofUpdatedAt(new Date().toISOString());
              })
              .catch((syncError) => {
                console.warn('Failed to sync local proof to server:', syncError);
              });
          }
        } else if (currentUser?.displayName) {
          setName(currentUser.displayName);
          setTokens('');
          setIsGenerated(false);
          setStorageProvider(null);
          setProofUpdatedAt(null);
        } else {
          setName('');
          setTokens('');
          setIsGenerated(false);
          setStorageProvider(null);
          setProofUpdatedAt(null);
        }
      } catch (error) {
        setStorageError(error instanceof Error ? error.message : 'Failed to load your saved proof.');
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchExistingProof();
  }, [currentUser]);

  useEffect(() => {
    if (shareStatus === 'idle') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setShareStatus('idle'), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [shareStatus]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokens || !name) {
      return;
    }

    setIsSaving(true);
    setStorageError(null);
    setShareStatus('idle');

    const numTokens = parseInt(tokens.replace(/,/g, ''), 10) || 0;
    const activeUserId = proofUserId || currentUser?.uid || getBrowserGuestId();
    setProofUserId(activeUserId);

    try {
      const provider = await saveUserProof({
        name,
        tokens: numTokens,
        userId: activeUserId,
        photoURL: currentUser?.photoURL || null,
      });
      const savedAt = new Date().toISOString();
      setStorageProvider(provider);
      setProofUpdatedAt(savedAt);
      setIsGenerated(true);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Failed to save your proof.');
    } finally {
      setIsSaving(false);
    }
  };

  const shareUrl = isGenerated && proofUserId ? buildProofShareUrl(proofUserId) : '';
  const proofCode = proofUserId ? formatProofCode(proofUserId) : undefined;
  const updatedLabel = proofUpdatedAt ? `Updated ${new Date(proofUpdatedAt).toLocaleDateString()}` : undefined;

  const handleDownload = async () => {
    if (!badgeRef.current) {
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
      link.download = getProofDownloadFileName(name);
      link.href = url;
      link.click();
    } catch (error) {
      console.error('Failed to download badge:', error);
      setShareStatus('error');
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      await copyTextToClipboard(shareUrl);
      setShareStatus('copied');
    } catch (error) {
      console.error('Failed to copy proof link:', error);
      setShareStatus('error');
    }
  };

  const handleShare = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Proof of Compute',
          text: `${name} has submitted ${tokens} monthly tokens on Token Forbes.`,
          url: shareUrl,
        });
        setShareStatus('shared');
        return;
      }

      await handleCopyLink();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      console.error('Failed to share badge:', error);
      setShareStatus('error');
    }
  };

  return (
    <section className="relative overflow-hidden bg-black py-20 sm:py-24">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="mb-6 font-serif text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Claim Your <span className="text-[#D4AF37] italic">Digital Wealth</span>
          </h2>
          <p className="text-base leading-relaxed text-gray-400 sm:text-lg">
            In the AI era, compute is the new currency. Submit your average monthly API usage, generate your Proof of Compute badge, and join the ranks of the Token Forbes.
          </p>
        </div>

        <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
          {/* Form */}
          <div className="relative rounded-2xl border border-white/10 bg-[#111] p-5 shadow-2xl sm:p-8">
            {isLoadingData && (
              <div className="absolute inset-0 bg-[#111]/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
              </div>
            )}
            {storageError && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {storageError}
              </div>
            )}
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  Developer / Entity Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all disabled:opacity-50"
                  placeholder="e.g. Satoshi Nakamoto"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="tokens" className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">
                  Monthly Token Consumption
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="tokens"
                    value={tokens}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setTokens(val ? formatNumber(parseInt(val)) : '');
                    }}
                    className="w-full bg-black border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white font-mono focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all disabled:opacity-50"
                    placeholder="1,000,000"
                    required
                  />
                  <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
                <p className="mt-2 text-xs text-gray-500">Aggregate your usage across OpenAI, Anthropic, Google, etc.</p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#D4AF37] hover:bg-[#b8952b] text-black font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate & Save Proof'}
              </button>

              {!currentUser && (
                <LoginMenu
                  login={login}
                  isLoggingIn={isLoggingIn}
                  activeProvider={activeProvider}
                  label="Login"
                  fullWidth
                  align="left"
                  buttonClassName="bg-white/10 py-4 text-sm text-white hover:bg-white/15"
                />
              )}

              {isGenerated && shareUrl && (
                <div className="rounded-2xl border border-[#D4AF37]/20 bg-black/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white">
                    <Link2 className="h-4 w-4 text-[#D4AF37]" />
                    Shareable Proof Link
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    This certificate is saved on the server, available anytime by link, and can be downloaded as a polished PNG.
                  </p>
                  <div className="mt-4 rounded-xl border border-white/10 bg-[#050505] px-4 py-3 font-mono text-xs leading-relaxed text-gray-300 break-all">
                    {shareUrl}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                    >
                      <Link2 className="h-4 w-4" />
                      Copy Link
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#b8952b] sm:w-auto"
                    >
                      <Download className="h-4 w-4" />
                      Download PNG
                    </button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Shared Page
                    </a>
                  </div>
                  {shareStatus !== 'idle' ? (
                    <p className="mt-4 text-sm text-[#D4AF37]">
                      {shareStatus === 'copied' && 'Share link copied to clipboard.'}
                      {shareStatus === 'shared' && 'Share dialog opened successfully.'}
                      {shareStatus === 'error' && 'Share action failed. Please try again.'}
                    </p>
                  ) : null}
                  {storageProvider ? (
                    <p className="mt-4 text-xs leading-relaxed text-emerald-300">
                      Server storage active via {storageProvider === 'sqlite' ? 'SQLite' : 'Vercel Blob'}.
                    </p>
                  ) : null}
                </div>
              )}
            </form>
          </div>

          {/* Badge Preview */}
          <div className="flex justify-center md:justify-end">
            {isGenerated ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0, rotateY: -15 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
                <ProofBadge
                  name={name}
                  tokens={tokens}
                  shareUrl={shareUrl}
                  badgeRef={badgeRef}
                  metaLabel={updatedLabel}
                  proofCode={proofCode}
                  actions={
                    <>
                      <button onClick={handleShare} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white" title="Share link">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button onClick={handleDownload} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white" title="Download PNG">
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  }
                />
              </motion.div>
            ) : (
              <div className="w-full max-w-sm aspect-[3/4] rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                <Cpu className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-serif text-xl mb-2">Awaiting Data</p>
                <p className="text-sm">Submit your token consumption to generate your personalized Proof of Compute badge.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
