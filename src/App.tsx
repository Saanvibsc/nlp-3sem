import React, { useState, useRef, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { OverviewView } from './views/OverviewView';
import { ArticleExplorerView } from './views/ArticleExplorerView';
import { NerWorkbenchView } from './views/NerWorkbenchView';
import { ComparisonView } from './views/ComparisonView';
import { EvaluationMatrixView } from './views/EvaluationMatrixView';
import { CodePipelineView } from './views/CodePipelineView';
import { UploadArticleNer } from './views/UploadArticleNer';
import { CorpusArticle, GroundTruthArticle } from './services/nlpEngine';

// Default static imports for instant responsiveness
import initialCorpus from './data/corpus.json';
import initialGroundTruth from './data/ground_truth.json';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('Overview');
  const [corpus] = useState<CorpusArticle[]>(initialCorpus as CorpusArticle[]);
  const [groundTruth] = useState<GroundTruthArticle[]>(initialGroundTruth as GroundTruthArticle[]);

  const allCategories = ['Business', 'Education', 'Entertainment', 'Sports', 'Technology'];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(allCategories);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [workbenchInitialText, setWorkbenchInitialText] = useState<string | undefined>(undefined);
  const mainRef = useRef<HTMLElement>(null);

  // Auto scroll to top on page navigation
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Toggle category filter
  const handleToggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Filter corpus
  const filteredArticles = corpus.filter(art => {
    const catMatch = selectedCategories.includes(art.category);
    if (!catMatch) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      art.headlines.toLowerCase().includes(q) ||
      art.content.toLowerCase().includes(q) ||
      art.description.toLowerCase().includes(q)
    );
  });

  const handleSendToWorkbench = (text: string) => {
    setWorkbenchInitialText(text);
    setCurrentPage('NER workbench');
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#fdfdfc] text-[#1a1a18] font-sans antialiased">
      {/* Main Layout (Sidebar + Content Area - top Header removed for clean full-height layout) */}
      <div className="flex-1 flex h-full min-h-0 min-w-0 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentPage={currentPage}
          onSelectPage={page => {
            setCurrentPage(page);
            if (mainRef.current) {
              mainRef.current.scrollTop = 0;
            }
          }}
          categories={allCategories}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          totalArticles={corpus.length}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#fdfdfc]">
          <main ref={mainRef} className="flex-1 overflow-y-auto px-6 py-8 md:px-12 max-w-7xl w-full mx-auto">
            {currentPage === 'Overview' && (
              <OverviewView
                articles={filteredArticles}
                totalCorpus={corpus.length}
                onNavigateToExplorer={() => setCurrentPage('Article explorer')}
                onNavigateToWorkbench={handleSendToWorkbench}
                onNavigateToEvaluation={() => setCurrentPage('Evaluation & Confusion Matrix')}
                onNavigateToCode={() => setCurrentPage('Python Pipeline (code.py)')}
                onNavigateToUpload={() => setCurrentPage('Upload Article - NER')}
              />
            )}

            {currentPage === 'Upload Article - NER' && (
              <UploadArticleNer
                onSendToWorkbench={handleSendToWorkbench}
                onNavigateToExplorer={() => setCurrentPage('Article explorer')}
              />
            )}

            {currentPage === 'Article explorer' && (
              <ArticleExplorerView
                articles={filteredArticles}
                onSendToWorkbench={handleSendToWorkbench}
                onNavigateToUpload={() => setCurrentPage('Upload Article - NER')}
              />
            )}

            {currentPage === 'Python Pipeline (code.py)' && (
              <CodePipelineView
                onNavigateToWorkbench={() => setCurrentPage('NER workbench')}
              />
            )}

            {currentPage === 'NER workbench' && (
              <NerWorkbenchView
                initialText={workbenchInitialText}
                onNavigateToUpload={() => setCurrentPage('Upload Article - NER')}
              />
            )}

            {currentPage === 'Evaluation & Confusion Matrix' && (
              <EvaluationMatrixView groundTruthData={groundTruth} />
            )}

            {currentPage === 'spaCy vs BERT comparison' && <ComparisonView />}
          </main>
        </div>
      </div>

      {/* Pinned Bottom Footer */}
      <footer className="border-t border-[rgba(26,26,24,0.08)] flex items-center justify-between px-6 py-2.5 bg-[#f7f7f5] z-20 shrink-0 text-xs">
        <span className="label opacity-60">NER Studio Pro · News Intelligence</span>
        <span className="label hidden sm:inline opacity-60">OntoNotes 5.0 & CoNLL-2003 Benchmark Active</span>
        <span className="label !opacity-80 flex items-center gap-1.5 text-[#1a1a18]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]"></span>
          150 Articles Analyzed
        </span>
      </footer>
    </div>
  );
};

export default App;
