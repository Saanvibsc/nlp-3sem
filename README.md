# NER Studio Pro · News Intelligence & Model Analytics

Enterprise Named Entity Recognition platform comparing fast industrial tokenizers (spaCy) against deep transformer architectures (BERT) on multi-domain news corpora, with ground-truth quantitative benchmarking and interactive REST APIs.

## Architecture

- **Runtime**: Node.js 22 (Express + TypeScript)
- **Frontend**: React 19 SPA (Vite, Tailwind CSS, Lucide icons)
- **Port**: 3000 (`0.0.0.0`)
- **Corpus**: Multi-domain news datasets covering Business, Education, Entertainment, Sports, and Technology
- **Evaluation**: 20 human-verified ground-truth articles from `NER_Annotation_Workbook.xlsx`

## Features

1. **Overview**: Key corpus metrics, category volume distribution, and median story length analysis.
2. **Article Explorer**: Live news search, category filters, paginated table, and instant entity scanner.
3. **NER Workbench**: In-context visual entity pill rendering, spaCy/BERT/Dual modes, structured records table, and CSV export.
4. **spaCy vs BERT Comparison**: Side-by-side split execution, agreement rate (Jaccard index), and architectural trade-offs matrix.
5. **Ground-Truth Benchmark**: Quantitative Precision, Recall, and F1-Score benchmarking against human gold standard.
6. **Bias & Error Audit**: Cross-domain entity representation matrices and diagnostic error pattern analysis.
7. **API Sandbox & Enterprise Use Cases**: Live REST test harness with code snippet generator (cURL, Python, JavaScript).

## API Endpoints

- `POST /api/v1/extract/spacy` - Ultra-fast rule/gazetteer entity extraction
- `POST /api/v1/extract/bert` - Deep contextual entity extraction with confidence scores
- `POST /api/v1/extract/hybrid` - Ensemble extraction combining both models
- `GET /api/v1/corpus` - Search and paginate news corpus
- `GET /api/v1/benchmark` - Retrieve benchmark dataset and metrics
- `GET /api/v1/audit` - Cross-tabulated domain distribution metrics
