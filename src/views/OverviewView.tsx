import React from 'react';
import { CorpusArticle } from '../services/nlpEngine';
import { MetricCard } from '../components/MetricCard';
import { Newspaper, BarChart3, ArrowRight } from 'lucide-react';

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
    { cat: 'business', count: 2000, pct: 100 },
    { cat: 'sports', count: 2000, pct: 100 },
    { cat: 'technology', count: 1999, pct: 99.95 },
    { cat: 'education', count: 1988, pct: 99.4 },
  ];

  // Featured sample articles (3 items)
  const samples = articles.slice(0, 3);

  return (
    <div className="space-y-10 pt-2 pb-12">
      {/* Hero Section matching Variation 5 */}
      <div className="max-w-3xl">
        <div className="label mb-3 text-[#d97706] font-medium tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
          News Intelligence & Quantitative NLP Benchmarks
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-[#1a1a18] leading-[1.05] tracking-tight mb-4">
          Named Entity Recognition Studio
        </h1>
        <p className="font-serif text-lg sm:text-xl text-[#1a1a18]/70 leading-relaxed mb-6">
          Compare production pipelines, analyze Indian corporate news extractions, and evaluate transformer accuracy against curated human annotations.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateToWorkbench('')}
            className="btn btn-primary"
          >
            Launch NER Workbench <ArrowRight className="w-4 h-4 ml-1" />
          </button>
          <button
            onClick={onNavigateToEvaluation}
            className="btn btn-secondary"
          >
            Evaluation Matrix
          </button>
        </div>
      </div>

      {/* Feature Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Confusion Matrix & Metrics Callout Card */}
        <div
          onClick={onNavigateToEvaluation}
          className="card cursor-pointer group hover:border-[#1a1a18]/30 transition-all p-6"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label text-[#d97706] font-medium">
                Benchmark Evaluation
              </span>
              <span className="text-xs font-mono text-[#d97706] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Open Matrix <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="text-xl font-medium text-[#1a1a18] tracking-tight">
              Confusion Matrix, Precision, Recall & F1
            </h3>
            <p className="text-sm text-[#1a1a18]/70 mt-2.5 leading-relaxed font-sans">
              Complete evaluation across the 20 ground-truth articles: Multi-class heatmap, error diagnostics, and precision/recall tradeoffs between spaCy and BERT.
            </p>
          </div>

          <div className="card-footer items-center justify-between text-[#1a1a18]/70 mt-6 pt-4">
            <span className="flex items-center gap-2">
              spaCy F1: <b className="text-[#1a1a18] font-mono">0.978</b>
            </span>
            <span className="text-[#1a1a18]/30">·</span>
            <span className="flex items-center gap-2">
              BERT F1: <b className="text-[#1a1a18] font-mono">0.264</b>
            </span>
            <span className="text-[#1a1a18]/30">·</span>
            <span className="text-[#d97706] font-mono font-medium">Error Mitigation Mode Available</span>
          </div>
        </div>

        {/* Article Explorer Instant Classification Callout Card */}
        <div
          onClick={onNavigateToExplorer}
          className="card cursor-pointer group hover:border-[#1a1a18]/30 transition-all p-6"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="label text-[#1a1a18]/60 font-medium">
                Corpus Reader
              </span>
              <span className="text-xs font-mono text-[#1a1a18]/70 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Explore Corpus <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <h3 className="text-xl font-medium text-[#1a1a18] tracking-tight">
              Article Explorer & Instant Inference
            </h3>
            <p className="text-sm text-[#1a1a18]/70 mt-2.5 leading-relaxed font-sans">
              Click any news article to immediately see its live entity classification, highlighted token spans, confidence scores, and domain category.
            </p>
          </div>

          <div className="card-footer items-center justify-between text-[#1a1a18]/70 mt-6 pt-4">
            <span>7,987 Cleaned Records</span>
            <span className="text-[#1a1a18] font-medium">Instant On-Click Inference</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Cleaned Corpus"
          value="7,987"
          foot="8,000 loaded · 13 duplicates removed"
          trend="Validated"
        />
        <MetricCard
          label="Active Categories"
          value="4"
          foot="Business, Sports, Tech, Education"
          trend="Balanced"
        />
        <MetricCard
          label="Avg Article Length"
          value="12.7 words"
          foot="std: 3.53 · min: 4 · max: 30"
          trend="Token Metric"
        />
        <MetricCard
          label="Ground Truth Subset"
          value="20 articles"
          foot="Human verified in Annotation Workbook"
          trend="Gold Standard"
        />
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category distribution */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
            <h3 className="text-sm font-medium text-[#1a1a18] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#d97706]" /> News Articles by Category
            </h3>
            <span className="label font-medium !opacity-80">7,987 total</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {categoryStats.map(({ cat, count, pct }) => {
              return (
                <div key={cat} className="bar-group mb-2">
                  <div className="bar-label">
                    <span className="capitalize text-xs font-sans text-[#1a1a18]">{cat}</span>
                    <span className="font-mono text-xs tabular-nums text-[#1a1a18]/60">{count.toLocaleString()} articles</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${cat === 'business' ? 'accent' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Word Length Distribution Summary */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
            <h3 className="text-sm font-medium text-[#1a1a18] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1a1a18]" /> Word Length Percentiles
            </h3>
            <span className="label font-medium !opacity-80">mean: 12.7 words</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {[
              { label: 'Minimum (min)', val: '4 words', pct: 13 },
              { label: '25th Percentile (Q1)', val: '10 words', pct: 33 },
              { label: 'Median (50%)', val: '12 words', pct: 40 },
              { label: '75th Percentile (Q3)', val: '15 words', pct: 50 },
              { label: 'Maximum (max)', val: '30 words', pct: 100 },
            ].map(row => (
              <div key={row.label} className="bar-group mb-2">
                <div className="bar-label">
                  <span className="text-xs font-sans text-[#1a1a18]">{row.label}</span>
                  <span className="font-mono text-xs tabular-nums text-[#1a1a18]/60">{row.val}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Sample Articles from the Dataset */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(26,26,24,0.08)]">
          <div>
            <h3 className="text-base font-medium text-[#1a1a18] flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-[#d97706]" /> Featured Sample Articles
            </h3>
            <p className="text-xs text-[#1a1a18]/60 font-sans mt-0.5">
              Dispatches from the cleaned news dataset ready for instant entity analysis.
            </p>
          </div>
          <button
            onClick={onNavigateToExplorer}
            className="btn btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5 self-start sm:self-auto"
          >
            Explore all articles <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {samples.map(article => (
            <div
              key={article.id}
              className="article-card flex flex-col justify-between group hover:border-[#1a1a18]/30 transition-all"
            >
              <div>
                <div className="article-meta">
                  <span className="badge">
                    {article.category}
                  </span>
                  <span className="font-mono text-xs text-[#1a1a18]/50 tabular-nums">
                    {article.word_count.toLocaleString()} words
                  </span>
                </div>
                <h4 className="font-serif text-base text-[#1a1a18] line-clamp-2 mb-2 group-hover:text-[#d97706] transition-colors leading-snug">
                  {article.headlines}
                </h4>
                <p className="text-xs text-[#1a1a18]/70 line-clamp-3 leading-relaxed font-sans">
                  {article.description || article.content.slice(0, 160)}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(26,26,24,0.08)] flex items-center justify-between">
                <button
                  onClick={() => onNavigateToWorkbench(article.content.slice(0, 1500))}
                  className="text-xs font-mono text-[#d97706] hover:text-[#1a1a18] inline-flex items-center gap-1 cursor-pointer transition-colors"
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
