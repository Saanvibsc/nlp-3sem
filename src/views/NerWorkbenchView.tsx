import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  extractSpacyEntities,
  extractBertEntities,
  extractAhoCorasickEntities,
  extractDenseWordRecognition,
  ahoCorasickAutomaton,
  Entity,
  LABEL_COLORS,
} from '../services/nlpEngine';
import { EntityHighlighter } from '../components/EntityHighlighter';
import {
  Play,
  Download,
  BarChart2,
  Clock,
  CheckCircle,
  Sparkles,
  Filter,
  Check,
  Eye,
  EyeOff,
  Zap,
  Cpu,
  Layers,
  RotateCcw,
  Activity,
  Sliders,
  ShieldCheck,
  BookOpen,
  FileUp,
} from 'lucide-react';

interface NerWorkbenchViewProps {
  initialText?: string;
  onNavigateToUpload?: () => void;
}

const ALL_ENTITY_TYPES = [
  'PERSON',
  'ORG',
  'LOCATION',
  'DATE',
  'MONEY',
  'CARDINAL',
  'ORDINAL',
  'PERCENT',
  'PRODUCT',
  'EVENT',
  'CONCEPT',
  'TITLE',
  'WORK_OF_ART',
  'MISC',
];

const SAMPLE_STORIES: Record<string, string> = {
  'Zomato & Blinkit (Food Delivery & Quick Commerce)':
    'Zomato CEO Deepinder Goyal announced record quarterly profits for Zomato and quick-commerce subsidiary Blinkit in Gurugram on Tuesday. The food delivery giant reported revenue of 4,799 crore rupees, delivering over 18 crore orders across Mumbai, New Delhi, and Bengaluru during Q3 FY25.',
  'Zomato & Swiggy Mega Rush (New Year Orders)':
    'On New Year eve, Zomato and Swiggy registered over 15000 orders per minute across Bengaluru, Mumbai, and Delhi. Blinkit delivered 45000 packets of potato chips and 25000 cold drinks, with CEO Deepinder Goyal noting total delivery partner earnings exceeding 50 crore rupees.',
  'Nirmala Sitharaman (Finance/Budget)':
    'Union Finance Minister Nirmala Sitharaman presented the Union Budget in Parliament in New Delhi on Monday. Representatives from Tata Group, Reliance Industries, and the Reserve Bank of India attended the summit. The capital expenditure outlay was raised to 11.11 lakh crore rupees for FY25.',
  'OpenAI & Microsoft (Technology)':
    'Microsoft CEO Satya Nadella announced an expanded partnership with OpenAI in San Francisco. The collaboration will deploy GPT-4 across Azure data centers located in Tokyo, London, and Dublin by November 2026.',
  'UN Climate Summit (Geopolitics)':
    'United Nations Secretary-General Antonio Guterres addressed world leaders at the COP summit in Paris. Officials from the European Union, India, and the United States signed an agreement to allocate $100 billion for green initiatives.',
  'ICC Cricket World Cup (Sports)':
    'Virat Kohli and Rohit Sharma led India to victory against Australia at the Narendra Modi Stadium in Ahmedabad. The BCCI and International Cricket Council declared attendance records with over 130,000 fans on Sunday.',
};

export const NerWorkbenchView: React.FC<NerWorkbenchViewProps> = ({ initialText, onNavigateToUpload }) => {
  const [selectedSample, setSelectedSample] = useState<string>(
    initialText ? '-- Custom Input --' : 'Zomato & Blinkit (Food Delivery & Quick Commerce)'
  );
  const [inputText, setInputText] = useState<string>(
    initialText || SAMPLE_STORIES['Zomato & Blinkit (Food Delivery & Quick Commerce)']
  );
  const [modelChoice, setModelChoice] = useState<'spaCy' | 'BERT' | 'Dual'>('Dual');
  const [dualDisplayMode, setDualDisplayMode] = useState<'side-by-side' | 'tabbed'>('side-by-side');
  const [dualTableFilter, setDualTableFilter] = useState<'all' | 'both' | 'spacy-only' | 'bert-only'>('all');
  const [denseMode, setDenseMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'spaCy' | 'BERT'>('spaCy');
  const [spacyResults, setSpacyResults] = useState<Entity[]>([]);
  const [bertResults, setBertResults] = useState<Entity[]>([]);
  const [acResults, setAcResults] = useState<Entity[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Visibility filters for individual entity types
  const [visibleEntityTypes, setVisibleEntityTypes] = useState<string[]>(ALL_ENTITY_TYPES);

  const toggleEntityType = (type: string) => {
    setVisibleEntityTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const selectAllTypes = () => setVisibleEntityTypes(ALL_ENTITY_TYPES);
  const clearAllTypes = () => setVisibleEntityTypes([]);
  const setQuickFilter = (types: string[]) => setVisibleEntityTypes(types);

  const runExtraction = (
    textToExtract: string,
    choice = modelChoice,
    isDense = denseMode,
    shouldScroll = false
  ) => {
    if (!textToExtract.trim()) return;
    const t0 = performance.now();

    // Instant local engines: spaCy, BERT, and Aho-Corasick Automaton
    const spaRes = extractSpacyEntities(textToExtract);
    const bertRes = extractBertEntities(textToExtract);
    const acRes = extractAhoCorasickEntities(textToExtract, isDense);
    setSpacyResults(spaRes);
    setBertResults(bertRes);
    setAcResults(acRes);

    const t1 = performance.now();
    setLatencyMs(Number((t1 - t0).toFixed(1)));
    setHasRun(true);

    if (shouldScroll) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  };

  // Run automatically on mount or when initialText changes
  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
      setSelectedSample('-- Custom Input --');
      runExtraction(initialText, modelChoice, denseMode, false);
    } else if (inputText) {
      runExtraction(inputText, modelChoice, denseMode, false);
    }
  }, [initialText]);

  const handleSelectSample = (sampleKey: string) => {
    setSelectedSample(sampleKey);
    if (sampleKey !== '-- Custom Input --' && SAMPLE_STORIES[sampleKey]) {
      const text = SAMPLE_STORIES[sampleKey];
      setInputText(text);
      runExtraction(text, modelChoice, denseMode, false);
    }
  };

  const handleModelChange = (m: 'spaCy' | 'BERT' | 'Dual') => {
    setModelChoice(m);
    if (inputText.trim()) {
      runExtraction(inputText, m, denseMode, false);
    }
  };

  const handleToggleDenseMode = () => {
    const nextDense = !denseMode;
    setDenseMode(nextDense);
    if (inputText.trim()) {
      runExtraction(inputText, modelChoice, nextDense, false);
    }
  };

  const handleExtract = () => {
    runExtraction(inputText, modelChoice, denseMode, true);
  };

  const spacyFiltered = spacyResults.filter(e => visibleEntityTypes.includes(e.label));
  const bertFiltered = bertResults.filter(e => visibleEntityTypes.includes(e.label));

  // Cross-model Dual analysis: compare spaCy & BERT directly
  const dualRecords = useMemo(() => {
    const list: Array<Entity & { detectedBy: 'Both' | 'spaCy' | 'BERT'; partnerEntity?: Entity }> = [];
    const matchedBertIndices = new Set<number>();

    for (const s of spacyFiltered) {
      const bIdx = bertFiltered.findIndex((b, idx) => {
        if (matchedBertIndices.has(idx)) return false;
        const textMatch = b.text.toLowerCase().trim() === s.text.toLowerCase().trim();
        const spanOverlap = Math.max(s.start, b.start) < Math.min(s.end, b.end);
        return textMatch || spanOverlap;
      });

      if (bIdx !== -1) {
        matchedBertIndices.add(bIdx);
        list.push({
          ...s,
          model: 'Dual (spaCy + BERT)' as any,
          detectedBy: 'Both',
          partnerEntity: bertFiltered[bIdx],
        });
      } else {
        list.push({
          ...s,
          model: 'spaCy',
          detectedBy: 'spaCy',
        });
      }
    }

    bertFiltered.forEach((b, idx) => {
      if (!matchedBertIndices.has(idx)) {
        list.push({
          ...b,
          model: 'BERT',
          detectedBy: 'BERT',
        });
      }
    });

    return list.sort((a, b) => a.start - b.start);
  }, [spacyFiltered, bertFiltered]);

  const consensusCount = dualRecords.filter(r => r.detectedBy === 'Both').length;
  const spacyOnlyCount = dualRecords.filter(r => r.detectedBy === 'spaCy').length;
  const bertOnlyCount = dualRecords.filter(r => r.detectedBy === 'BERT').length;
  const totalUniqueDual = dualRecords.length;
  const agreementRate = totalUniqueDual > 0 ? Math.round((consensusCount / totalUniqueDual) * 100) : 100;

  const activeResults =
    modelChoice === 'spaCy'
      ? spacyResults
      : modelChoice === 'BERT'
      ? bertResults
      : dualRecords;

  // Filtered by user's entity type visibility selections and dual filter
  const filteredResults =
    modelChoice === 'Dual'
      ? dualTableFilter === 'both'
        ? dualRecords.filter(r => r.detectedBy === 'Both')
        : dualTableFilter === 'spacy-only'
        ? dualRecords.filter(r => r.detectedBy === 'spaCy')
        : dualTableFilter === 'bert-only'
        ? dualRecords.filter(r => r.detectedBy === 'BERT')
        : dualRecords
      : activeResults.filter(e => visibleEntityTypes.includes(e.label));

  // Calculate entity counts for mix chart and filter badges
  const entityTypeCounts: Record<string, number> = {};
  activeResults.forEach(e => {
    entityTypeCounts[e.label] = (entityTypeCounts[e.label] || 0) + 1;
  });
  const sortedTypes = Object.entries(entityTypeCounts).sort((a, b) => b[1] - a[1]);
  const maxTypeCount = sortedTypes.length > 0 ? sortedTypes[0][1] : 1;

  // Export CSV
  const handleExportCSV = () => {
    if (filteredResults.length === 0) return;
    const headers = ['text', 'label', 'start', 'end', 'score', 'model'];
    const rows = filteredResults.map(e => [
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
    link.setAttribute('download', `extracted_entities_${modelChoice.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pt-1 pb-12">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(26,26,24,0.08)]">
        <div>
          <span className="label !opacity-100 text-[#d97706] flex items-center gap-1.5 font-medium mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
            Live Testing Lab
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#1a1a18] leading-tight tracking-tight">
            Interactive Entity Workbench
          </h1>
          <p className="text-xs text-[#1a1a18]/65 font-sans mt-0.5">
            Type or paste any text to see what people, places, dates, and companies the AI spots in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onNavigateToUpload && (
            <button
              onClick={onNavigateToUpload}
              className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer shadow-xs bg-[#d97706] hover:bg-[#b45309] text-white border-[#d97706]"
            >
              <FileUp className="w-3.5 h-3.5" /> Upload Article & NER
            </button>
          )}
        </div>
      </div>

      {/* Streamlined, Compact Input Container (Eliminates excessive vertical length) */}
      <div className="card p-4 sm:p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-3 shadow-xs">
        {/* Top Toolbar: Sample Story, Model Selector (spaCy, BERT, Dual), and Dense Mode Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Sample Stories Dropdown */}
          <div className="flex-1 min-w-[240px]">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#1a1a18]/60 block mb-1">
              Select Sample Story
            </label>
            <select
              value={selectedSample}
              onChange={e => handleSelectSample(e.target.value)}
              className="w-full text-xs font-mono border border-[rgba(26,26,24,0.12)] rounded-lg px-2.5 py-1.5 bg-white text-[#1a1a18] focus:outline-none focus:border-[#d97706]"
            >
              <option value="-- Custom Input --">-- Custom Input --</option>
              {Object.keys(SAMPLE_STORIES).map(key => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          {/* Model Switcher: spaCy, BERT, Dual */}
          <div className="shrink-0">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#1a1a18]/60 block mb-1">
              Active Engine
            </label>
            <div className="flex border border-[rgba(26,26,24,0.1)] rounded-lg bg-[#f7f7f5] p-0.5 gap-1">
              <button
                type="button"
                onClick={() => handleModelChange('spaCy')}
                className={`py-1 px-3 font-mono text-xs rounded transition-all cursor-pointer ${
                  modelChoice === 'spaCy'
                    ? 'bg-white text-[#1a1a18] font-semibold shadow-xs border border-[rgba(26,26,24,0.1)]'
                    : 'text-[#1a1a18]/70 hover:text-[#1a1a18]'
                }`}
              >
                spaCy
              </button>
              <button
                type="button"
                onClick={() => handleModelChange('BERT')}
                className={`py-1 px-3 font-mono text-xs rounded transition-all cursor-pointer ${
                  modelChoice === 'BERT'
                    ? 'bg-white text-[#1a1a18] font-semibold shadow-xs border border-[rgba(26,26,24,0.1)]'
                    : 'text-[#1a1a18]/70 hover:text-[#1a1a18]'
                }`}
              >
                BERT
              </button>
              <button
                type="button"
                onClick={() => handleModelChange('Dual')}
                className={`py-1 px-3.5 font-mono text-xs rounded transition-all cursor-pointer ${
                  modelChoice === 'Dual'
                    ? 'bg-[#1a1a18] text-white font-semibold shadow-xs'
                    : 'text-[#1a1a18]/70 hover:text-[#1a1a18]'
                }`}
              >
                Dual
              </button>
            </div>
          </div>

          {/* Dense Mode Inline Toggle */}
          <div className="shrink-0 self-end lg:self-auto">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#1a1a18]/60 block mb-1">
              Semantic Mode
            </label>
            <button
              onClick={handleToggleDenseMode}
              className={`px-3 py-1 text-xs font-mono rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                denseMode
                  ? 'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/30 font-medium'
                  : 'bg-[#f7f7f5] text-[#1a1a18]/70 border-[rgba(26,26,24,0.08)] hover:bg-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#d97706]" />
              Dense Mode: {denseMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Compact Textarea */}
        <div>
          <textarea
            rows={3}
            value={inputText}
            onChange={e => {
              setInputText(e.target.value);
              setSelectedSample('-- Custom Input --');
            }}
            placeholder="Type or paste any news article, announcement, or startup press release (e.g. Zomato, Blinkit, OpenAI)..."
            className="w-full text-xs sm:text-sm font-sans text-[#1a1a18] leading-relaxed p-3 border border-[rgba(26,26,24,0.12)] rounded-lg bg-white focus:outline-none focus:border-[#d97706]"
          />
        </div>

        {/* Action Row: Test / Run Button & Latency */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExtract}
              disabled={!inputText.trim()}
              className="btn btn-primary py-2 px-4 text-xs font-mono uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Test / Run Extraction ({modelChoice === 'Dual' ? 'Dual: spaCy + BERT' : modelChoice})
            </button>

            {latencyMs !== null && (
              <span className="text-[11px] font-mono text-[#1a1a18]/70 flex items-center gap-1 tabular-nums">
                <Clock className="w-3 h-3 text-[#d97706]" />
                <span>{latencyMs} ms</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                showFilters
                  ? 'bg-[#1a1a18] text-white border-[#1a1a18]'
                  : 'bg-white text-[#1a1a18]/70 border-[rgba(26,26,24,0.1)] hover:bg-[#f7f7f5]'
              }`}
            >
              <Filter className="w-3 h-3" />
              Filters ({visibleEntityTypes.length}/{ALL_ENTITY_TYPES.length})
            </button>

            {filteredResults.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1 text-xs font-mono rounded border border-[rgba(26,26,24,0.1)] bg-white text-[#1a1a18]/70 hover:bg-[#f7f7f5] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RESULTS SECTION - IMMEDIATELY IN VIEW RIGHT UNDERNEATH */}
      {hasRun && (
        <div ref={resultsRef} className="space-y-5">
          {/* Optional Collapsible Filter Bar */}
          {showFilters && (
            <div className="card p-4 bg-[#fdfdfc] border border-[rgba(26,26,24,0.08)] rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,24,0.06)]">
                <span className="text-xs font-mono text-[#1a1a18] font-medium flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#d97706]" /> Filter Entity Types in Highlighting
                </span>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <button onClick={selectAllTypes} className="text-[11px] text-[#d97706] hover:underline cursor-pointer">
                    Show All
                  </button>
                  <span className="text-[#1a1a18]/20">·</span>
                  <button onClick={clearAllTypes} className="text-[11px] text-[#1a1a18]/60 hover:underline cursor-pointer">
                    Hide All
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {ALL_ENTITY_TYPES.map(type => {
                  const isVisible = visibleEntityTypes.includes(type);
                  const count = entityTypeCounts[type] || 0;
                  const color = LABEL_COLORS[type] || '#d97706';

                  return (
                    <button
                      key={type}
                      onClick={() => toggleEntityType(type)}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[11px] rounded transition-all border cursor-pointer select-none ${
                        isVisible
                          ? 'bg-white text-[#1a1a18] border-[rgba(26,26,24,0.12)] shadow-2xs'
                          : 'bg-[#f7f7f5] text-[#1a1a18]/40 border-[rgba(26,26,24,0.06)] opacity-60 line-through'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: isVisible ? color : '#e2e8f0' }}
                      />
                      <span>{type}</span>
                      <span className="text-[10px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ANNOTATED DOCUMENT SPANS - PLACED FIRST FOR INSTANT VISIBILITY ON TEST */}
          {modelChoice === 'Dual' ? (
            <div className="space-y-4">
              {/* Dual Summary Metrics Bar */}
              <div className="p-3.5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#6366f1]" />
                    <span>spaCy: <b className="text-[#1a1a18]">{spacyFiltered.length}</b></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0d9488]" />
                    <span>BERT: <b className="text-[#1a1a18]">{bertFiltered.length}</b></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Consensus (Both): <b>{consensusCount}</b></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#d97706]">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Agreement: <b>{agreementRate}%</b></span>
                  </div>
                </div>

                {/* View Switcher: Side-by-Side vs Tabbed */}
                <div className="flex border border-[rgba(26,26,24,0.1)] rounded-lg bg-[#f7f7f5] p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDualDisplayMode('side-by-side')}
                    className={`px-2.5 py-1 font-mono text-xs rounded transition-all cursor-pointer ${
                      dualDisplayMode === 'side-by-side'
                        ? 'bg-white text-[#1a1a18] font-medium shadow-2xs'
                        : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setDualDisplayMode('tabbed')}
                    className={`px-2.5 py-1 font-mono text-xs rounded transition-all cursor-pointer ${
                      dualDisplayMode === 'tabbed'
                        ? 'bg-white text-[#1a1a18] font-medium shadow-2xs'
                        : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
                    }`}
                  >
                    Tabbed
                  </button>
                </div>
              </div>

              {/* Highlighting Display */}
              {dualDisplayMode === 'side-by-side' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column: spaCy */}
                  <div className="card p-4 sm:p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,24,0.08)]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                        <h4 className="font-serif font-medium text-base text-[#1a1a18]">
                          spaCy (en_core_web_sm)
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#f7f7f5] text-[#1a1a18] border border-[rgba(26,26,24,0.08)]">
                        {spacyFiltered.length} Spans
                      </span>
                    </div>
                    <EntityHighlighter text={inputText} entities={spacyFiltered} showConfidence={false} showToolbar={false} />
                  </div>

                  {/* Right Column: BERT */}
                  <div className="card p-4 sm:p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,24,0.08)]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" />
                        <h4 className="font-serif font-medium text-base text-[#1a1a18]">
                          BERT (dslim/bert-base-NER)
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#f7f7f5] text-[#1a1a18] border border-[rgba(26,26,24,0.08)]">
                        {bertFiltered.length} Spans
                      </span>
                    </div>
                    <EntityHighlighter text={inputText} entities={bertFiltered} showConfidence={true} showToolbar={false} />
                  </div>
                </div>
              ) : (
                /* Tabbed View */
                <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
                    <h3 className="font-serif text-lg font-medium text-[#1a1a18]">
                      Annotated Document Spans
                    </h3>
                    <div className="flex border border-[rgba(26,26,24,0.08)] rounded-lg bg-[#f7f7f5] p-0.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('spaCy')}
                        className={`px-3 py-1 font-mono text-xs rounded transition-all cursor-pointer ${
                          activeTab === 'spaCy'
                            ? 'bg-white text-[#1a1a18] font-medium shadow-xs'
                            : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
                        }`}
                      >
                        spaCy ({spacyFiltered.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('BERT')}
                        className={`px-3 py-1 font-mono text-xs rounded transition-all cursor-pointer ${
                          activeTab === 'BERT'
                            ? 'bg-white text-[#1a1a18] font-medium shadow-xs'
                            : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
                        }`}
                      >
                        BERT ({bertFiltered.length})
                      </button>
                    </div>
                  </div>
                  <EntityHighlighter
                    text={inputText}
                    entities={activeTab === 'spaCy' ? spacyFiltered : bertFiltered}
                    showConfidence={activeTab === 'BERT'}
                    showToolbar={false}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Single Model Annotation (spaCy or BERT) */
            <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,24,0.08)]">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      modelChoice === 'spaCy' ? 'bg-[#6366f1]' : 'bg-[#0d9488]'
                    }`}
                  />
                  <h4 className="font-serif font-medium text-base text-[#1a1a18]">
                    Annotated Document Spans ({modelChoice})
                  </h4>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#f7f7f5] text-[#1a1a18] border border-[rgba(26,26,24,0.08)]">
                  {filteredResults.length} / {activeResults.length} Spans
                </span>
              </div>
              <EntityHighlighter
                text={inputText}
                entities={filteredResults}
                showConfidence={modelChoice !== 'spaCy'}
                showToolbar={false}
              />
            </div>
          )}

          {/* Structured Records & Mix Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Table */}
            <div className="lg:col-span-2 card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,24,0.08)]">
                <div>
                  <h3 className="font-serif text-base font-medium text-[#1a1a18]">
                    Structured Entity Records
                  </h3>
                  <span className="text-xs text-[#1a1a18]/60 font-sans">
                    {filteredResults.length} extracted tokens
                  </span>
                </div>

                {/* In Dual mode, allow quick filtering */}
                {modelChoice === 'Dual' && (
                  <div className="flex border border-[rgba(26,26,24,0.08)] rounded-lg bg-[#f7f7f5] p-0.5 text-xs font-mono">
                    <button
                      onClick={() => setDualTableFilter('all')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        dualTableFilter === 'all' ? 'bg-white font-medium shadow-2xs' : 'text-[#1a1a18]/60'
                      }`}
                    >
                      All ({dualRecords.length})
                    </button>
                    <button
                      onClick={() => setDualTableFilter('both')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        dualTableFilter === 'both' ? 'bg-white font-medium shadow-2xs' : 'text-[#1a1a18]/60'
                      }`}
                    >
                      Consensus ({consensusCount})
                    </button>
                    <button
                      onClick={() => setDualTableFilter('spacy-only')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        dualTableFilter === 'spacy-only' ? 'bg-white font-medium shadow-2xs' : 'text-[#1a1a18]/60'
                      }`}
                    >
                      spaCy Only ({spacyOnlyCount})
                    </button>
                    <button
                      onClick={() => setDualTableFilter('bert-only')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        dualTableFilter === 'bert-only' ? 'bg-white font-medium shadow-2xs' : 'text-[#1a1a18]/60'
                      }`}
                    >
                      BERT Only ({bertOnlyCount})
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto border border-[rgba(26,26,24,0.08)] rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/70 uppercase text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Entity Span</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Offsets</th>
                      <th className="py-2 px-3">Score</th>
                      <th className="py-2 px-3">Source Model</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(26,26,24,0.06)] bg-white text-[#1a1a18]">
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#1a1a18]/40 font-mono">
                          No entities matching current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredResults.map((ent: any, idx: number) => {
                        const color = LABEL_COLORS[ent.label] || '#d97706';
                        return (
                          <tr key={idx} className="hover:bg-[#f7f7f5]/60 transition-colors">
                            <td className="py-2 px-3 font-semibold text-[#1a1a18]">
                              {ent.text}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                                style={{
                                  backgroundColor: `${color}15`,
                                  color: color,
                                  border: `1px solid ${color}30`,
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                {ent.label}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[#1a1a18]/60 tabular-nums">
                              [{ent.start}, {ent.end}]
                            </td>
                            <td className="py-2 px-3 tabular-nums text-[#1a1a18]">
                              {ent.score.toFixed(2)}
                            </td>
                            <td className="py-2 px-3">
                              {modelChoice === 'Dual' ? (
                                ent.detectedBy === 'Both' ? (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                                    ✓ Both Models
                                  </span>
                                ) : ent.detectedBy === 'spaCy' ? (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                                    spaCy Only
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                                    BERT Only
                                  </span>
                                )
                              ) : (
                                <span className="text-[11px] text-[#1a1a18]/70">
                                  {ent.model}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Entity Label Distribution Mix Chart */}
            <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
              <div className="pb-2 border-b border-[rgba(26,26,24,0.08)]">
                <h3 className="font-serif text-base font-medium text-[#1a1a18]">
                  Entity Type Breakdown
                </h3>
                <span className="text-xs text-[#1a1a18]/60 font-sans">
                  Distribution of extracted classes
                </span>
              </div>

              <div className="space-y-2.5">
                {sortedTypes.length === 0 ? (
                  <p className="text-xs text-[#1a1a18]/40 font-mono py-4 text-center">
                    No entities extracted
                  </p>
                ) : (
                  sortedTypes.map(([type, count]) => {
                    const color = LABEL_COLORS[type] || '#d97706';
                    const pct = Math.round((count / maxTypeCount) * 100);

                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="flex items-center gap-1.5 font-medium text-[#1a1a18]">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {type}
                          </span>
                          <span className="tabular-nums text-[#1a1a18]/70">{count}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#f7f7f5] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
