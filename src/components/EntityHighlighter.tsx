import React from 'react';
import { Entity, LABEL_COLORS } from '../services/nlpEngine';

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

interface EntityHighlighterProps {
  text: string;
  entities: Entity[];
  showConfidence?: boolean;
}

export const EntityHighlighter: React.FC<EntityHighlighterProps> = ({
  text,
  entities,
  showConfidence = true,
}) => {
  if (!entities || entities.length === 0) {
    return (
      <div className="bg-white border border-[rgba(26,26,24,0.08)] rounded-xl p-6 leading-relaxed text-base text-[#1a1a18] shadow-xs max-h-96 overflow-y-auto whitespace-pre-wrap font-sans">
        {text}
      </div>
    );
  }

  // Sort and filter non-overlapping spans
  const sorted = [...entities].sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const nonOverlapping: Entity[] = [];
  let lastEnd = 0;

  for (const ent of sorted) {
    if (ent.start >= lastEnd && ent.end <= text.length) {
      nonOverlapping.push(ent);
      lastEnd = ent.end;
    }
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  nonOverlapping.forEach((ent, idx) => {
    if (ent.start > cursor) {
      parts.push(
        <span key={`text-${cursor}`}>
          {text.slice(cursor, ent.start)}
        </span>
      );
    }

    const entText = text.slice(ent.start, ent.end);
    const color = BRUTAL_LABEL_COLORS[ent.label] || LABEL_COLORS[ent.label] || '#d97706';
    const confPercentage = Math.round(ent.score * 100);
    const definition = LABEL_DEFINITIONS[ent.label] || `${ent.label} Entity`;

    parts.push(
      <span
        key={`ent-${idx}-${ent.start}`}
        title={definition}
        className="inline-flex items-baseline font-medium px-2 py-0.5 my-0.5 mx-0.5 rounded text-white text-sm shadow-xs transition-opacity hover:opacity-90 cursor-help"
        style={{ backgroundColor: color }}
      >
        <span className="font-sans text-sm">{entText}</span>
        <span className="font-mono text-[0.625rem] ml-1.5 pl-1.5 border-l border-white/40 text-white/90 uppercase tracking-wider font-medium">
          {ent.label}
          {showConfidence && ent.model === 'BERT' && (
            <span className="opacity-90 ml-0.5">·{confPercentage}%</span>
          )}
        </span>
      </span>
    );

    cursor = ent.end;
  });

  if (cursor < text.length) {
    parts.push(
      <span key={`text-tail`}>
        {text.slice(cursor)}
      </span>
    );
  }

  return (
    <div className="bg-white border border-[rgba(26,26,24,0.08)] rounded-xl p-6 leading-relaxed text-base text-[#1a1a18] shadow-xs max-h-96 overflow-y-auto whitespace-pre-wrap font-sans">
      {parts}
    </div>
  );
};
