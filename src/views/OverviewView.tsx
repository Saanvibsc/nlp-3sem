import React from 'react';
import { CorpusArticle, NOTEBOOK_DATA } from '../services/nlpEngine';
import { MetricCard } from '../components/MetricCard';
import { Sparkles, Newspaper, BarChart3, ArrowRight, Grid3X3, CheckCircle2, Cpu, Zap, FileSpreadsheet } from 'lucide-react';

interface OverviewViewProps {
  articles: CorpusArticle[];
  totalCorpus: number;
  onNavigateToExplorer: () => void;
  onNavigateToWorkbench: (text: string) => void;
  onNavigateToEvaluation: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  articles,
  onNavigateToExplorer,
  onNavigateToWorkbench,
  onNavigateToEvaluation,
}) => {
  // Categories and exact counts from code.py Section 4 & 6
  const categoryStats = [
    { cat: 'business', count: 2000, pct: 25.04 },
    { cat: 'sports', count: 2000, pct: 25.04 },
    { cat: 'technology', count: 1999, pct: 25.03 },
    { cat: 'education', count: 1988, pct: 24.89 },
  ];

  // Featured sample articles (3 items)
  const samples = articles.slice(0, 3);

  return (
    <div className="space-y-6 pt-2 pb-8">
      {/* Hero Banner with explicit margins and clear typography */}
      <div className="rounded-2xl p-7 md:p-8 text-white bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 shadow-lg shadow-emerald-950/20 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Notebook Code.py · Named Entity Recognition on News Text
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            Named Entity Recognition on News Text
          </h1>
          <p className="text-emerald-100 text-xs md:text-sm leading-relaxed max-w-2xl">
            Automated entity extraction comparing fast rule-based <b>spaCy (en_core_web_sm)</b> with deep transformer <b>BERT (dslim/bert-base-NER)</b> across multi-category news corpora, quantitatively benchmarked against 20 human-verified ground-truth articles.
          </p>
        </div>
      </div>

      {/* Feature Action Banners: Direct links to the requested core features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Confusion Matrix & Metrics Callout Card */}
        <div
          onClick={onNavigateToEvaluation}
          className="bg-gradient-to-br from-white to-emerald-50/40 border border-emerald-200 rounded-xl p-5 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Notebook Sections 11–15 & 18
              </span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Open Matrix & Report <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-emerald-600" />
              Confusion Matrix, Precision, Recall & F1 Evaluation
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Complete evaluation on the 20 ground-truth articles: Multi-class heatmap, error diagnostics (BERT FP: 33, FN: 34), and exact F1 scores.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-100/80 flex items-center gap-4 text-xs font-mono font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-600" /> spaCy F1: <b className="text-emerald-800">0.978</b>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-indigo-600" /> BERT F1: <b className="text-indigo-800">0.264</b>
            </span>
          </div>
        </div>

        {/* Article Explorer Instant Classification Callout Card */}
        <div
          onClick={onNavigateToExplorer}
          className="bg-gradient-to-br from-white to-indigo-50/40 border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                Live Article Classifier
              </span>
              <span className="text-xs font-bold text-indigo-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Explore Articles <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-800 transition-colors flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-indigo-600" />
              Article Explorer & Auto-Classification
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Click any news article to immediately see its live entity classification, highlighted token spans, confidence scores, and domain category.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              Interactive corpus reader
            </span>
            <span className="font-bold text-indigo-700">
              Instant on-click inference
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row (Matching Code.py Sections 4–7) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Cleaned Corpus"
          value="7,987"
          foot="8,000 loaded · 13 duplicates removed"
          trend="Section 6 & 7"
        />
        <MetricCard
          label="Active Categories"
          value="4"
          foot="Business, Sports, Tech, Education"
          trend="~2,000 each"
        />
        <MetricCard
          label="Avg Article Length"
          value="12.7 words"
          foot="std: 3.53 · min: 4 · max: 30"
          trend="Word Count"
        />
        <MetricCard
          label="Ground Truth Subset"
          value="20 articles"
          foot="Human verified in NER_Annotation_Workbook"
          trend="Section 11"
        />
      </div>

      {/* Distribution Charts matching Notebook Sections 7 & 16 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category distribution from Section 7 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" /> News Articles by Category (Section 7)
            </h3>
            <span className="text-xs text-slate-500 font-mono">7,987 total</span>
          </div>

          <div className="space-y-3">
            {categoryStats.map(({ cat, count }) => {
              const pct = (count / 2000) * 100;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="capitalize">{cat}</span>
                    <span className="text-slate-500 font-mono">{count.toLocaleString()} articles</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Word Length Distribution Summary (Section 7) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" /> Word Length Percentiles (Section 7)
            </h3>
            <span className="text-xs text-slate-500 font-mono">mean: 12.7 words</span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Minimum (min)', val: '4 words', pct: 13 },
              { label: '25th Percentile (Q1)', val: '10 words', pct: 33 },
              { label: 'Median (50%)', val: '12 words', pct: 40 },
              { label: '75th Percentile (Q3)', val: '15 words', pct: 50 },
              { label: 'Maximum (max)', val: '30 words', pct: 100 },
            ].map(row => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{row.label}</span>
                  <span className="text-slate-500 font-mono">{row.val}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Sample Articles from the Dataset */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-emerald-600" /> Featured Sample Articles (from Dataset)
            </h3>
            <p className="text-xs text-slate-500">
              Dispatches from the cleaned news dataset ready for instant entity analysis.
            </p>
          </div>
          <button
            onClick={onNavigateToExplorer}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            Explore all articles <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {samples.map(article => (
            <div
              key={article.id}
              className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-300 hover:shadow-sm transition-all group"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {article.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {article.word_count.toLocaleString()} words
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">
                  {article.headlines}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {article.description || article.content.slice(0, 160)}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onNavigateToWorkbench(article.content.slice(0, 1500))}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
                >
                  Test in Workbench <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
