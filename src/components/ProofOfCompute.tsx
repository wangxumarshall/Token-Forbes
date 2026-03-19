import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Share2, Download, CheckCircle2, Loader2, Lock, Github, Shield, Terminal } from 'lucide-react';
import html2canvas from 'html2canvas';
import { formatNumber } from '../utils/format';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function ProofOfCompute() {
  const { currentUser, login, isLoggingIn } = useAuth();

  const [activeTab, setActiveTab] = useState<'form' | 'result'>('form');
  const [provider, setProvider] = useState<'OpenRouter' | 'Helicone' | 'Langfuse'>('OpenRouter');
  const [key1, setKey1] = useState('');
  const [key2, setKey2] = useState('');
  const [isBurning, setIsBurning] = useState(false);
  const [burnStep, setBurnStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [resultData, setResultData] = useState<{
    setScore: number;
    provider: string;
    rankText: string;
  } | null>(null);

  const badgeRef = useRef<HTMLDivElement>(null);

  const getTier = (tokens: number) => {
    if (tokens >= 1e12) return { title: 'Compute Giant', color: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/20' };
    if (tokens >= 1e9) return { title: 'Enterprise Whale', color: 'from-blue-500 to-cyan-400', shadow: 'shadow-blue-500/20' };
    if (tokens >= 1e6) return { title: 'Super Geek', color: 'from-[#D4AF37] to-yellow-600', shadow: 'shadow-[#D4AF37]/20' };
    return { title: 'Token Enthusiast', color: 'from-gray-300 to-gray-500', shadow: 'shadow-gray-500/20' };
  };

  const calculateGlobalRank = (score: number) => {
    if (score > 1000000000) return 'Top 0.1% Global';
    if (score > 10000000) return 'Top 1% Global';
    if (score > 1000000) return 'Top 5% Global';
    return 'Top 20% Global';
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setError(null);
    setIsBurning(true);
    setBurnStep('Fetching from API...');

    try {
      const res = await fetch('http://localhost:3001/api/generate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          provider,
          key_1: key1,
          key_2: key2,
          burn_after_reading: true
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      setBurnStep('Calculating SET Score...');

      // Simulate slight delay for dramatic effect
      await new Promise(resolve => setTimeout(resolve, 800));

      setBurnStep('Incinerating Key in Memory...');

      // Save to Firebase
      const score = data.set_score || 0;
      await setDoc(doc(db, 'proofs', currentUser.uid), {
        userId: currentUser.uid,
        name: currentUser.displayName,
        photoURL: currentUser.photoURL,
        tokens: score,
        provider: data.provider,
        timestamp: serverTimestamp(),
        sourceTag: 'Direct Disclosure'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      setResultData({
        setScore: score,
        provider: data.provider,
        rankText: calculateGlobalRank(score)
      });
      setActiveTab('result');
      
      // Clear keys from frontend memory
      setKey1('');
      setKey2('');

    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsBurning(false);
      setBurnStep('');
    }
  };

  const handleDownload = async () => {
    if (!badgeRef.current || !currentUser) return;
    try {
      const canvas = await html2canvas(badgeRef.current, { backgroundColor: null, scale: 2, useCORS: true });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `tokenrank-${currentUser.displayName?.replace(/\s+/g, '-').toLowerCase() || 'badge'}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error('Failed to download badge:', error);
    }
  };

  const handleShare = async () => {
    if (!badgeRef.current) return;
    try {
      const canvas = await html2canvas(badgeRef.current, { backgroundColor: null, scale: 2, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'proof-of-compute.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: 'My Proof of Compute', text: `I've proved my compute!`, files: [file] });
        } else {
          alert('Sharing files is not supported on this browser. Please use the download button instead.');
        }
      });
    } catch (error) {
      console.error('Failed to share badge:', error);
    }
  };

  return (
    <section className="py-24 bg-[#050505] relative overflow-hidden font-mono">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight flex items-center justify-center gap-3">
            <Terminal className="w-10 h-10 text-green-500" />
            证明你的 AI 算力 <span className="text-green-500 opacity-50">(Prove Your Compute)</span>
          </h2>
          <p className="text-gray-400">无状态内存级换算，绝对安全，阅后即焚。</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,255,0,0.03)]">
          <AnimatePresence mode="wait">
            {activeTab === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-8 md:p-12"
              >
                <form onSubmit={handleGenerate} className="space-y-8">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-xs text-green-500 mb-2 uppercase tracking-widest">Select Provider</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['OpenRouter', 'Helicone', 'Langfuse'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setProvider(p as any)}
                          className={`py-3 rounded-lg border text-sm font-bold transition-all ${
                            provider === p
                              ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                              : 'bg-black border-white/10 text-gray-500 hover:border-white/30'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* API Key Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-green-500 mb-2 uppercase tracking-widest">
                        {provider} {provider === 'Langfuse' ? 'Public Key' : 'API Key'}
                      </label>
                      <input
                        type="password"
                        value={key1}
                        onChange={(e) => setKey1(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-green-500 focus:shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all"
                        placeholder={provider === 'Langfuse' ? 'pk-...' : 'sk-...'}
                        required
                        disabled={!currentUser || isBurning}
                      />
                    </div>

                    {provider === 'Langfuse' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <label className="block text-xs text-green-500 mb-2 uppercase tracking-widest">Secret Key</label>
                        <input
                          type="password"
                          value={key2}
                          onChange={(e) => setKey2(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-green-500 focus:shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all"
                          placeholder="sk-..."
                          required
                          disabled={!currentUser || isBurning}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Burn After Reading Checkbox */}
                  <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div className="mt-1">
                      <div className="w-5 h-5 rounded border border-red-500/50 flex items-center justify-center bg-red-500/20">
                        <Lock className="w-3 h-3 text-red-500" />
                      </div>
                    </div>
                    <div>
                      <div className="text-red-400 font-bold uppercase tracking-wide text-sm flex items-center gap-2">
                        阅后即焚模式 <span className="text-xs opacity-60">(Burn After Reading)</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        系统抓取完数据后，立刻从内存中物理删除该 Key。不保留状态，仅此一次。
                      </p>
                    </div>
                  </div>

                  {/* GitHub Callout */}
                  <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">
                    <Github className="w-8 h-8 text-gray-500 shrink-0" />
                    <div>
                      <p>这就是我们在后端跑的代码，你可以亲自 Review，我们只抓取总数，绝不存储 Key。</p>
                      <a href="#" className="text-green-400 hover:text-green-300 flex items-center gap-1 mt-1 text-xs">
                        ➔ View tokenrank-fetcher on GitHub
                      </a>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                      Error: {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  {currentUser ? (
                    <button
                      type="submit"
                      disabled={isBurning || !key1 || (provider === 'Langfuse' && !key2)}
                      className="w-full relative group overflow-hidden rounded-lg disabled:opacity-50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-400 transition-transform group-hover:scale-105"></div>
                      <div className="relative px-8 py-4 bg-black/50 text-white font-bold tracking-widest uppercase flex items-center justify-center gap-3 backdrop-blur-sm">
                        {isBurning ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="animate-pulse">{burnStep}</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5 text-green-400" />
                            Sync & Generate Card
                          </>
                        )}
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={login}
                      disabled={isLoggingIn}
                      className="w-full bg-white text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                    >
                      {isLoggingIn && <Loader2 className="w-5 h-5 animate-spin" />}
                      Sign in with Google to Authenticate
                    </button>
                  )}
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 md:p-12 flex flex-col items-center"
              >
                {/* The Geek Card */}
                <div
                  ref={badgeRef}
                  className="w-full max-w-sm aspect-[3/4] rounded-2xl p-8 relative overflow-hidden bg-black border border-white/20 shadow-[0_0_50px_rgba(34,197,94,0.15)] flex flex-col"
                >
                  {/* Card Background Effects */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <Cpu className="w-8 h-8 text-green-500" />
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Source</div>
                      <div className="font-bold text-white tracking-wider">{resultData?.provider}</div>
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col justify-center text-center relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-2">{currentUser?.displayName}</h3>
                    <div className="inline-block px-4 py-1 rounded border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-widest mx-auto mb-8">
                      Token Billionaire
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tighter">
                        {formatNumber(resultData?.setScore || 0)}
                      </div>
                      <div className="text-xs text-green-500 font-bold tracking-widest">SET</div>
                    </div>
                    <div className="mt-4 text-xs text-gray-400 tracking-wider">
                      {resultData?.rankText}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-1 text-gray-500 text-[10px] uppercase tracking-widest">
                      <Shield className="w-3 h-3 text-green-500" />
                      <span>Verified</span>
                    </div>
                    <div className="flex gap-2" data-html2canvas-ignore>
                      <button onClick={handleShare} className="p-2 bg-white/5 hover:bg-white/10 rounded text-white" title="Share">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button onClick={handleDownload} className="p-2 bg-white/5 hover:bg-white/10 rounded text-white" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                <div className="mt-8 flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-3 rounded border border-green-400/20 text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p>Success! Your API Key has been permanently deleted from our server memory.</p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('form');
                    setResultData(null);
                    document.getElementById('rankings')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-8 text-gray-400 hover:text-white transition-colors text-sm underline underline-offset-4"
                >
                  Return to Leaderboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
