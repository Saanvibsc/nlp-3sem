import React, { useState } from 'react';
import {
  extractSpacyEntities,
  extractBertEntities,
  Entity,
  LABEL_COLORS,
} from '../services/nlpEngine';
import { EntityHighlighter } from '../components/EntityHighlighter';
import { Play, Download, BarChart2, Clock, CheckCircle } from 'lucide-react';

interface NerWorkbenchViewProps {
  initialText?: string;
}

const SAMPLE_STORIES: Record<string, string> = {
  'Nirmala Sitharaman (Finance/Budget)':
    'Union Finance Minister Nirmala Sitharaman presented the Union Budget in Parliament in New Delhi on Monday. Representatives from Tata Group, Reliance Industries, and the Reserve Bank of India attended the summit. The capital expenditure outlay was raised to 11.11 lakh crore rupees for FY25.',
  'OpenAI & Microsoft (Technology)':
    'Microsoft CEO Satya Nadella announced an expanded partnership with OpenAI in San Francisco. The collaboration will deploy GPT-4 across Azure data centers located in Tokyo, London, and Dublin by November 2026.',
  'UN Climate Summit (Geopolitics)':
    'United Nations Secretary-General Antonio Guterres addressed world leaders at the COP summit in Paris. Officials from the European Union, India, and the United States signed an agreement to allocate $100 billion for green initiatives.',
  'ICC Cricket World Cup (Sports)':
    'Virat Kohli and Rohit Sharma led India to victory against Australia at the Narendra Modi Stadium in Ahmedabad. The BCCI and International Cricket Council declared attendance records with over 130,000 fans on Sunday.',
};

export const NerWorkbenchView: React.FC<NerWorkbenchViewProps> = ({ initialText }) => {
  const [selectedSample, setSelectedSample] = useState<string>(
    initialText ? '-- Custom Input --' : 'Nirmala Sitharaman (Finance/Budget)'
  );
  const [inputText, setInputText] = useState<string>(
    initialText || SAMPLE_STORIES['Nirmala Sitharaman (Finance/Budget)']
  );
  const [modelChoice, setModelChoice] = useState<'spaCy' | 'BERT' | 'Dual'>('spaCy');
  const [activeTab, setActiveTab] = useState<'spaCy' | 'BERT'>('spaCy');
  const [spacyResults, setSpacyResults] = useState<Entity[]>([]);
  const [bertResults, setBertResults] = useState<Entity[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [hasRun, setHasRun] = useState<boolean>(false);

  const handleSelectSample = (sampleKey: string) => {
    setSelectedSample(sampleKey);
    if (sampleKey !== '-- Custom Input --' && SAMPLE_STORIES[sampleKey]) {
      setInputText(SAMPLE_STORIES[sampleKey]);
    }
  };

  const handleExtract = () => {
    if (!inputText.trim()) return;
    const t0 = performance.now();

    let spaRes: Entity[] = [];
    let bertRes: Entity[] = [];

    if (modelChoice === 'spaCy' || modelChoice === 'Dual') {
      spaRes = extractSpacyEntities(inputText);
      setSpacyResults(spaRes);
    }
    if (modelChoice === 'BERT' || modelChoice === 'Dual') {
      bertRes = extractBertEntities(inputText);
      setBertResults(bertRes);
    }

    const t1 = performance.now();
    setLatencyMs(Number((t1 - t0).toFixed(1)));
    setHasRun(true);
  };

  const activeResults =
    modelChoice === 'BERT'
      ? bertResults
      : modelChoice === 'Dual' && activeTab === 'BERT'
      ? bertResults
      : spacyResults;

  // Calculate entity counts for mix chart
  const entityTypeCounts: Record<string, number> = {};
  activeResults.forEach(e => {
    entityTypeCounts[e.label] = (entityTypeCounts[e.label] || 0) + 1;
  });
  const sortedTypes = Object.entries(entityTypeCounts).sort((a, b) => b[1] - a[1]);
  const maxTypeCount = sortedTypes.length > 0 ? sortedTypes[0][1] : 1;

  // Export CSV
  const handleExportCSV = () => {
    if (activeResults.length === 0) return;
    const headers = ['text', 'label', 'start', 'end', 'score', 'model'];
    const rows = activeResults.map(e => [
      `"${e.text.replace(/"/g, '""')}"`,
      e.label,
      e.start,
      e.end,
      e.score,
      e.model,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'extracted_entities.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Interactive NLP Engine
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Named Entity Recognition Workbench
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Run state-of-the-art pretrained models (spaCy & BERT) on pre-loaded news stories or custom text.
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Quick Load Sample News Story:
            </label>
            <select
              value={selectedSample}
              onChange={e => handleSelectSample(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
            >
              <option value="-- Custom Input --">-- Custom Input --</option>
              {Object.keys(SAMPLE_STORIES).map(key => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Active Engine:
            </label>
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
              {(['spaCy', 'BERT', 'Dual'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setModelChoice(m)}
                  className={`flex-1 py-1.5 rounded-md transition-all ${
                    modelChoice === m
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m === 'Dual' ? 'Dual (Both)' : m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Input Text for Entity Analysis:
          </label>
          <textarea
            rows={5}
            value={inputText}
            onChange={e => {
              setInputText(e.target.value);
              setSelectedSample('-- Custom Input --');
            }}
            placeholder="Type or paste any news article, announcement, or press release..."
            className="w-full text-sm font-normal border border-slate-200 rounded-lg p-3 focus:ring-emerald-500 focus:border-emerald-500 bg-white leading-relaxed text-slate-900"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleExtract}
            disabled={!inputText.trim()}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Extract Named Entities
          </button>

          {latencyMs !== null && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Execution Latency: <b>{latencyMs} ms</b></span>
            </div>
          )}
        </div>
      </div>

      {/* Results View */}
      {hasRun && (
        <div className="space-y-6">
          {/* Visual Annotation */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                In-Context Visual Entity Annotation
              </h3>

              {modelChoice === 'Dual' && (
                <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('spaCy')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeTab === 'spaCy'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    spaCy Output ({spacyResults.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('BERT')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeTab === 'BERT'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    BERT Output ({bertResults.length})
                  </button>
                </div>
              )}
            </div>

            <EntityHighlighter
              text={inputText}
              entities={
                modelChoice === 'Dual'
                  ? activeTab === 'spaCy'
                    ? spacyResults
                    : bertResults
                  : activeResults
              }
              showConfidence={modelChoice !== 'spaCy'}
            />
          </div>

          {/* Structured Records & Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Structured Entity Records ({activeResults.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Detailed token span boundaries and confidence metrics.
                  </p>
                </div>
                {activeResults.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                )}
              </div>

              {activeResults.length === 0 ? (
                <div className="text-xs text-slate-500 p-6 text-center bg-slate-50 rounded-lg">
                  No named entities detected in the provided text.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Entity</th>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3 text-right">Start</th>
                        <th className="py-2.5 px-3 text-right">End</th>
                        <th className="py-2.5 px-3">Confidence</th>
                        <th className="py-2.5 px-3">Model</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeResults.map((ent, idx) => {
                        const color = LABEL_COLORS[ent.label] || '#0d9488';
                        return (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {ent.text}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                                style={{ backgroundColor: color }}
                              >
                                {ent.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                              {ent.start}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                              {ent.end}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-emerald-600 h-1.5 rounded-full"
                                    style={{ width: `${Math.round(ent.score * 100)}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[11px] text-slate-600">
                                  {(ent.score).toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-medium">
                              {ent.model}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Entity Mix Bar Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-1">
                  <BarChart2 className="w-4 h-4 text-emerald-600" /> Entity Mix Distribution
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Distribution of detected entity classes in current selection.
                </p>

                {sortedTypes.length === 0 ? (
                  <div className="text-xs text-slate-400 p-4 text-center">
                    No distribution available.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedTypes.map(([type, count]) => {
                      const pct = Math.round((count / maxTypeCount) * 100);
                      const color = LABEL_COLORS[type] || '#0d9488';
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              {type}
                            </span>
                            <span className="text-slate-500">{count}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Standardized via CoNLL universal schema mappings.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
