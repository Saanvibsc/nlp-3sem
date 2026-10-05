import React, { useState } from 'react';
import {
  extractSpacyEntities,
  extractBertEntities,
  Entity,
  NOTEBOOK_DATA,
} from '../services/nlpEngine';
import { EntityHighlighter } from '../components/EntityHighlighter';
import { MetricCard } from '../components/MetricCard';
import { Play, GitCompare, Zap, Cpu, Award, BarChart3 } from 'lucide-react';

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
    <div className="space-y-6 pt-2 pb-10">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Notebook Section 15 & 19 Head-to-Head
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          spaCy vs BERT Model Comparison
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Direct comparison between Tok2Vec rule-based parser (spaCy) and bidirectional transformer (BERT).
        </p>
      </div>

      {/* Official Notebook Comparison Matrix (Section 15 & 19) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            Official Benchmark Scores (code.py Section 15 & 19)
          </h3>
          <span className="text-xs text-slate-500 font-mono">20 Benchmark Articles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3 text-center">Precision</th>
                  <th className="py-2.5 px-3 text-center">Recall</th>
                  <th className="py-2.5 px-3 text-center font-extrabold text-emerald-800">F1 Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-3 font-sans font-bold text-emerald-800">
                    spaCy
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">0.978</td>
                  <td className="py-2.5 px-3 text-center font-bold">0.978</td>
                  <td className="py-2.5 px-3 text-center font-extrabold text-emerald-800">0.978</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-sans font-bold text-indigo-800">
                    BERT
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">0.267</td>
                  <td className="py-2.5 px-3 text-center font-bold">0.261</td>
                  <td className="py-2.5 px-3 text-center font-extrabold text-indigo-800">0.264</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bar Chart Visualization matching notebook page 27 & 40 */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-700 flex items-center justify-between">
              <span>Metric Visualization</span>
              <span className="text-[11px] text-slate-400 font-normal">spaCy (Green) vs BERT (Indigo)</span>
            </div>
            {[
              { name: 'Precision', spacy: 0.978, bert: 0.267 },
              { name: 'Recall', spacy: 0.978, bert: 0.261 },
              { name: 'F1 Score', spacy: 0.978, bert: 0.264 },
            ].map(m => (
              <div key={m.name} className="space-y-1">
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="font-sans font-semibold text-slate-700">{m.name}</span>
                  <span className="text-slate-500">
                    spaCy: <b className="text-emerald-800">{m.spacy}</b> | BERT: <b className="text-indigo-800">{m.bert}</b>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full"
                      style={{ width: `${Math.round(m.spacy * 100)}%` }}
                    />
                  </div>
                  <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${Math.round(m.bert * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input Box for Live Simultaneous Comparison */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Enter text to compare both models simultaneously:
          </label>
          <textarea
            rows={3}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="w-full text-sm font-normal border border-slate-200 rounded-lg p-3 focus:ring-emerald-500 focus:border-emerald-500 bg-white leading-relaxed text-slate-900"
          />
        </div>

        <button
          onClick={handleCompare}
          disabled={!inputText.trim()}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Execute Comparative Analysis
        </button>
      </div>

      {hasRun && (
        <div className="space-y-6">
          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="spaCy Entities"
              value={spacyEnts.length}
              foot={`Extracted in ${spacyTime} ms`}
              trend="Low Latency"
            />
            <MetricCard
              label="BERT Entities"
              value={bertEnts.length}
              foot={`Extracted in ${bertTime} ms`}
              trend="Deep Context"
            />
            <MetricCard
              label="Full Agreement"
              value={commonCount}
              foot="Exact text + label matches"
            />
            <MetricCard
              label="Agreement Rate"
              value={`${jaccardRate}%`}
              foot="Jaccard similarity index"
            />
          </div>

          {/* Side by Side Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* spaCy side */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">spaCy Engine</h3>
                    <p className="text-[11px] font-mono text-slate-400">en_core_web_sm</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {spacyEnts.length} entities
                </span>
              </div>

              <EntityHighlighter text={inputText} entities={spacyEnts} showConfidence={false} />

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Entity</th>
                      <th className="py-2 px-3">Class</th>
                      <th className="py-2 px-3 text-right">Start</th>
                      <th className="py-2 px-3 text-right">End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {spacyEnts.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{e.text}</td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white uppercase bg-emerald-600">
                            {e.label}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">{e.start}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">{e.end}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BERT side */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">BERT Engine</h3>
                    <p className="text-[11px] font-mono text-slate-400">dslim/bert-base-NER</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {bertEnts.length} entities
                </span>
              </div>

              <EntityHighlighter text={inputText} entities={bertEnts} showConfidence={true} />

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Entity</th>
                      <th className="py-2 px-3">Class</th>
                      <th className="py-2 px-3">Confidence</th>
                      <th className="py-2 px-3 text-right">Start</th>
                      <th className="py-2 px-3 text-right">End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bertEnts.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{e.text}</td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white uppercase bg-indigo-600">
                            {e.label}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700">
                          {Math.round(e.score * 100)}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">{e.start}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-400">{e.end}</td>
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
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-emerald-600" /> Architectural Trade-offs Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-1/4">Dimension</th>
                <th className="py-3 px-4 w-3/8 text-emerald-800">spaCy (en_core_web_sm)</th>
                <th className="py-3 px-4 w-3/8 text-indigo-800">BERT (dslim/bert-base-NER)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Model Architecture</td>
                <td className="py-3 px-4">Tok2Vec + Transition-based CNN/Linear Parser</td>
                <td className="py-3 px-4">Bidirectional Transformer (110M Parameters)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Benchmark F1 Score</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-700">0.978 (TP: 45, FP: 1, FN: 1)</td>
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">0.264 (TP: 12, FP: 33, FN: 34)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Speed / Throughput</td>
                <td className="py-3 px-4">~5,000+ words/sec (Ultra-fast, CPU optimized)</td>
                <td className="py-3 px-4">~200-500 words/sec (Computationally heavier)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Confidence Scores</td>
                <td className="py-3 px-4">Deterministic rule/state logic (Discrete output)</td>
                <td className="py-3 px-4">Softmax probability confidence score (0.0 to 1.0)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
