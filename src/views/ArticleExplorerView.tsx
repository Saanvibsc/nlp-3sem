import React, { useState, useMemo } from 'react';
import {
  CorpusArticle,
  extractSpacyEntities,
  extractBertEntities,
  Entity,
  LABEL_COLORS,
} from '../services/nlpEngine';
import { EntityHighlighter } from '../components/EntityHighlighter';
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Send,
  Sparkles,
  Tag,
  Zap,
  Cpu,
} from 'lucide-react';

interface ArticleExplorerViewProps {
  articles: CorpusArticle[];
  onSendToWorkbench: (text: string) => void;
}

export const ArticleExplorerView: React.FC<ArticleExplorerViewProps> = ({
  articles,
  onSendToWorkbench,
}) => {
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(
    articles.length > 0 ? articles[0].id : null
  );
  const [activeModel, setActiveModel] = useState<'spaCy' | 'BERT'>('spaCy');

  const totalPages = Math.max(1, Math.ceil(articles.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentArticles = articles.slice(startIndex, startIndex + pageSize);

  // Active selected article
  const selectedArticle =
    articles.find(a => a.id === selectedArticleId) || articles[0] || null;

  // Immediately and automatically extract entities whenever selectedArticle or activeModel changes
  const detectedEntities = useMemo<Entity[]>(() => {
    if (!selectedArticle) return [];
    const textToScan = selectedArticle.content.slice(0, 2000);
    return activeModel === 'spaCy'
      ? extractSpacyEntities(textToScan)
      : extractBertEntities(textToScan);
  }, [selectedArticle, activeModel]);

  // Aggregate entity breakdown for active article
  const entityClassCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    detectedEntities.forEach(e => {
      counts[e.label] = (counts[e.label] || 0) + 1;
    });
    return counts;
  }, [detectedEntities]);

  return (
    <div className="space-y-8 pt-2 pb-12">
      <div className="max-w-3xl">
        <span className="label !opacity-100 text-[#d97706] flex items-center gap-1.5 font-medium mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
          Interactive News Corpus Explorer
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1a1a18] leading-[1.05] tracking-tight mb-3">
          Article Explorer
        </h1>
        <p className="font-serif text-base sm:text-lg text-[#1a1a18]/70 max-w-2xl leading-relaxed mb-6">
          Click any news article to inspect its live entity classification, token spans, confidence distributions, and model predictions.
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="card p-6 text-center font-mono text-xs text-[#1a1a18]/70">
          No articles match your search or category filters. Try expanding your selection in the sidebar.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Table Container */}
          <div className="card p-0 overflow-hidden bg-white border border-[rgba(26,26,24,0.08)] rounded-xl">
            {/* Table controls header */}
            <div className="p-4 border-b border-[rgba(26,26,24,0.08)] flex flex-wrap items-center justify-between gap-3 bg-[#f7f7f5]">
              <div className="text-xs font-mono text-[#1a1a18] flex items-center gap-2">
                <span>Total: <b className="font-medium text-[#1a1a18]">{articles.length.toLocaleString()}</b></span>
                <span className="text-[#1a1a18]/30">·</span>
                <span className="text-[#1a1a18]/60">Click any row to classify</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-[#1a1a18]">
                <div className="flex items-center gap-2">
                  <span className="text-[#1a1a18]/60">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-[rgba(26,26,24,0.12)] rounded px-2 py-1 bg-white text-xs font-mono focus:outline-none focus:border-[#d97706]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1 rounded border border-[rgba(26,26,24,0.12)] bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f7f7f5] cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-xs text-[#1a1a18] px-1 tabular-nums">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1 rounded border border-[rgba(26,26,24,0.12)] bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f7f7f5] cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/60 uppercase text-[11px] font-medium">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">ID</th>
                    <th className="py-3 px-4">Headline</th>
                    <th className="py-3 px-4">Domain Category</th>
                    <th className="py-3 px-4">Quick Preview</th>
                    <th className="py-3 px-4 text-right">Words</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(26,26,24,0.06)] bg-white">
                  {currentArticles.map(art => {
                    const isSelected = selectedArticle?.id === art.id;
                    const quickPreview = extractSpacyEntities(art.content.slice(0, 400));
                    const previewText = quickPreview.slice(0, 2).map(e => e.text).join(', ');

                    return (
                      <tr
                        key={art.id}
                        onClick={() => setSelectedArticleId(art.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#f7f7f5] font-medium border-l-2 border-l-[#d97706]'
                            : 'hover:bg-[#f7f7f5]/50'
                        }`}
                      >
                        <td className="py-3 px-4 text-center tabular-nums text-[#1a1a18]/50">
                          #{art.id}
                        </td>
                        <td className="py-3 px-4 max-w-sm font-sans font-medium text-[#1a1a18] truncate">
                          {art.headlines}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="badge">
                            {art.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs text-[#1a1a18]/70 truncate">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#f7f7f5] text-[10px] text-[#1a1a18]">
                            <Tag className="w-2.5 h-2.5 text-[#d97706]" />
                            {quickPreview.length} entities
                          </span>
                          {previewText && (
                            <span className="ml-2 text-xs text-[#1a1a18]/50 truncate font-sans">
                              ({previewText}...)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap text-[#1a1a18]/60 tabular-nums">
                          {art.word_count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                              isSelected
                                ? 'bg-[#1a1a18] text-white'
                                : 'bg-[#f7f7f5] text-[#1a1a18]/70'
                            }`}
                          >
                            {isSelected ? 'Active' : 'Select'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Classification Panel for Clicked Article */}
          {selectedArticle && (
            <div className="card p-6 md:p-8 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-6">
              {/* Header with Classification Meta */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[rgba(26,26,24,0.08)] gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-accent">
                      Category: {selectedArticle.category}
                    </span>
                    <span className="label !opacity-70 text-[#1a1a18]">
                      Article #{selectedArticle.id} · {selectedArticle.word_count.toLocaleString()} words
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#1a1a18] font-normal leading-tight">
                    {selectedArticle.headlines}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Model toggle */}
                  <div className="flex border border-[rgba(26,26,24,0.08)] rounded-lg p-0.5 bg-[#f7f7f5]">
                    <button
                      onClick={() => setActiveModel('spaCy')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs rounded transition-all cursor-pointer ${
                        activeModel === 'spaCy'
                          ? 'bg-white text-[#1a1a18] font-medium shadow-xs'
                          : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-[#d97706]" /> spaCy
                    </button>
                    <button
                      onClick={() => setActiveModel('BERT')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs rounded transition-all cursor-pointer ${
                        activeModel === 'BERT'
                          ? 'bg-white text-[#1a1a18] font-medium shadow-xs'
                          : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5 text-[#1a1a18]" /> BERT
                    </button>
                  </div>

                  <button
                    onClick={() => onSendToWorkbench(selectedArticle.content)}
                    className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Workbench
                  </button>

                  {selectedArticle.url && selectedArticle.url.startsWith('http') && (
                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Source
                    </a>
                  )}
                </div>
              </div>

              {/* Classification Summary Cards for this Article */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)]">
                  <div className="label">Domain Class</div>
                  <div className="font-mono text-lg font-medium text-[#1a1a18] mt-1">
                    {selectedArticle.category}
                  </div>
                  <div className="text-[10px] font-mono text-[#1a1a18]/50 mt-0.5">News category</div>
                </div>

                <div className="p-4 rounded-lg bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)]">
                  <div className="label">Entities Detected</div>
                  <div className="font-mono text-lg font-medium text-[#d97706] mt-1 tabular-nums">
                    {detectedEntities.length}
                  </div>
                  <div className="text-[10px] font-mono text-[#1a1a18]/50 mt-0.5">Via {activeModel}</div>
                </div>

                <div className="p-4 rounded-lg bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)]">
                  <div className="label">Unique Classes</div>
                  <div className="font-mono text-lg font-medium text-[#1a1a18] mt-1 tabular-nums">
                    {Object.keys(entityClassCounts).length}
                  </div>
                  <div className="text-[10px] font-mono text-[#1a1a18]/50 mt-0.5">Entity categories</div>
                </div>

                <div className="p-4 rounded-lg bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)]">
                  <div className="label">Avg Confidence</div>
                  <div className="font-mono text-lg font-medium text-[#1a1a18] mt-1 tabular-nums">
                    {activeModel === 'BERT' && detectedEntities.length > 0
                      ? `${Math.round(
                          (detectedEntities.reduce((acc, e) => acc + e.score, 0) /
                            detectedEntities.length) *
                            100
                        )}%`
                      : '100%'}
                  </div>
                  <div className="text-[10px] font-mono text-[#1a1a18]/50 mt-0.5">Model certainty</div>
                </div>
              </div>

              {/* Entity Breakdown Badges for this Article */}
              <div className="p-4 rounded-lg bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)]">
                <div className="label !opacity-80 font-medium text-[#1a1a18] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Entity Breakdown for Article #{selectedArticle.id}:</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(entityClassCounts).map(([cls, count]) => {
                    const color = LABEL_COLORS[cls] || '#d97706';
                    return (
                      <span
                        key={cls}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs bg-white border border-[rgba(26,26,24,0.08)] rounded-md shadow-2xs"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[#1a1a18]">{cls}:</span>
                        <span className="text-[#d97706] font-medium tabular-nums">{count}</span>
                      </span>
                    );
                  })}
                  {detectedEntities.length === 0 && (
                    <span className="text-xs font-mono text-[#1a1a18]/50 italic">
                      No entities identified in sample boundary.
                    </span>
                  )}
                </div>
              </div>

              {/* Highlighted Full Text & Structured Entity Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <h4 className="font-serif text-sm text-[#1a1a18] flex items-center gap-1.5 font-medium">
                      <BookOpen className="w-4 h-4 text-[#d97706]" />
                      Classified Text Spans ({activeModel})
                    </h4>
                    <span className="label !opacity-70">
                      Entity spans visually highlighted below
                    </span>
                  </div>

                  <EntityHighlighter
                    text={selectedArticle.content}
                    entities={detectedEntities}
                    showConfidence={activeModel === 'BERT'}
                  />
                </div>

                {/* Right side: Detailed Token Spans Table */}
                <div className="border border-[rgba(26,26,24,0.08)] rounded-xl p-4 bg-[#f7f7f5] flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,24,0.08)]">
                      <h4 className="font-serif text-sm font-medium text-[#1a1a18]">
                        Extracted Tokens ({detectedEntities.length})
                      </h4>
                      <span className="label !opacity-100 text-[#d97706] font-medium">
                        {activeModel}
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                      {detectedEntities.map((ent, idx) => {
                        const color = LABEL_COLORS[ent.label] || '#d97706';
                        return (
                          <div
                            key={idx}
                            className="bg-white border border-[rgba(26,26,24,0.08)] rounded-md p-2.5 text-xs flex items-center justify-between shadow-2xs"
                          >
                            <div>
                              <div className="font-sans font-medium text-[#1a1a18]">{ent.text}</div>
                              <div className="text-[10px] text-[#1a1a18]/50 font-mono tabular-nums">
                                pos: [{ent.start}, {ent.end}]
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium text-white uppercase tracking-wider block"
                                style={{ backgroundColor: color }}
                              >
                                {ent.label}
                              </span>
                              {activeModel === 'BERT' && (
                                <span className="text-[10px] font-mono text-[#1a1a18]/70 block mt-0.5 tabular-nums">
                                  {Math.round(ent.score * 100)}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {detectedEntities.length === 0 && (
                        <div className="text-xs font-mono text-[#1a1a18]/50 italic p-4 text-center">
                          No entities detected.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[rgba(26,26,24,0.08)] text-[11px] font-mono text-[#1a1a18]/60 flex items-center justify-between">
                    <span>Model: {activeModel}</span>
                    <span>Article #{selectedArticle.id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
