import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Cpu, Share2, Download, CheckCircle2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { formatNumber } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const withTimeout = <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
};

export default function ProofOfCompute() {
  const { currentUser, login, isLoggingIn } = useAuth();
  const [tokens, setTokens] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errorToThrow, setErrorToThrow] = useState<Error | null>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  if (errorToThrow) {
    throw errorToThrow;
  }

  useEffect(() => {
    async function fetchExistingProof() {
      if (!currentUser) {
        setIsGenerated(false);
        setTokens('');
        setName('');
        return;
      }

      setIsLoadingData(true);
      const path = `proofs/${currentUser.uid}`;
      try {
        const docRef = doc(db, 'proofs', currentUser.uid);
        const docSnap = await withTimeout(
          getDoc(docRef),
          5000,
          "the client is offline"
        );
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || '');
          setTokens(formatNumber(data.tokens || 0));
          setIsGenerated(true);
        } else {
          setName(currentUser.displayName || '');
        }
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (e) {
          setErrorToThrow(e as Error);
        }
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchExistingProof();
  }, [currentUser]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      await login();
      return;
    }

    if (tokens && name) {
      setIsSaving(true);
      const numTokens = parseInt(tokens.replace(/,/g, '')) || 0;
      const path = `proofs/${currentUser.uid}`;
      
      try {
        await withTimeout(
          setDoc(doc(db, 'proofs', currentUser.uid), {
            name,
            tokens: numTokens,
            updatedAt: serverTimestamp(),
            userId: currentUser.uid,
            photoURL: currentUser.photoURL
          }),
          5000,
          "the client is offline"
        );
        setIsGenerated(true);
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.WRITE, path);
        } catch (e) {
          setErrorToThrow(e as Error);
        }
      } finally {
        setIsSaving(false);
      }
    }
  };

  const getBadgeTier = (numTokens: number) => {
    if (numTokens >= 1e9) return { title: 'Token Billionaire', color: 'from-[#D4AF37] to-[#8c7324]', shadow: 'shadow-[#D4AF37]/50' };
    if (numTokens >= 1e6) return { title: 'Token Millionaire', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/50' };
    return { title: 'Token Enthusiast', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/50' };
  };

  const numTokens = parseInt(tokens.replace(/,/g, '')) || 0;
  const tier = getBadgeTier(numTokens);

  const handleDownload = async () => {
    if (!badgeRef.current) return;
    try {
      const canvas = await html2canvas(badgeRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `token-forbes-proof-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error('Failed to download badge:', error);
    }
  };

  const handleShare = async () => {
    if (!badgeRef.current) return;
    try {
      const canvas = await html2canvas(badgeRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'proof-of-compute.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My Proof of Compute',
            text: `I've consumed ${tokens} tokens! Check out my Token Forbes ranking.`,
            files: [file]
          });
        } else {
          // Fallback
          alert('Sharing files is not supported on this browser. Please use the download button instead.');
        }
      });
    } catch (error) {
      console.error('Failed to share badge:', error);
    }
  };

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
            Claim Your <span className="text-[#D4AF37] italic">Digital Wealth</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            In the AI era, compute is the new currency. Submit your monthly API usage, generate your Proof of Compute badge, and join the ranks of the Token Forbes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Form */}
          <div className="bg-[#111] p-8 rounded-2xl border border-white/10 shadow-2xl relative">
            {isLoadingData && (
              <div className="absolute inset-0 bg-[#111]/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
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
                  disabled={!currentUser}
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
                    disabled={!currentUser}
                  />
                  <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
                <p className="mt-2 text-xs text-gray-500">Aggregate your usage across OpenAI, Anthropic, Google, etc.</p>
              </div>

              {currentUser ? (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#D4AF37] hover:bg-[#b8952b] text-black font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate & Save Proof'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={login}
                  disabled={isLoggingIn}
                  className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70"
                >
                  {isLoggingIn && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isLoggingIn ? 'Signing in...' : 'Sign in with Google to Generate'}
                </button>
              )}
            </form>
          </div>

          {/* Badge Preview */}
          <div className="flex justify-center">
            {isGenerated ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0, rotateY: -15 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className={`w-full max-w-sm aspect-[3/4] rounded-3xl p-1 bg-gradient-to-br ${tier.color} ${tier.shadow} shadow-2xl relative group`}
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay rounded-3xl pointer-events-none" />
                
                <div ref={badgeRef} className="w-full h-full bg-[#0a0a0a] rounded-[22px] p-8 flex flex-col relative overflow-hidden">
                  {/* Holographic effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 translate-x-[-100%] group-hover:translate-x-[100%] pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-8">
                    <Cpu className={`w-8 h-8 text-transparent bg-clip-text bg-gradient-to-br ${tier.color}`} />
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Verified By</div>
                      <div className="font-serif text-sm font-bold text-white">Token Forbes</div>
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col justify-center text-center">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-6 font-mono">Certificate of Compute</div>
                    <h3 className="text-3xl font-serif font-bold text-white mb-4">{name}</h3>
                    <div className={`inline-block px-4 py-1.5 rounded-full bg-gradient-to-r ${tier.color} text-black text-xs font-bold uppercase tracking-widest mx-auto mb-8 shadow-lg`}>
                      {tier.title}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 uppercase tracking-widest">Monthly Burn Rate</div>
                      <div className="font-mono text-4xl font-bold text-white tracking-tighter">
                        {tokens}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">SET (Standard Equivalent Tokens)</div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-green-500 text-xs font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Proof Validated</span>
                    </div>
                    <div className="flex gap-3" data-html2canvas-ignore>
                      <button onClick={handleShare} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white" title="Share">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button onClick={handleDownload} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
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
