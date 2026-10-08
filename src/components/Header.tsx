import React from 'react';
import { PageId } from './Sidebar';

interface HeaderProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  totalArticles: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onSelectPage,
  totalArticles,
}) => {
  const quickLinks: { id: PageId; label: string }[] = [
    { id: 'Overview', label: 'Dashboard' },
    { id: 'NER workbench', label: 'NER Workbench' },
    { id: 'Article explorer', label: 'Explorer' },
    { id: 'Python Pipeline (code.py)', label: 'code.py' },
    { id: 'spaCy vs BERT comparison', label: 'spaCy vs BERT' },
    { id: 'Evaluation & Confusion Matrix', label: 'Confusion Matrix & Metrics' },
  ];

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-[rgba(26,26,24,0.08)] bg-[#fdfdfc] z-20 shrink-0 select-none">
      {/* Brand Zone */}
      <div 
        onClick={() => onSelectPage('Overview')}
        className="flex items-center gap-2 cursor-pointer"
      >
        <span className="font-semibold text-sm tracking-tight text-[#1a1a18]">
          NER STUDIO
        </span>
        <span className="text-[10px] bg-[#d97706] text-white px-1 py-0.5 rounded font-mono font-medium leading-none">
          PRO
        </span>
      </div>

      {/* Center Nav Links */}
      <div className="flex items-center gap-6 overflow-x-auto">
        {quickLinks.map(link => {
          const isActive = currentPage === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onSelectPage(link.id)}
              className={`text-[13px] transition-opacity whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-[#1a1a18] font-medium opacity-100'
                  : 'text-[#1a1a18] opacity-60 hover:opacity-100 font-normal'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>

      {/* Right Stats Zone */}
      <div className="label !opacity-80 font-mono text-[11px] text-[#1a1a18]">
        {totalArticles.toLocaleString()} Articles Analyzed
      </div>
    </nav>
  );
};
