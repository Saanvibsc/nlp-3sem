import React, { useState, useMemo } from 'react';
import {
  GroundTruthArticle,
  generateDetailedEvaluation,
  ConfusionMatrixReport,
  LABEL_COLORS,
  NOTEBOOK_DATA,
} from '../services/nlpEngine';
import { MetricCard } from '../components/MetricCard';
import {
  Award,
  BarChart3,
  AlertOctagon,
  FileCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface EvaluationMatrixViewProps {
  groundTruthData: GroundTruthArticle[];
}

export const EvaluationMatrixView: React.FC<EvaluationMatrixViewProps> = ({
  groundTruthData,
}) => {
  const [selectedEngine, setSelectedEngine] = useState<'spaCy' | 'BERT' | 'Trained BERT' | 'AC Automaton'>('spaCy');
  const [benchmarkSearch, setBenchmarkSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'matrix' | 'errors' | 'confidence'>('matrix');

  // Compute detailed evaluation report for the selected model
  const activeReport = useMemo<ConfusionMatrixReport>(() => {
    return generateDetailedEvaluation(
      groundTruthData,
      selectedEngine,
      false,
      []
    );
  }, [groundTruthData, selectedEngine]);

  // Calculate current total errors
  const currentTotalErrors = useMemo(() => {
    let fp = 0;
    let fn = 0;
    for (const cm of activeReport.classMetrics) {
      fp += cm.fp;
      fn += cm.fn;
    }
    return fp + fn;
  }, [activeReport]);

  // Filter benchmark articles
  const filteredArticles = useMemo(() => {
    if (!benchmarkSearch.trim()) return groundTruthData;
    const q = benchmarkSearch.toLowerCase();
    return groundTruthData.filter(
      a =>
        (a.Category || '').toLowerCase().includes(q) ||
        (a.Manual_Entities || '').toLowerCase().includes(q) ||
        (a.Annotation_Text || '').toLowerCase().includes(q)
    );
  }, [groundTruthData, benchmarkSearch]);

  return (
    <div className="space-y-8 pt-2 pb-12">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-3xl">
          <span className="label !opacity-100 text-[#d97706] flex items-center gap-1.5 font-medium mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
            Easy-to-Understand AI Accuracy Check
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1a1a18] leading-[1.05] tracking-tight mb-2">
            Model Performance & Category Report Card
          </h1>
          <p className="font-serif text-base sm:text-lg text-[#1a1a18]/70 max-w-2xl leading-relaxed mb-4">
            Think of this page like an AI report card. It shows you exactly what names and dates the AI found, where it mistook one thing for another, and what it missed completely. No confusing math jargon.
          </p>
        </div>

        {/* Engine Switcher */}
        <div className="flex border border-[rgba(26,26,24,0.08)] rounded-lg bg-[#f7f7f5] p-1 shrink-0 self-start md:self-auto gap-1">
          <button
            onClick={() => setSelectedEngine('spaCy')}
            className={`px-3 py-1.5 font-mono text-xs rounded transition-all cursor-pointer ${
              selectedEngine === 'spaCy'
                ? 'bg-white text-[#1a1a18] font-medium shadow-xs'
                : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
            }`}
          >
            spaCy (Fast & Accurate ~98%)
          </button>
          <button
            onClick={() => setSelectedEngine('BERT')}
            className={`px-3 py-1.5 font-mono text-xs rounded transition-all cursor-pointer ${
              selectedEngine === 'BERT'
                ? 'bg-white text-[#1a1a18] font-medium shadow-xs'
                : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
            }`}
          >
            BERT (Older Basic Model ~26%)
          </button>
          <button
            onClick={() => setSelectedEngine('Trained BERT')}
            className={`px-3 py-1.5 font-mono text-xs rounded transition-all cursor-pointer ${
              selectedEngine === 'Trained BERT'
                ? 'bg-white text-[#1a1a18] font-medium shadow-xs'
                : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
            }`}
          >
            Trained BERT
          </button>
          <button
            onClick={() => setSelectedEngine('AC Automaton')}
            className={`px-3 py-1.5 font-mono text-xs rounded transition-all cursor-pointer ${
              selectedEngine === 'AC Automaton'
                ? 'bg-white text-[#1a1a18] font-medium shadow-xs'
                : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
            }`}
          >
            Exact Match / AC
          </button>
        </div>
      </div>

      {/* QUICK GUIDE: HOW TO READ THIS IN 30 SECONDS */}
      <div className="card p-5 bg-[#fafaf8] border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[rgba(26,26,24,0.06)]">
          <HelpCircle className="w-4 h-4 text-[#d97706]" />
          <h3 className="font-serif text-base font-medium text-[#1a1a18]">
            Quick Guide: How to Read a Confusion Matrix in Plain English
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-sans">
          <div className="p-3 bg-white border border-[rgba(26,26,24,0.06)] rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Right Guesses (True Positive)</span>
            </div>
            <p className="text-[#1a1a18]/70 leading-relaxed text-[11px]">
              The AI was completely right! Example: It saw "Google" and correctly recognized it as a company.
            </p>
          </div>

          <div className="p-3 bg-white border border-[rgba(26,26,24,0.06)] rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#d97706]">
              <XCircle className="w-3.5 h-3.5 text-[#d97706]" />
              <span>False Alarms (False Positive)</span>
            </div>
            <p className="text-[#1a1a18]/70 leading-relaxed text-[11px]">
              The AI guessed wrong! It flagged a normal word, or called a city a company.
            </p>
          </div>

          <div className="p-3 bg-white border border-[rgba(26,26,24,0.06)] rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-red-700">
              <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
              <span>Missed Words (False Negative)</span>
            </div>
            <p className="text-[#1a1a18]/70 leading-relaxed text-[11px]">
              A real name or date was right there in the article, but the AI walked past without noticing.
            </p>
          </div>

          <div className="p-3 bg-white border border-[rgba(26,26,24,0.06)] rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-[#1a1a18]">
              <Award className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Overall Grade (F1 Score)</span>
            </div>
            <p className="text-[#1a1a18]/70 leading-relaxed text-[11px]">
              Combines trust and catch rate into one balanced percentage score so you know the model's true accuracy.
            </p>
          </div>
        </div>

        {/* The 3 scores explained in human language */}
        <div className="p-3 bg-white border border-[rgba(26,26,24,0.06)] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-[#1a1a18]/75">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1a1a18]">The 3 Key Scores:</span>
            <span><b>Trust (Precision):</b> When it speaks up, how often is it right?</span>
          </div>
          <div className="flex items-center gap-4">
            <span><b>Catch Rate (Recall):</b> Out of 100 real names, how many did it spot?</span>
            <span><b>Overall Grade (F1):</b> The final balanced score out of 100%.</span>
          </div>
        </div>
      </div>

      {/* Official Benchmark Comparison Table */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[rgba(26,26,24,0.08)] pb-3">
          <h3 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#d97706]" />
            Side-by-Side Model Comparison
          </h3>
          <span className="label !opacity-70">Tested on 20 Real Stories (47 Verified Names & Numbers)</span>
        </div>

        <div className="overflow-x-auto border border-[rgba(26,26,24,0.08)] rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/60 uppercase text-[11px] font-medium">
              <tr>
                <th className="py-2.5 px-4">AI Model</th>
                <th className="py-2.5 px-4 text-center">Right Guesses</th>
                <th className="py-2.5 px-4 text-center">False Alarms</th>
                <th className="py-2.5 px-4 text-center">Missed Words</th>
                <th className="py-2.5 px-4 text-center">Total Mistakes</th>
                <th className="py-2.5 px-4">Trust Score (Precision)</th>
                <th className="py-2.5 px-4">Catch Rate (Recall)</th>
                <th className="py-2.5 px-4 font-medium text-[#1a1a18]">Overall Grade (F1)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(26,26,24,0.06)] bg-white text-xs">
              <tr className={selectedEngine === 'spaCy' ? 'bg-[#f7f7f5] font-medium' : ''}>
                <td className="py-3 px-4 font-sans font-medium text-[#1a1a18]">
                  spaCy (Default AI Model)
                </td>
                <td className="py-3 px-4 text-center tabular-nums font-medium text-emerald-700">46</td>
                <td className="py-3 px-4 text-center tabular-nums text-[#d97706]">1</td>
                <td className="py-3 px-4 text-center tabular-nums text-[#d97706]">1</td>
                <td className="py-3 px-4 text-center tabular-nums text-[#d97706] font-medium">2</td>
                <td className="py-3 px-4 tabular-nums">97.9%</td>
                <td className="py-3 px-4 tabular-nums">97.9%</td>
                <td className="py-3 px-4 font-medium tabular-nums text-[#1a1a18]">97.9%</td>
              </tr>
              <tr className={selectedEngine === 'BERT' ? 'bg-[#f7f7f5] font-medium' : ''}>
                <td className="py-3 px-4 font-sans font-medium text-[#1a1a18]">
                  BERT (Basic Untuned Model)
                </td>
                <td className="py-3 px-4 text-center tabular-nums">12</td>
                <td className="py-3 px-4 text-center tabular-nums text-[#d97706]">33</td>
                <td className="py-3 px-4 text-center tabular-nums text-[#d97706]">34</td>
                <td className="py-3 px-4 text-center tabular-nums text-[#d97706] font-medium">67</td>
                <td className="py-3 px-4 tabular-nums">26.7%</td>
                <td className="py-3 px-4 tabular-nums">26.1%</td>
                <td className="py-3 px-4 font-medium tabular-nums text-[#1a1a18]">26.4%</td>
              </tr>
              <tr className={selectedEngine === 'Trained BERT' ? 'bg-[#f7f7f5] font-medium' : ''}>
                <td className="py-3 px-4 font-sans font-medium text-[#1a1a18] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Trained BERT (Fine-Tuned OntoNotes)
                </td>
                <td className="py-3 px-4 text-center tabular-nums font-medium text-emerald-700">46</td>
                <td className="py-3 px-4 text-center tabular-nums text-[#d97706]">1</td>
                <td className="py-3 px-4 text-center tabular-nums text-[#d97706]">1</td>
                <td className="py-3 px-4 text-center tabular-nums text-[#d97706] font-medium">2</td>
                <td className="py-3 px-4 tabular-nums text-emerald-700">97.9%</td>
                <td className="py-3 px-4 tabular-nums text-emerald-700">97.9%</td>
                <td className="py-3 px-4 font-medium tabular-nums text-emerald-700">97.9%</td>
              </tr>
              <tr className={selectedEngine === 'AC Automaton' ? 'bg-[#f7f7f5] font-medium' : ''}>
                <td className="py-3 px-4 font-sans font-medium text-[#1a1a18] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Aho-Corasick + AI Ensemble
                </td>
                <td className="py-3 px-4 text-center tabular-nums font-medium text-emerald-700">47</td>
                <td className="py-3 px-4 text-center tabular-nums text-emerald-700">0</td>
                <td className="py-3 px-4 text-center tabular-nums text-emerald-700">0</td>
                <td className="py-3 px-4 text-center tabular-nums text-emerald-700 font-medium">0</td>
                <td className="py-3 px-4 tabular-nums text-emerald-700">100.0%</td>
                <td className="py-3 px-4 tabular-nums text-emerald-700">100.0%</td>
                <td className="py-3 px-4 font-medium tabular-nums text-emerald-700">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Level Metric Cards for Active Engine */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label={`${selectedEngine} Overall Grade (F1)`}
          value={activeReport.macroAvg.f1.toFixed(3)}
          foot={`Mistakes: ${currentTotalErrors}`}
          trend="Score out of 1.0"
        />
        <MetricCard
          label="Trust Score (Precision)"
          value={`${(activeReport.macroAvg.precision * 100).toFixed(1)}%`}
          foot={`Correct: ${activeReport.totalPredictions - activeReport.classMetrics.reduce((a, c) => a + c.fp, 0)} · False alarms: ${activeReport.classMetrics.reduce((a, c) => a + c.fp, 0)}`}
          trend="How sure you can be"
        />
        <MetricCard
          label="Catch Rate (Recall)"
          value={`${(activeReport.macroAvg.recall * 100).toFixed(1)}%`}
          foot={`Found: ${activeReport.classMetrics.reduce((a, c) => a + c.tp, 0)} · Missed: ${activeReport.classMetrics.reduce((a, c) => a + c.fn, 0)}`}
          trend="How much it found"
        />
        <MetricCard
          label="Total Mistakes"
          value={currentTotalErrors}
          foot={currentTotalErrors === 0 ? 'Zero mistakes!' : `False alarms: ${activeReport.classMetrics.reduce((a, c) => a + c.fp, 0)}, Missed: ${activeReport.classMetrics.reduce((a, c) => a + c.fn, 0)}`}
          trend="Confusions + Missed"
        />
        <MetricCard
          label="Exact Accuracy"
          value={`${(activeReport.accuracy * 100).toFixed(1)}%`}
          foot={`${activeReport.classMetrics.reduce((a, c) => a + c.tp, 0)} out of ${activeReport.totalGroundTruth} correct`}
          trend="100% Right Answers"
        />
      </div>

      {/* Section Sub-Navigation Tabs */}
      <div className="flex border-b border-[rgba(26,26,24,0.08)] gap-6 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'border-[#d97706] text-[#d97706] font-medium'
              : 'border-transparent text-[#1a1a18]/60 hover:text-[#1a1a18]'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> 1. Category Report Card ({selectedEngine})
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'errors'
              ? 'border-[#d97706] text-[#d97706] font-medium'
              : 'border-transparent text-[#1a1a18]/60 hover:text-[#1a1a18]'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" /> 2. Mistake Inspector (What was wrong & why)
        </button>
        <button
          onClick={() => setActiveTab('confidence')}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'confidence'
              ? 'border-[#d97706] text-[#d97706] font-medium'
              : 'border-transparent text-[#1a1a18]/60 hover:text-[#1a1a18]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> 3. How Sure The AI Was (Confidence Scores)
        </button>
      </div>

      {/* TAB 1: Category Report Card & Classification Metrics */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Classification Report Table */}
          <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
              <div>
                <h3 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#d97706]" />
                  Report Card by Category ({selectedEngine})
                </h3>
                <p className="text-xs text-[#1a1a18]/70 font-sans mt-0.5">
                  See how dependable the AI is for People, Companies, Places, Dates, and Numbers.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-[rgba(26,26,24,0.08)] rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/60 uppercase text-[11px] font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Entity Category</th>
                    <th className="py-2.5 px-3 text-center">Hits (Right)</th>
                    <th className="py-2.5 px-3 text-center">False Alarms</th>
                    <th className="py-2.5 px-3 text-center">Missed Words</th>
                    <th className="py-2.5 px-4">Trust Score (Precision)</th>
                    <th className="py-2.5 px-4">Catch Rate (Recall)</th>
                    <th className="py-2.5 px-4">Overall Score (F1)</th>
                    <th className="py-2.5 px-4 text-right">Total in Text</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(26,26,24,0.06)] text-xs bg-white">
                  {activeReport.classMetrics.map(cm => {
                    const color = LABEL_COLORS[cm.className] || '#d97706';
                    return (
                      <tr key={cm.className} className="hover:bg-[#f7f7f5]/40">
                        <td className="py-2.5 px-4 font-medium text-[#1a1a18]">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span>{cm.className}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center tabular-nums text-emerald-700 font-medium">
                          {cm.tp}
                        </td>
                        <td className="py-2.5 px-3 text-center tabular-nums text-[#d97706]">
                          {cm.fp}
                        </td>
                        <td className="py-2.5 px-3 text-center tabular-nums text-[#1a1a18]/60">
                          {cm.fn}
                        </td>
                        <td className="py-2.5 px-4 tabular-nums">
                          {(cm.precision * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 tabular-nums">
                          {(cm.recall * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 tabular-nums font-medium text-[#1a1a18]">
                          {(cm.f1 * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-[#1a1a18]/60">
                          {cm.support}
                        </td>
                      </tr>
                    );
                  })}

                  <tr className="bg-[#f7f7f5] border-t border-[rgba(26,26,24,0.08)] font-medium">
                    <td className="py-3 px-4 text-[#1a1a18] uppercase">Average Across All Categories</td>
                    <td className="py-3 px-3 text-center text-[#1a1a18]/50">—</td>
                    <td className="py-3 px-3 text-center text-[#1a1a18]/50">—</td>
                    <td className="py-3 px-3 text-center text-[#1a1a18]/50">—</td>
                    <td className="py-3 px-4 font-medium text-[#1a1a18]">
                      {(activeReport.macroAvg.precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 font-medium text-[#1a1a18]">
                      {(activeReport.macroAvg.recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 font-medium text-[#d97706]">
                      {(activeReport.macroAvg.f1 * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-[#1a1a18]">
                      {activeReport.macroAvg.support}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Friendly Tip Callout */}
            <div className="p-3 bg-[#fafaf8] border border-[rgba(26,26,24,0.06)] rounded-lg text-xs text-[#1a1a18]/70 flex items-start gap-2">
              <span className="text-base">💡</span>
              <p className="leading-relaxed">
                <b>Friendly Tip:</b> Notice that for Dates, Money, and Numbers, the older basic BERT model scored 0% because it was never trained to recognize numbers. spaCy scores near 100% because it was taught all 18 standard categories!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Error Analysis */}
      {activeTab === 'errors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* False Positives */}
            <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,24,0.08)]">
                <h4 className="font-serif text-sm font-medium text-[#1a1a18] flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[#d97706]" />
                  False Alarms (Words the basic AI wrongly flagged) ({NOTEBOOK_DATA.bertFalsePositives.length} found)
                </h4>
                <span className="badge">
                  FP = {NOTEBOOK_DATA.bertFalsePositives.length}
                </span>
              </div>
              <p className="text-xs font-mono text-[#1a1a18]/60">
                Words the basic model flagged as entities, but in reality they were normal words or broken syllables:
              </p>

              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {NOTEBOOK_DATA.bertFalsePositives.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-[rgba(26,26,24,0.08)] rounded-lg bg-white text-xs flex flex-col justify-between shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#1a1a18] font-mono">
                        "{item.text}"
                      </span>
                      <span className="badge badge-accent">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#1a1a18]/60 mt-1">
                      {item.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* False Negatives */}
            <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,24,0.08)]">
                <h4 className="font-serif text-sm font-medium text-[#1a1a18] flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-[#1a1a18]" />
                  Missed Words (Things the basic AI overlooked) ({NOTEBOOK_DATA.bertFalseNegatives.length} found)
                </h4>
                <span className="badge">
                  FN = {NOTEBOOK_DATA.bertFalseNegatives.length}
                </span>
              </div>
              <p className="text-xs font-mono text-[#1a1a18]/60">
                Real names and numbers present in the stories, but the basic model walked past without seeing them:
              </p>

              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {NOTEBOOK_DATA.bertFalseNegatives.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-[rgba(26,26,24,0.08)] rounded-lg bg-white text-xs flex flex-col justify-between shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#1a1a18] font-mono">
                        "{item.text}"
                      </span>
                      <span className="badge">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#1a1a18]/60 mt-1">
                      {item.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Confidence by Entity Type */}
      {activeTab === 'confidence' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confidence Table */}
            <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
              <div>
                <h4 className="font-serif text-sm font-medium text-[#1a1a18] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#d97706]" />
                  Average Certainty by Category
                </h4>
                <p className="text-xs text-[#1a1a18]/60 mt-0.5">
                  How confident the AI feels when guessing each kind of entity.
                </p>
              </div>

              <div className="space-y-3.5">
                {NOTEBOOK_DATA.bertConfidenceByType.map(c => {
                  const pct = Math.round(c.confidence * 100);
                  return (
                    <div key={c.label} className="bar-group mb-2">
                      <div className="bar-label">
                        <span className="text-xs font-mono text-[#1a1a18]">{c.label}</span>
                        <span className="text-xs font-mono text-[#d97706] tabular-nums">
                          {(c.confidence * 100).toFixed(1)}% certainty
                        </span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill accent transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* High vs Low Confidence Samples */}
            <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
              <div>
                <h4 className="font-serif text-sm font-medium text-[#1a1a18]">
                  Words the AI Was Most & Least Sure About
                </h4>
                <p className="text-xs text-[#1a1a18]/60 mt-0.5">
                  Famous names get high certainty, while chopped-up syllables get low certainty.
                </p>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <div className="label text-[10px] text-emerald-800 font-medium mb-1.5">
                    Highest Certainty Guesses (&gt;99% sure):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {NOTEBOOK_DATA.highConfidenceSamples.slice(0, 5).map((s, idx) => (
                      <span
                        key={idx}
                        className="badge"
                      >
                        {s.text} ({s.label} · {(s.score * 100).toFixed(1)}% sure)
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="label text-[10px] text-[#d97706] font-medium mb-1.5">
                    Lowest Certainty Words (Unusual or broken syllables):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {NOTEBOOK_DATA.lowConfidenceSamples.slice(0, 5).map((s, idx) => (
                      <span
                        key={idx}
                        className="badge text-[#d97706] border-[#d97706]/20 bg-[#d97706]/5"
                      >
                        {s.text} ({s.label} · {(s.score * 100).toFixed(1)}% sure)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ground-Truth Workbook Gold Standard Table */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(26,26,24,0.08)] pb-3">
          <div>
            <h3 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#d97706]" />
              The 20 Real News Stories Used to Grade the AI
            </h3>
            <p className="text-xs font-mono text-[#1a1a18]/60 mt-0.5">
              Human editors read these 20 articles and carefully marked every person, company, date, and place to establish 100% honest answers.
            </p>
          </div>
          <input
            type="text"
            value={benchmarkSearch}
            onChange={e => setBenchmarkSearch(e.target.value)}
            placeholder="Search stories..."
            className="text-xs font-mono border border-[rgba(26,26,24,0.12)] rounded-lg px-3 py-1.5 w-60 bg-white focus:outline-none focus:border-[#d97706]"
          />
        </div>

        <div className="overflow-x-auto border border-[rgba(26,26,24,0.08)] rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/60 uppercase text-[11px] font-medium">
              <tr>
                <th className="py-2.5 px-3">Story #</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Real Verified Entities</th>
                <th className="py-2.5 px-3">Story Excerpt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(26,26,24,0.06)] bg-white">
              {filteredArticles.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#f7f7f5]/40">
                  <td className="py-2.5 px-3 text-[#1a1a18]/60">
                    #{row.Article_ID}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="badge">
                      {row.Category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 max-w-xs text-[#d97706] font-medium break-words">
                    {row.Manual_Entities || (
                      <span className="text-[#1a1a18]/40 italic">None</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 max-w-md text-[#1a1a18]/70 font-sans truncate">
                    {row.Annotation_Text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

