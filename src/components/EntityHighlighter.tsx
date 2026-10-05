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
      <div className="bg-white border border-slate-200 rounded-xl p-5 leading-relaxed text-sm text-slate-800 shadow-sm max-h-96 overflow-y-auto whitespace-pre-wrap">
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
    const color = LABEL_COLORS[ent.label] || '#0d9488';
    const confPercentage = Math.round(ent.score * 100);
    const definition = LABEL_DEFINITIONS[ent.label] || `${ent.label} Entity`;

    parts.push(
      <span
        key={`ent-${idx}-${ent.start}`}
        title={definition}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 mx-1 rounded-md text-xs font-medium bg-slate-100 border border-slate-300 shadow-2xs hover:bg-slate-200 transition-colors cursor-help"
        style={{ borderLeftWidth: '3px', borderLeftColor: color }}
      >
        <span className="text-slate-900 font-semibold">{entText}</span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded text-white"
          style={{ backgroundColor: color }}
        >
          {ent.label}
          {showConfidence && ent.model === 'BERT' && (
            <span className="opacity-90 ml-1">· {confPercentage}%</span>
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
    <div className="bg-white border border-slate-200 rounded-xl p-5 leading-loose text-sm text-slate-800 shadow-sm max-h-96 overflow-y-auto whitespace-pre-wrap">
      {parts}
    </div>
  );
};
