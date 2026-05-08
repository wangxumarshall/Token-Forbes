import { Target, Compass, Divide, Calculator, FileSearch, ShieldCheck, Database, Search, Users, Github } from 'lucide-react';

export default function Methodology() {
  return (
    <section id="methodology" className="py-24 bg-[#0a0a0a] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
            Our <span className="text-[#D4AF37] italic">Methodology</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Anchoring the new wealth standard of the digital age through rigorous data acquisition and estimation.
          </p>
        </div>

        {/* The Deep Value */}
        <div className="mb-20">
          <h3 className="text-2xl font-serif font-bold text-white mb-8 border-b border-white/10 pb-4">The Deep Value of Token Forbes</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#111] p-8 rounded-2xl border border-white/10">
              <Target className="w-8 h-8 text-[#D4AF37] mb-6" />
              <h4 className="text-xl font-bold text-white mb-4">The New Wealth Standard</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Past rich lists looked at assets and cash flow. The future digital power list looks at how much of humanity's condensed knowledge (Tokens) you can mobilize.
              </p>
            </div>
            <div className="bg-[#111] p-8 rounded-2xl border border-white/10">
              <Compass className="w-8 h-8 text-blue-500 mb-6" />
              <h4 className="text-xl font-bold text-white mb-4">Industry Wind Vane</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Spikes in token consumption directly correspond to the most potential and dynamic AI tracks today, such as embodied AI and automated code generation.
              </p>
            </div>
            <div className="bg-[#111] p-8 rounded-2xl border border-white/10">
              <Divide className="w-8 h-8 text-purple-500 mb-6" />
              <h4 className="text-xl font-bold text-white mb-4">Quantifying the Compute Divide</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                Visually demonstrating the gap between the world's top minds and ordinary individuals in the allocation and deployment of AI resources.
              </p>
            </div>
          </div>
        </div>

        {/* The Data Engine */}
        <div className="mb-20">
          <h3 className="text-2xl font-serif font-bold text-white mb-8 border-b border-white/10 pb-4">The Data Engine: How We Calculate</h3>
          <p className="text-gray-400 mb-8 max-w-4xl leading-relaxed">
            Outputting individual and enterprise lists requires overcoming extreme data acquisition challenges. We now blend public GitHub contributor statistics, self-reported proofs, partner data, strong proxy variables, and model-based estimation across four main paths:
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#111] p-8 rounded-2xl border border-white/10">
              <Calculator className="w-8 h-8 text-emerald-500 mb-6" />
              <h4 className="text-xl font-bold text-white mb-4">1. Proxy Indicator Deduction</h4>
              <div className="text-xs text-[#D4AF37] uppercase tracking-wider mb-3">For Compute Giants</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                <strong>Compute Conversion:</strong> We collect public cluster sizes (e.g., 350k H100s) and calculate token processing volume for large training runs.<br/><br/>
                <strong>Ownership Attribution:</strong> Macro consumption is mapped to core leaders based on shareholding or control weights.
              </p>
            </div>
            <div className="bg-[#111] p-8 rounded-2xl border border-white/10">
              <FileSearch className="w-8 h-8 text-orange-500 mb-6" />
              <h4 className="text-xl font-bold text-white mb-4">2. Financial Reverse Engineering</h4>
              <div className="text-xs text-[#D4AF37] uppercase tracking-wider mb-3">For Enterprise Whales</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                <strong>Cloud Bill Parsing:</strong> Tracking public cloud spend, deducting storage/bandwidth, and reverse-engineering consumption via API pricing.<br/><br/>
                <strong>Funding Scale:</strong> Analyzing early-stage AI startup funding vs. DAU to model their underlying token burn rate.
              </p>
            </div>
            <div className="bg-[#111] p-8 rounded-2xl border border-white/10">
              <ShieldCheck className="w-8 h-8 text-pink-500 mb-6" />
              <h4 className="text-xl font-bold text-white mb-4">3. Proof of Compute Protocol</h4>
              <div className="text-xs text-[#D4AF37] uppercase tracking-wider mb-3">For Super Geeks & Devs</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                <strong>Social Monetization:</strong> A verified certification system allowing users to input daily/monthly consumption. We issue "Token Billionaire" virtual badges and social share cards to incentivize global developers to join the leaderboard.
              </p>
            </div>
            <div className="bg-[#111] p-8 rounded-2xl border border-white/10 md:col-span-3">
              <Github className="w-8 h-8 text-violet-400 mb-6" />
              <h4 className="text-xl font-bold text-white mb-4">4. Public GitHub Proxy Ranking</h4>
              <div className="text-xs text-[#D4AF37] uppercase tracking-wider mb-3">For Open Source AI Builders</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                <strong>Contributor Stats:</strong> We ingest public repository URLs, then use GitHub’s contributor stats to collect 52-week commits, additions and deletions per developer.<br/><br/>
                <strong>Token Conversion:</strong> Effective changed lines are converted into estimated AI coding tokens using repo-type priors, AI-native topic detection, and maintainer iteration multipliers.
              </p>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div>
          <h3 className="text-2xl font-serif font-bold text-white mb-8 border-b border-white/10 pb-4">Data Sources & Priority</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-[#111] p-6 rounded-xl border border-white/5">
              <Database className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h5 className="text-white font-bold mb-1">Direct / Official Disclosure & API Partners (High Trust)</h5>
                <p className="text-gray-400 text-sm">Annual/quarterly reports, SEC filings (EDGAR), API partnership statements, and aggregated, anonymized data sharing with major model/cloud providers under NDA.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-[#111] p-6 rounded-xl border border-white/5">
              <Search className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h5 className="text-white font-bold mb-1">External Proxy Indicators (Publicly Crawlable)</h5>
                <p className="text-gray-400 text-sm">Product DAU, request volumes, AI/ML engineer headcounts, R&D spend, public bidding, cloud consumption rankings, and data center capacity (satellite imagery).</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-[#111] p-6 rounded-xl border border-white/5">
              <Users className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h5 className="text-white font-bold mb-1">Third-Party Data & Self-Reporting</h5>
                <p className="text-gray-400 text-sm">Market research institutions, supply chain reports, controlled questionnaires for high-value teams, and public news events regarding deployment scales.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
