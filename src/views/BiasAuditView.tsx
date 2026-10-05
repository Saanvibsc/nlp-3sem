import React from 'react';
import { NOTEBOOK_DATA, LABEL_COLORS } from '../services/nlpEngine';
import { AlertTriangle, BarChart3, Grid3X3, CheckCircle2, XCircle, FileText, Layers, ShieldAlert } from 'lucide-react';

export const BiasAuditView: React.FC = () => {
  // Section 17 audit counts table from notebook page 35
  const auditCounts = [
    { label: 'CARDINAL', spacy: 369, bert: 0 },
    { label: 'DATE', spacy: 285, bert: 0 },
    { label: 'EVENT', spacy: 2, bert: 0 },
    { label: 'FAC', spacy: 8, bert: 0 },
    { label: 'LAW', spacy: 2, bert: 0 },
    { label: 'LOC', spacy: 0, bert: 147 },
    { label: 'LOCATION', spacy: 326, bert: 0 },
    { label: 'MISC', spacy: 0, bert: 135 },
    { label: 'MONEY', spacy: 39, bert: 0 },
    { label: 'NORP', spacy: 107, bert: 0 },
    { label: 'ORDINAL', spacy: 35, bert: 0 },
    { label: 'ORG', spacy: 730, bert: 471 },
    { label: 'PER', spacy: 0, bert: 134 },
    { label: 'PERCENT', spacy: 165, bert: 0 },
    { label: 'PERSON', spacy: 140, bert: 0 },
    { label: 'PRODUCT', spacy: 26, bert: 0 },
    { label: 'QUANTITY', spacy: 8, bert: 0 },
    { label: 'TIME', spacy: 7, bert: 0 },
    { label: 'WORK_OF_ART', spacy: 7, bert: 0 },
  ];

  // Section 17 category crosstab from page 36
  const categoryCrosstab = [
    { label: 'ORG', count: 730 },
    { label: 'CARDINAL', count: 369 },
    { label: 'LOCATION', count: 326 },
    { label: 'DATE', count: 285 },
    { label: 'PERCENT', count: 165 },
    { label: 'PERSON', count: 140 },
    { label: 'NORP', count: 107 },
    { label: 'MONEY', count: 39 },
    { label: 'ORDINAL', count: 35 },
    { label: 'PRODUCT', count: 26 },
    { label: 'FAC', count: 8 },
    { label: 'QUANTITY', count: 8 },
    { label: 'TIME', count: 7 },
    { label: 'WORK_OF_ART', count: 7 },
    { label: 'LAW', count: 2 },
    { label: 'EVENT', count: 2 },
  ];

  return (
    <div className="space-y-6 pt-2 pb-10">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Notebook Sections 16, 17, 18 & 20
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Explainability, Bias Audit & Error Analysis
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed audit of model disparities, cross-label representations, category bias heatmaps, and false positive/negative root causes.
        </p>
      </div>

      {/* Section 16: Explainability Analysis */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              16. Explainability Analysis: Entity Distribution Using spaCy (1,000 Articles)
            </h3>
            <p className="text-xs text-slate-500">
              Frequency distribution of 16 recognized entity types across 1,000 news articles (Notebook Section 16).
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            2,256 Total Entities
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categoryCrosstab.slice(0, 8).map(item => (
            <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <div className="text-[11px] font-bold uppercase text-slate-500">{item.label}</div>
              <div className="text-lg font-extrabold text-emerald-800 mt-1 font-mono">{item.count}</div>
            </div>
          ))}
        </div>

        {/* Bar chart representation */}
        <div className="space-y-2 pt-2">
          {categoryCrosstab.map(item => {
            const pct = Math.round((item.count / 730) * 100);
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="font-mono">{item.label}</span>
                  <span className="text-slate-500 font-mono">{item.count} entities</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 17: Bias / Performance Audit */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              17. Bias & Label Coverage Audit (spaCy vs BERT)
            </h3>
            <p className="text-xs text-slate-500">
              Comparative representation counts showing label taxonomy divergence (Notebook Section 17).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audit counts table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Label</th>
                  <th className="py-2 px-3 text-right font-mono text-emerald-800">spaCy Count</th>
                  <th className="py-2 px-3 text-right font-mono text-indigo-800">BERT Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {auditCounts.map(row => (
                  <tr key={row.label} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-sans font-bold text-slate-800">{row.label}</td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-semibold">{row.spacy.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right text-indigo-700 font-semibold">{row.bert.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Category Crosstab Heatmap */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-900">
              Entity Distribution in Business News (crosstab from code.py Section 17)
            </div>
            <p className="text-xs text-slate-500">
              Organizations (730), Quantities/Cardinals (369), Locations (326), and Dates (285) heavily dominate business reporting.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-emerald-950 text-white text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-300">ORG</div>
                <div className="text-xl font-extrabold font-mono mt-1">730</div>
                <div className="text-[10px] text-emerald-200">32.4%</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-900 text-white text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-300">CARDINAL</div>
                <div className="text-xl font-extrabold font-mono mt-1">369</div>
                <div className="text-[10px] text-emerald-200">16.4%</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-800 text-white text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-300">LOCATION</div>
                <div className="text-xl font-extrabold font-mono mt-1">326</div>
                <div className="text-[10px] text-emerald-200">14.5%</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-700 text-white text-center">
                <div className="text-[10px] uppercase font-bold text-emerald-300">DATE</div>
                <div className="text-xl font-extrabold font-mono mt-1">285</div>
                <div className="text-[10px] text-emerald-200">12.6%</div>
              </div>
              <div className="p-3 rounded-lg bg-teal-800 text-white text-center">
                <div className="text-[10px] uppercase font-bold text-teal-300">PERCENT</div>
                <div className="text-xl font-extrabold font-mono mt-1">165</div>
                <div className="text-[10px] text-teal-200">7.3%</div>
              </div>
              <div className="p-3 rounded-lg bg-teal-700 text-white text-center">
                <div className="text-[10px] uppercase font-bold text-teal-300">PERSON</div>
                <div className="text-xl font-extrabold font-mono mt-1">140</div>
                <div className="text-[10px] text-teal-200">6.2%</div>
              </div>
              <div className="p-3 rounded-lg bg-teal-600 text-white text-center">
                <div className="text-[10px] uppercase font-bold text-teal-300">NORP</div>
                <div className="text-xl font-extrabold font-mono mt-1">107</div>
                <div className="text-[10px] text-teal-200">4.7%</div>
              </div>
              <div className="p-3 rounded-lg bg-teal-500 text-white text-center">
                <div className="text-[10px] uppercase font-bold text-teal-200">MONEY</div>
                <div className="text-xl font-extrabold font-mono mt-1">39</div>
                <div className="text-[10px] text-white">1.7%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 18: Error Analysis (Sample Article 0 & FP/FN Lists) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              18. Error Analysis & Extraction Diagnostics (Section 18)
            </h3>
            <p className="text-xs text-slate-500">
              Examining Article 0 from the benchmark set and diagnosing BERT's 33 False Positives and 34 False Negatives.
            </p>
          </div>
        </div>

        {/* Sample Article 0 Test Case */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="text-xs font-bold text-slate-800">
            Sample Article 0 Test: <span className="font-mono font-normal">"Uttarakhand UBSE Class 10th, 12th board exams 2024 datesheet out"</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> spaCy Predictions (Candidate Baseline)
              </div>
              <ul className="text-xs space-y-1 font-mono">
                <li>• Uttarakhand → <b className="text-emerald-700">ORG</b></li>
                <li>• 10th → <b className="text-emerald-700">ORDINAL</b></li>
                <li>• 12th → <b className="text-emerald-700">ORDINAL</b></li>
                <li>• 2024 → <b className="text-emerald-700">CARDINAL</b></li>
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] font-bold text-indigo-800 mb-2 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-indigo-600" /> BERT Predictions (Tokenized with WordPiece)
              </div>
              <ul className="text-xs space-y-1 font-mono">
                <li>• Uttarakhand → <b className="text-indigo-700">LOC</b> (score: 0.989)</li>
                <li>• UBSE → <b className="text-indigo-700">MISC</b> (score: 0.602)</li>
                <li className="text-slate-400 font-sans italic text-[11px] pt-1">
                  (Missed: 10th, 12th, 2024 because BERT is trained strictly on CoNLL-03 PER/ORG/LOC/MISC)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed False Positive & Negative Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>BERT False Positives (33 items):</span>
              <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Spurious / Split
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-80 overflow-y-auto space-y-2 text-xs">
              {NOTEBOOK_DATA.bertFalsePositives.map((item, idx) => (
                <div key={idx} className="bg-white p-2 rounded border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold font-mono">"{item.text}"</span>
                    <div className="text-[10px] text-slate-400">{item.reason}</div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-amber-600">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>BERT False Negatives (34 items):</span>
              <span className="font-mono text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Missed / Schema Gap
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-80 overflow-y-auto space-y-2 text-xs">
              {NOTEBOOK_DATA.bertFalseNegatives.map((item, idx) => (
                <div key={idx} className="bg-white p-2 rounded border border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold font-mono">"{item.text}"</span>
                    <div className="text-[10px] text-slate-400">{item.reason}</div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-rose-600">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 20: Project Conclusion */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-xl p-6 shadow-md space-y-3">
        <h3 className="text-base font-bold flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          20. Project Conclusion & Diagnostic Findings
        </h3>
        <p className="text-xs leading-relaxed text-slate-200">
          1. <b>Evaluation Ground-Truth Grounding</b>: The human ground-truth dataset was created by reviewing and correcting spaCy candidate suggestions from 20 news articles. Consequently, spaCy achieved an exceptional <b>0.978 F1-Score (TP: 45, FP: 1, FN: 1)</b> because the label taxonomy aligns with spaCy's 18 OntoNotes classes (CARDINAL, ORDINAL, DATE, MONEY, NORP).
        </p>
        <p className="text-xs leading-relaxed text-slate-200">
          2. <b>BERT Generalization & Schema Gap</b>: <code>dslim/bert-base-NER</code> is pre-trained on CoNLL-03 (PER, ORG, LOC, MISC only). While it exhibits strong contextual sensitivity and high confidence on international locations (LOC mean: 0.958, ORG mean: 0.940), it achieved <b>0.264 F1-Score (TP: 12, FP: 33, FN: 34)</b> due to WordPiece token splits (e.g. <code>##icci</code>, <code>##nu</code>) and an inability to predict OntoNotes non-CoNLL categories.
        </p>
        <p className="text-xs leading-relaxed text-slate-200">
          3. <b>Industrial Recommendation</b>: For Indian news domain telemetry with numbers, dates, and organizational structures, an ensemble hybrid pipeline combining spaCy's rule-based span coverage with fine-tuned transformer context yields the optimal balance of throughput and accuracy.
        </p>
      </div>
    </div>
  );
};
