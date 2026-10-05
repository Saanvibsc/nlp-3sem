import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  extractSpacyEntities,
  extractBertEntities,
  evaluateGroundTruth,
  GroundTruthArticle,
  CorpusArticle,
} from './src/services/nlpEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Load data files safely
const corpusPath = path.join(__dirname, 'src', 'data', 'corpus.json');
const groundTruthPath = path.join(__dirname, 'src', 'data', 'ground_truth.json');

let corpusData: CorpusArticle[] = [];
let groundTruthData: GroundTruthArticle[] = [];

try {
  if (fs.existsSync(corpusPath)) {
    corpusData = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'));
  }
  if (fs.existsSync(groundTruthPath)) {
    groundTruthData = JSON.parse(fs.readFileSync(groundTruthPath, 'utf-8'));
  }
} catch (err) {
  console.warn('Error reading dataset files:', err);
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    corpusCount: corpusData.length,
    groundTruthCount: groundTruthData.length,
    engines: ['spaCy (en_core_web_sm)', 'BERT (dslim/bert-base-NER)'],
  });
});

// spaCy Extraction
app.post('/api/v1/extract/spacy', (req: Request, res: Response) => {
  const { text, min_score = 0.0 } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Field "text" is required and must be a string.' });
  }

  const start = performance.now();
  const entities = extractSpacyEntities(text).filter(e => e.score >= min_score);
  const latencyMs = Number((performance.now() - start).toFixed(2));

  res.json({
    model: 'spaCy (en_core_web_sm)',
    entity_count: entities.length,
    latency_ms: latencyMs,
    entities,
  });
});

// BERT Extraction
app.post('/api/v1/extract/bert', (req: Request, res: Response) => {
  const { text, min_score = 0.0 } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Field "text" is required and must be a string.' });
  }

  const start = performance.now();
  const entities = extractBertEntities(text).filter(e => e.score >= min_score);
  const latencyMs = Number((performance.now() - start).toFixed(2));

  res.json({
    model: 'BERT (dslim/bert-base-NER)',
    entity_count: entities.length,
    latency_ms: latencyMs,
    entities,
  });
});

// Hybrid Ensemble Extraction
app.post('/api/v1/extract/hybrid', (req: Request, res: Response) => {
  const { text, min_score = 0.0 } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Field "text" is required and must be a string.' });
  }

  const start = performance.now();
  const spacy = extractSpacyEntities(text);
  const bert = extractBertEntities(text);

  // Merge ensemble
  const map = new Map<string, any>();
  for (const e of bert) {
    if (e.score >= min_score) {
      map.set(`${e.text.toLowerCase()}|${e.start}`, e);
    }
  }
  for (const e of spacy) {
    const k = `${e.text.toLowerCase()}|${e.start}`;
    if (!map.has(k) && e.score >= min_score) {
      map.set(k, { ...e, model: 'spaCy+Ensemble' });
    }
  }

  const latencyMs = Number((performance.now() - start).toFixed(2));
  const merged = Array.from(map.values()).sort((a, b) => a.start - b.start);

  res.json({
    model: 'Hybrid Ensemble (spaCy + BERT)',
    entity_count: merged.length,
    latency_ms: latencyMs,
    entities: merged,
  });
});

// Corpus Query & Pagination
app.get('/api/v1/corpus', (req: Request, res: Response) => {
  const { category, search, page = '1', limit = '10' } = req.query;
  let results = [...corpusData];

  if (category && typeof category === 'string' && category !== 'All') {
    const cats = category.split(',').map(c => c.trim().toLowerCase());
    results = results.filter(a => cats.includes(a.category.toLowerCase()));
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      a =>
        a.headlines.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }

  const p = Math.max(1, parseInt(page as string, 10) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));
  const total = results.length;
  const totalPages = Math.ceil(total / l);
  const paginated = results.slice((p - 1) * l, p * l);

  res.json({
    total,
    page: p,
    limit: l,
    totalPages,
    articles: paginated,
  });
});

// Ground Truth Benchmark Evaluation
app.get('/api/v1/benchmark', (_req: Request, res: Response) => {
  const spacyMetrics = evaluateGroundTruth(groundTruthData, 'spaCy');
  const bertMetrics = evaluateGroundTruth(groundTruthData, 'BERT');

  res.json({
    articleCount: groundTruthData.length,
    articles: groundTruthData,
    metrics: {
      spaCy: spacyMetrics,
      BERT: bertMetrics,
    },
  });
});

// Bias and Category Cross-Tabulation Audit
app.get('/api/v1/audit', (_req: Request, res: Response) => {
  const categorySamples: Record<string, string[]> = {
    Business: [],
    Education: [],
    Entertainment: [],
    Sports: [],
    Technology: [],
  };

  for (const art of corpusData) {
    if (categorySamples[art.category] && categorySamples[art.category].length < 15) {
      categorySamples[art.category].push(art.content.slice(0, 800));
    }
  }

  const crossTab: Record<string, Record<string, number>> = {};
  const categories = Object.keys(categorySamples);

  for (const cat of categories) {
    crossTab[cat] = { PERSON: 0, ORG: 0, LOCATION: 0, DATE: 0, MONEY: 0, EVENT: 0, MISC: 0 };
    for (const text of categorySamples[cat]) {
      const ents = extractSpacyEntities(text);
      for (const e of ents) {
        if (crossTab[cat][e.label] !== undefined) {
          crossTab[cat][e.label]++;
        } else {
          crossTab[cat].MISC++;
        }
      }
    }
  }

  res.json({
    categories,
    crossTab,
  });
});

// ----------------------------------------------------
// VITE DEV / PRODUCTION INTEGRATION
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`🚀 NER Studio Pro running on http://${HOST}:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
