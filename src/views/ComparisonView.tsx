import React, { useState } from 'react';
import {
  extractSpacyEntities,
  extractBertEntities,
  Entity,
  NOTEBOOK_DATA,
} from '../services/nlpEngine';
import { EntityHighlighter } from '../components/EntityHighlighter';
import { MetricCard } from '../components/MetricCard';
import { Play, GitCompare, Zap, Cpu, Award } from 'lucide-react';

export const ComparisonView: React.FC = () => {
  const [inputText, setInputText] = useState<string>(
    'Prime Minister Narendra Modi and US President Joe Biden held bilateral discussions in Washington. Representatives of Google, Amazon, and Infosys committed to investments exceeding $25 billion by 2027.'
  );

  const [spacyEnts, setSpacyEnts] = useState<Entity[]>([]);
  const [bertEnts, setBertEnts] = useState<Entity[]>([]);
  const [spacyTime, setSpacyTime] = useState<number>(0);
  const [bertTime, setBertTime] = useState<number>(0);
  const [hasRun, setHasRun] = useState<boolean>(false);

  const handleCompare = () => {
    if (!inputText.trim()) return;

    // Run spaCy
    const t0 = performance.now();
    const sEnts = extractSpacyEntities(inputText);
    const sTime = Number((performance.now() - t0).toFixed(2));

    // Run BERT
    const t1 = performance.now();
    const bEnts = extractBertEntities(inputText);
    const bTime = Number((performance.now() - t1).toFixed(2));

    setSpacyEnts(sEnts);
    setBertEnts(bEnts);
    setSpacyTime(sTime);
    setBertTime(bTime);
    setHasRun(true);
  };

  // Compute intersection & Jaccard agreement
  const spaSet = new Set(spacyEnts.map(e => `${e.text.toLowerCase()}|${e.label}`));
  const bertSet = new Set(bertEnts.map(e => `${e.text.toLowerCase()}|${e.label}`));
  const unionSet = new Set([...spaSet, ...bertSet]);
  let commonCount = 0;
  for (const s of spaSet) {
    if (bertSet.has(s)) commonCount++;
  }
  const jaccardRate = unionSet.size > 0 ? Math.round((commonCount / unionSet.size) * 100) : 0;

  return (
    <div className="space-y-8 pt-2 pb-12">
      <div className="max-w-3xl">
        <span className="label !opacity-100 text-[#d97706] flex items-center gap-1.5 font-medium mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
          Model Architecture Evaluation & Head-to-Head
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1a1a18] leading-[1.05] tracking-tight mb-2">
          spaCy vs BERT Comparison
        </h1>
        <p className="font-serif text-base sm:text-lg text-[#1a1a18]/70 max-w-2xl leading-relaxed mb-4">
          Direct comparative analysis between transition-based CNN parser (spaCy) and bidirectional transformer (BERT).
        </p>
      </div>

      {/* Official Benchmark Comparison Matrix */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
          <h3 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#d97706]" />
            Official Benchmark Evaluation Scores
          </h3>
          <span className="label !opacity-70 font-mono">20 Ground-Truth Articles (47 Entities)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="overflow-x-auto border border-[rgba(26,26,24,0.08)] rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/60 uppercase text-[11px] font-medium">
                <tr>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3 text-center">Precision</th>
                  <th className="py-2.5 px-3 text-center">Recall</th>
                  <th className="py-2.5 px-3 text-center text-[#d97706]">F1 Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(26,26,24,0.06)] bg-white text-xs">
                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-[#1a1a18]">
                    spaCy (en_core_web_sm)
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums">0.979</td>
                  <td className="py-2.5 px-3 text-center tabular-nums">0.979</td>
                  <td className="py-2.5 px-3 text-center font-medium tabular-nums text-[#d97706]">0.979</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-[#1a1a18]">
                    BERT (dslim/bert-base-NER)
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums">0.267</td>
                  <td className="py-2.5 px-3 text-center tabular-nums">0.261</td>
                  <td className="py-2.5 px-3 text-center font-medium tabular-nums text-[#1a1a18]">0.264</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Metric Comparison Bar Chart */}
          <div className="space-y-3 text-xs">
            <div className="label font-medium !opacity-80 flex items-center justify-between">
              <span>Metric Visualization</span>
              <span>spaCy (97.9%) vs BERT (26.4%)</span>
            </div>
            
            {[
              { name: 'Precision', spacy: 0.979, bert: 0.267 },
              { name: 'Recall', spacy: 0.979, bert: 0.261 },
              { name: 'F1-Score', spacy: 0.979, bert: 0.264 },
            ].map(m => (
              <div key={m.name} className="space-y-1">
                <div className="flex justify-between font-mono text-[11px] text-[#1a1a18]/70">
                  <span className="font-sans font-medium text-[#1a1a18]">{m.name}</span>
                  <span>spaCy: {(m.spacy * 100).toFixed(1)}% · BERT: {(m.bert * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-[#f7f7f5] rounded-full overflow-hidden flex gap-1">
                  <div
                    className="h-full bg-[#d97706] rounded-full"
                    style={{ width: `${m.spacy * 100}%` }}
                    title={`spaCy: ${(m.spacy * 100).toFixed(1)}%`}
                  />
                  <div
                    className="h-full bg-[#1a1a18]/40 rounded-full"
                    style={{ width: `${m.bert * 100}%` }}
                    title={`BERT: ${(m.bert * 100).toFixed(1)}%`}
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between text-[10px] font-mono text-[#1a1a18]/50 pt-2 border-t border-[rgba(26,26,24,0.06)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#d97706]" /> spaCy (en_core_web_sm)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1a1a18]/40" /> BERT (dslim/bert-base-NER)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Input Box for Live Simultaneous Comparison */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div>
          <label className="label block mb-2 text-[#1a1a18]">
            Enter Text for Simultaneous Model Execution
          </label>
          <textarea
            rows={3}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="w-full text-base font-sans text-[#1a1a18] leading-relaxed p-4 border border-[rgba(26,26,24,0.12)] rounded-lg bg-white focus:outline-none focus:border-[#1a1a18] transition-colors"
          />
        </div>

        <button
          onClick={handleCompare}
          disabled={!inputText.trim()}
          className="btn btn-primary"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Execute Head-to-Head Comparison
        </button>
      </div>

      {hasRun && (
        <div className="space-y-8">
          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="spaCy Entities"
              value={spacyEnts.length}
              foot={`Latency: ${spacyTime} ms`}
              trend="CPU Speed"
            />
            <MetricCard
              label="BERT Entities"
              value={bertEnts.length}
              foot={`Latency: ${bertTime} ms`}
              trend="Deep Attention"
            />
            <MetricCard
              label="Full Agreement"
              value={commonCount}
              foot="Exact text + label match"
            />
            <MetricCard
              label="Agreement Rate"
              value={`${jaccardRate}%`}
              foot="Jaccard token similarity"
            />
          </div>

          {/* Side by Side Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* spaCy side */}
            <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded border border-[rgba(26,26,24,0.08)] bg-[#d97706] text-white flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-medium text-[#1a1a18]">spaCy Engine</h3>
                    <p className="text-[11px] font-mono text-[#1a1a18]/60">en_core_web_sm</p>
                  </div>
                </div>
                <span className="badge badge-accent">
                  {spacyEnts.length} entities
                </span>
              </div>

              <EntityHighlighter text={inputText} entities={spacyEnts} showConfidence={false} showToolbar={false} />

              <div className="overflow-x-auto border border-[rgba(26,26,24,0.08)] rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/60 uppercase text-[11px] font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Entity</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3 text-right">Start</th>
                      <th className="py-2.5 px-3 text-right">End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(26,26,24,0.06)] bg-white">
                    {spacyEnts.map((e, idx) => (
                      <tr key={idx} className="hover:bg-[#f7f7f5]">
                        <td className="py-2 px-3 font-sans font-medium text-[#1a1a18]">{e.text}</td>
                        <td className="py-2 px-3">
                          <span className="badge badge-accent text-[10px]">
                            {e.label}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-[#1a1a18]/60">{e.start}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-[#1a1a18]/60">{e.end}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BERT side */}
            <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded border border-[rgba(26,26,24,0.08)] bg-[#1a1a18] text-white flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-medium text-[#1a1a18]">BERT Engine</h3>
                    <p className="text-[11px] font-mono text-[#1a1a18]/60">dslim/bert-base-NER</p>
                  </div>
                </div>
                <span className="badge">
                  {bertEnts.length} entities
                </span>
              </div>

              <EntityHighlighter text={inputText} entities={bertEnts} showConfidence={true} showToolbar={false} />

              <div className="overflow-x-auto border border-[rgba(26,26,24,0.08)] rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/60 uppercase text-[11px] font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Entity</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Confidence</th>
                      <th className="py-2.5 px-3 text-right">Start</th>
                      <th className="py-2.5 px-3 text-right">End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(26,26,24,0.06)] bg-white">
                    {bertEnts.map((e, idx) => (
                      <tr key={idx} className="hover:bg-[#f7f7f5]">
                        <td className="py-2 px-3 font-sans font-medium text-[#1a1a18]">{e.text}</td>
                        <td className="py-2 px-3">
                          <span className="badge text-[10px]">
                            {e.label}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium tabular-nums text-[#1a1a18]">
                          {Math.round(e.score * 100)}%
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-[#1a1a18]/60">{e.start}</td>
                        <td className="py-2 px-3 text-right tabular-nums text-[#1a1a18]/60">{e.end}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Architectural Trade-offs Table */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <h3 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-[#d97706]" /> Architectural Trade-offs Matrix
        </h3>

        <div className="overflow-x-auto border border-[rgba(26,26,24,0.08)] rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/60 uppercase text-[11px] font-medium">
              <tr>
                <th className="py-3 px-4 w-1/4">Dimension</th>
                <th className="py-3 px-4 w-3/8 text-[#d97706]">spaCy (en_core_web_sm)</th>
                <th className="py-3 px-4 w-3/8 text-[#1a1a18]">BERT (dslim/bert-base-NER)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(26,26,24,0.06)] bg-white text-[#1a1a18]">
              <tr>
                <td className="py-3 px-4 font-medium text-[#1a1a18]">Model Architecture</td>
                <td className="py-3 px-4">Tok2Vec + Transition-based CNN/Linear Parser</td>
                <td className="py-3 px-4">Bidirectional Transformer (110M Parameters)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-[#1a1a18]">Benchmark F1 Score</td>
                <td className="py-3 px-4 font-medium text-[#d97706] tabular-nums">0.979 (TP: 46, FP: 1, FN: 1)</td>
                <td className="py-3 px-4 font-medium text-[#1a1a18] tabular-nums">0.264 (TP: 12, FP: 33, FN: 34)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-[#1a1a18]">Speed / Throughput</td>
                <td className="py-3 px-4">~5,000+ words/sec (Ultra-fast, CPU optimized)</td>
                <td className="py-3 px-4">~200-500 words/sec (Computationally heavier)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-[#1a1a18]">Confidence Scores</td>
                <td className="py-3 px-4">Discrete grammatical transition logic</td>
                <td className="py-3 px-4">Softmax token distribution (0.00 to 1.00)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
