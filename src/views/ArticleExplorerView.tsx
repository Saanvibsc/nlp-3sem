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
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Interactive Corpus Explorer
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          News Article Explorer & Classifier
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Click any news article to inspect its instant entity classification, token spans, and model predictions.
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-6 rounded-xl">
          No articles match your search or category filters. Try expanding your selection.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Table controls header */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span>Total Articles: <b>{articles.length.toLocaleString()}</b></span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-semibold">Click any row to classify</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span>Articles per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-slate-200 rounded-md px-2 py-1 bg-white text-xs font-medium focus:ring-emerald-500 focus:border-emerald-500"
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
                    className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-semibold text-slate-800">
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">ID</th>
                    <th className="py-3 px-4">Headline</th>
                    <th className="py-3 px-4">Domain Category</th>
                    <th className="py-3 px-4">Quick Classification</th>
                    <th className="py-3 px-4 text-right">Words</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentArticles.map(art => {
                    const isSelected = selectedArticle?.id === art.id;
                    // Pre-scan first 400 chars for inline preview badge
                    const quickPreview = extractSpacyEntities(art.content.slice(0, 400));
                    const previewText = quickPreview.slice(0, 2).map(e => e.text).join(', ');

                    return (
                      <tr
                        key={art.id}
                        onClick={() => setSelectedArticleId(art.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50/80 font-medium border-l-4 border-l-emerald-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          #{art.id}
                        </td>
                        <td className="py-3 px-4 max-w-sm font-semibold text-slate-900 truncate">
                          {art.headlines}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                            {art.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs text-slate-600 truncate">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-900 text-[10px] font-bold">
                            <Tag className="w-2.5 h-2.5" />
                            {quickPreview.length} entities
                          </span>
                          {previewText && (
                            <span className="ml-2 text-[11px] text-slate-400 truncate">
                              ({previewText}...)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap text-slate-600 font-mono">
                          {art.word_count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              isSelected
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isSelected ? 'Viewing' : 'Select'}
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
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              {/* Header with Classification Meta */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-700 text-white shadow-2xs">
                      Category: {selectedArticle.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      Article #{selectedArticle.id} • {selectedArticle.word_count.toLocaleString()} words
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                    {selectedArticle.headlines}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Model toggle */}
                  <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
                    <button
                      onClick={() => setActiveModel('spaCy')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                        activeModel === 'spaCy'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" /> spaCy
                    </button>
                    <button
                      onClick={() => setActiveModel('BERT')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                        activeModel === 'BERT'
                          ? 'bg-indigo-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5" /> BERT
                    </button>
                  </div>

                  <button
                    onClick={() => onSendToWorkbench(selectedArticle.content)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Workbench
                  </button>

                  {selectedArticle.url && selectedArticle.url.startsWith('http') && (
                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Source
                    </a>
                  )}
                </div>
              </div>

              {/* Classification Summary Cards for this Article */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Domain Class</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {selectedArticle.category}
                  </div>
                  <div className="text-[10px] text-slate-400">News category</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Entities Detected</div>
                  <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                    {detectedEntities.length}
                  </div>
                  <div className="text-[10px] text-slate-400">Via {activeModel} engine</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Unique Classes</div>
                  <div className="text-base font-extrabold text-indigo-700 mt-0.5">
                    {Object.keys(entityClassCounts).length}
                  </div>
                  <div className="text-[10px] text-slate-400">Entity categories</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] font-bold uppercase text-slate-500">Avg Confidence</div>
                  <div className="text-base font-extrabold text-amber-700 mt-0.5">
                    {activeModel === 'BERT' && detectedEntities.length > 0
                      ? `${Math.round(
                          (detectedEntities.reduce((acc, e) => acc + e.score, 0) /
                            detectedEntities.length) *
                            100
                        )}%`
                      : '100%'}
                  </div>
                  <div className="text-[10px] text-slate-400">Model certainty</div>
                </div>
              </div>

              {/* Entity Breakdown Badges for this Article */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Entity Breakdown for Article #{selectedArticle.id}:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(entityClassCounts).map(([cls, count]) => {
                    const color = LABEL_COLORS[cls] || '#0d9488';
                    return (
                      <span
                        key={cls}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white border shadow-2xs"
                        style={{ borderColor: color }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-slate-800">{cls}:</span>
                        <span className="text-emerald-800 font-extrabold">{count}</span>
                      </span>
                    );
                  })}
                  {detectedEntities.length === 0 && (
                    <span className="text-xs text-slate-400 italic">
                      No entities identified in sample boundary.
                    </span>
                  )}
                </div>
              </div>

              {/* Highlighted Full Text & Structured Entity Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      Classified In-Context Text ({activeModel})
                    </h4>
                    <span className="text-[11px] text-slate-400">
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
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                        Extracted Tokens ({detectedEntities.length})
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                        {activeModel}
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                      {detectedEntities.map((ent, idx) => {
                        const color = LABEL_COLORS[ent.label] || '#0d9488';
                        return (
                          <div
                            key={idx}
                            className="bg-white border border-slate-200 rounded-lg p-2 text-xs flex items-center justify-between shadow-2xs hover:border-slate-300"
                            style={{ borderLeftWidth: '3px', borderLeftColor: color }}
                          >
                            <div>
                              <div className="font-bold text-slate-900">{ent.text}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                pos: [{ent.start}, {ent.end}]
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider block"
                                style={{ backgroundColor: color }}
                              >
                                {ent.label}
                              </span>
                              {activeModel === 'BERT' && (
                                <span className="text-[10px] font-mono text-slate-500 font-semibold block mt-0.5">
                                  {Math.round(ent.score * 100)}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {detectedEntities.length === 0 && (
                        <div className="text-xs text-slate-400 italic p-4 text-center">
                          No entities detected.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Model: {activeModel}</span>
                    <span>Article ID: #{selectedArticle.id}</span>
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
