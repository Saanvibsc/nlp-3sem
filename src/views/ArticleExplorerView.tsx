import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CorpusArticle,
  extractSpacyEntities,
  extractBertEntities,
  extractTrainedBertEntities,
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
  Zap,
  Cpu,
  FileUp,
  Search,
  Filter,
  ArrowUpDown,
  Shuffle,
  LayoutGrid,
  List,
  Clock,
  FileText,
  Copy,
  Check,
  Download,
  Eye,
  X,
  Columns2,
  Tag,
  BarChart3,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';

interface ArticleExplorerViewProps {
  articles: CorpusArticle[];
  onSendToWorkbench: (text: string) => void;
  onNavigateToUpload?: () => void;
}

type ModelMode = 'spaCy' | 'BERT' | 'Trained BERT' | 'compare';
type ViewMode = 'grid' | 'table';
type SortOption = 'id-asc' | 'id-desc' | 'words-desc' | 'words-asc' | 'headline-asc';

export const ArticleExplorerView: React.FC<ArticleExplorerViewProps> = ({
  articles,
  onSendToWorkbench,
  onNavigateToUpload,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('id-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selected Article & Reader State
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(
    articles.length > 0 ? articles[0].id : null
  );
  const [activeModel, setActiveModel] = useState<ModelMode>('spaCy');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [tokenSearchQuery, setTokenSearchQuery] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedTokens, setCopiedTokens] = useState<boolean>(false);

  const readerRef = useRef<HTMLDivElement>(null);

  // Distinct categories available in current corpus
  const availableCategories = useMemo<string[]>(() => {
    const cats = new Set<string>();
    articles.forEach(a => {
      if (a.category) cats.add(a.category);
    });
    return Array.from(cats).sort();
  }, [articles]);

  // Filter and Sort articles
  const filteredAndSortedArticles = useMemo<CorpusArticle[]>(() => {
    let result = articles.filter(art => {
      // Category filter
      if (selectedCategory !== 'ALL' && art.category !== selectedCategory) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesHeadline = (art.headlines || '').toLowerCase().includes(q);
        const matchesCategory = (art.category || '').toLowerCase().includes(q);
        const matchesContent = (art.content || '').toLowerCase().includes(q);
        const matchesId = art.id.toString() === q.replace('#', '');
        return matchesHeadline || matchesCategory || matchesContent || matchesId;
      }
      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'id-asc':
          return a.id - b.id;
        case 'id-desc':
          return b.id - a.id;
        case 'words-desc':
          return b.word_count - a.word_count;
        case 'words-asc':
          return a.word_count - b.word_count;
        case 'headline-asc':
          return (a.headlines || '').localeCompare(b.headlines || '');
        default:
          return a.id - b.id;
      }
    });

    return result;
  }, [articles, selectedCategory, searchQuery, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy, pageSize]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedArticles.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedArticles = filteredAndSortedArticles.slice(startIndex, startIndex + pageSize);

  // Currently selected article
  const selectedArticle = useMemo<CorpusArticle | null>(() => {
    if (selectedArticleId !== null) {
      const found = articles.find(a => a.id === selectedArticleId);
      if (found) return found;
    }
    return filteredAndSortedArticles[0] || articles[0] || null;
  }, [articles, selectedArticleId, filteredAndSortedArticles]);

  // Extracted entities for selected article under different models
  const spacyEntities = useMemo<Entity[]>(() => {
    if (!selectedArticle) return [];
    return extractSpacyEntities(selectedArticle.content);
  }, [selectedArticle]);

  const bertEntities = useMemo<Entity[]>(() => {
    if (!selectedArticle) return [];
    return extractBertEntities(selectedArticle.content);
  }, [selectedArticle]);

  const trainedBertEntities = useMemo<Entity[]>(() => {
    if (!selectedArticle) return [];
    return extractTrainedBertEntities(selectedArticle.content);
  }, [selectedArticle]);

  // Active entities based on current model mode
  const currentEntities = useMemo<Entity[]>(() => {
    switch (activeModel) {
      case 'spaCy':
        return spacyEntities;
      case 'BERT':
        return bertEntities;
      case 'Trained BERT':
        return trainedBertEntities;
      case 'compare':
        return spacyEntities;
      default:
        return spacyEntities;
    }
  }, [activeModel, spacyEntities, bertEntities, trainedBertEntities]);

  // Filtered entities for highlighting based on selected category chip
  const displayedEntities = useMemo<Entity[]>(() => {
    if (selectedClassFilter === 'ALL') return currentEntities;
    return currentEntities.filter(e => e.label === selectedClassFilter);
  }, [currentEntities, selectedClassFilter]);

  // Entity breakdown counts
  const entityClassCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    currentEntities.forEach(e => {
      counts[e.label] = (counts[e.label] || 0) + 1;
    });
    return counts;
  }, [currentEntities]);

  // Search filtered tokens list for right column
  const filteredTokenList = useMemo<Entity[]>(() => {
    let list = currentEntities;
    if (selectedClassFilter !== 'ALL') {
      list = list.filter(e => e.label === selectedClassFilter);
    }
    if (tokenSearchQuery.trim()) {
      const q = tokenSearchQuery.toLowerCase();
      list = list.filter(
        e => e.text.toLowerCase().includes(q) || e.label.toLowerCase().includes(q)
      );
    }
    return list;
  }, [currentEntities, selectedClassFilter, tokenSearchQuery]);

  // Corpus stats
  const totalCorpusWords = useMemo(() => {
    return articles.reduce((acc, a) => acc + (a.word_count || 0), 0);
  }, [articles]);

  const avgWordsPerArticle = useMemo(() => {
    if (articles.length === 0) return 0;
    return Math.round(totalCorpusWords / articles.length);
  }, [articles, totalCorpusWords]);

  // Navigation handlers
  const handleSelectArticle = (art: CorpusArticle, shouldScroll = true) => {
    setSelectedArticleId(art.id);
    setSelectedClassFilter('ALL');
    setTokenSearchQuery('');
    if (shouldScroll && readerRef.current) {
      readerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNextArticle = () => {
    if (!selectedArticle) return;
    const currentIndex = articles.findIndex(a => a.id === selectedArticle.id);
    if (currentIndex < articles.length - 1) {
      handleSelectArticle(articles[currentIndex + 1]);
    } else {
      handleSelectArticle(articles[0]);
    }
  };

  const handlePrevArticle = () => {
    if (!selectedArticle) return;
    const currentIndex = articles.findIndex(a => a.id === selectedArticle.id);
    if (currentIndex > 0) {
      handleSelectArticle(articles[currentIndex - 1]);
    } else {
      handleSelectArticle(articles[articles.length - 1]);
    }
  };

  const handleRandomArticle = () => {
    if (articles.length === 0) return;
    const randomIndex = Math.floor(Math.random() * articles.length);
    handleSelectArticle(articles[randomIndex]);
  };

  const handleCopyArticle = () => {
    if (!selectedArticle) return;
    navigator.clipboard.writeText(
      `${selectedArticle.headlines}\n\n${selectedArticle.content}`
    );
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyTokens = () => {
    if (currentEntities.length === 0) return;
    const jsonStr = JSON.stringify(
      currentEntities.map(e => ({
        text: e.text,
        label: e.label,
        start: e.start,
        end: e.end,
        score: e.score,
        model: e.model,
      })),
      null,
      2
    );
    navigator.clipboard.writeText(jsonStr);
    setCopiedTokens(true);
    setTimeout(() => setCopiedTokens(false), 2000);
  };

  const handleDownloadCsv = () => {
    if (!selectedArticle || currentEntities.length === 0) return;
    const headers = 'Text,Label,Start,End,Confidence,Model\n';
    const rows = currentEntities
      .map(
        e =>
          `"${e.text.replace(/"/g, '""')}",${e.label},${e.start},${e.end},${(e.score * 100).toFixed(1)}%,${e.model}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `article-${selectedArticle.id}-entities.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pt-2 pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[rgba(26,26,24,0.08)] pb-6">
        <div className="max-w-3xl">
          <div className="text-xs font-mono uppercase tracking-widest text-[#d97706] mb-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d97706]" />
            News Corpus Intelligence
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1a1a18] leading-[1.05] tracking-tight mb-2">
            Article Explorer
          </h1>
          <p className="font-serif text-base sm:text-lg text-[#1a1a18]/70 max-w-2xl leading-relaxed">
            Browse through 150 real news stories across technology, business, politics, and sports.
            Select any story to inspect full entity recognition, compare spaCy vs BERT, and analyze detected names, numbers, and dates.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
          <button
            onClick={handleRandomArticle}
            className="btn btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-white"
            title="Pick a random story from the library"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Random Story</span>
          </button>

          {onNavigateToUpload && (
            <button
              onClick={onNavigateToUpload}
              className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer shadow-xs bg-[#d97706] hover:bg-[#b45309] text-white border-[#d97706]"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload Custom Article</span>
            </button>
          )}
        </div>
      </div>

      {/* Corpus Key Statistics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl">
          <div className="text-[11px] font-mono text-[#1a1a18]/60 uppercase tracking-wider">Total Articles</div>
          <div className="text-2xl font-serif font-normal text-[#1a1a18] mt-1 tabular-nums">
            {articles.length.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#1a1a18]/50 mt-0.5">5 News Domains</div>
        </div>

        <div className="card p-4 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl">
          <div className="text-[11px] font-mono text-[#1a1a18]/60 uppercase tracking-wider">Filtered Matches</div>
          <div className="text-2xl font-serif font-normal text-[#d97706] mt-1 tabular-nums">
            {filteredAndSortedArticles.length.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#1a1a18]/50 mt-0.5">
            {selectedCategory === 'ALL' ? 'All categories' : selectedCategory}
          </div>
        </div>

        <div className="card p-4 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl">
          <div className="text-[11px] font-mono text-[#1a1a18]/60 uppercase tracking-wider">Avg Story Length</div>
          <div className="text-2xl font-serif font-normal text-[#1a1a18] mt-1 tabular-nums">
            {avgWordsPerArticle}
          </div>
          <div className="text-[11px] text-[#1a1a18]/50 mt-0.5">Words per story</div>
        </div>

        <div className="card p-4 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl">
          <div className="text-[11px] font-mono text-[#1a1a18]/60 uppercase tracking-wider">Active Story</div>
          <div className="text-2xl font-serif font-normal text-[#1a1a18] mt-1 tabular-nums truncate">
            #{selectedArticle?.id || 1}
          </div>
          <div className="text-[11px] text-[#1a1a18]/50 mt-0.5 truncate">
            {selectedArticle?.category || 'General'}
          </div>
        </div>
      </div>

      {/* SEARCH, CATEGORY FILTER, SORT & VIEW SWITCHER */}
      <div className="card p-5 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#1a1a18]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search headline, text, or #ID..."
              className="w-full text-xs font-mono pl-9 pr-8 py-2 bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] rounded-lg focus:outline-none focus:border-[#d97706] focus:bg-white transition-all text-[#1a1a18]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1a1a18]/40 hover:text-[#1a1a18] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & View Mode Controls */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-[#1a1a18]/60">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#d97706]"
              >
                <option value="id-asc">Article ID (1 → 150)</option>
                <option value="id-desc">Article ID (150 → 1)</option>
                <option value="words-desc">Longest First (Words)</option>
                <option value="words-asc">Shortest First (Words)</option>
                <option value="headline-asc">Headline (A → Z)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#1a1a18]/60">Per page:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-[#d97706]"
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-[rgba(26,26,24,0.08)] rounded-lg p-0.5 bg-[#f7f7f5]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#1a1a18] shadow-2xs'
                    : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#1a1a18] shadow-2xs'
                    : 'text-[#1a1a18]/60 hover:text-[#1a1a18]'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none text-xs font-mono">
          <span className="text-[#1a1a18]/50 text-[11px] uppercase mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3 text-[#d97706]" /> Filter:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#1a1a18] text-white font-medium'
                : 'bg-[#f7f7f5] text-[#1a1a18]/70 hover:bg-[#ebebe8]'
            }`}
          >
            All Stories ({articles.length})
          </button>
          {availableCategories.map(cat => {
            const count = articles.filter(a => a.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#1a1a18] text-white font-medium'
                    : 'bg-[#f7f7f5] text-[#1a1a18]/70 hover:bg-[#ebebe8]'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] tabular-nums ${
                    isSelected ? 'text-[#d97706]' : 'text-[#1a1a18]/50'
                  }`}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ARTICLE LIBRARY: GRID OR TABLE VIEW */}
      {filteredAndSortedArticles.length === 0 ? (
        <div className="card p-12 text-center bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#f7f7f5] text-[#d97706] flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg text-[#1a1a18]">No articles found</h3>
          <p className="text-xs font-mono text-[#1a1a18]/60 max-w-md mx-auto">
            No stories match "{searchQuery}" in category "{selectedCategory}". Try clearing your filters or searching another keyword.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
            }}
            className="btn btn-secondary text-xs px-4 py-2"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Container */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedArticles.map(art => {
                const isSelected = selectedArticle?.id === art.id;
                const readingMinutes = Math.max(1, Math.ceil(art.word_count / 200));

                return (
                  <div
                    key={art.id}
                    onClick={() => handleSelectArticle(art)}
                    className={`card p-5 bg-white border rounded-xl transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'border-[#d97706] ring-2 ring-[#d97706]/20 shadow-sm'
                        : 'border-[rgba(26,26,24,0.08)] hover:border-[rgba(26,26,24,0.2)] hover:shadow-2xs'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Quiet Metadata Header */}
                      <div className="flex items-center justify-between text-xs text-[#1a1a18]/60 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#1a1a18]">#{art.id}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#d97706] font-medium">{art.category}</span>
                        </div>
                        <span className="tabular-nums text-[11px]">{art.word_count} words</span>
                      </div>

                      {/* Headline */}
                      <h3 className="font-serif text-lg font-normal text-[#1a1a18] leading-snug line-clamp-2 group-hover:text-[#d97706] transition-colors">
                        {art.headlines}
                      </h3>

                      {/* Snippet */}
                      <p className="text-xs text-[#1a1a18]/70 font-sans leading-relaxed line-clamp-3">
                        {art.description || art.content.slice(0, 160)}...
                      </p>
                    </div>

                    {/* Footer Strip */}
                    <div className="pt-4 mt-4 border-t border-[rgba(26,26,24,0.06)] flex items-center justify-between text-[11px] font-mono text-[#1a1a18]/60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#1a1a18]/40" />
                        {readingMinutes} min read
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          isSelected
                            ? 'bg-[#d97706] text-white'
                            : 'bg-[#f7f7f5] text-[#1a1a18]/70 group-hover:bg-[#1a1a18] group-hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Active in Reader' : 'Open in Reader →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="card p-0 overflow-hidden bg-white border border-[rgba(26,26,24,0.08)] rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/60 uppercase text-[11px] font-medium">
                    <tr>
                      <th className="py-3 px-4 w-14 text-center">ID</th>
                      <th className="py-3 px-4">Headline</th>
                      <th className="py-3 px-4 w-36">Category</th>
                      <th className="py-3 px-4 w-28 text-right">Words</th>
                      <th className="py-3 px-4 w-28 text-center">Read Time</th>
                      <th className="py-3 px-4 w-24 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(26,26,24,0.06)] bg-white">
                    {paginatedArticles.map(art => {
                      const isSelected = selectedArticle?.id === art.id;
                      const readingMinutes = Math.max(1, Math.ceil(art.word_count / 200));

                      return (
                        <tr
                          key={art.id}
                          onClick={() => handleSelectArticle(art)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#fafaf8] font-medium border-l-3 border-l-[#d97706]'
                              : 'hover:bg-[#f7f7f5]/60'
                          }`}
                        >
                          <td className="py-3 px-4 text-center tabular-nums text-[#1a1a18]/50">
                            #{art.id}
                          </td>
                          <td className="py-3 px-4 font-sans font-medium text-[#1a1a18] max-w-md truncate">
                            {art.headlines}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-[#d97706]">
                            {art.category}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-[#1a1a18]/70">
                            {art.word_count.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center text-[#1a1a18]/60">
                            {readingMinutes} min
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                                isSelected
                                  ? 'bg-[#1a1a18] text-white'
                                  : 'bg-[#f7f7f5] text-[#1a1a18]/70 hover:bg-[#1a1a18] hover:text-white'
                              }`}
                            >
                              {isSelected ? 'Active' : 'Inspect'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl text-xs font-mono">
            <div className="text-[#1a1a18]/60">
              Showing <b className="text-[#1a1a18]">{startIndex + 1}</b> to{' '}
              <b className="text-[#1a1a18]">
                {Math.min(startIndex + pageSize, filteredAndSortedArticles.length)}
              </b>{' '}
              of <b className="text-[#1a1a18]">{filteredAndSortedArticles.length}</b> stories
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-[rgba(26,26,24,0.12)] bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f7f7f5] cursor-pointer flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="px-2 py-1 text-xs tabular-nums text-[#1a1a18]">
                Page <b>{safePage}</b> of <b>{totalPages}</b>
              </span>

              <button
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-[rgba(26,26,24,0.12)] bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f7f7f5] cursor-pointer flex items-center gap-1 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE READER & NER INTELLIGENCE WORKBENCH */}
      {selectedArticle && (
        <div
          ref={readerRef}
          className="card p-6 md:p-8 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-6 scroll-mt-6"
        >
          {/* Article Header & Reader Controls */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between pb-6 border-b border-[rgba(26,26,24,0.08)] gap-6">
            <div className="space-y-2 max-w-3xl">
              {/* Clean Editorial Metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#1a1a18]/60 font-mono">
                <span className="font-semibold text-[#d97706]">{selectedArticle.category}</span>
                <span aria-hidden="true">·</span>
                <span>Story #{selectedArticle.id}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedArticle.word_count.toLocaleString()} words</span>
                <span aria-hidden="true">·</span>
                <span>{Math.max(1, Math.ceil(selectedArticle.word_count / 200))} min read</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">
                  {currentEntities.length} entities detected
                </span>
              </div>

              {/* Headline */}
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#1a1a18] font-normal leading-tight tracking-tight">
                {selectedArticle.headlines}
              </h2>

              {selectedArticle.description && (
                <p className="font-serif text-base text-[#1a1a18]/70 leading-relaxed pt-1">
                  {selectedArticle.description}
                </p>
              )}
            </div>

            {/* Quick Actions & Prev/Next Bar */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
              {/* Prev / Next buttons */}
              <div className="flex border border-[rgba(26,26,24,0.12)] rounded-lg bg-[#f7f7f5] p-0.5">
                <button
                  onClick={handlePrevArticle}
                  className="p-1.5 rounded hover:bg-white text-[#1a1a18]/70 hover:text-[#1a1a18] transition-colors cursor-pointer"
                  title="Previous story"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextArticle}
                  className="p-1.5 rounded hover:bg-white text-[#1a1a18]/70 hover:text-[#1a1a18] transition-colors cursor-pointer"
                  title="Next story"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Copy Story Text */}
              <button
                onClick={handleCopyArticle}
                className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
                title="Copy article text to clipboard"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              {/* Send to Workbench */}
              <button
                onClick={() => onSendToWorkbench(selectedArticle.content)}
                className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
                title="Send full text to interactive testing workbench"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Workbench</span>
              </button>

              {/* Source Link */}
              {selectedArticle.url && selectedArticle.url.startsWith('http') && (
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  title="Open original news source"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Source</span>
                </a>
              )}
            </div>
          </div>

          {/* AI Model Architecture Switcher & Side-by-Side Comparison Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#fafaf8] border border-[rgba(26,26,24,0.06)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#1a1a18]/60 uppercase tracking-wider">
                Model:
              </span>
              <div className="flex border border-[rgba(26,26,24,0.1)] rounded-lg p-0.5 bg-white shadow-2xs">
                <button
                  onClick={() => setActiveModel('spaCy')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs rounded transition-all cursor-pointer ${
                    activeModel === 'spaCy'
                      ? 'bg-[#1a1a18] text-white font-medium'
                      : 'text-[#1a1a18]/70 hover:text-[#1a1a18]'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>spaCy (97.9%)</span>
                </button>
                <button
                  onClick={() => setActiveModel('BERT')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs rounded transition-all cursor-pointer ${
                    activeModel === 'BERT'
                      ? 'bg-[#1a1a18] text-white font-medium'
                      : 'text-[#1a1a18]/70 hover:text-[#1a1a18]'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Basic BERT (26.4%)</span>
                </button>
                <button
                  onClick={() => setActiveModel('Trained BERT')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs rounded transition-all cursor-pointer ${
                    activeModel === 'Trained BERT'
                      ? 'bg-[#1a1a18] text-white font-medium'
                      : 'text-[#1a1a18]/70 hover:text-[#1a1a18]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Trained BERT (97.9%)</span>
                </button>
                <button
                  onClick={() => setActiveModel('compare')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs rounded transition-all cursor-pointer ${
                    activeModel === 'compare'
                      ? 'bg-[#d97706] text-white font-medium'
                      : 'text-[#1a1a18]/70 hover:text-[#1a1a18]'
                  }`}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span>Side-by-Side</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics for Active Model on this story */}
            <div className="flex items-center gap-4 text-xs font-mono text-[#1a1a18]/70">
              <div>
                Entities: <b className="text-[#1a1a18]">{currentEntities.length}</b>
              </div>
              <span aria-hidden="true">·</span>
              <div>
                Classes: <b className="text-[#1a1a18]">{Object.keys(entityClassCounts).length}</b>
              </div>
              <span aria-hidden="true">·</span>
              <div>
                Density:{' '}
                <b className="text-[#d97706]">
                  {(
                    (currentEntities.length / Math.max(1, selectedArticle.word_count)) *
                    100
                  ).toFixed(1)}
                  /100w
                </b>
              </div>
            </div>
          </div>

          {/* CATEGORY FILTER CHIPS FOR HIGHLIGHTING */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
            <span className="text-[11px] uppercase text-[#1a1a18]/50 mr-1 flex items-center gap-1 shrink-0">
              <Tag className="w-3 h-3 text-[#d97706]" /> Highlight:
            </span>
            <button
              onClick={() => setSelectedClassFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                selectedClassFilter === 'ALL'
                  ? 'bg-[#1a1a18] text-white font-medium'
                  : 'bg-[#f7f7f5] text-[#1a1a18]/70 hover:bg-[#ebebe8]'
              }`}
            >
              All Entities ({currentEntities.length})
            </button>
            {Object.entries(entityClassCounts).map(([cls, count]) => {
              const color = LABEL_COLORS[cls] || '#d97706';
              const isSelected = selectedClassFilter === cls;
              return (
                <button
                  key={cls}
                  onClick={() => setSelectedClassFilter(cls)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#1a1a18] text-white font-medium'
                      : 'bg-[#f7f7f5] text-[#1a1a18]/70 hover:bg-[#ebebe8]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>{cls}</span>
                  <span
                    className={`text-[10px] tabular-nums ${
                      isSelected ? 'text-[#d97706]' : 'text-[#1a1a18]/50'
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* MAIN READER AREA */}
          {activeModel === 'compare' ? (
            /* SIDE-BY-SIDE COMPARISON VIEW */
            <div className="space-y-4">
              <div className="p-3 bg-[#fafaf8] border border-[rgba(26,26,24,0.08)] rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[#d97706] font-semibold">Head-to-Head Comparison:</span>
                  <span>
                    spaCy detected <b>{spacyEntities.length}</b> entities vs basic BERT detected{' '}
                    <b>{bertEntities.length}</b> entities.
                  </span>
                </div>
                <span className="text-[#1a1a18]/60 hidden sm:inline">
                  Compare how each model tags this exact text
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: spaCy */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,24,0.08)]">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#d97706]" />
                      <h4 className="font-serif text-base font-medium text-[#1a1a18]">
                        spaCy Model
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-emerald-700 font-medium">
                      {spacyEntities.length} entities identified
                    </span>
                  </div>
                  <EntityHighlighter
                    text={selectedArticle.content}
                    entities={spacyEntities}
                    showConfidence={false}
                    showToolbar={false}
                  />
                </div>

                {/* Right: BERT */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(26,26,24,0.08)]">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#1a1a18]" />
                      <h4 className="font-serif text-base font-medium text-[#1a1a18]">
                        Basic BERT Model
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-[#d97706] font-medium">
                      {bertEntities.length} entities identified
                    </span>
                  </div>
                  <EntityHighlighter
                    text={selectedArticle.content}
                    entities={bertEntities}
                    showConfidence={true}
                    showToolbar={false}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* SINGLE MODEL VIEW: TEXT HIGHLIGHTER + RIGHT TOKEN INSPECTOR */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Classified Text */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="font-serif text-base text-[#1a1a18] flex items-center gap-2 font-medium">
                    <BookOpen className="w-4 h-4 text-[#d97706]" />
                    <span>Story Content with Entity Tags ({activeModel})</span>
                  </h4>
                  <span className="text-xs font-mono text-[#1a1a18]/60">
                    Click any highlighted word to inspect details
                  </span>
                </div>

                <EntityHighlighter
                  text={selectedArticle.content}
                  entities={displayedEntities}
                  showConfidence={activeModel === 'BERT' || activeModel === 'Trained BERT'}
                  showToolbar={true}
                  articleTitle={selectedArticle.headlines}
                />
              </div>

              {/* Right Col: Extracted Tokens Inspector */}
              <div className="border border-[rgba(26,26,24,0.08)] rounded-xl p-5 bg-[#fafaf8] flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Token list header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
                    <div>
                      <h4 className="font-serif text-sm font-medium text-[#1a1a18]">
                        Extracted Entities ({filteredTokenList.length})
                      </h4>
                      <p className="text-[11px] font-mono text-[#1a1a18]/50 mt-0.5">
                        Categorized text spans
                      </p>
                    </div>
                    <button
                      onClick={handleCopyTokens}
                      className="text-xs font-mono text-[#d97706] hover:underline flex items-center gap-1 cursor-pointer"
                      title="Copy entity list as JSON"
                    >
                      {copiedTokens ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Token Search within this article */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#1a1a18]/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tokenSearchQuery}
                      onChange={e => setTokenSearchQuery(e.target.value)}
                      placeholder="Filter detected tokens..."
                      className="w-full text-xs font-mono pl-8 pr-7 py-1.5 bg-white border border-[rgba(26,26,24,0.08)] rounded-lg focus:outline-none focus:border-[#d97706]"
                    />
                    {tokenSearchQuery && (
                      <button
                        onClick={() => setTokenSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1a1a18]/40 hover:text-[#1a1a18]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Scrollable Token Cards */}
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                    {filteredTokenList.map((ent, idx) => {
                      const color = LABEL_COLORS[ent.label] || '#d97706';

                      return (
                        <div
                          key={idx}
                          className="bg-white border border-[rgba(26,26,24,0.08)] rounded-lg p-2.5 text-xs flex items-center justify-between shadow-2xs hover:border-[rgba(26,26,24,0.2)] transition-colors group"
                        >
                          <div className="space-y-0.5 pr-2 min-w-0">
                            <div className="font-sans font-medium text-[#1a1a18] truncate group-hover:text-[#d97706] transition-colors">
                              {ent.text}
                            </div>
                            <div className="text-[10px] text-[#1a1a18]/50 font-mono tabular-nums">
                              pos: [{ent.start}, {ent.end}]
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium text-white uppercase tracking-wider block"
                              style={{ backgroundColor: color }}
                            >
                              {ent.label}
                            </span>
                            {(activeModel === 'BERT' || activeModel === 'Trained BERT') && (
                              <span className="text-[10px] font-mono text-[#1a1a18]/70 block mt-0.5 tabular-nums">
                                {Math.round(ent.score * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {filteredTokenList.length === 0 && (
                      <div className="text-xs font-mono text-[#1a1a18]/50 italic p-6 text-center">
                        No entities match your search filter.
                      </div>
                    )}
                  </div>
                </div>

                {/* Token Footer Actions */}
                <div className="pt-3 border-t border-[rgba(26,26,24,0.08)] flex items-center justify-between text-xs font-mono text-[#1a1a18]/60">
                  <button
                    onClick={handleDownloadCsv}
                    className="flex items-center gap-1.5 text-[#1a1a18] hover:text-[#d97706] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                  <span>Story #{selectedArticle.id}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
