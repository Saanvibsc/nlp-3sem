import React from 'react';
import { PageId } from './Sidebar';

interface HeaderProps {
  currentPage: PageId;
  totalArticles: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  totalArticles,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 z-10">
      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="font-medium text-slate-400">Workspace</span>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-600">News NLP Intelligence</span>
        <span className="text-slate-300">/</span>
        <span className="font-bold text-slate-900">{currentPage}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Model Pipeline Status */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-800">Pipeline:</span>
          <span>spaCy + BERT</span>
        </div>

        {/* Corpus Count Indicator */}
        <div className="text-xs text-slate-500 hidden md:block">
          <span className="font-mono font-semibold text-slate-800 tabular-nums">
            7,987
          </span>{' '}
          corpus articles
        </div>
      </div>
    </header>
  );
};
