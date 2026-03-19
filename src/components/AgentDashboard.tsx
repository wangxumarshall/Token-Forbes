import { useState } from 'react';
import { motion } from 'motion/react';
import { Database, Search, Cpu, RefreshCw, CheckCircle2, AlertCircle, Link2, MapPin } from 'lucide-react';
import { AI_CONFIG_ERROR, defaultAiModelLabel, isAiConfigured, locateDataCenters, runDataEngineEvaluation } from '../services/geminiService';
import { formatTokens } from '../utils/format';

export default function AgentDashboard() {
  const [entityName, setEntityName] = useState('');
  const [company, setCompany] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [mapsResult, setMapsResult] = useState<any>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName || !company || !isAiConfigured) return;

    setIsEvaluating(true);
    setResult(null);
    setError(null);
    setLogs([]);
    setMapsResult(null);

    try {
      addLog(`Initializing Data Engine for ${entityName} (${company})...`);
      addLog(`Connecting to OpenRouter (${defaultAiModelLabel})...`);
      addLog(`Scanning public web sources, infra announcements, and company disclosures...`);
      addLog(`Analyzing proxy indicators (DAU, GPU clusters, R&D headcount)...`);
      
      const evalResult = await runDataEngineEvaluation(entityName, company);
      
      addLog(`Evaluation complete. Confidence Interval: ±${evalResult.confidenceInterval}%`);
      setResult(evalResult);

      addLog(`Locating related data centers and infrastructure footprints...`);
      const mapsData = await locateDataCenters(company);
      setMapsResult(mapsData);
      addLog(`Infrastructure scan complete.`);

    } catch (err: any) {
      setError(err.message || 'An error occurred during evaluation.');
      addLog(`ERROR: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto my-16">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-[#D4AF37]/10 rounded-xl">
          <Database className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-white">Data Engine Agent</h2>
          <p className="text-gray-400 text-sm">Autonomous token consumption evaluation system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="bg-black/50 p-6 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              Target Entity
            </h3>
            {!isAiConfigured && (
              <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {AI_CONFIG_ERROR}
              </div>
            )}
            <form onSubmit={handleEvaluate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Entity Name (Person/Project)</label>
                <input
                  type="text"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="e.g., Sam Altman"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  required
                  disabled={!isAiConfigured}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Company / Organization</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., OpenAI"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  required
                  disabled={!isAiConfigured}
                />
              </div>
              <button
                type="submit"
                disabled={isEvaluating || !isAiConfigured}
                className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-lg hover:bg-[#b8952b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <Cpu className="w-5 h-5" />
                    Run Evaluation
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Terminal Logs */}
          <div className="bg-black p-4 rounded-xl border border-white/10 font-mono text-xs h-64 overflow-y-auto">
            <div className="text-gray-500 mb-2">// Agent Execution Logs</div>
            {logs.map((log, i) => (
              <div key={i} className={log.includes('ERROR') ? 'text-red-400' : 'text-green-400'}>
                {log}
              </div>
            ))}
            {isEvaluating && (
              <div className="text-green-400/50 animate-pulse">_</div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Evaluation Results
          </h3>
          
          {error ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-red-400">
              <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
              <p>{error}</p>
            </div>
          ) : result ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 flex-1"
            >
              <div className="bg-black/50 p-4 rounded-lg border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Estimated Monthly Burn</div>
                <div className="text-3xl font-mono font-bold text-[#D4AF37]">
                  {formatTokens(result.estimatedTokensPerMonth)}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Confidence Interval: ±{result.confidenceInterval}%
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Source Tag</div>
                <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-gray-300">
                  {result.sourceTag}
                </span>
              </div>

              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Agent Reasoning</div>
                <p className="text-sm text-gray-300 leading-relaxed bg-black/30 p-4 rounded-lg border border-white/5">
                  {result.reasoning}
                </p>
              </div>

              {mapsResult && (mapsResult.text || mapsResult.links?.length) && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Infrastructure Locations
                  </div>
                  {mapsResult.text && (
                    <p className="text-sm text-gray-300 leading-relaxed bg-black/30 p-4 rounded-lg border border-white/5 mb-3">
                      {mapsResult.text}
                    </p>
                  )}
                  {mapsResult.links?.length > 0 && (
                    <ul className="space-y-2">
                      {mapsResult.links.map((link: any, idx: number) => (
                        <li key={`${link.url}-${idx}`}>
                          <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
              <Database className="w-12 h-12 mb-4 opacity-20" />
              <p>
                {isAiConfigured
                  ? 'Enter an entity and run the evaluation to see real-time token consumption estimates.'
                  : 'Add OpenRouter configuration to enable the live data engine.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
