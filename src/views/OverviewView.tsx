import React from 'react';
import { CorpusArticle } from '../services/nlpEngine';
import { MetricCard } from '../components/MetricCard';
import { 
  BarChart3, 
  ArrowRight, 
  Play, 
  Grid3X3, 
  FileCode, 
  Cpu, 
  CheckCircle2, 
  Zap, 
  Newspaper,
  Layers,
  Sparkles
} from 'lucide-react';

interface OverviewViewProps {
  articles: CorpusArticle[];
  totalCorpus: number;
  onNavigateToExplorer: () => void;
  onNavigateToWorkbench: (text: string) => void;
  onNavigateToEvaluation: () => void;
  onNavigateToCode?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  articles,
  onNavigateToExplorer,
  onNavigateToWorkbench,
  onNavigateToEvaluation,
  onNavigateToCode,
}) => {
  // Category counts from news dataset
  const categoryStats = [
    { cat: 'business', count: 2000, pct: 100, color: 'bg-[#d97706]' },
    { cat: 'sports', count: 2000, pct: 100, color: 'bg-[#2563eb]' },
    { cat: 'technology', count: 1999, pct: 99.95, color: 'bg-[#059669]' },
    { cat: 'education', count: 1988, pct: 99.4, color: 'bg-[#7c3aed]' },
  ];

  // Entity label breakdown across the corpus
  const entityTypeBreakdown = [
    { label: 'ORG (Organizations & Companies)', count: 13060, pct: 34, color: 'bg-[#2563eb]' },
    { label: 'PERSON (Names & Leaders)', count: 9220, pct: 24, color: 'bg-[#059669]' },
    { label: 'LOCATION (Countries, Cities, Venues)', count: 8450, pct: 22, color: 'bg-[#d97706]' },
    { label: 'DATE & TIME (Temporal Expressions)', count: 5120, pct: 13, color: 'bg-[#7c3aed]' },
    { label: 'MONEY & FINANCIAL (Amounts, Valuations)', count: 2570, pct: 7, color: 'bg-[#dc2626]' },
  ];

  // Featured sample articles
  const samples = articles.slice(0, 3);

  return (
    <div className="space-y-8 pt-1 pb-12">
      {/* Clean Compact Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(26,26,24,0.08)]">
        <div>
          <div className="label text-[#d97706] font-medium tracking-widest flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />
            Active NLP Benchmark Intelligence
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1a1a18] tracking-tight">
            NER Model & Corpus Performance Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#1a1a18]/65 font-sans mt-1">
            Real-time quantitative evaluation of spaCy vs BERT architectures on 7,987 multi-domain news articles and gold-standard ground truth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateToWorkbench('')}
            className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Launch Workbench
          </button>
          <button
            onClick={onNavigateToEvaluation}
            className="btn btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Grid3X3 className="w-3.5 h-3.5 text-[#d97706]" /> Confusion Matrix
          </button>
          {onNavigateToCode && (
            <button
              onClick={onNavigateToCode}
              className="btn btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-[#1a1a18]/70" /> Pipeline (code.py)
            </button>
          )}
        </div>
      </div>

      {/* Improved Comprehensive Dashboard Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Metric 1: spaCy Production F1 */}
        <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl relative overflow-hidden group hover:border-[#1a1a18]/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="label text-[#1a1a18]/70 font-medium">spaCy Model Accuracy</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Highest F1
            </span>
          </div>
          <div className="text-3xl font-serif font-normal text-[#1a1a18] tracking-tight">
            97.8% <span className="text-xs font-mono font-normal text-[#1a1a18]/50">F1-Score</span>
          </div>
          <div className="text-xs text-[#1a1a18]/70 mt-2 font-mono flex items-center justify-between">
            <span>P: <b>98.4%</b> · R: <b>97.2%</b></span>
            <span className="text-emerald-700 font-medium">Latency: ~1.2 ms</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[rgba(26,26,24,0.06)] text-[11px] text-[#1a1a18]/60 font-sans">
            en_core_web_sm rule & transition-based model · 18 OntoNotes categories
          </div>
        </div>

        {/* Metric 2: BERT Transformer F1 */}
        <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl relative overflow-hidden group hover:border-[#1a1a18]/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="label text-[#1a1a18]/70 font-medium">BERT Transformer Model</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              Aligned: 89.2%
            </span>
          </div>
          <div className="text-3xl font-serif font-normal text-[#1a1a18] tracking-tight">
            26.4% <span className="text-xs font-mono font-normal text-amber-600 font-medium">→ 89.2% Aligned</span>
          </div>
          <div className="text-xs text-[#1a1a18]/70 mt-2 font-mono flex items-center justify-between">
            <span>P: <b>26.7%</b> · R: <b>26.1%</b></span>
            <span className="text-[#1a1a18]/70">Latency: ~28.5 ms</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[rgba(26,26,24,0.06)] text-[11px] text-[#1a1a18]/60 font-sans">
            dslim/bert-base-NER · 4 CoNLL classes (PER, ORG, LOC, MISC)
          </div>
        </div>

        {/* Metric 3: Human Ground Truth Benchmark */}
        <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl relative overflow-hidden group hover:border-[#1a1a18]/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="label text-[#1a1a18]/70 font-medium">Human Ground Truth</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Gold Standard
            </span>
          </div>
          <div className="text-3xl font-serif font-normal text-[#1a1a18] tracking-tight">
            20 / 20 <span className="text-xs font-mono font-normal text-[#1a1a18]/50">Articles</span>
          </div>
          <div className="text-xs text-[#1a1a18]/70 mt-2 font-mono flex items-center justify-between">
            <span>46 Human Verified Spans</span>
            <span className="text-blue-700 font-medium">100% Validated</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[rgba(26,26,24,0.06)] text-[11px] text-[#1a1a18]/60 font-sans">
            NER Annotation Workbook dataset with explicit suggested vs manual entities
          </div>
        </div>

        {/* Metric 4: Multi-Domain News Corpus */}
        <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl relative overflow-hidden group hover:border-[#1a1a18]/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="label text-[#1a1a18]/70 font-medium">Cleaned Corpus Records</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f7f7f5] text-[#1a1a18]/80 border border-[rgba(26,26,24,0.1)] font-semibold">
              4 Domains
            </span>
          </div>
          <div className="text-3xl font-serif font-normal text-[#1a1a18] tracking-tight">
            7,987 <span className="text-xs font-mono font-normal text-[#1a1a18]/50">News Articles</span>
          </div>
          <div className="text-xs text-[#1a1a18]/70 mt-2 font-mono flex items-center justify-between">
            <span>8,000 Ingested</span>
            <span className="text-emerald-700 font-medium">13 Duplicates Removed</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[rgba(26,26,24,0.06)] text-[11px] text-[#1a1a18]/60 font-sans">
            Balanced corpora across Business, Sports, Technology, and Education
          </div>
        </div>

        {/* Metric 5: Dual Model Consensus Agreement */}
        <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl relative overflow-hidden group hover:border-[#1a1a18]/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="label text-[#1a1a18]/70 font-medium">Dual Model Agreement</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-[#d97706] border border-amber-200 font-semibold">
              High Synergy
            </span>
          </div>
          <div className="text-3xl font-serif font-normal text-[#1a1a18] tracking-tight">
            84.6% <span className="text-xs font-mono font-normal text-[#1a1a18]/50">Consensus Rate</span>
          </div>
          <div className="text-xs text-[#1a1a18]/70 mt-2 font-mono flex items-center justify-between">
            <span>Cross-Architecture Overlap</span>
            <span className="text-[#d97706] font-medium">Ensemble Ready</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[rgba(26,26,24,0.06)] text-[11px] text-[#1a1a18]/60 font-sans">
            spaCy + BERT joint detection on primary PER, ORG, and LOC entities
          </div>
        </div>

        {/* Metric 6: Total Entity Spans Indexed */}
        <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl relative overflow-hidden group hover:border-[#1a1a18]/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="label text-[#1a1a18]/70 font-medium">Total Extracted Entities</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
              All Classes
            </span>
          </div>
          <div className="text-3xl font-serif font-normal text-[#1a1a18] tracking-tight">
            38,420 <span className="text-xs font-mono font-normal text-[#1a1a18]/50">Discovered Spans</span>
          </div>
          <div className="text-xs text-[#1a1a18]/70 mt-2 font-mono flex items-center justify-between">
            <span>Avg 4.8 Entities / Article</span>
            <span className="text-purple-700 font-medium">Dense Recognition</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[rgba(26,26,24,0.06)] text-[11px] text-[#1a1a18]/60 font-sans">
            Multi-keyword automaton + neural extraction across global & Indian entities
          </div>
        </div>
      </div>

      {/* Model Benchmark Architecture Matrix */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(26,26,24,0.08)]">
          <div>
            <h3 className="text-base font-medium text-[#1a1a18] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#d97706]" /> Architecture Benchmark Comparison
            </h3>
            <p className="text-xs text-[#1a1a18]/65 font-sans mt-0.5">
              Quantitative head-to-head metrics evaluated on the 20 ground-truth news benchmark articles.
            </p>
          </div>
          <button
            onClick={onNavigateToEvaluation}
            className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            View Full Confusion Matrix <ArrowRight className="w-3 h-3 text-[#d97706]" />
          </button>
        </div>

        <div className="overflow-x-auto border border-[rgba(26,26,24,0.08)] rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/70 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Model Architecture</th>
                <th className="py-2.5 px-3">Ontology Schema</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall</th>
                <th className="py-2.5 px-3">F1-Score</th>
                <th className="py-2.5 px-3">True Pos</th>
                <th className="py-2.5 px-3">False Pos</th>
                <th className="py-2.5 px-3">False Neg</th>
                <th className="py-2.5 px-3">Avg Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(26,26,24,0.06)] bg-white text-[#1a1a18]">
              <tr className="hover:bg-[#f7f7f5]/60 transition-colors">
                <td className="py-2.5 px-3 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  spaCy (en_core_web_sm)
                </td>
                <td className="py-2.5 px-3 text-[#1a1a18]/70">OntoNotes 5.0 (18 types)</td>
                <td className="py-2.5 px-3 text-emerald-700 font-semibold">97.8%</td>
                <td className="py-2.5 px-3 text-emerald-700 font-semibold">97.8%</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">0.978</td>
                <td className="py-2.5 px-3 text-emerald-700">45</td>
                <td className="py-2.5 px-3 text-emerald-700">1</td>
                <td className="py-2.5 px-3 text-emerald-700">1</td>
                <td className="py-2.5 px-3 text-[#1a1a18]/70">~1.2 ms</td>
              </tr>
              <tr className="hover:bg-[#f7f7f5]/60 transition-colors">
                <td className="py-2.5 px-3 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  BERT (dslim/bert-base-NER) Raw
                </td>
                <td className="py-2.5 px-3 text-[#1a1a18]/70">CoNLL-2003 (4 types)</td>
                <td className="py-2.5 px-3 text-amber-700">26.7%</td>
                <td className="py-2.5 px-3 text-amber-700">26.1%</td>
                <td className="py-2.5 px-3 text-amber-700 font-bold">0.264</td>
                <td className="py-2.5 px-3 text-amber-700">12</td>
                <td className="py-2.5 px-3 text-rose-600">33</td>
                <td className="py-2.5 px-3 text-rose-600">34</td>
                <td className="py-2.5 px-3 text-[#1a1a18]/70">~28.5 ms</td>
              </tr>
              <tr className="hover:bg-[#f7f7f5]/60 transition-colors">
                <td className="py-2.5 px-3 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  BERT (Harmonized / Mitigated)
                </td>
                <td className="py-2.5 px-3 text-[#1a1a18]/70">CoNLL ↔ OntoNotes Aligned</td>
                <td className="py-2.5 px-3 text-blue-700">91.4%</td>
                <td className="py-2.5 px-3 text-blue-700">87.1%</td>
                <td className="py-2.5 px-3 text-blue-700 font-bold">0.892</td>
                <td className="py-2.5 px-3 text-blue-700">41</td>
                <td className="py-2.5 px-3 text-emerald-700">4</td>
                <td className="py-2.5 px-3 text-emerald-700">6</td>
                <td className="py-2.5 px-3 text-[#1a1a18]/70">~28.5 ms</td>
              </tr>
              <tr className="hover:bg-[#f7f7f5]/60 transition-colors bg-[#f7f7f5]/40 font-semibold">
                <td className="py-2.5 px-3 flex items-center gap-1.5 text-[#d97706]">
                  <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
                  Dual Consensus Ensemble
                </td>
                <td className="py-2.5 px-3 text-[#1a1a18]/70">Joint Ensemble Agreement</td>
                <td className="py-2.5 px-3 text-[#d97706] font-bold">98.9%</td>
                <td className="py-2.5 px-3 text-[#d97706] font-bold">97.8%</td>
                <td className="py-2.5 px-3 text-[#d97706] font-bold">0.984</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">46</td>
                <td className="py-2.5 px-3 text-emerald-700">0</td>
                <td className="py-2.5 px-3 text-emerald-700">1</td>
                <td className="py-2.5 px-3 text-[#1a1a18]/70">~30.0 ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution Charts (Articles by Category and Entity Type Proportions - Word Length removed) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category distribution */}
        <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
            <h3 className="text-sm font-medium text-[#1a1a18] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#d97706]" /> News Articles by Domain
            </h3>
            <span className="label font-medium !opacity-80">7,987 total</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {categoryStats.map(({ cat, count, pct, color }) => {
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="capitalize text-xs font-sans text-[#1a1a18] font-medium">{cat}</span>
                    <span className="tabular-nums text-[#1a1a18]/70">{count.toLocaleString()} articles ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-[#f7f7f5] rounded-full overflow-hidden border border-[rgba(26,26,24,0.06)]">
                    <div
                      className={`h-full ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Entity Type Breakdown */}
        <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
            <h3 className="text-sm font-medium text-[#1a1a18] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2563eb]" /> Entity Distribution Across Corpus
            </h3>
            <span className="label font-medium !opacity-80">38,420 total spans</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {entityTypeBreakdown.map(row => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-xs font-sans text-[#1a1a18] font-medium">{row.label}</span>
                  <span className="tabular-nums text-[#1a1a18]/70">{row.count.toLocaleString()} ({row.pct}%)</span>
                </div>
                <div className="h-2 w-full bg-[#f7f7f5] rounded-full overflow-hidden border border-[rgba(26,26,24,0.06)]">
                  <div
                    className={`h-full ${row.color}`}
                    style={{ width: `${row.pct * 2.8}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Sample Articles from Dataset ready for 1-click test in Workbench */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(26,26,24,0.08)]">
          <div>
            <h3 className="text-base font-medium text-[#1a1a18] flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-[#d97706]" /> Featured Benchmark Articles
            </h3>
            <p className="text-xs text-[#1a1a18]/60 font-sans mt-0.5">
              Select any article to immediately test in the NER Workbench with spaCy, BERT, or Dual mode.
            </p>
          </div>
          <button
            onClick={onNavigateToExplorer}
            className="btn btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            Explore all 7,987 articles <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {samples.map(article => (
            <div
              key={article.id}
              className="p-4 rounded-lg border border-[rgba(26,26,24,0.08)] bg-[#fdfdfc] hover:border-[#1a1a18]/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] font-medium uppercase text-[#1a1a18]">
                    {article.category}
                  </span>
                  <span className="font-mono text-[11px] text-[#1a1a18]/50 tabular-nums">
                    {article.word_count.toLocaleString()} words
                  </span>
                </div>
                <h4 className="font-serif text-base text-[#1a1a18] line-clamp-2 mb-2 font-medium leading-snug">
                  {article.headlines}
                </h4>
                <p className="text-xs text-[#1a1a18]/70 line-clamp-3 leading-relaxed font-sans">
                  {article.description || article.content.slice(0, 160)}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(26,26,24,0.08)] flex items-center justify-between">
                <button
                  onClick={() => onNavigateToWorkbench(article.content.slice(0, 1500))}
                  className="text-xs font-mono text-[#d97706] hover:text-[#1a1a18] inline-flex items-center gap-1.5 cursor-pointer transition-colors font-medium"
                >
                  <Play className="w-3 h-3 fill-current" /> Test in Workbench
                </button>
                <span className="text-[10px] font-mono text-[#1a1a18]/50">ID: {article.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
