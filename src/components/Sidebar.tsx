import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Terminal, 
  Grid3x2 as Grid3X3, 
  GitCompare, 
  TriangleAlert as AlertTriangle, 
  Search, 
  Cpu
} from 'lucide-react';

export type PageId =
  | 'Overview'
  | 'Article explorer'
  | 'NER workbench'
  | 'Evaluation & Confusion Matrix'
  | 'Bias, Error & Explainability'
  | 'spaCy vs BERT comparison';

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
    { id: 'Overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'NER workbench', label: 'NER Workbench', icon: Terminal },
    { id: 'Article explorer', label: 'Article Explorer', icon: FileText },
    { id: 'spaCy vs BERT comparison', label: 'spaCy vs BERT Comparison', icon: GitCompare },
    { id: 'Evaluation & Confusion Matrix', label: 'Confusion Matrix & Metrics', icon: Grid3X3 },
    { id: 'Bias, Error & Explainability', label: 'Bias & Error Audit', icon: AlertTriangle },
  ];

  return (
    <aside className="w-[260px] bg-[#f7f7f5] border-r border-[rgba(26,26,24,0.08)] flex flex-col shrink-0 h-full overflow-y-auto text-[#1a1a18]">
      {/* Sidebar sections */}
      <div className="p-5 flex-1 space-y-6">
        {/* Navigation Section */}
        <div className="space-y-2">
          <span className="label">Workspace</span>
          <div className="flex flex-col gap-1">
            {navItems.map(item => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPage(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[13px] rounded-md transition-all text-left cursor-pointer border ${
                    active
                      ? 'bg-white border-[rgba(26,26,24,0.08)] shadow-xs font-medium text-[#1a1a18]'
                      : 'border-transparent text-[#1a1a18]/70 hover:text-[#1a1a18] hover:bg-black/[0.02]'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {active && <span className="text-[10px] text-[#d97706]">●</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Section */}
        <div className="pt-2 border-t border-[rgba(26,26,24,0.08)] space-y-2">
          <span className="label">Filters</span>
          
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#1a1a18]/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search corpus..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono rounded-md border border-[rgba(26,26,24,0.1)] bg-white focus:outline-none focus:border-[#d97706]"
              />
            </div>

            <div className="flex flex-col gap-1">
              {categories.map(cat => {
                const checked = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => onToggleCategory(cat)}
                    className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md border cursor-pointer transition-all ${
                      checked
                        ? 'bg-white border-[rgba(26,26,24,0.08)] text-[#1a1a18] font-medium shadow-xs'
                        : 'border-transparent text-[#1a1a18]/60 hover:text-[#1a1a18]'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] font-mono">{checked ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Extractions / Engines Section */}
        <div className="pt-2 border-t border-[rgba(26,26,24,0.08)] space-y-2">
          <span className="label">Models</span>
          <div className="flex flex-wrap gap-1.5">
            <span className="badge">spaCy</span>
            <span className="badge">BERT</span>
            <span className="badge">Gemini</span>
            <span className="badge">Automaton</span>
          </div>
        </div>
      </div>

      {/* Model Spec Footer Callout */}
      <div className="p-4 border-t border-[rgba(26,26,24,0.08)] bg-[#f7f7f5]">
        <div className="p-3 bg-white border border-[rgba(26,26,24,0.08)] rounded-lg">
          <span className="label !opacity-100 text-[#d97706] font-medium">Benchmarks</span>
          <div className="text-[11px] font-mono text-[#1a1a18] mt-1 space-y-0.5 leading-relaxed">
            <div>spaCy F1: <b className="font-medium">0.978</b></div>
            <div>BERT F1: <b className="font-medium">0.264</b></div>
            <div className="text-[10px] text-[#1a1a18]/50">20 Gold Records</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
