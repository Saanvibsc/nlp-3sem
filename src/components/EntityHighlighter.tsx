import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Entity, LABEL_COLORS } from '../services/nlpEngine';
import {
  Check,
  CheckCircle2,
  X,
  Search,
  Filter,
  Copy,
  Trash2,
  Plus,
  Sparkles,
  ShieldCheck,
  Sliders,
  Download,
  Type,
  Tag,
  Eye,
  AlertCircle,
} from 'lucide-react';

export const LABEL_DEFINITIONS: Record<string, string> = {
  CARDINAL: 'CARDINAL: Numeric quantity or count (answers "How many?": e.g., 10, 50, 2,250, 130,000)',
  ORDINAL: 'ORDINAL: Rank, sequence, or position in order (answers "Which rank?": e.g., 1st, 10th, 12th, second)',
  PERSON: 'PERSON: Specific people, individuals, or proper names (e.g., Nirmala Sitharaman, Satya Nadella)',
  ORG: 'ORG: Companies, institutions, government bodies, or associations (e.g., Tata Group, RBI, BCCI)',
  LOCATION: 'LOCATION: Countries, cities, states, or geographic facilities (e.g., India, New Delhi, Narendra Modi Stadium)',
  DATE: 'DATE: Absolute or relative dates, days of week, fiscal periods (e.g., Monday, November 2026, FY25, Q1)',
  MONEY: 'MONEY: Currency values and monetary figures (e.g., $100 billion, 11.11 lakh crore rupees, Rs 2,250 cr)',
  PERCENT: 'PERCENT: Percentage expressions (e.g., 300%, 15.5%)',
  EVENT: 'EVENT: Named conferences, sports tournaments, or summits (e.g., COP summit, World Cup)',
  PRODUCT: 'PRODUCT: Commercial items, models, or software platforms (e.g., GPT-4, Watch Series 9, Azure)',
  WORK_OF_ART: 'WORK_OF_ART: Titles of books, degrees, artworks (e.g., PhD, Watch Series)',
  NORP: 'NORP: Nationalities, religious, or political affiliations (e.g., Indian, American)',
  FAC: 'FACILITY: Buildings, airports, highways, stadiums (e.g., Narendra Modi Stadium, Heathrow Airport)',
  MISC: 'MISC: Miscellaneous named entities (e.g., subwords, academic domains)',
};

export const BRUTAL_LABEL_COLORS: Record<string, string> = {
  ORG: '#d97706', // Warm Amber Accent
  PER: '#1a1a18', // Deep Ink
  PERSON: '#1a1a18',
  LOC: '#0284c7', // Steel Blue
  LOCATION: '#0284c7',
  DATE: '#059669', // Emerald
  MONEY: '#b45309', // Warm Ochre
  CARDINAL: '#475569', // Slate
  ORDINAL: '#c2410c', // Rust
  PERCENT: '#0f766e', // Teal
  PRODUCT: '#6d28d9', // Deep Purple
  EVENT: '#be185d', // Crimson
  WORK_OF_ART: '#4338ca', // Indigo
  NORP: '#334155',
  FAC: '#047857',
  MISC: '#64748b',
};

export const ALL_CANONICAL_LABELS = [
  'ORG',
  'PERSON',
  'LOCATION',
  'DATE',
  'MONEY',
  'CARDINAL',
  'ORDINAL',
  'PERCENT',
  'PRODUCT',
  'EVENT',
  'WORK_OF_ART',
  'MISC',
];

export interface EntityHighlighterProps {
  text: string;
  entities: Entity[];
  showConfidence?: boolean;
  enableProofing?: boolean;
  onUpdateEntity?: (updatedEntity: Entity, index: number) => void;
  onDeleteEntity?: (entity: Entity, index: number) => void;
  onAddEntity?: (newEntity: Entity) => void;
  showToolbar?: boolean;
  articleTitle?: string;
}

export const EntityHighlighter: React.FC<EntityHighlighterProps> = ({
  text,
  entities: initialEntities,
  showConfidence = true,
  enableProofing = true,
  onUpdateEntity,
  onDeleteEntity,
  onAddEntity,
  showToolbar = true,
  articleTitle,
}) => {
  // Local mutable state for proofing
  const [entities, setEntities] = useState<Entity[]>(initialEntities || []);
  const [verifiedKeys, setVerifiedKeys] = useState<Set<string>>(new Set());
  const [selectedEntity, setSelectedEntity] = useState<{ entity: Entity; index: number } | null>(null);
  const [activeLabelFilter, setActiveLabelFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [displayStyle, setDisplayStyle] = useState<'badge' | 'underline' | 'reading'>('badge');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [selectedSelection, setSelectedSelection] = useState<{ text: string; start: number; end: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync when parent entities change
  useEffect(() => {
    setEntities(initialEntities || []);
  }, [initialEntities]);

  // Click outside to close entity inspector popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setSelectedEntity(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Safe entity key generator
  const getEntityKey = (ent: Entity, idx: number) => `${ent.text}-${ent.start}-${ent.end}-${idx}`;

  // Robust reconciliation of complicated article text spans:
  // Corrects any offset drift (e.g. from whitespace normalization or punctuation)
  const reconciledEntities = useMemo(() => {
    if (!text || !entities || entities.length === 0) return [];

    const reconciled: Array<Entity & { origIndex: number; key: string }> = [];

    entities.forEach((ent, idx) => {
      let { start, end, text: entText } = ent;
      if (!entText) return;

      // Check if text at [start, end] exactly matches entText
      const directSlice = text.slice(start, end);
      if (directSlice !== entText) {
        // Offset drift detected! Reconcile by localized search
        let foundIndex = -1;
        // Search in a window ±60 characters around original start
        const windowStart = Math.max(0, start - 60);
        const windowEnd = Math.min(text.length, end + 60);
        const searchWindow = text.slice(windowStart, windowEnd);
        const localIdx = searchWindow.indexOf(entText);

        if (localIdx !== -1) {
          foundIndex = windowStart + localIdx;
        } else {
          // Global fallback search
          foundIndex = text.indexOf(entText);
        }

        if (foundIndex !== -1) {
          start = foundIndex;
          end = foundIndex + entText.length;
        }
      }

      // Clamp within text length
      start = Math.max(0, Math.min(start, text.length));
      end = Math.max(start, Math.min(end, text.length));

      reconciled.push({
        ...ent,
        start,
        end,
        origIndex: idx,
        key: getEntityKey(ent, idx),
      });
    });

    // Sort by start offset ascending, and longer spans first
    reconciled.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Filter overlapping spans safely to preserve document fidelity
    const nonOverlapping: typeof reconciled = [];
    let lastEnd = 0;

    for (const item of reconciled) {
      if (item.start >= lastEnd) {
        nonOverlapping.push(item);
        lastEnd = item.end;
      }
    }

    return nonOverlapping;
  }, [text, entities]);

  // Aggregate category counts for the proofing toolbar
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entities.forEach(e => {
      counts[e.label] = (counts[e.label] || 0) + 1;
    });
    return counts;
  }, [entities]);

  // Proofing stats
  const totalCount = entities.length;
  const verifiedCount = useMemo(() => {
    return entities.filter((e, idx) => verifiedKeys.has(getEntityKey(e, idx))).length;
  }, [entities, verifiedKeys]);

  const proofingPercentage = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 100;

  // Toggle verification for an entity
  const toggleVerify = (ent: Entity, idx: number) => {
    const key = getEntityKey(ent, idx);
    setVerifiedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Reclassify entity label
  const handleReclassify = (newLabel: string) => {
    if (!selectedEntity) return;
    const { entity, index } = selectedEntity;
    const updated: Entity = {
      ...entity,
      label: newLabel,
      score: 1.0, // manually validated
      reason: 'Human Proofing Override',
    };

    const newEntities = [...entities];
    newEntities[index] = updated;
    setEntities(newEntities);

    // Auto mark as verified
    const key = getEntityKey(updated, index);
    setVerifiedKeys(prev => new Set(prev).add(key));

    setSelectedEntity({ entity: updated, index });
    if (onUpdateEntity) onUpdateEntity(updated, index);
  };

  // Delete entity annotation
  const handleDeleteEntity = () => {
    if (!selectedEntity) return;
    const { entity, index } = selectedEntity;
    const newEntities = entities.filter((_, i) => i !== index);
    setEntities(newEntities);
    setSelectedEntity(null);
    if (onDeleteEntity) onDeleteEntity(entity, index);
  };

  // Verify all entities in one click
  const handleVerifyAll = () => {
    const allKeys = new Set<string>();
    entities.forEach((e, idx) => allKeys.add(getEntityKey(e, idx)));
    setVerifiedKeys(allKeys);
  };

  // Reset proofing status
  const handleResetProofing = () => {
    setVerifiedKeys(new Set());
  };

  // Handle text selection in article to tag new entity
  const handleMouseUp = () => {
    if (!enableProofing) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectedSelection(null);
      return;
    }

    const selText = sel.toString().trim();
    if (!selText || selText.length < 2) {
      setSelectedSelection(null);
      return;
    }

    // Locate selection offset in text
    const idx = text.indexOf(selText);
    if (idx !== -1) {
      setSelectedSelection({
        text: selText,
        start: idx,
        end: idx + selText.length,
      });
    }
  };

  // Add new entity from selection
  const handleAddEntityFromSelection = (label: string) => {
    if (!selectedSelection) return;
    const newEnt: Entity = {
      text: selectedSelection.text,
      label,
      start: selectedSelection.start,
      end: selectedSelection.end,
      score: 1.0,
      model: 'spaCy' as any,
      reason: 'Manual Proofing Addition',
    };

    const newEntities = [...entities, newEnt].sort((a, b) => a.start - b.start);
    setEntities(newEntities);
    const newIdx = newEntities.indexOf(newEnt);
    setVerifiedKeys(prev => new Set(prev).add(getEntityKey(newEnt, newIdx)));
    setSelectedSelection(null);
    if (onAddEntity) onAddEntity(newEnt);
  };

  // Copy proofed text with markup
  const handleCopyProofedText = () => {
    let annotatedString = text;
    // Replace from back to front to keep offsets valid
    const reversed = [...reconciledEntities].sort((a, b) => b.start - a.start);
    for (const ent of reversed) {
      const before = annotatedString.slice(0, ent.start);
      const after = annotatedString.slice(ent.end);
      annotatedString = `${before}[${ent.text}](${ent.label})${after}`;
    }

    navigator.clipboard.writeText(annotatedString);
    setCopyFeedback('Annotated text copied to clipboard!');
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Download proofed annotations as JSON
  const handleDownloadProofedJSON = () => {
    const data = {
      article_title: articleTitle || 'Article NER Proofing',
      text_length: text.length,
      verified_count: verifiedCount,
      total_entities: entities.length,
      proofing_completion_rate: `${proofingPercentage}%`,
      entities: entities.map((e, idx) => ({
        text: e.text,
        label: e.label,
        start: e.start,
        end: e.end,
        confidence: e.score,
        model: e.model,
        proofed: verifiedKeys.has(getEntityKey(e, idx)),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proofed_article_ner_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render article text with highlights and search matching
  const renderAnnotatedContent = () => {
    if (!text) {
      return (
        <div className="py-12 text-center text-xs font-mono text-[#1a1a18]/40 italic">
          No text content provided for annotation.
        </div>
      );
    }

    if (reconciledEntities.length === 0) {
      return (
        <div className="whitespace-pre-wrap leading-relaxed text-[#1a1a18] select-text">
          {text}
        </div>
      );
    }

    const elements: React.ReactNode[] = [];
    let cursor = 0;

    reconciledEntities.forEach((ent, idx) => {
      // 1. Text chunk before entity
      if (ent.start > cursor) {
        const textSlice = text.slice(cursor, ent.start);
        elements.push(
          <span key={`txt-${cursor}`} className="select-text">
            {renderSearchHighlights(textSlice, cursor)}
          </span>
        );
      }

      // 2. Entity span
      const entText = text.slice(ent.start, ent.end);
      const color = BRUTAL_LABEL_COLORS[ent.label] || LABEL_COLORS[ent.label] || '#d97706';
      const confPercentage = Math.round(ent.score * 100);
      const definition = LABEL_DEFINITIONS[ent.label] || `${ent.label} Named Entity`;
      const isVerified = verifiedKeys.has(ent.key);
      const isSelected = selectedEntity?.index === ent.origIndex;

      // Filter check
      const matchesFilter = activeLabelFilter === 'ALL' || ent.label === activeLabelFilter;
      const opacityClass = matchesFilter ? 'opacity-100' : 'opacity-25 filter grayscale';

      if (displayStyle === 'badge') {
        // Rich Badge Style with Proofing Status
        elements.push(
          <span
            key={ent.key}
            onClick={() => {
              if (enableProofing) {
                setSelectedEntity({ entity: ent, index: ent.origIndex });
              }
            }}
            title={`${definition} (Click to inspect / proof)`}
            className={`inline-flex items-baseline font-medium px-2 py-0.5 my-0.5 mx-0.5 rounded text-white shadow-2xs transition-all cursor-pointer ${opacityClass} ${
              isSelected ? 'ring-2 ring-offset-1 ring-[#1a1a18] scale-[1.02]' : 'hover:opacity-95'
            }`}
            style={{ backgroundColor: color }}
          >
            <span className="font-sans">{entText}</span>

            <span className="font-mono text-[10px] ml-1.5 pl-1.5 border-l border-white/40 text-white/95 uppercase tracking-wider font-semibold inline-flex items-center gap-1">
              {ent.label}
              {showConfidence && ent.model === 'BERT' && (
                <span className="opacity-90 font-normal">·{confPercentage}%</span>
              )}
              {isVerified && (
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300 fill-emerald-800 shrink-0 inline ml-0.5" />
              )}
            </span>
          </span>
        );
      } else if (displayStyle === 'underline') {
        // Proofing Underline Style
        elements.push(
          <span
            key={ent.key}
            onClick={() => {
              if (enableProofing) {
                setSelectedEntity({ entity: ent, index: ent.origIndex });
              }
            }}
            title={`${definition} (Click to proof)`}
            className={`cursor-pointer inline-flex items-baseline border-b-2 font-medium px-1 rounded-xs transition-colors ${opacityClass} ${
              isVerified ? 'border-emerald-600 bg-emerald-50/60' : 'border-[#d97706] bg-amber-50/60'
            }`}
            style={{ borderBottomColor: color }}
          >
            <span className="text-[#1a1a18]">{entText}</span>
            <span
              className="text-[9px] font-mono ml-1 px-1 rounded text-white font-semibold"
              style={{ backgroundColor: color }}
            >
              {ent.label}
              {isVerified && ' ✓'}
            </span>
          </span>
        );
      } else {
        // Clean Editorial Reading Style
        elements.push(
          <span
            key={ent.key}
            onClick={() => {
              if (enableProofing) {
                setSelectedEntity({ entity: ent, index: ent.origIndex });
              }
            }}
            title={`${definition}`}
            className={`cursor-pointer px-1 rounded-sm font-medium transition-colors ${opacityClass}`}
            style={{
              backgroundColor: `${color}20`,
              color: color,
              borderBottom: `1.5px solid ${color}`,
            }}
          >
            {entText}
          </span>
        );
      }

      cursor = ent.end;
    });

    // 3. Trailing text chunk
    if (cursor < text.length) {
      const tailSlice = text.slice(cursor);
      elements.push(
        <span key="txt-tail" className="select-text">
          {renderSearchHighlights(tailSlice, cursor)}
        </span>
      );
    }

    return elements;
  };

  // Highlight search term inside raw text slices
  const renderSearchHighlights = (slice: string, baseOffset: number) => {
    if (!searchTerm.trim()) return slice;
    const term = searchTerm.trim().toLowerCase();
    const parts: React.ReactNode[] = [];
    let startIdx = 0;
    const lowerSlice = slice.toLowerCase();

    while (startIdx < slice.length) {
      const matchIdx = lowerSlice.indexOf(term, startIdx);
      if (matchIdx === -1) {
        parts.push(slice.slice(startIdx));
        break;
      }

      if (matchIdx > startIdx) {
        parts.push(slice.slice(startIdx, matchIdx));
      }

      parts.push(
        <mark
          key={`mark-${baseOffset + matchIdx}`}
          className="bg-amber-200 text-amber-950 px-0.5 rounded font-medium"
        >
          {slice.slice(matchIdx, matchIdx + term.length)}
        </mark>
      );

      startIdx = matchIdx + term.length;
    }

    return parts;
  };

  const fontSizeClass =
    fontSize === 'sm' ? 'text-sm leading-relaxed' : fontSize === 'lg' ? 'text-lg leading-loose' : 'text-base leading-relaxed';

  return (
    <div className="space-y-4">
      {/* Proofing Studio Toolbar */}
      {showToolbar && (
        <div className="card p-3.5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-3 shadow-xs">
          {/* Row 1: Proofing Progress & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[rgba(26,26,24,0.06)]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#1a1a18]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Article Proofing:</span>
                <span className="text-emerald-700 font-bold tabular-nums">
                  {verifiedCount} / {totalCount}
                </span>
                <span className="text-[#1a1a18]/50">({proofingPercentage}% verified)</span>
              </div>

              {/* Mini progress bar */}
              <div className="w-24 h-2 bg-[#f7f7f5] rounded-full overflow-hidden border border-[rgba(26,26,24,0.08)] hidden sm:block">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${proofingPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleVerifyAll}
                className="text-xs font-mono px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                title="Mark all detected entities as verified/proofed"
              >
                <Check className="w-3 h-3 text-emerald-600" /> Verify All
              </button>

              <button
                type="button"
                onClick={handleResetProofing}
                className="text-xs font-mono px-2 py-1 bg-[#f7f7f5] text-[#1a1a18]/70 border border-[rgba(26,26,24,0.08)] rounded hover:bg-[#ebebe8] transition-colors cursor-pointer"
                title="Reset verification state"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={handleCopyProofedText}
                className="text-xs font-mono px-2.5 py-1 bg-[#f7f7f5] text-[#1a1a18] border border-[rgba(26,26,24,0.08)] rounded hover:bg-[#ebebe8] transition-colors cursor-pointer flex items-center gap-1"
                title="Copy text with inline [Entity](LABEL) tags"
              >
                <Copy className="w-3 h-3 text-[#d97706]" /> Copy
              </button>

              <button
                type="button"
                onClick={handleDownloadProofedJSON}
                className="text-xs font-mono px-2.5 py-1 bg-[#f7f7f5] text-[#1a1a18] border border-[rgba(26,26,24,0.08)] rounded hover:bg-[#ebebe8] transition-colors cursor-pointer flex items-center gap-1"
                title="Download verified annotations JSON"
              >
                <Download className="w-3 h-3 text-[#2563eb]" /> Export
              </button>
            </div>
          </div>

          {/* Row 2: Search, Label Filters, & Typography Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Label filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveLabelFilter('ALL')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors border ${
                  activeLabelFilter === 'ALL'
                    ? 'bg-[#1a1a18] text-white border-[#1a1a18] font-medium'
                    : 'bg-[#f7f7f5] text-[#1a1a18]/70 border-[rgba(26,26,24,0.08)] hover:bg-[#ebebe8]'
                }`}
              >
                ALL ({totalCount})
              </button>

              {Object.entries(categoryCounts).map(([lbl, cnt]) => {
                const color = BRUTAL_LABEL_COLORS[lbl] || LABEL_COLORS[lbl] || '#64748b';
                const isSelected = activeLabelFilter === lbl;
                return (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setActiveLabelFilter(isSelected ? 'ALL' : lbl)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-all border flex items-center gap-1 ${
                      isSelected
                        ? 'bg-white shadow-xs font-semibold border-[#1a1a18]'
                        : 'bg-[#f7f7f5] text-[#1a1a18]/70 border-[rgba(26,26,24,0.08)] hover:bg-[#ebebe8]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <span>{lbl}</span>
                    <span className="opacity-60 text-[10px]">({cnt})</span>
                  </button>
                );
              })}
            </div>

            {/* Right Controls: Search, Style & Font Size */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Search in article */}
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[#1a1a18]/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Find in article..."
                  className="pl-7 pr-2.5 py-1 bg-white border border-[rgba(26,26,24,0.12)] rounded text-xs font-mono placeholder-[#1a1a18]/40 focus:outline-none focus:border-[#d97706] w-36"
                />
              </div>

              {/* Display Style Toggle */}
              <div className="flex border border-[rgba(26,26,24,0.08)] rounded bg-[#f7f7f5] p-0.5 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setDisplayStyle('badge')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    displayStyle === 'badge' ? 'bg-white shadow-2xs font-semibold text-[#1a1a18]' : 'text-[#1a1a18]/60'
                  }`}
                  title="Full badges with label tags"
                >
                  Badges
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayStyle('underline')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    displayStyle === 'underline' ? 'bg-white shadow-2xs font-semibold text-[#1a1a18]' : 'text-[#1a1a18]/60'
                  }`}
                  title="Proofing underline mode"
                >
                  Lines
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayStyle('reading')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    displayStyle === 'reading' ? 'bg-white shadow-2xs font-semibold text-[#1a1a18]' : 'text-[#1a1a18]/60'
                  }`}
                  title="Clean reading mode"
                >
                  Reading
                </button>
              </div>

              {/* Font Size controls */}
              <div className="flex border border-[rgba(26,26,24,0.08)] rounded bg-[#f7f7f5] p-0.5 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setFontSize('sm')}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    fontSize === 'sm' ? 'bg-white shadow-2xs font-bold text-[#1a1a18]' : 'text-[#1a1a18]/60'
                  }`}
                  title="Small text"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('base')}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    fontSize === 'base' ? 'bg-white shadow-2xs font-bold text-[#1a1a18]' : 'text-[#1a1a18]/60'
                  }`}
                  title="Normal text"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('lg')}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    fontSize === 'lg' ? 'bg-white shadow-2xs font-bold text-[#1a1a18]' : 'text-[#1a1a18]/60'
                  }`}
                  title="Large text"
                >
                  A+
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy notification toast */}
      {copyFeedback && (
        <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Floating Selection Action: Tag New Entity */}
      {selectedSelection && (
        <div className="p-3 bg-white border border-[#1a1a18] rounded-xl shadow-lg flex flex-wrap items-center gap-2 text-xs font-mono animate-in fade-in slide-in-from-top-1">
          <span className="font-semibold text-[#1a1a18] flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-[#d97706]" />
            Tag "{selectedSelection.text}":
          </span>
          {ALL_CANONICAL_LABELS.slice(0, 6).map(lbl => (
            <button
              key={lbl}
              type="button"
              onClick={() => handleAddEntityFromSelection(lbl)}
              className="px-2 py-0.5 rounded text-white text-[11px] font-semibold cursor-pointer shadow-2xs hover:opacity-90"
              style={{ backgroundColor: BRUTAL_LABEL_COLORS[lbl] || '#64748b' }}
            >
              +{lbl}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedSelection(null)}
            className="p-1 hover:bg-[#f7f7f5] rounded text-[#1a1a18]/50 hover:text-[#1a1a18]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* The Annotated Article Text Container */}
      <div className="relative">
        <div
          ref={containerRef}
          onMouseUp={handleMouseUp}
          className={`bg-white border border-[rgba(26,26,24,0.08)] rounded-xl p-6 md:p-8 text-[#1a1a18] shadow-xs max-h-[640px] overflow-y-auto whitespace-pre-wrap font-sans transition-all ${fontSizeClass}`}
        >
          {renderAnnotatedContent()}
        </div>

        {/* Interactive Entity Proofing Inspector Popover */}
        {selectedEntity && (
          <div
            ref={popoverRef}
            className="absolute z-20 bottom-4 right-4 max-w-sm w-full bg-white border border-[#1a1a18]/20 rounded-xl p-4 shadow-xl space-y-3 font-sans animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex items-start justify-between pb-2 border-b border-[rgba(26,26,24,0.08)]">
              <div>
                <span className="text-[10px] font-mono text-[#d97706] font-semibold uppercase tracking-wider block">
                  Proofing Entity Inspector
                </span>
                <h4 className="font-serif text-lg font-medium text-[#1a1a18] mt-0.5">
                  "{selectedEntity.entity.text}"
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntity(null)}
                className="p-1 rounded hover:bg-[#f7f7f5] text-[#1a1a18]/50 hover:text-[#1a1a18] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Entity metadata */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#f7f7f5] p-2.5 rounded-lg border border-[rgba(26,26,24,0.06)]">
              <div>
                <span className="text-[#1a1a18]/50 block text-[10px]">CATEGORY</span>
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-semibold mt-0.5"
                  style={{
                    backgroundColor:
                      BRUTAL_LABEL_COLORS[selectedEntity.entity.label] || LABEL_COLORS[selectedEntity.entity.label] || '#64748b',
                  }}
                >
                  {selectedEntity.entity.label}
                </span>
              </div>
              <div>
                <span className="text-[#1a1a18]/50 block text-[10px]">PROOF STATUS</span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold text-[11px] mt-0.5 ${
                    verifiedKeys.has(getEntityKey(selectedEntity.entity, selectedEntity.index))
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {verifiedKeys.has(getEntityKey(selectedEntity.entity, selectedEntity.index)) ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" /> Unverified
                    </>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[#1a1a18]/50 block text-[10px]">CHAR SPAN</span>
                <span className="text-[#1a1a18] font-medium">
                  [{selectedEntity.entity.start} : {selectedEntity.entity.end}]
                </span>
              </div>
              <div>
                <span className="text-[#1a1a18]/50 block text-[10px]">CONFIDENCE</span>
                <span className="text-[#1a1a18] font-medium">
                  {(selectedEntity.entity.score * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Label Definition */}
            <div className="text-[11px] text-[#1a1a18]/70 font-sans leading-snug bg-amber-50/50 border border-amber-200/50 p-2 rounded">
              {LABEL_DEFINITIONS[selectedEntity.entity.label] || `${selectedEntity.entity.label} entity description.`}
            </div>

            {/* In-place Reclassify Buttons */}
            <div>
              <span className="text-[10px] font-mono text-[#1a1a18]/60 block mb-1">RECLASSIFY LABEL:</span>
              <div className="flex flex-wrap gap-1">
                {ALL_CANONICAL_LABELS.map(lbl => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => handleReclassify(lbl)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-all cursor-pointer ${
                      selectedEntity.entity.label === lbl
                        ? 'ring-2 ring-[#1a1a18] text-white font-bold'
                        : 'text-white hover:opacity-90'
                    }`}
                    style={{ backgroundColor: BRUTAL_LABEL_COLORS[lbl] || '#64748b' }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-[rgba(26,26,24,0.08)] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => toggleVerify(selectedEntity.entity, selectedEntity.index)}
                className={`btn text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer font-mono ${
                  verifiedKeys.has(getEntityKey(selectedEntity.entity, selectedEntity.index))
                    ? 'btn-secondary text-[#1a1a18]'
                    : 'btn-primary bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                {verifiedKeys.has(getEntityKey(selectedEntity.entity, selectedEntity.index))
                  ? 'Unverify'
                  : 'Verify / Proof'}
              </button>

              <button
                type="button"
                onClick={handleDeleteEntity}
                className="btn btn-secondary text-xs py-1.5 px-2.5 text-rose-700 hover:bg-rose-50 hover:border-rose-200 flex items-center gap-1 cursor-pointer font-mono"
                title="Remove entity annotation"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
