import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Terminal,
  Grid3X3,
  GitCompare,
  AlertTriangle,
  FileCode,
  Search,
  Filter,
} from 'lucide-react';

export type PageId =
  | 'Overview'
  | 'Article explorer'
  | 'NER workbench'
  | 'Evaluation & Confusion Matrix'
  | 'Bias, Error & Explainability'
  | 'spaCy vs BERT comparison'
  | 'code.py & Datasets';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  categories: string[];
  selectedCategories: string[];
  onToggleCategory: (cat: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  totalArticles: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  categories,
  selectedCategories,
  onToggleCategory,
  searchTerm,
  onSearchChange,
  totalArticles,
}) => {
  const navItems: { id: PageId; label: string; icon: React.FC<any> }[] = [
    { id: 'Overview', label: 'Overview & Corpus (1–7)', icon: LayoutDashboard },
    { id: 'Article explorer', label: 'Article Explorer', icon: FileText },
    { id: 'NER workbench', label: 'NER Workbench (8–10)', icon: Terminal },
    { id: 'Evaluation & Confusion Matrix', label: 'Confusion Matrix & Metrics (11–15)', icon: Grid3X3 },
    { id: 'Bias, Error & Explainability', label: 'Bias & Error Audit (16–20)', icon: AlertTriangle },
    { id: 'spaCy vs BERT comparison', label: 'spaCy vs BERT Comparison', icon: GitCompare },
    { id: 'code.py & Datasets', label: 'code.py & Datasets', icon: FileCode },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full overflow-y-auto text-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-emerald-600/20">
            N
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-base leading-tight">NER Studio Pro</div>
            <div className="text-xs text-slate-500 font-medium">News NLP & Model Benchmarking</div>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="p-4 flex-1 space-y-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
          Workspace View
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                active
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-700' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {/* Corpus Filters */}
        <div className="pt-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center gap-1.5">
            <Filter className="w-3 h-3" /> Corpus Filters
          </div>

          <div className="px-3 pt-2">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search corpus (e.g. Modi, Tata...)"
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
              />
            </div>

            <div className="text-xs font-semibold text-slate-700 mb-2">News Categories:</div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {categories.map(cat => {
                const checked = selectedCategories.includes(cat);
                return (
                  <label
                    key={cat}
                    className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleCategory(cat)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{cat}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-3 text-[11px] text-slate-500">
              Loaded 7,987 cleaned articles (8,000 raw · 13 duplicates removed).
            </div>
          </div>
        </div>
      </div>

      {/* Active NLP Engines Card */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80">
        <div className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
          <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            NLP Pipeline (code.py):
          </div>
          <div>• spaCy (en_core_web_sm) · F1: 0.978</div>
          <div>• BERT (dslim/bert-base-NER) · F1: 0.264</div>
          <div>• 20 Ground-Truth Benchmarks</div>
        </div>
      </div>
    </aside>
  );
};
