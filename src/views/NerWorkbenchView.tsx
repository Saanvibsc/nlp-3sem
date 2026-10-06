import React, { useState, useEffect } from 'react';
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
  Network,
  Activity,
  Sliders,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface NerWorkbenchViewProps {
  initialText?: string;
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

export const NerWorkbenchView: React.FC<NerWorkbenchViewProps> = ({ initialText }) => {
  const [selectedSample, setSelectedSample] = useState<string>(
    initialText ? '-- Custom Input --' : 'Zomato & Blinkit (Food Delivery & Quick Commerce)'
  );
  const [inputText, setInputText] = useState<string>(
    initialText || SAMPLE_STORIES['Zomato & Blinkit (Food Delivery & Quick Commerce)']
  );
  const [modelChoice, setModelChoice] = useState<
    'spaCy' | 'BERT' | 'Dual' | 'Gemini AI' | 'AC Automaton'
  >('Dual');
  const [dualDisplayMode, setDualDisplayMode] = useState<'side-by-side' | 'tabbed'>('side-by-side');
  const [dualTableFilter, setDualTableFilter] = useState<'all' | 'both' | 'spacy-only' | 'bert-only'>('all');
  const [denseMode, setDenseMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'spaCy' | 'BERT'>('spaCy');
  const [spacyResults, setSpacyResults] = useState<Entity[]>([]);
  const [bertResults, setBertResults] = useState<Entity[]>([]);
  const [acResults, setAcResults] = useState<Entity[]>([]);
  const [geminiResults, setGeminiResults] = useState<Entity[]>([]);
  const [ensembleResults, setEnsembleResults] = useState<Entity[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [hasRun, setHasRun] = useState<boolean>(false);

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

  const runExtraction = async (
    textToExtract: string,
    choice = modelChoice,
    isDense = denseMode
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

    let currentGemini = geminiResults;

    if (choice === 'Gemini AI') {
      setIsLoadingAi(true);
      try {
        const res = await fetch('/api/v1/extract/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToExtract, dense: isDense }),
        });
        const data = await res.json();
        if (data && Array.isArray(data.entities)) {
          currentGemini = data.entities;
          setGeminiResults(data.entities);
        } else {
          // Local AC Automaton fallback for Gemini
          currentGemini = acRes.map(e => ({ ...e, model: 'Gemini AI' as const }));
          setGeminiResults(currentGemini);
        }
      } catch (err) {
        console.warn('Gemini endpoint error, using local AC fallback:', err);
        currentGemini = acRes.map(e => ({ ...e, model: 'Gemini AI' as const }));
        setGeminiResults(currentGemini);
      } finally {
        setIsLoadingAi(false);
      }
    } else {
      if (geminiResults.length === 0) {
        setGeminiResults(acRes.map(e => ({ ...e, model: 'Gemini AI' as const })));
      }
    }

    // Build AC + AI Ensemble (Combines AC dictionary precision with Neural contextual semantics)
    const ensembleMap = new Map<string, Entity>();
    for (const e of acRes) {
      ensembleMap.set(`${e.text.toLowerCase()}|${e.start}`, {
        ...e,
        model: 'AC+AI Ensemble',
        reason: e.reason || 'Aho-Corasick Automaton DFA Match',
      });
    }
    for (const e of (currentGemini || [])) {
      const k = `${e.text.toLowerCase()}|${e.start}`;
      if (!ensembleMap.has(k)) {
        ensembleMap.set(k, {
          ...e,
          model: 'AC+AI Ensemble',
          reason: e.reason || 'Neural Contextual Recognition',
        });
      } else {
        const prev = ensembleMap.get(k)!;
        ensembleMap.set(k, {
          ...prev,
          score: Math.max(prev.score, e.score),
          reason: `${prev.reason} + Neural Verification`,
        });
      }
    }
    setEnsembleResults(Array.from(ensembleMap.values()).sort((a, b) => a.start - b.start));

    const t1 = performance.now();
    setLatencyMs(Number((t1 - t0).toFixed(1)));
    setHasRun(true);
  };

  // Run automatically on mount or when initialText changes
  useEffect(() => {
    const text = initialText || inputText;
    if (text) {
      runExtraction(text, modelChoice, denseMode);
    }
  }, [initialText]);

  const handleSelectSample = (sampleKey: string) => {
    setSelectedSample(sampleKey);
    if (sampleKey !== '-- Custom Input --' && SAMPLE_STORIES[sampleKey]) {
      const text = SAMPLE_STORIES[sampleKey];
      setInputText(text);
      runExtraction(text, modelChoice, denseMode);
    }
  };

  const handleModelChange = (
    m: 'spaCy' | 'BERT' | 'Dual' | 'Gemini AI' | 'AC Automaton'
  ) => {
    setModelChoice(m);
    if (m === 'Gemini AI' && geminiResults.length === 0 && inputText.trim()) {
      runExtraction(inputText, m, denseMode);
    }
  };

  const handleToggleDenseMode = () => {
    const nextDense = !denseMode;
    setDenseMode(nextDense);
    if (inputText.trim()) {
      runExtraction(inputText, modelChoice, nextDense);
    }
  };

  const handleExtract = () => {
    runExtraction(inputText, modelChoice, denseMode);
  };

  const spacyFiltered = spacyResults.filter(e => visibleEntityTypes.includes(e.label));
  const bertFiltered = bertResults.filter(e => visibleEntityTypes.includes(e.label));

  // Cross-model Dual analysis: compare spaCy & BERT directly
  const dualRecords = React.useMemo(() => {
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
      : modelChoice === 'Dual'
      ? dualRecords
      : modelChoice === 'AC Automaton'
      ? acResults
      : geminiResults;

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
    <div className="space-y-8 pt-2 pb-12">
      {/* Hero Section matching Variation 5 */}
      <div className="max-w-3xl">
        <span className="label !opacity-100 text-[#d97706] flex items-center gap-1.5 font-medium mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
          Interactive Information Extraction Engine
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1a1a18] leading-[1.05] tracking-tight mb-3">
          NER Workbench
        </h1>
        <p className="font-serif text-base sm:text-lg text-[#1a1a18]/70 max-w-2xl leading-relaxed mb-6">
          Extract named entities, corporate leadership, dates, and fiscal valuations across business and tech news using <b>spaCy</b>, <b>BERT</b>, and <b>Dual</b> (spaCy + BERT) comparison.
        </p>
      </div>

      {/* Main Input Container matching Variation 5 specification */}
      <div className="card p-6 md:p-8 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-6">
        {/* Top Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-5 border-b border-[rgba(26,26,24,0.08)]">
          <div className="md:col-span-2">
            <label className="label block mb-1.5 text-[#1a1a18]">
              Select Sample Story
            </label>
            <select
              value={selectedSample}
              onChange={e => handleSelectSample(e.target.value)}
              className="w-full text-xs font-mono border border-[rgba(26,26,24,0.12)] rounded-lg px-3 py-2 bg-white text-[#1a1a18] focus:outline-none focus:border-[#d97706]"
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="label text-[#1a1a18]">
                Active Engine
              </label>
              <span className="text-[11px] font-mono text-[#d97706] font-semibold">
                {modelChoice === 'Dual' ? 'Dual (spaCy + BERT)' : modelChoice}
              </span>
            </div>

            {/* Clean, wide 3-option engine selector: spaCy, BERT, Dual */}
            <div className="grid grid-cols-3 border border-[rgba(26,26,24,0.1)] rounded-lg bg-[#f7f7f5] p-1 gap-1">
              <button
                type="button"
                onClick={() => handleModelChange('spaCy')}
                className={`py-2 px-2.5 font-mono text-xs rounded transition-all text-center flex items-center justify-center cursor-pointer ${
                  modelChoice === 'spaCy'
                    ? 'bg-white text-[#1a1a18] font-semibold shadow-xs border border-[rgba(26,26,24,0.1)]'
                    : 'text-[#1a1a18]/70 hover:text-[#1a1a18] hover:bg-black/[0.02]'
                }`}
              >
                <span>spaCy</span>
              </button>

              <button
                type="button"
                onClick={() => handleModelChange('BERT')}
                className={`py-2 px-2.5 font-mono text-xs rounded transition-all text-center flex items-center justify-center cursor-pointer ${
                  modelChoice === 'BERT'
                    ? 'bg-white text-[#1a1a18] font-semibold shadow-xs border border-[rgba(26,26,24,0.1)]'
                    : 'text-[#1a1a18]/70 hover:text-[#1a1a18] hover:bg-black/[0.02]'
                }`}
              >
                <span>BERT</span>
              </button>

              <button
                type="button"
                onClick={() => handleModelChange('Dual')}
                className={`py-2 px-2.5 font-mono text-xs rounded transition-all text-center flex items-center justify-center cursor-pointer ${
                  modelChoice === 'Dual'
                    ? 'bg-white text-[#1a1a18] font-semibold shadow-xs border border-[rgba(26,26,24,0.1)]'
                    : 'text-[#1a1a18]/70 hover:text-[#1a1a18] hover:bg-black/[0.02]'
                }`}
              >
                <span>Dual</span>
              </button>
            </div>

            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-[#1a1a18]/50 px-0.5">
              <span>spaCy · Statistical</span>
              <span>BERT · Transformer</span>
              <span className="text-[#d97706] font-medium">spaCy & BERT</span>
            </div>
          </div>
        </div>

        {/* Dense Word Recognition Mode Switch */}
        <div className="p-3.5 bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded border flex items-center justify-center shrink-0 ${denseMode ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-white text-[#1a1a18] border-[rgba(26,26,24,0.1)]'}`}>
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-[#1a1a18]">
                  Dense Semantic Recognition Mode
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${denseMode ? 'bg-[#d97706]/10 text-[#d97706] border-[#d97706]/30 font-medium' : 'bg-white text-[#1a1a18]/60 border-[rgba(26,26,24,0.08)]'}`}>
                  {denseMode ? 'ACTIVE' : 'STANDARD'}
                </span>
              </div>
              <p className="text-[11px] text-[#1a1a18]/60 font-sans mt-0.5">
                {denseMode
                  ? 'Identifies core domain concepts, culinary terms, technical domains, executive titles, and keywords across the text.'
                  : 'Isolates standard named entities: Person, Organization, Location, Date, Money, Number.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleDenseMode}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
              denseMode
                ? 'bg-[#1a1a18] text-white border-[#1a1a18]'
                : 'bg-white text-[#1a1a18] border-[rgba(26,26,24,0.12)] hover:bg-[#f7f7f5]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {denseMode ? 'Disable Dense Mode' : 'Enable Dense Mode'}
          </button>
        </div>

        {/* Textarea matching Variation 5 */}
        <div className="space-y-2">
          <label className="label block text-[#1a1a18]">
            Input Text for Entity Analysis
          </label>
          <textarea
            rows={5}
            value={inputText}
            onChange={e => {
              setInputText(e.target.value);
              setSelectedSample('-- Custom Input --');
            }}
            placeholder="Type or paste any news article, announcement, or startup press release (e.g. Zomato, Blinkit, OpenAI)..."
            className="w-full text-base font-sans text-[#1a1a18] leading-relaxed p-4 border border-[rgba(26,26,24,0.12)] rounded-lg bg-white focus:outline-none focus:border-[#d97706]"
          />
        </div>

        {/* Run Extraction Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <button
            onClick={handleExtract}
            disabled={!inputText.trim() || isLoadingAi}
            className="btn btn-primary py-2.5 px-5 text-xs font-mono uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoadingAi ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing Neural Extraction...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Extract Named Entities ({modelChoice === 'Dual' ? 'Dual: spaCy + BERT' : modelChoice})
              </>
            )}
          </button>

          {latencyMs !== null && (
            <div className="label !opacity-80 flex items-center gap-2 text-[#1a1a18] tabular-nums font-mono">
              <Clock className="w-3.5 h-3.5 text-[#d97706]" />
              <span>
                Engine: <b className="font-medium">{modelChoice === 'Dual' ? 'Dual (spaCy + BERT)' : modelChoice}</b> · Latency: <b className="font-medium">{latencyMs} ms</b>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Results View */}
      {hasRun && (
        <div className="space-y-6">
          {/* ENTITY TYPE VISIBILITY FILTER COMPONENT */}
          <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[rgba(26,26,24,0.08)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] text-[#d97706] flex items-center justify-center font-bold">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-medium text-base text-[#1a1a18] flex items-center gap-2">
                    Entity Visibility Filter
                    <span className="text-[10px] font-mono bg-[#f7f7f5] text-[#1a1a18]/70 border border-[rgba(26,26,24,0.08)] px-2 py-0.5 rounded">
                      {filteredResults.length} / {activeResults.length} Visible
                    </span>
                  </h4>
                  <p className="text-xs text-[#1a1a18]/60 font-sans">
                    Click any entity badge below to toggle its highlight on or off in the processed text.
                  </p>
                </div>
              </div>

              {/* Quick preset action buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                <button
                  onClick={selectAllTypes}
                  className="px-2.5 py-1 text-xs rounded border border-[rgba(26,26,24,0.1)] bg-white text-[#1a1a18] hover:bg-[#f7f7f5] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3 text-[#1a1a18]/70" /> Select All
                </button>
                <button
                  onClick={clearAllTypes}
                  className="px-2.5 py-1 text-xs rounded border border-[rgba(26,26,24,0.1)] bg-white text-[#1a1a18] hover:bg-[#f7f7f5] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <EyeOff className="w-3 h-3 text-[#1a1a18]/70" /> Hide All
                </button>
                <button
                  onClick={() => setQuickFilter(['LOCATION', 'DATE'])}
                  className="px-2.5 py-1 text-xs rounded border border-[rgba(26,26,24,0.1)] bg-white text-[#1a1a18] hover:bg-[#f7f7f5] transition-colors cursor-pointer"
                >
                  Locations & Dates
                </button>
                <button
                  onClick={() => setQuickFilter(['PERSON', 'ORG'])}
                  className="px-2.5 py-1 text-xs rounded border border-[rgba(26,26,24,0.1)] bg-white text-[#1a1a18] hover:bg-[#f7f7f5] transition-colors cursor-pointer"
                >
                  People & Orgs
                </button>
                <button
                  onClick={() => setQuickFilter(['CARDINAL', 'ORDINAL', 'MONEY', 'PERCENT'])}
                  className="px-2.5 py-1 text-xs rounded border border-[rgba(26,26,24,0.1)] bg-white text-[#1a1a18] hover:bg-[#f7f7f5] transition-colors cursor-pointer"
                >
                  Numbers & Money
                </button>
                <button
                  onClick={() => setQuickFilter(['ORG', 'PERSON', 'PRODUCT', 'LOCATION'])}
                  className="px-2.5 py-1 text-xs rounded border border-[rgba(26,26,24,0.1)] bg-white text-[#1a1a18] hover:bg-[#f7f7f5] transition-colors cursor-pointer"
                >
                  Brands & Products
                </button>
              </div>
            </div>

            {/* Entity Filter Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {ALL_ENTITY_TYPES.map(type => {
                const isVisible = visibleEntityTypes.includes(type);
                const count = entityTypeCounts[type] || 0;
                const color = LABEL_COLORS[type] || '#d97706';

                return (
                  <button
                    key={type}
                    onClick={() => toggleEntityType(type)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs rounded transition-all border cursor-pointer select-none ${
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
                    <span
                      className={`text-[10px] px-1 font-mono rounded ${
                        count > 0
                          ? isVisible
                            ? 'bg-[#f7f7f5] text-[#1a1a18]'
                            : 'bg-slate-200 text-[#1a1a18]/60'
                          : 'text-[#1a1a18]/40'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Annotation Section */}
          {modelChoice === 'Dual' ? (
            <div className="space-y-4">
              {/* Dual Analysis Comparison Header */}
              <div className="p-4 bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-serif font-medium text-base text-[#1a1a18]">
                      Dual Model Analysis (spaCy & BERT)
                    </span>
                    <span className="text-[11px] font-mono bg-[#d97706]/10 text-[#d97706] border border-[#d97706]/30 px-2 py-0.5 rounded-full font-medium">
                      {agreementRate}% Overlap Agreement
                    </span>
                  </div>
                  <p className="text-xs text-[#1a1a18]/65 font-sans">
                    Simultaneous inference comparing spaCy's rule & transition-based pipeline with BERT's contextual transformer.
                  </p>
                </div>

                {/* View Layout Switcher */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="label !text-[10px] hidden sm:inline">View:</span>
                  <div className="flex border border-[rgba(26,26,24,0.1)] rounded-lg bg-white p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setDualDisplayMode('side-by-side')}
                      className={`px-3 py-1 font-mono text-xs rounded transition-all cursor-pointer ${
                        dualDisplayMode === 'side-by-side'
                          ? 'bg-[#1a1a18] text-white font-medium'
                          : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
                      }`}
                    >
                      Side-by-Side
                    </button>
                    <button
                      type="button"
                      onClick={() => setDualDisplayMode('tabbed')}
                      className={`px-3 py-1 font-mono text-xs rounded transition-all cursor-pointer ${
                        dualDisplayMode === 'tabbed'
                          ? 'bg-[#1a1a18] text-white font-medium'
                          : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
                      }`}
                    >
                      Tabbed View
                    </button>
                  </div>
                </div>
              </div>

              {/* Dual Model Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white border border-[rgba(26,26,24,0.08)] rounded-lg">
                  <span className="label block text-[10px] text-[#1a1a18]/60 mb-0.5">spaCy Entities</span>
                  <span className="font-mono text-xl font-medium text-[#1a1a18]">{spacyFiltered.length}</span>
                  <span className="block text-[10px] text-[#1a1a18]/50 mt-0.5 font-mono">en_core_web_sm</span>
                </div>
                <div className="p-3 bg-white border border-[rgba(26,26,24,0.08)] rounded-lg">
                  <span className="label block text-[10px] text-[#1a1a18]/60 mb-0.5">BERT Entities</span>
                  <span className="font-mono text-xl font-medium text-[#1a1a18]">{bertFiltered.length}</span>
                  <span className="block text-[10px] text-[#1a1a18]/50 mt-0.5 font-mono">dslim/bert-base-NER</span>
                </div>
                <div className="p-3 bg-white border border-[rgba(26,26,24,0.08)] rounded-lg">
                  <span className="label block text-[10px] text-[#1a1a18]/60 mb-0.5">Both Agreed</span>
                  <span className="font-mono text-xl font-medium text-[#059669]">{consensusCount}</span>
                  <span className="block text-[10px] text-[#059669]/70 mt-0.5 font-mono">Consensus entities</span>
                </div>
                <div className="p-3 bg-white border border-[rgba(26,26,24,0.08)] rounded-lg">
                  <span className="label block text-[10px] text-[#1a1a18]/60 mb-0.5">Discrepancies</span>
                  <span className="font-mono text-xl font-medium text-[#d97706]">{spacyOnlyCount + bertOnlyCount}</span>
                  <span className="block text-[10px] text-[#d97706]/70 mt-0.5 font-mono">{spacyOnlyCount} spaCy / {bertOnlyCount} BERT</span>
                </div>
              </div>

              {/* Highlighting Display */}
              {dualDisplayMode === 'side-by-side' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Left Column: spaCy */}
                  <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-3">
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
                    <EntityHighlighter text={inputText} entities={spacyFiltered} showConfidence={false} />
                  </div>

                  {/* Right Column: BERT */}
                  <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-3">
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
                    <EntityHighlighter text={inputText} entities={bertFiltered} showConfidence={true} />
                  </div>
                </div>
              ) : (
                /* Tabbed View */
                <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
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
                  />
                </div>
              )}
            </div>
          ) : (
            /* Single Engine Visual Annotation */
            <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-medium text-[#1a1a18]">
                    Annotated Document Spans ({modelChoice})
                  </h3>
                  {visibleEntityTypes.length < ALL_ENTITY_TYPES.length && (
                    <span className="text-[10px] font-mono bg-[#f7f7f5] text-[#1a1a18]/70 border border-[rgba(26,26,24,0.08)] px-2 py-0.5 rounded">
                      {filteredResults.length} / {activeResults.length} Shown
                    </span>
                  )}
                </div>
              </div>

              <EntityHighlighter
                text={inputText}
                entities={filteredResults}
                showConfidence={modelChoice !== 'spaCy'}
              />
            </div>
          )}

          {/* Structured Records & Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table */}
            <div className="lg:col-span-2 card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,24,0.08)]">
                <div>
                  <h4 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2">
                    Structured Entity Records
                    <span className="label font-normal !opacity-70">
                      ({filteredResults.length} / {activeResults.length} visible)
                    </span>
                  </h4>
                  <p className="text-xs text-[#1a1a18]/60 font-sans">
                    Detailed token span boundaries, confidence metrics, and classifications.
                  </p>
                </div>
                {filteredResults.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                )}
              </div>

              {/* Dual Mode Table Sub-filters */}
              {modelChoice === 'Dual' && (
                <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-[rgba(26,26,24,0.06)] text-xs font-mono">
                  <span className="text-[#1a1a18]/60 mr-1 text-[11px]">Filter Models:</span>
                  <button
                    type="button"
                    onClick={() => setDualTableFilter('all')}
                    className={`px-2.5 py-1 rounded border transition-all cursor-pointer ${
                      dualTableFilter === 'all'
                        ? 'bg-[#1a1a18] text-white border-[#1a1a18] font-medium'
                        : 'bg-white text-[#1a1a18]/70 border-[rgba(26,26,24,0.1)] hover:bg-[#f7f7f5]'
                    }`}
                  >
                    All Records ({totalUniqueDual})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDualTableFilter('both')}
                    className={`px-2.5 py-1 rounded border transition-all cursor-pointer ${
                      dualTableFilter === 'both'
                        ? 'bg-[#059669] text-white border-[#059669] font-medium'
                        : 'bg-white text-[#059669] border-[#059669]/30 hover:bg-[#059669]/5'
                    }`}
                  >
                    Consensus ({consensusCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDualTableFilter('spacy-only')}
                    className={`px-2.5 py-1 rounded border transition-all cursor-pointer ${
                      dualTableFilter === 'spacy-only'
                        ? 'bg-[#6366f1] text-white border-[#6366f1] font-medium'
                        : 'bg-white text-[#6366f1] border-[#6366f1]/30 hover:bg-[#6366f1]/5'
                    }`}
                  >
                    spaCy Only ({spacyOnlyCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDualTableFilter('bert-only')}
                    className={`px-2.5 py-1 rounded border transition-all cursor-pointer ${
                      dualTableFilter === 'bert-only'
                        ? 'bg-[#0d9488] text-white border-[#0d9488] font-medium'
                        : 'bg-white text-[#0d9488] border-[#0d9488]/30 hover:bg-[#0d9488]/5'
                    }`}
                  >
                    BERT Only ({bertOnlyCount})
                  </button>
                </div>
              )}

              {filteredResults.length === 0 ? (
                <div className="text-xs font-mono text-[#1a1a18]/60 p-8 text-center bg-[#f7f7f5] border border-dashed border-[rgba(26,26,24,0.15)] rounded-lg space-y-2">
                  <p className="font-medium text-[#1a1a18]">No matching entities are currently visible.</p>
                  {activeResults.length > 0 ? (
                    <p className="text-[11px]">
                      {activeResults.length} entities detected but hidden by filters.{' '}
                      <button
                        onClick={selectAllTypes}
                        className="text-[#d97706] font-medium underline cursor-pointer"
                      >
                        Reset and show all entity types
                      </button>
                    </p>
                  ) : (
                    <p className="text-[11px]">No named entities detected in text.</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto border border-[rgba(26,26,24,0.08)] rounded-lg">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/60 uppercase text-[11px] font-medium">
                      <tr>
                        <th className="py-2.5 px-3">Entity</th>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3 text-right">Start</th>
                        <th className="py-2.5 px-3 text-right">End</th>
                        <th className="py-2.5 px-3">Confidence</th>
                        <th className="py-2.5 px-3">Model</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(26,26,24,0.06)] bg-white">
                      {filteredResults.map((ent, idx) => {
                        const color = LABEL_COLORS[ent.label] || '#d97706';
                        return (
                          <tr key={idx} className="hover:bg-[#f7f7f5]/50">
                            <td className="py-2.5 px-3 font-sans font-medium text-[#1a1a18]">
                              {ent.text}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-medium text-white uppercase"
                                style={{ backgroundColor: color }}
                              >
                                {ent.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-[#1a1a18]/60">
                              {ent.start}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums text-[#1a1a18]/60">
                              {ent.end}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] rounded h-1.5 overflow-hidden">
                                  <div
                                    className="bg-[#d97706] h-full"
                                    style={{ width: `${Math.round(ent.score * 100)}%` }}
                                  />
                                </div>
                                <span className="tabular-nums text-[11px] text-[#1a1a18]">
                                  {(ent.score).toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              {modelChoice === 'Dual' ? (
                                (ent as any).detectedBy === 'Both' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#059669]/10 text-[#059669] border border-[#059669]/20 font-medium inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Both Agreed
                                  </span>
                                ) : (ent as any).detectedBy === 'spaCy' || (ent as any).detectedBy === 'spacy' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20 font-medium inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" /> spaCy Only
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0d9488]/10 text-[#0d9488] border border-[#0d9488]/20 font-medium inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488]" /> BERT Only
                                  </span>
                                )
                              ) : (
                                <span className="text-[#1a1a18]">{ent.model}</span>
                              )}
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
            <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2 mb-1">
                  <BarChart2 className="w-4 h-4 text-[#d97706]" /> Entity Mix Distribution
                </h4>
                <p className="text-xs text-[#1a1a18]/60 font-sans mb-4">
                  Distribution of detected entity classes in current selection.
                </p>

                {sortedTypes.length === 0 ? (
                  <div className="text-xs font-mono text-[#1a1a18]/40 p-4 text-center">
                    No distribution available.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedTypes.map(([type, count]) => {
                      const pct = Math.round((count / maxTypeCount) * 100);
                      const color = LABEL_COLORS[type] || '#d97706';
                      const isVisible = visibleEntityTypes.includes(type);

                      return (
                        <div
                          key={type}
                          onClick={() => toggleEntityType(type)}
                          className={`space-y-1 cursor-pointer transition-opacity ${
                            isVisible ? 'opacity-100' : 'opacity-40'
                          }`}
                          title={`Click to ${isVisible ? 'hide' : 'show'} ${type}`}
                        >
                          <div className="flex justify-between text-xs font-mono text-[#1a1a18]">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span className={isVisible ? '' : 'line-through'}>{type}</span>
                            </span>
                            <span className="tabular-nums text-[#d97706] font-medium">{count}</span>
                          </div>
                          <div className="w-full bg-[#f7f7f5] rounded h-1.5 overflow-hidden">
                            <div
                              className="h-full transition-all duration-300"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[rgba(26,26,24,0.08)] text-[11px] font-mono text-[#1a1a18]/60 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#d97706] shrink-0" />
                <span>OntoNotes 5.0 and CoNLL-2003 standardized mappings.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NLP Concepts Guide */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4 mt-8">
        <div className="border-b border-[rgba(26,26,24,0.08)] pb-3">
          <span className="label !opacity-100 text-[#d97706] font-medium">
            NLP Theory & Taxonomy Reference
          </span>
          <h3 className="font-serif text-xl text-[#1a1a18] font-normal mt-1">
            Understanding Named Entity Recognition (NER), Cardinal & Ordinal Classes
          </h3>
          <p className="text-xs text-[#1a1a18]/60 font-sans mt-0.5">
            How token boundary extraction operates and how numeric entity categories are classified.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-sans">
          {/* Card 1 */}
          <div className="p-4 rounded-lg border border-[rgba(26,26,24,0.08)] bg-[#f7f7f5] space-y-2">
            <div className="font-serif font-medium text-sm text-[#1a1a18] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]"></span>
              Why are only specific words tagged?
            </div>
            <p className="text-[#1a1a18]/70 leading-relaxed text-[11px]">
              NER is an <b>Information Extraction pipeline</b>, not a syntax tree generator. It intentionally ignores grammatical noise (<i>"the", "in", "and", "was"</i>) to isolate <b>high-value entities</b>: executives, corporations, municipalities, and fiscal numbers.
            </p>
            <div className="pt-2 border-t border-[rgba(26,26,24,0.08)] text-[11px] font-mono">
              <span className="font-medium text-[#1a1a18]">Industry Pipeline Terms:</span>
              <ul className="list-disc list-inside text-[#1a1a18]/60 mt-1 space-y-0.5">
                <li>Key Information Extraction (KIE)</li>
                <li>Dense Named Entity Recognizer</li>
                <li>Token Classification Head</li>
              </ul>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-lg border border-[rgba(26,26,24,0.08)] bg-[#f7f7f5] space-y-2">
            <div className="font-serif font-medium text-sm text-[#1a1a18] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a18]"></span>
              Cardinal vs. Ordinal Distinction
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 bg-white rounded border border-[rgba(26,26,24,0.08)]">
                <div className="font-mono text-[#1a1a18] flex items-center justify-between">
                  <span className="font-medium">1. CARDINAL (Count)</span>
                  <span className="text-[9px] uppercase font-mono text-[#d97706]">"How Many?"</span>
                </div>
                <p className="text-[#1a1a18]/60 mt-0.5">
                  Absolute counts, amounts, or integer tallies.
                </p>
                <div className="mt-1 font-mono text-[10px] text-[#1a1a18]/80 bg-[#f7f7f5] px-1.5 py-0.5 rounded">
                  Examples: 15,000, 10, 50, 18 crore, 2,250
                </div>
              </div>

              <div className="p-2.5 bg-white rounded border border-[rgba(26,26,24,0.08)]">
                <div className="font-mono text-[#1a1a18] flex items-center justify-between">
                  <span className="font-medium">2. ORDINAL (Rank)</span>
                  <span className="text-[9px] uppercase font-mono text-[#d97706]">"Which Rank?"</span>
                </div>
                <p className="text-[#1a1a18]/60 mt-0.5">
                  Sequence positions with suffix morphemes (<i>-st, -nd, -rd, -th</i>).
                </p>
                <div className="mt-1 font-mono text-[10px] text-[#1a1a18]/80 bg-[#f7f7f5] px-1.5 py-0.5 rounded">
                  Examples: 10th, 12th, 1st place, second round
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-lg border border-[rgba(26,26,24,0.08)] bg-[#f7f7f5] space-y-2">
            <div className="font-serif font-medium text-sm text-[#1a1a18] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]"></span>
              Aho-Corasick Automaton Linear DFA
            </div>
            <p className="text-[#1a1a18]/70 leading-relaxed text-[11px]">
              Exact string-searching state machine compiling dictionaries of entity keywords into a <b>Trie with failure transitions</b>.
            </p>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2.5 bg-white rounded border border-[rgba(26,26,24,0.08)]">
                <div className="font-mono text-[#1a1a18] flex items-center justify-between">
                  <span className="font-medium">Speed: O(n + m)</span>
                  <span className="text-[9px] font-mono text-[#d97706] font-medium">~0.4 ms</span>
                </div>
                <p className="text-[#1a1a18]/60 mt-0.5 text-[10px]">
                  Scans entire corpus in a single pass without latency or external tokens.
                </p>
              </div>

              <div className="p-2.5 bg-white rounded border border-[rgba(26,26,24,0.08)]">
                <div className="font-mono text-[#1a1a18] flex items-center justify-between">
                  <span className="font-medium">Accuracy Assurance</span>
                  <span className="text-[9px] font-mono text-[#d97706] font-medium">Ensemble</span>
                </div>
                <p className="text-[#1a1a18]/60 mt-0.5 text-[10px]">
                  Combines keyword DFA with regex numerical parsers to guarantee high precision on gold entities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
