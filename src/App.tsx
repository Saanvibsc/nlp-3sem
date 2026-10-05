import React, { useState } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './views/OverviewView';
import { ArticleExplorerView } from './views/ArticleExplorerView';
import { NerWorkbenchView } from './views/NerWorkbenchView';
import { ComparisonView } from './views/ComparisonView';
import { EvaluationMatrixView } from './views/EvaluationMatrixView';
import { BiasAuditView } from './views/BiasAuditView';
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
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={page => setCurrentPage(page)}
        categories={allCategories}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        totalArticles={corpus.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          currentPage={currentPage}
          totalArticles={filteredArticles.length}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8 max-w-7xl w-full mx-auto">
          {currentPage === 'Overview' && (
            <OverviewView
              articles={filteredArticles}
              totalCorpus={corpus.length}
              onNavigateToExplorer={() => setCurrentPage('Article explorer')}
              onNavigateToWorkbench={handleSendToWorkbench}
              onNavigateToEvaluation={() => setCurrentPage('Evaluation & Confusion Matrix')}
            />
          )}

          {currentPage === 'Article explorer' && (
            <ArticleExplorerView
              articles={filteredArticles}
              onSendToWorkbench={handleSendToWorkbench}
            />
          )}

          {currentPage === 'NER workbench' && (
            <NerWorkbenchView initialText={workbenchInitialText} />
          )}

          {currentPage === 'Evaluation & Confusion Matrix' && (
            <EvaluationMatrixView groundTruthData={groundTruth} />
          )}

          {currentPage === 'Bias, Error & Explainability' && <BiasAuditView />}

          {currentPage === 'spaCy vs BERT comparison' && <ComparisonView />}

        </main>
      </div>
    </div>
  );
};

export default App;
