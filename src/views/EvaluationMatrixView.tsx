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
  Grid3X3,
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
  const [selectedEngine, setSelectedEngine] = useState<'spaCy' | 'BERT'>('spaCy');
  const [selectedCell, setSelectedCell] = useState<{
    actual: string;
    pred: string;
    count: number;
  } | null>(null);
  const [benchmarkSearch, setBenchmarkSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'matrix' | 'errors' | 'confidence'>('matrix');

  // Compute detailed evaluation report for both models
  const spacyReport = useMemo<ConfusionMatrixReport>(
    () => generateDetailedEvaluation(groundTruthData, 'spaCy'),
    [groundTruthData]
  );

  const bertReport = useMemo<ConfusionMatrixReport>(
    () => generateDetailedEvaluation(groundTruthData, 'BERT'),
    [groundTruthData]
  );

  const activeReport = selectedEngine === 'spaCy' ? spacyReport : bertReport;

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

  const matrixClasses = activeReport.classes;

  return (
    <div className="space-y-6 pt-2 pb-10">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Notebook Section 11-15 & 18 Evaluation
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Confusion Matrix, Precision, Recall & F1 Evaluation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Exact quantitative metrics from <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">code.py</code> evaluated against the 20 human-verified ground-truth articles from <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">NER_Annotation_Workbook.xlsx</code>.
          </p>
        </div>

        {/* Engine Switcher */}
        <div className="flex rounded-xl border border-slate-200 p-1 bg-white shadow-xs shrink-0 self-start md:self-auto">
          <button
            onClick={() => {
              setSelectedEngine('spaCy');
              setSelectedCell(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              selectedEngine === 'spaCy'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            spaCy (en_core_web_sm)
          </button>
          <button
            onClick={() => {
              setSelectedEngine('BERT');
              setSelectedCell(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              selectedEngine === 'BERT'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            BERT (dslim/bert-base-NER)
          </button>
        </div>
      </div>

      {/* Official Notebook Head-to-Head Results Banner (Notebook Section 15 & 19) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            Official Benchmark Comparison Table (code.py Section 15 & 19)
          </h3>
          <span className="text-[11px] font-mono text-slate-400">20 Human-Verified Articles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Model</th>
                <th className="py-2.5 px-4 text-center">True Positives</th>
                <th className="py-2.5 px-4 text-center">False Positives</th>
                <th className="py-2.5 px-4 text-center">False Negatives</th>
                <th className="py-2.5 px-4 font-extrabold text-emerald-800">Precision</th>
                <th className="py-2.5 px-4 font-extrabold text-indigo-800">Recall</th>
                <th className="py-2.5 px-4 font-extrabold text-slate-900">F1 Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              <tr className={selectedEngine === 'spaCy' ? 'bg-emerald-50/60 font-semibold' : ''}>
                <td className="py-3 px-4 font-sans font-bold text-emerald-800">
                  spaCy (en_core_web_sm)
                </td>
                <td className="py-3 px-4 text-center text-slate-800 font-bold">45</td>
                <td className="py-3 px-4 text-center text-amber-700">1</td>
                <td className="py-3 px-4 text-center text-rose-700">1</td>
                <td className="py-3 px-4 font-extrabold text-emerald-700 text-sm">0.978</td>
                <td className="py-3 px-4 font-extrabold text-emerald-700 text-sm">0.978</td>
                <td className="py-3 px-4 font-extrabold text-emerald-800 text-sm">0.978</td>
              </tr>
              <tr className={selectedEngine === 'BERT' ? 'bg-indigo-50/60 font-semibold' : ''}>
                <td className="py-3 px-4 font-sans font-bold text-indigo-800">
                  BERT (dslim/bert-base-NER)
                </td>
                <td className="py-3 px-4 text-center text-slate-800 font-bold">12</td>
                <td className="py-3 px-4 text-center text-amber-700">33</td>
                <td className="py-3 px-4 text-center text-rose-700">34</td>
                <td className="py-3 px-4 font-extrabold text-indigo-700 text-sm">0.267</td>
                <td className="py-3 px-4 font-extrabold text-indigo-700 text-sm">0.261</td>
                <td className="py-3 px-4 font-extrabold text-indigo-800 text-sm">0.264</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Level Metric Cards for Active Engine */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label={`${selectedEngine} F1-Score`}
          value={activeReport.macroAvg.f1.toFixed(3)}
          foot={selectedEngine === 'spaCy' ? 'Notebook Section 14 (0.978)' : 'Notebook Section 14 (0.264)'}
          trend="F1 Metric"
        />
        <MetricCard
          label="Precision"
          value={activeReport.macroAvg.precision.toFixed(3)}
          foot={`TP: ${selectedEngine === 'spaCy' ? 45 : 12} · FP: ${selectedEngine === 'spaCy' ? 1 : 33}`}
          trend="TP / (TP+FP)"
        />
        <MetricCard
          label="Recall"
          value={activeReport.macroAvg.recall.toFixed(3)}
          foot={`TP: ${selectedEngine === 'spaCy' ? 45 : 12} · FN: ${selectedEngine === 'spaCy' ? 1 : 34}`}
          trend="TP / (TP+FN)"
        />
        <MetricCard
          label="Gold Standard"
          value="46 tokens"
          foot="Across 20 news articles"
          trend="Human Verified"
        />
        <MetricCard
          label="Accuracy Rate"
          value={selectedEngine === 'spaCy' ? '97.8%' : '26.4%'}
          foot={selectedEngine === 'spaCy' ? '45 / 46 matched' : '12 / 46 matched'}
          trend="Exact Match"
        />
      </div>

      {/* Section Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'matrix'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5" /> Confusion Matrix & Classification Report
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'errors'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-amber-600" /> Error Analysis (FP: 33, FN: 34)
        </button>
        <button
          onClick={() => setActiveTab('confidence')}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'confidence'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> BERT Confidence by Entity Type
        </button>
      </div>

      {/* TAB 1: Confusion Matrix & Classification Report */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Confusion Matrix Heatmap */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4 text-emerald-600" />
                  Multi-Class Confusion Matrix Heatmap ({selectedEngine})
                </h3>
                <p className="text-xs text-slate-500">
                  Rows represent <b>Actual Ground Truth</b>; columns represent <b>{selectedEngine} Predictions</b>.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-3 h-3 rounded bg-emerald-600"></span> Correct (TP)
                </span>
                <span className="flex items-center gap-1.5 text-amber-800">
                  <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400"></span> Confusion / Missed
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-left w-36">
                      Actual \ Predicted
                    </th>
                    {matrixClasses.map(cls => (
                      <th key={cls} className="py-2.5 px-2 font-bold whitespace-nowrap">
                        {cls}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 bg-slate-100 font-extrabold text-slate-800">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrixClasses.map(actual => {
                    const rowTotal = Object.values(activeReport.matrix[actual] || {}).reduce(
                      (a, b) => a + b,
                      0
                    );

                    return (
                      <tr key={actual} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-left font-bold text-slate-900 bg-slate-50/80 whitespace-nowrap">
                          {actual}
                        </td>
                        {matrixClasses.map(pred => {
                          const count = activeReport.matrix[actual]?.[pred] || 0;
                          const isDiagonal = actual === pred && !actual.includes('O');
                          const isSelected =
                            selectedCell?.actual === actual && selectedCell?.pred === pred;

                          let cellBg = 'bg-white text-slate-400';
                          if (count > 0) {
                            if (isDiagonal) {
                              cellBg =
                                count > 15
                                  ? 'bg-emerald-600 text-white font-extrabold shadow-inner'
                                  : count > 5
                                  ? 'bg-emerald-500 text-white font-bold'
                                  : 'bg-emerald-100 text-emerald-900 font-bold';
                            } else {
                              cellBg =
                                count > 3
                                  ? 'bg-amber-300 text-amber-950 font-bold border border-amber-400'
                                  : 'bg-amber-100 text-amber-900 font-semibold';
                            }
                          }

                          return (
                            <td
                              key={pred}
                              onClick={() => setSelectedCell({ actual, pred, count })}
                              className={`py-2 px-2 cursor-pointer transition-all ${cellBg} ${
                                isSelected
                                  ? 'ring-2 ring-emerald-500 ring-offset-1 font-extrabold'
                                  : 'hover:opacity-85'
                              }`}
                            >
                              {count}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 bg-slate-100">
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedCell && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Cell Details:</span> Actual:{' '}
                  <b className="text-emerald-800">{selectedCell.actual}</b> → Predicted:{' '}
                  <b className="text-indigo-800">{selectedCell.pred}</b> (<b>{selectedCell.count}</b> tokens)
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Classification Report Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Per-Entity Classification Report ({selectedEngine})
                </h3>
                <p className="text-xs text-slate-500">
                  Precision, Recall, F1 and Support breakdown by entity category.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Entity Class</th>
                    <th className="py-3 px-3 text-center">TP</th>
                    <th className="py-3 px-3 text-center">FP</th>
                    <th className="py-3 px-3 text-center">FN</th>
                    <th className="py-3 px-4">Precision</th>
                    <th className="py-3 px-4">Recall</th>
                    <th className="py-3 px-4">F1-Score</th>
                    <th className="py-3 px-4 text-right">Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {activeReport.classMetrics.map(cm => {
                    const color = LABEL_COLORS[cm.className] || '#0d9488';
                    return (
                      <tr key={cm.className} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span>{cm.className}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-700">
                          {cm.tp}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-amber-700">
                          {cm.fp}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-rose-700">
                          {cm.fn}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {cm.precision.toFixed(3)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {cm.recall.toFixed(3)}
                        </td>
                        <td className="py-3 px-4 font-mono font-extrabold text-emerald-800">
                          {cm.f1.toFixed(3)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500 font-semibold">
                          {cm.support}
                        </td>
                      </tr>
                    );
                  })}

                  <tr className="bg-slate-100/70 border-t-2 border-slate-300 font-bold">
                    <td className="py-3 px-4 text-slate-900">Macro Avg</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">—</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">—</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">—</td>
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900">
                      {activeReport.macroAvg.precision.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900">
                      {activeReport.macroAvg.recall.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-emerald-900">
                      {activeReport.macroAvg.f1.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {activeReport.macroAvg.support}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Error Analysis (Notebook Section 18) */}
      {activeTab === 'errors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* False Positives */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-amber-500" />
                  BERT False Positives ({NOTEBOOK_DATA.bertFalsePositives.length} recorded)
                </h4>
                <span className="text-[10px] font-mono bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                  FP = 33
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Predicted by BERT but absent or labeled differently in ground truth:
              </p>

              <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
                {NOTEBOOK_DATA.bertFalsePositives.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono">
                        "{item.text}"
                      </span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-600 text-white">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">
                      {item.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* False Negatives */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-500" />
                  BERT False Negatives ({NOTEBOOK_DATA.bertFalseNegatives.length} recorded)
                </h4>
                <span className="text-[10px] font-mono bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded border border-rose-200">
                  FN = 34
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Present in ground truth but uncaptured or split by BERT:
              </p>

              <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
                {NOTEBOOK_DATA.bertFalseNegatives.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono">
                        "{item.text}"
                      </span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-rose-600 text-white">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">
                      {item.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Confidence by Entity Type (Notebook Section 10) */}
      {activeTab === 'confidence' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confidence Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Average BERT Confidence by Entity Type (Section 10)
              </h4>

              <div className="space-y-3">
                {NOTEBOOK_DATA.bertConfidenceByType.map(c => {
                  const pct = Math.round(c.confidence * 100);
                  return (
                    <div key={c.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{c.label}</span>
                        <span className="font-mono text-indigo-800">
                          {(c.confidence * 100).toFixed(2)}% ({c.confidence.toFixed(6)})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* High vs Low Confidence Samples */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900">
                Sample High & Low Confidence Tokens (Section 10)
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[11px] font-bold uppercase text-emerald-800 mb-1">
                    Highest Confidence Predictions (Score &gt; 0.999):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {NOTEBOOK_DATA.highConfidenceSamples.slice(0, 5).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-[11px]"
                      >
                        {s.text} ({s.label} · {(s.score * 100).toFixed(2)}%)
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-[11px] font-bold uppercase text-rose-800 mb-1">
                    Lowest Confidence Tokens (Ambiguous / Subword Pieces):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {NOTEBOOK_DATA.lowConfidenceSamples.slice(0, 5).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-rose-900 font-mono text-[11px]"
                      >
                        {s.text} ({s.label} · {(s.score * 100).toFixed(1)}%)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ground-Truth Workbook Gold Standard Table (Notebook Section 11 & 13) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              20 Ground-Truth Benchmark Articles (NER_Annotation_Workbook.xlsx)
            </h3>
            <p className="text-xs text-slate-500">
              Evaluated dataset created in Section 11-13 of code.py.
            </p>
          </div>
          <input
            type="text"
            value={benchmarkSearch}
            onChange={e => setBenchmarkSearch(e.target.value)}
            placeholder="Search gold standard..."
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-60 bg-slate-50 focus:ring-emerald-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Verified Ground-Truth Entities</th>
                <th className="py-2.5 px-3">Annotation Text Snippet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArticles.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                    #{row.Article_ID}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {row.Category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 max-w-xs font-mono text-[11px] text-emerald-800 break-words">
                    {row.Manual_Entities || (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 max-w-md text-slate-600 truncate">
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
