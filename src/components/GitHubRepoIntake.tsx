import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Database, Github, Link2, Loader2, Save, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { evaluateGitHubRepo, GitHubRepoEvaluation } from '../services/githubRankingService';
import { saveGitHubRanking } from '../services/leaderboardStore';
import { formatNumber, formatTokens } from '../utils/format';
import { normalizeAvatarUrl } from '../utils/avatar';

export default function GitHubRepoIntake() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<GitHubRepoEvaluation | null>(null);
  const { currentUser, login, isLoggingIn, activeProvider } = useAuth();

  const totalTokens = useMemo(
    () => evaluation?.individualEntities.reduce((sum, entity) => sum + entity.totalTokens, 0) ?? 0,
    [evaluation],
  );

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsEvaluating(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await evaluateGitHubRepo(repoUrl);
      setEvaluation(result);
    } catch (err: any) {
      setEvaluation(null);
      setError(err.message || 'Failed to evaluate repository.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSave = async () => {
    if (!evaluation) return;

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const docId = evaluation.repo.fullName.replace('/', '__').toLowerCase();
      const provider = await saveGitHubRanking({
        docId,
        repo: evaluation.repo,
        enterpriseEntity: evaluation.enterpriseEntity,
        individualEntities: evaluation.individualEntities,
        methodology: evaluation.methodology,
        updatedBy: currentUser
          ? {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
            }
          : undefined,
      });

      setSuccess(
        provider === 'sqlite'
          ? `Saved ${evaluation.repo.fullName} contributor ranking to the SQLite leaderboard database.`
          : provider === 'vercel-blob'
            ? `Saved ${evaluation.repo.fullName} contributor ranking to the live leaderboard database.`
            : `Saved ${evaluation.repo.fullName} contributor ranking to local browser storage.`,
      );
    } catch (err: any) {
      setError(err.message || 'Failed to save repository ranking.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section id="github-intake" className="py-24 border-t border-white/10 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
            GitHub <span className="text-[#D4AF37] italic">Repo Intake</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Paste any public GitHub repository URL. We convert the last 30 days of contributor commits, additions, and deletions into an AI coding leaderboard, then optionally sync it into the live database.
          </p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
          <form onSubmit={handleEvaluate} className="grid lg:grid-cols-[1fr_auto] gap-4 items-start">
            <div>
              <label className="block text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-3">
                Public GitHub Repository
              </label>
              <div className="relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/langchain-ai/langchain"
                  className="w-full bg-black border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Uses GitHub REST contributor stats. Large repos may take a few seconds while GitHub computes fresh aggregates.
              </p>
            </div>

            <button
              type="submit"
              disabled={isEvaluating}
              className="h-[58px] px-8 rounded-2xl bg-[#D4AF37] text-black font-bold flex items-center justify-center gap-2 hover:bg-[#b8952b] transition-colors disabled:opacity-60"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Evaluating
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Run GitHub Audit
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 bg-green-500/10 border border-green-500/20 text-green-300 rounded-2xl px-4 py-3 text-sm">
              {success}
            </div>
          )}

          {evaluation && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 space-y-8"
            >
              <div className="grid xl:grid-cols-[1.4fr_1fr] gap-6">
                <div className="bg-black/50 rounded-3xl border border-white/5 p-6">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={normalizeAvatarUrl(evaluation.repo.ownerAvatar, evaluation.repo.owner)}
                        alt={evaluation.repo.owner}
                        className="w-14 h-14 rounded-2xl border border-white/10 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 mb-1">
                          Repository Snapshot
                        </div>
                        <h3 className="text-2xl font-bold text-white">{evaluation.repo.fullName}</h3>
                        <a
                          href={evaluation.repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-400 hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          <Github className="w-4 h-4" />
                          Open on GitHub
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving || isLoggingIn}
                      className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save to Leaderboard
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-[#111] rounded-2xl border border-white/5 p-4">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Top Contributors</div>
                      <div className="text-xl font-mono text-white">{evaluation.individualEntities.length}</div>
                    </div>
                    <div className="bg-[#111] rounded-2xl border border-white/5 p-4">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Since Jan 2025</div>
                      <div className="text-xl font-mono text-[#D4AF37]">{formatTokens(totalTokens)}</div>
                    </div>
                    <div className="bg-[#111] rounded-2xl border border-white/5 p-4">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Stars</div>
                      <div className="text-xl font-mono text-white">{formatNumber(evaluation.repo.stars)}</div>
                    </div>
                    <div className="bg-[#111] rounded-2xl border border-white/5 p-4">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Repo AI Score</div>
                      <div className="text-xl font-mono text-white">{Math.round(evaluation.repo.aiNativeScore * 100)}%</div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/50 rounded-3xl border border-white/5 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-[#D4AF37]" />
                    <h4 className="text-lg font-bold text-white">Methodology Snapshot</h4>
                  </div>
                  <ol className="space-y-3 text-sm text-gray-300 leading-relaxed list-decimal list-inside">
                    {evaluation.methodology.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  {!currentUser && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => login('github')}
                        disabled={isLoggingIn}
                        className="text-xs text-[#D4AF37] hover:text-[#f1d77a] transition-colors disabled:opacity-50"
                      >
                        {isLoggingIn && activeProvider === 'github'
                          ? 'Connecting GitHub…'
                          : 'Attribute saved audits with GitHub'}
                      </button>
                      <button
                        type="button"
                        onClick={() => login('google')}
                        disabled={isLoggingIn}
                        className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {isLoggingIn && activeProvider === 'google'
                          ? 'Connecting Google…'
                          : 'or use Google'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-black/50 rounded-3xl border border-white/5 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-[11px] font-mono uppercase tracking-[0.25em] text-gray-500">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Contributor</div>
                  <div className="col-span-3 text-right">Total Since Jan 2025</div>
                  <div className="col-span-2 text-right">Avg Monthly</div>
                  <div className="col-span-2 text-right">Confidence</div>
                </div>
                <div className="divide-y divide-white/5">
                  {evaluation.individualEntities.map((entity) => (
                    <div key={entity.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/5 transition-colors">
                      <div className="col-span-1 font-serif text-xl text-gray-500">{entity.rank}</div>
                      <div className="col-span-4 flex items-center gap-3">
                        <img
                          src={normalizeAvatarUrl(entity.avatar, entity.name)}
                          alt={entity.name}
                          className="w-11 h-11 rounded-full border border-white/10 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="text-white font-semibold">{entity.name}</div>
                          <div className="text-xs text-gray-500">{entity.title}</div>
                        </div>
                      </div>
                      <div className="col-span-3 text-right font-mono text-[#D4AF37]">{formatTokens(entity.totalTokens)}</div>
                      <div className="col-span-2 text-right font-mono text-gray-300">{formatTokens(entity.tokensPerMonth)}</div>
                      <div className="col-span-2 text-right font-mono text-gray-500">±{entity.confidenceInterval}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
