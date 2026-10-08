/**
 * Document & Text Extraction Utility for NER Studio Pro
 * Handles text extraction, normalisation, and metadata calculation
 * across Plain Text, Markdown, HTML, JSON, CSV, PDF, and DOCX formats.
 */

export interface DocumentStats {
  wordCount: number;
  charCount: number;
  paragraphCount: number;
  sentenceCount: number;
  readingTimeMin: number;
  lexicalDiversity: number; // unique words / total words
}

export interface DocumentExtractionResult {
  filename: string;
  fileType: 'txt' | 'md' | 'html' | 'json' | 'csv' | 'pdf' | 'docx' | 'pasted';
  title: string;
  rawText: string;
  cleanText: string;
  stats: DocumentStats;
  extractedAt: string;
  sourceNote?: string;
}

/**
 * Clean and normalise extracted text
 */
export function cleanExtractedText(
  raw: string,
  options: {
    stripHtml?: boolean;
    normalizeWhitespace?: boolean;
    preserveParagraphs?: boolean;
  } = {}
): string {
  const {
    stripHtml = true,
    normalizeWhitespace = true,
    preserveParagraphs = true,
  } = options;

  let text = raw || '';

  // 1. Strip HTML tags if present
  if (stripHtml && /<[a-z][\s\S]*>/i.test(text)) {
    // Replace block tags with newline to preserve paragraph breaks
    text = text
      .replace(/<(?:p|div|h[1-6]|li|blockquote|br)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ');
    // Decode common entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  // 2. Strip Markdown heading markers (#) and bold/italic asterisks for clean NER ingestion
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 3. Normalise line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 4. Handle whitespace
  if (normalizeWhitespace) {
    if (preserveParagraphs) {
      // Split into paragraphs, collapse intra-line spaces, join with double newline
      const paragraphs = text
        .split(/\n\s*\n+/)
        .map(p => p.replace(/[ \t]+/g, ' ').trim())
        .filter(p => p.length > 0);
      text = paragraphs.join('\n\n');
    } else {
      text = text.replace(/\s+/g, ' ').trim();
    }
  }

  return text.trim();
}

/**
 * Automatically detect or extract a title from the article body or file name
 */
export function extractTitleFromText(text: string, filename?: string): string {
  if (!text.trim()) {
    return filename ? filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Untitled Article';
  }

  // Check first line if it looks like a headline (less than 120 chars, no ending period or exclamation)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length >= 8 && firstLine.length <= 150) {
      return firstLine.replace(/^[#\s*]+/, '').trim();
    }
  }

  // Fallback to first sentence
  const sentenceMatch = text.match(/^([^.!?\n]{8,120}[.!?]?)/);
  if (sentenceMatch) {
    return sentenceMatch[1].trim();
  }

  if (filename) {
    return filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  return 'Extracted News Article';
}

/**
 * Compute descriptive statistics for extracted text
 */
export function computeDocumentStats(text: string): DocumentStats {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      wordCount: 0,
      charCount: 0,
      paragraphCount: 0,
      sentenceCount: 0,
      readingTimeMin: 0,
      lexicalDiversity: 0,
    };
  }

  const charCount = trimmed.length;
  const words = trimmed.match(/\b[A-Za-z0-9_-]+(?:'[A-Za-z]+)?\b/g) || [];
  const wordCount = words.length;

  const paragraphs = trimmed.split(/\n\s*\n+/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  const sentences = trimmed.split(/[.!?]+(?:\s+|$)/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;

  // Average reading speed: 200 words per minute
  const readingTimeMin = Number((wordCount / 200).toFixed(1));

  // Unique vocabulary
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const lexicalDiversity = wordCount > 0 ? Number((uniqueWords.size / wordCount).toFixed(2)) : 0;

  return {
    wordCount,
    charCount,
    paragraphCount,
    sentenceCount,
    readingTimeMin,
    lexicalDiversity,
  };
}

/**
 * Parse text from structured formats like JSON or CSV
 */
export function extractStructuredContent(raw: string, extension: string): { title: string; text: string } {
  if (extension === 'json') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        const title = first.title || first.headline || first.headlines || 'Imported JSON Dataset';
        const texts = parsed
          .map((item, idx) => {
            const body = item.content || item.text || item.body || item.description || JSON.stringify(item);
            return `[Article ${idx + 1}] ${item.title || item.headlines || ''}\n${body}`;
          })
          .join('\n\n---\n\n');
        return { title, text: texts };
      } else if (typeof parsed === 'object' && parsed !== null) {
        const title = parsed.title || parsed.headline || parsed.headlines || 'Imported JSON Article';
        const body = parsed.content || parsed.text || parsed.body || parsed.description || JSON.stringify(parsed, null, 2);
        return { title, text: body };
      }
    } catch {
      // Fallback to raw text
    }
  }

  if (extension === 'csv') {
    // Parse CSV rows into readable article paragraphs
    const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length > 1) {
      const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
      const contentIdx = headers.findIndex(h => ['content', 'text', 'article', 'body', 'description'].includes(h));
      const headlineIdx = headers.findIndex(h => ['headline', 'headlines', 'title'].includes(h));

      if (contentIdx !== -1) {
        const extractedLines: string[] = [];
        let primaryTitle = 'Imported CSV News Records';

        for (let i = 1; i < Math.min(lines.length, 30); i++) {
          const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          const head = headlineIdx !== -1 && cols[headlineIdx] ? cols[headlineIdx].replace(/^["']|["']$/g, '').trim() : '';
          const body = cols[contentIdx] ? cols[contentIdx].replace(/^["']|["']$/g, '').trim() : '';
          if (i === 1 && head) primaryTitle = head;
          if (body) {
            extractedLines.push(head ? `${head}\n${body}` : body);
          }
        }
        if (extractedLines.length > 0) {
          return { title: primaryTitle, text: extractedLines.join('\n\n') };
        }
      }
    }
  }

  return {
    title: extractTitleFromText(raw),
    text: raw,
  };
}

/**
 * Pre-loaded sample articles for instant testing and demonstration
 */
export const SAMPLE_UPLOAD_ARTICLES = [
  {
    id: 'sample-tata-ev',
    category: 'Business & Automotive',
    title: 'Tata Motors Announces ₹24,000 Crore EV Gigafactory and UK Battery Expansion',
    filename: 'tata_motors_ev_expansion.txt',
    snippet: 'Tata Motors and subsidiary JLR will invest ₹24,000 crore in electric mobility across Gujarat and Somerset...',
    content: `Tata Motors Chairman Natarajan Chandrasekaran announced on Wednesday that Tata Motors and luxury subsidiary Jaguar Land Rover will invest ₹24,000 crore ($2.9 billion) to establish a state-of-the-art lithium-ion battery gigafactory in Sanand, Gujarat.

The new facility in Ahmedabad district will have an initial annual capacity of 20 GWh, creating over 6,500 skilled engineering jobs in Western India. Chief Minister Bhupendra Patel praised the agreement signed at the Vibrant Gujarat Global Summit in Gandhinagar.

Speaking to analysts in Mumbai, CFO P.B. Balaji confirmed that Tata Passenger Electric Mobility will also supply battery packs to Agratas in Somerset, United Kingdom by Q4 FY26. The company registered record sales of 73,800 electric vehicles in 2024, capturing a 71% domestic market share ahead of rivals Mahindra & Mahindra and Hyundai India. Reserve Bank of India Governor Shaktikanta Das noted that sustainable green investments remain a top growth driver for India's GDP in 2025.`,
  },
  {
    id: 'sample-isro-space',
    category: 'Science & Aerospace',
    title: 'ISRO Gears Up for Chandrayaan-4 Lunar Sample Return Mission with LVM3',
    filename: 'isro_chandrayaan4_mission.md',
    snippet: 'The Indian Space Research Organisation (ISRO) in Bengaluru finalized blueprints for Chandrayaan-4...',
    content: `The Indian Space Research Organisation (ISRO) headquartered in Bengaluru finalized launch blueprints for Chandrayaan-4 on Monday. The ambitious lunar sample-return mission will lift off aboard the Launch Vehicle Mark 3 (LVM3) from the Satish Dhawan Space Centre in Sriharikota, Andhra Pradesh in late 2028.

ISRO Chairman S. Somanath addressed senior space scientists at the U R Rao Satellite Centre, stating that the Union Cabinet chaired by Prime Minister Narendra Modi approved a dedicated budget outlay of ₹2,104 crore for the project.

The spacecraft consists of five modular modules: the Propulsion Module, Descender Module, Ascender Module, Transfer Module, and Re-entry Module. Spacecraft engineers in Thiruvananthapuram and Ahmedabad are currently conducting cryogenic engine qualification tests at Mahendragiri, Tamil Nadu. The project follows the historic success of Chandrayaan-3, which made India the 1st country to land near the lunar south pole on August 23, 2023. NASA Administrator Bill Nelson and European Space Agency Director General Josef Aschbacher congratulated ISRO on the milestone.`,
  },
  {
    id: 'sample-ai-blackwell',
    category: 'Technology & AI',
    title: 'Nvidia CEO Jensen Huang Unveils Blackwell Ultra AI Chips and Reliance Supercomputer',
    filename: 'nvidia_blackwell_ai_summit.html',
    snippet: 'Nvidia CEO Jensen Huang took the stage at the AI Summit in Mumbai to reveal Blackwell Ultra servers...',
    content: `Nvidia CEO Jensen Huang took the stage at the Jio World Convention Centre in Mumbai on Thursday alongside Reliance Industries Chairman Mukesh Ambani to announce a mega-computing partnership.

Nvidia will deploy tens of thousands of Blackwell Ultra GB200 GPUs across Reliance data centers in Jamnagar and Navi Mumbai. The AI supercomputing cluster, powered by 1 Gigawatt of renewable solar energy, will train Indic large language models in Hindi, Tamil, and Bengali for over 450 million Jio subscribers.

Speaking in Santa Clara, California earlier this week, Microsoft Chief Executive Satya Nadella and Google Cloud CEO Thomas Kurian also confirmed multi-billion dollar procurements of Nvidia Blackwell B200 systems. Nvidia reported quarterly revenue of $35.1 billion for Q3 FY25, up 94% year-over-year. Market capitalization surpassed $3.6 trillion, making Nvidia the most valuable public company on Wall Street ahead of Apple and Amazon. Minister for Electronics and IT Ashwini Vaishnaw stated that India's IndiaAI Mission will provide ₹10,372 crore in subsidies to support indigenous compute infrastructure across New Delhi, Bengaluru, and Hyderabad.`,
  },
  {
    id: 'sample-climate-summit',
    category: 'Geopolitics & Climate',
    title: 'United Nations Climate Summit in Geneva Ratifies $100 Billion Clean Energy Accord',
    filename: 'geneva_un_climate_accord.txt',
    snippet: 'United Nations Secretary-General Antonio Guterres presided over negotiations in Geneva on Friday...',
    content: `United Nations Secretary-General António Guterres presided over final negotiations at the Palais des Nations in Geneva on Friday. Delegations from 195 nations ratified the Global Green Finance Accord, pledging $100 billion annually starting in January 2026.

World Bank President Ajay Banga and International Monetary Fund Managing Director Kristalina Georgieva confirmed that $35 billion would be disbursed as low-interest loans for solar and offshore wind infrastructure across South Asia and Sub-Saharan Africa.

European Commission President Ursula von der Leyen and French President Emmanuel Macron declared that the European Union would commit €25 billion through the Horizon Europe fund. In Tokyo, Japan's Prime Minister Shigeru Ishiba promised 3 trillion yen for hydrogen power research in collaboration with Toyota and Mitsubishi Heavy Industries. United States Special Presidential Envoy John Podesta praised the consensus reached between Beijing and Washington, noting that clean energy technology accounts for 10% of global GDP expansion.`,
  },
];
