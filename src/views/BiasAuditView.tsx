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
    <div className="space-y-8 pt-2 pb-12">
      <div className="max-w-3xl">
        <span className="label !opacity-100 text-[#d97706] flex items-center gap-1.5 font-medium mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
          Fairness, Disparity & Root Cause Diagnostics
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1a1a18] leading-[1.05] tracking-tight mb-2">
          Bias, Error & Explainability
        </h1>
        <p className="font-serif text-base sm:text-lg text-[#1a1a18]/70 max-w-2xl leading-relaxed mb-4">
          Detailed audit of model disparities, cross-label representations, category bias heatmaps, and false positive/negative root causes.
        </p>
      </div>

      {/* Explainability Analysis */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
          <div>
            <h3 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#d97706]" />
              Explainability Analysis: Entity Distribution Using spaCy (1,000 Articles)
            </h3>
            <p className="text-xs font-mono text-[#1a1a18]/60 mt-0.5">
              Frequency distribution of 16 recognized entity types across 1,000 news articles.
            </p>
          </div>
          <span className="badge badge-accent text-xs">
            2,256 Total Entities
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categoryCrosstab.slice(0, 8).map(item => (
            <div key={item.label} className="bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] rounded-lg p-3 text-center">
              <div className="label text-[10px]">{item.label}</div>
              <div className="text-lg font-medium text-[#1a1a18] mt-1 font-mono">{item.count}</div>
            </div>
          ))}
        </div>

        {/* Bar chart representation */}
        <div className="space-y-2 pt-2">
          {categoryCrosstab.map(item => {
            const pct = Math.round((item.count / 730) * 100);
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-medium text-[#1a1a18]">
                  <span>{item.label}</span>
                  <span className="text-[#1a1a18]/60 font-normal">{item.count} entities ({pct}%)</span>
                </div>
                <div className="w-full bg-[#f7f7f5] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#1a1a18] h-full rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bias / Performance Audit */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
          <div>
            <h3 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#d97706]" />
              Bias & Label Coverage Audit (spaCy vs BERT)
            </h3>
            <p className="text-xs font-mono text-[#1a1a18]/60 mt-0.5">
              Comparative representation counts showing label taxonomy divergence across architectures.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audit counts table */}
          <div className="overflow-x-auto border border-[rgba(26,26,24,0.08)] rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/60 uppercase text-[11px] font-medium">
                <tr>
                  <th className="py-2.5 px-3">Label</th>
                  <th className="py-2.5 px-3 text-right text-[#d97706]">spaCy Count</th>
                  <th className="py-2.5 px-3 text-right text-[#1a1a18]">BERT Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(26,26,24,0.06)] text-xs bg-white">
                {auditCounts.map(row => (
                  <tr key={row.label} className="hover:bg-[#f7f7f5]">
                    <td className="py-2 px-3 font-sans font-medium text-[#1a1a18]">{row.label}</td>
                    <td className="py-2 px-3 text-right font-medium text-[#d97706] tabular-nums">{row.spacy.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right font-medium text-[#1a1a18] tabular-nums">{row.bert.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Category Crosstab Heatmap */}
          <div className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-wider text-[#1a1a18] font-mono">
              Entity Distribution in Business News
            </div>
            <p className="text-xs font-mono text-[#1a1a18]/60">
              Organizations (730), Quantities/Cardinals (369), Locations (326), and Dates (285) heavily dominate business reporting.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 border border-[rgba(26,26,24,0.08)] rounded-lg bg-[#1a1a18] text-white text-center">
                <div className="label text-[10px] text-white/70">ORG</div>
                <div className="text-xl font-medium font-mono mt-1 text-[#d97706]">730</div>
                <div className="text-[10px] text-white/60 font-mono">32.4%</div>
              </div>
              <div className="p-3 border border-[rgba(26,26,24,0.08)] rounded-lg bg-white text-[#1a1a18] text-center">
                <div className="label text-[10px]">CARDINAL</div>
                <div className="text-xl font-medium font-mono mt-1">369</div>
                <div className="text-[10px] text-[#1a1a18]/60 font-mono">16.4%</div>
              </div>
              <div className="p-3 border border-[rgba(26,26,24,0.08)] rounded-lg bg-white text-[#1a1a18] text-center">
                <div className="label text-[10px]">LOCATION</div>
                <div className="text-xl font-medium font-mono mt-1">326</div>
                <div className="text-[10px] text-[#1a1a18]/60 font-mono">14.5%</div>
              </div>
              <div className="p-3 border border-[rgba(26,26,24,0.08)] rounded-lg bg-white text-[#1a1a18] text-center">
                <div className="label text-[10px]">DATE</div>
                <div className="text-xl font-medium font-mono mt-1">285</div>
                <div className="text-[10px] text-[#1a1a18]/60 font-mono">12.6%</div>
              </div>
              <div className="p-3 border border-[rgba(26,26,24,0.08)] rounded-lg bg-[#f7f7f5] text-[#1a1a18] text-center">
                <div className="label text-[10px]">PERCENT</div>
                <div className="text-xl font-medium font-mono mt-1">165</div>
                <div className="text-[10px] text-[#1a1a18]/60 font-mono">7.3%</div>
              </div>
              <div className="p-3 border border-[rgba(26,26,24,0.08)] rounded-lg bg-[#f7f7f5] text-[#1a1a18] text-center">
                <div className="label text-[10px]">PERSON</div>
                <div className="text-xl font-medium font-mono mt-1">140</div>
                <div className="text-[10px] text-[#1a1a18]/60 font-mono">6.2%</div>
              </div>
              <div className="p-3 border border-[rgba(26,26,24,0.08)] rounded-lg bg-[#f7f7f5] text-[#1a1a18] text-center">
                <div className="label text-[10px]">NORP</div>
                <div className="text-xl font-medium font-mono mt-1">107</div>
                <div className="text-[10px] text-[#1a1a18]/60 font-mono">4.7%</div>
              </div>
              <div className="p-3 border border-[rgba(26,26,24,0.08)] rounded-lg bg-[#f7f7f5] text-[#1a1a18] text-center">
                <div className="label text-[10px]">MONEY</div>
                <div className="text-xl font-medium font-mono mt-1">39</div>
                <div className="text-[10px] text-[#1a1a18]/60 font-mono">1.7%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 18: Error Analysis (Sample Article 0 & FP/FN Lists) */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
          <div>
            <h3 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#d97706]" />
              Error Analysis & Extraction Diagnostics (Section 18)
            </h3>
            <p className="text-xs font-mono text-[#1a1a18]/60 mt-0.5">
              Examining Article 0 from the benchmark set and diagnosing BERT's 33 False Positives and 34 False Negatives.
            </p>
          </div>
        </div>

        {/* Sample Article 0 Test Case */}
        <div className="bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] rounded-lg p-4 space-y-3">
          <div className="text-xs font-medium text-[#1a1a18]">
            Sample Article 0 Test: <span className="font-mono font-normal">"Uttarakhand UBSE Class 10th, 12th board exams 2024 datesheet out"</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[rgba(26,26,24,0.08)] rounded-lg p-3">
              <div className="text-[11px] font-medium text-[#1a1a18] mb-2 flex items-center gap-1.5 font-mono uppercase">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> spaCy Predictions (Candidate Baseline)
              </div>
              <ul className="text-xs space-y-1 font-mono">
                <li>• Uttarakhand → <b className="text-[#d97706]">ORG</b></li>
                <li>• 10th → <b className="text-[#1a1a18]">ORDINAL</b></li>
                <li>• 12th → <b className="text-[#1a1a18]">ORDINAL</b></li>
                <li>• 2024 → <b className="text-[#1a1a18]">CARDINAL</b></li>
              </ul>
            </div>

            <div className="bg-white border border-[rgba(26,26,24,0.08)] rounded-lg p-3">
              <div className="text-[11px] font-medium text-[#1a1a18] mb-2 flex items-center gap-1.5 font-mono uppercase">
                <XCircle className="w-3.5 h-3.5 text-[#d97706]" /> BERT Predictions (Tokenized with WordPiece)
              </div>
              <ul className="text-xs space-y-1 font-mono">
                <li>• Uttarakhand → <b className="text-sky-700">LOC</b> (score: 0.989)</li>
                <li>• UBSE → <b className="text-[#1a1a18]/70">MISC</b> (score: 0.602)</li>
                <li className="text-[#1a1a18]/60 font-sans italic text-[11px] pt-1">
                  (Missed: 10th, 12th, 2024 because BERT is trained strictly on CoNLL-03 PER/ORG/LOC/MISC)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed False Positive & Negative Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <div className="text-xs font-medium text-[#1a1a18] mb-2 flex items-center justify-between font-mono">
              <span>BERT False Positives (33 items):</span>
              <span className="badge text-[10px]">
                Spurious / Split
              </span>
            </div>
            <div className="bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] rounded-lg p-3 max-h-80 overflow-y-auto space-y-2 text-xs">
              {NOTEBOOK_DATA.bertFalsePositives.map((item, idx) => (
                <div key={idx} className="bg-white p-2.5 border border-[rgba(26,26,24,0.08)] rounded-md flex justify-between items-center">
                  <div>
                    <span className="font-medium font-mono">"{item.text}"</span>
                    <div className="text-[10px] text-[#1a1a18]/60 font-mono">{item.reason}</div>
                  </div>
                  <span className="badge badge-accent text-[10px]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-[#1a1a18] mb-2 flex items-center justify-between font-mono">
              <span>BERT False Negatives (34 items):</span>
              <span className="badge text-[10px]">
                Missed / Schema Gap
              </span>
            </div>
            <div className="bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] rounded-lg p-3 max-h-80 overflow-y-auto space-y-2 text-xs">
              {NOTEBOOK_DATA.bertFalseNegatives.map((item, idx) => (
                <div key={idx} className="bg-white p-2.5 border border-[rgba(26,26,24,0.08)] rounded-md flex justify-between items-center">
                  <div>
                    <span className="font-medium font-mono">"{item.text}"</span>
                    <div className="text-[10px] text-[#1a1a18]/60 font-mono">{item.reason}</div>
                  </div>
                  <span className="badge text-[10px]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Project Conclusion */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-3">
        <span className="label !opacity-100 text-[#d97706] flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
          Key Benchmark Findings & Engineering Conclusions
        </span>
        <h3 className="font-serif text-xl font-normal text-[#1a1a18]">
          OntoNotes Alignment & Architecture Takeaways
        </h3>
        <p className="text-xs leading-relaxed text-[#1a1a18]/80 font-sans">
          1. <b>Evaluation Ground-Truth Grounding</b>: The human ground-truth dataset was created by reviewing and correcting spaCy candidate suggestions from 20 news articles. Consequently, spaCy achieved an exceptional <b>0.978 F1-Score (TP: 45, FP: 1, FN: 1)</b> because the label taxonomy aligns with spaCy's 18 OntoNotes classes (CARDINAL, ORDINAL, DATE, MONEY, NORP).
        </p>
        <p className="text-xs leading-relaxed text-[#1a1a18]/80 font-sans">
          2. <b>BERT Generalization & Schema Gap</b>: <code className="font-mono text-[11px] bg-[#f7f7f5] px-1 border border-[rgba(26,26,24,0.08)] rounded">dslim/bert-base-NER</code> is pre-trained on CoNLL-03 (PER, ORG, LOC, MISC only). While it exhibits strong contextual sensitivity and high confidence on international locations (LOC mean: 0.958, ORG mean: 0.940), it achieved <b>0.264 F1-Score (TP: 12, FP: 33, FN: 34)</b> due to WordPiece token splits (e.g. <code className="font-mono text-[11px]">##icci</code>, <code className="font-mono text-[11px]">##nu</code>) and an inability to predict OntoNotes non-CoNLL categories.
        </p>
        <p className="text-xs leading-relaxed text-[#1a1a18]/80 font-sans">
          3. <b>Industrial Recommendation</b>: For Indian news domain telemetry with numbers, dates, and organizational structures, an ensemble hybrid pipeline combining spaCy's rule-based span coverage with fine-tuned transformer context yields the optimal balance of throughput and accuracy.
        </p>
      </div>
    </div>
  );
};
