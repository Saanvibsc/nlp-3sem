from __future__ import annotations

import importlib
import json
import time
from html import escape
from pathlib import Path
from typing import Any

import pandas as pd
import streamlit as st

# ---------------------------------------------------------
# Safety monkeypatch for Windows Application Control blocking _regex.pyd
# ---------------------------------------------------------
import sys
import re
sys.modules.setdefault("regex", re)

# ---------------------------------------------------------
# Path configurations
# ---------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
DATA_DIR = PROJECT_DIR / "datasets"
DATA_FILES = (
    "business_data.csv",
    "education_data.csv",
    "entertainment_data.csv",
    "sports_data.csv",
    "technology_data.csv",
)
WORKBOOK_FILE = "NER_Annotation_Workbook.xlsx"
SPACY_MODEL = "en_core_web_sm"
BERT_MODEL_NAME = "dslim/bert-base-NER"

LABEL_COLORS = {
    "PERSON": "#6366f1",     # Indigo
    "PER": "#6366f1",
    "ORG": "#0d9488",        # Teal
    "GPE": "#0284c7",        # Sky blue
    "LOC": "#0284c7",        # Sky blue
    "LOCATION": "#0284c7",
    "DATE": "#d97706",       # Amber
    "MONEY": "#059669",      # Emerald
    "EVENT": "#e11d48",      # Rose
    "NORP": "#9333ea",       # Purple
    "PRODUCT": "#ea580c",    # Orange
    "CARDINAL": "#475569",   # Slate
    "ORDINAL": "#475569",
    "WORK_OF_ART": "#b45309",
    "MISC": "#64748b",
}

LABEL_MAPPING = {
    "PERSON": "PERSON",
    "PER": "PERSON",
    "ORG": "ORG",
    "GPE": "LOCATION",
    "LOC": "LOCATION",
    "LOCATION": "LOCATION",
    "DATE": "DATE",
    "MONEY": "MONEY",
    "EVENT": "EVENT",
    "MISC": "MISC",
    "CARDINAL": "CARDINAL",
    "ORDINAL": "ORDINAL",
    "WORK_OF_ART": "WORK_OF_ART",
}

st.set_page_config(
    page_title="NER Studio Pro · News Intelligence & Model Analytics",
    page_icon="📰",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------
# Global Styling
# ---------------------------------------------------------
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
    :root {
        --ink: #0f172a;
        --muted: #64748b;
        --primary: #047857;
        --primary-light: #ecfdf5;
        --line: #e2e8f0;
        --surface: #ffffff;
        --canvas: #f8fafc;
        --card-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    }
    html, body, [class*="css"] { font-family: 'Plus Jakarta Sans', sans-serif; }
    .stApp { background: var(--canvas); color: var(--ink); }
    [data-testid="stHeader"] { background: transparent; }
    [data-testid="stSidebar"] {
        background: #ffffff;
        border-right: 1px solid var(--line);
    }
    [data-testid="stSidebar"] > div:first-child { padding-top: 1.2rem; }
    .block-container { max-width: 1400px; padding: 1.8rem 2.8rem 3.5rem; }
    h1, h2, h3, h4 { font-family: 'Plus Jakarta Sans', sans-serif; color: var(--ink); font-weight: 750; }
    h1 { font-size: 1.95rem !important; letter-spacing: -0.02em; }
    h2 { font-size: 1.35rem !important; letter-spacing: -0.015em; }
    h3 { font-size: 1.1rem !important; }
    p, label, .stCaption { color: var(--muted); }

    .brand {
        display: flex; align-items: center; gap: 12px; padding: 0 0 1.2rem;
        border-bottom: 1px solid var(--line); margin-bottom: 1.1rem;
    }
    .brand-mark {
        width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center;
        color: white; background: linear-gradient(135deg, #059669 0%, #047857 100%);
        font: 800 20px 'Plus Jakarta Sans', sans-serif; box-shadow: 0 4px 10px #05966933;
    }
    .brand-name { color: var(--ink); font: 800 15px 'Plus Jakarta Sans', sans-serif; }
    .brand-sub { color: var(--muted); font-size: 11px; margin-top: 1px; font-weight: 500; }

    .eyebrow {
        color: var(--primary); font-size: 11px; text-transform: uppercase;
        letter-spacing: .12em; font-weight: 700; margin-bottom: 6px;
    }
    .hero {
        border-radius: 16px; padding: 24px 28px; color: white;
        background: linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%);
        box-shadow: 0 10px 25px -5px rgba(6, 78, 59, 0.25); margin-bottom: 1.5rem;
    }
    .hero .eyebrow { color: #a7f3d0; margin-bottom: 6px; }
    .hero h1 { color: white; margin: 0 0 6px; font-size: 1.85rem !important; }
    .hero p { color: #d1fae5; margin: 0; font-size: 14px; max-width: 820px; line-height: 1.5; }

    .metric-card {
        background: var(--surface); border: 1px solid var(--line); border-radius: 14px;
        padding: 18px 20px; box-shadow: var(--card-shadow); height: 100%;
    }
    .metric-label { color: var(--muted); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    .metric-value { color: var(--ink); font: 800 28px 'Plus Jakarta Sans', sans-serif; margin: 6px 0 2px; }
    .metric-foot { color: #94a3b8; font-size: 11px; }

    .article-card {
        background: var(--surface); border: 1px solid var(--line);
        border-radius: 12px; padding: 16px 18px; margin: 8px 0;
        box-shadow: var(--card-shadow); transition: transform 0.15s ease;
    }
    .article-title { color: var(--ink); font: 700 14px 'Plus Jakarta Sans', sans-serif; margin-bottom: 6px; }
    .article-meta { color: var(--muted); font-size: 11px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .article-snippet { color: #475569; font-size: 13px; line-height: 1.5; }
    
    .tag {
        display: inline-block; padding: 3px 8px; border-radius: 6px;
        font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
        background: var(--primary-light); color: var(--primary);
    }
    
    .entity-pill {
        display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px;
        border-radius: 6px; font-size: 12px; font-weight: 600; margin: 2px 3px;
        background: #f1f5f9; border: 1px solid #cbd5e1;
    }
    .entity-badge {
        font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 4px;
        color: white; text-transform: uppercase; letter-spacing: 0.05em;
    }
    
    .highlighted-text-box {
        background: #ffffff; border: 1px solid var(--line); border-radius: 12px;
        padding: 20px; line-height: 2.1; font-size: 14px; color: var(--ink);
        box-shadow: var(--card-shadow); max-height: 480px; overflow-y: auto;
    }
    
    .code-preview {
        font-family: 'JetBrains Mono', monospace; font-size: 12px;
        background: #0f172a; color: #f8fafc; border-radius: 10px; padding: 14px;
    }

    .stButton > button {
        border-radius: 9px; font-weight: 600; padding: .5rem 1.1rem;
        transition: all 0.2s ease;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------
# Dataset Loading & Caching
# ---------------------------------------------------------
@st.cache_data(show_spinner="Loading news corpus from datasets/...")
def load_news_dataset(data_dir: str, signature: tuple[tuple[str, int, int], ...]) -> pd.DataFrame:
    data_path = Path(data_dir)
    missing = [f for f in DATA_FILES if not (data_path / f).is_file()]
    if missing:
        raise FileNotFoundError(f"Missing expected dataset files in {data_path}: {', '.join(missing)}")

    frames: list[pd.DataFrame] = []
    for filename in DATA_FILES:
        path = data_path / filename
        frame = pd.read_csv(path, dtype=str, low_memory=False, on_bad_lines="skip")
        frame.columns = [str(c).strip().lower() for c in frame.columns]
        if "content" not in frame.columns or "category" not in frame.columns:
            raise ValueError(f"{filename} must contain 'content' and 'category' columns.")
        frame["source_file"] = filename
        frames.append(frame)

    news = pd.concat(frames, ignore_index=True)
    news["content"] = news["content"].fillna("").astype(str).str.strip()
    news["category"] = news["category"].fillna("Uncategorized").astype(str).str.strip().str.title()
    news = news[news["content"].ne("")].copy()

    for col in ("headlines", "description", "url"):
        if col not in news.columns:
            news[col] = ""
        news[col] = news[col].fillna("").astype(str).str.strip()

    news["word_count"] = news["content"].str.split().str.len()
    news = news.drop_duplicates(subset=["content"]).reset_index(drop=True)
    return news


@st.cache_data(show_spinner=False)
def load_ground_truth_workbook(workbook_path: str) -> pd.DataFrame:
    wb_file = Path(workbook_path)
    if not wb_file.is_file():
        return pd.DataFrame()
    try:
        df = pd.read_excel(wb_file)
        return df
    except Exception:
        return pd.DataFrame()


# ---------------------------------------------------------
# Model Loading & Inference
# ---------------------------------------------------------
@st.cache_resource(show_spinner=False)
def load_spacy():
    spacy = importlib.import_module("spacy")
    try:
        return spacy.load(SPACY_MODEL)
    except OSError:
        import subprocess
        subprocess.run([sys.executable, "-m", "spacy", "download", SPACY_MODEL], check=True)
        return spacy.load(SPACY_MODEL)


@st.cache_resource(show_spinner=False)
def load_bert():
    from transformers import pipeline
    return pipeline("ner", model=BERT_MODEL_NAME, aggregation_strategy="simple")


def extract_spacy_entities(nlp, text: str) -> list[dict[str, Any]]:
    doc = nlp(text)
    entities = []
    for ent in doc.ents:
        norm_label = LABEL_MAPPING.get(ent.label_, ent.label_)
        entities.append({
            "text": ent.text.strip(),
            "label": norm_label,
            "orig_label": ent.label_,
            "start": ent.start_char,
            "end": ent.end_char,
            "score": 1.0,
            "model": "spaCy",
        })
    return entities


def extract_bert_entities(bert_pipe, text: str) -> list[dict[str, Any]]:
    # Transformers BERT accepts max 512 tokens (~1200 characters safely)
    truncated = text[:1200]
    raw_results = bert_pipe(truncated)
    entities = []
    for r in raw_results:
        w = str(r.get("word", "")).strip()
        score = float(r.get("score", 1.0))
        grp = str(r.get("entity_group", "MISC"))
        norm_label = LABEL_MAPPING.get(grp, grp)
        
        # Subword continuation stitching
        if w.startswith("##") and entities and entities[-1]["label"] == norm_label:
            entities[-1]["text"] += w[2:]
            entities[-1]["end"] = int(r["end"])
            entities[-1]["score"] = round((entities[-1]["score"] + score) / 2, 4)
        else:
            clean_word = w.lstrip("#").strip()
            if clean_word:
                entities.append({
                    "text": clean_word,
                    "label": norm_label,
                    "orig_label": grp,
                    "start": int(r["start"]),
                    "end": int(r["end"]),
                    "score": round(score, 4),
                    "model": "BERT",
                })
    return entities


def parse_ground_truth_entities(entity_string: Any) -> list[tuple[str, str]]:
    if pd.isna(entity_string) or not str(entity_string).strip():
        return []
    parsed = []
    for item in str(entity_string).split(";"):
        if "|" in item:
            t, l = item.rsplit("|", 1)
            t = t.strip()
            l = l.strip().upper()
            if t and l:
                norm_label = LABEL_MAPPING.get(l, l)
                parsed.append((t.lower(), norm_label))
    return parsed


# ---------------------------------------------------------
# UI Helper Components
# ---------------------------------------------------------
def render_metric_card(label: str, value: str, foot: str):
    st.markdown(
        f"""
        <div class="metric-card">
            <div class="metric-label">{escape(label)}</div>
            <div class="metric-value">{escape(value)}</div>
            <div class="metric-foot">{escape(foot)}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_highlighted_text(text: str, entities: list[dict[str, Any]]):
    if not entities:
        st.markdown(f'<div class="highlighted-text-box">{escape(text)}</div>', unsafe_allow_html=True)
        return

    # Sort entities by start offset ascending
    sorted_ents = sorted(entities, key=lambda e: (e["start"], -(e["end"] - e["start"])))
    
    # Remove overlapping spans
    non_overlapping = []
    last_end = 0
    for e in sorted_ents:
        if e["start"] >= last_end and e["end"] <= len(text):
            non_overlapping.append(e)
            last_end = e["end"]

    html_parts = []
    cursor = 0
    for e in non_overlapping:
        start = e["start"]
        end = e["end"]
        # Text before entity
        if start > cursor:
            html_parts.append(escape(text[cursor:start]))
        # Entity pill
        ent_text = escape(text[start:end])
        color = LABEL_COLORS.get(e["label"], "#0d9488")
        score_str = f" · {int(e['score']*100)}%" if e.get("model") == "BERT" else ""
        pill = (
            f'<span class="entity-pill" style="border-left: 3px solid {color};">'
            f'<span>{ent_text}</span>'
            f'<span class="entity-badge" style="background:{color};">{escape(e["label"])}{score_str}</span>'
            f'</span>'
        )
        html_parts.append(pill)
        cursor = end

    if cursor < len(text):
        html_parts.append(escape(text[cursor:]))

    rendered_html = "".join(html_parts).replace("\n", "<br>")
    st.markdown(f'<div class="highlighted-text-box">{rendered_html}</div>', unsafe_allow_html=True)


# ---------------------------------------------------------
# Load Data
# ---------------------------------------------------------
try:
    sig = tuple(
        (f, (DATA_DIR / f).stat().st_mtime_ns, (DATA_DIR / f).stat().st_size)
        for f in DATA_FILES
        if (DATA_DIR / f).is_file()
    )
    news_df = load_news_dataset(str(DATA_DIR), sig)
except Exception as err:
    st.error(f"Error loading news corpus: {err}")
    st.stop()

workbook_path = DATA_DIR / WORKBOOK_FILE
ground_truth_df = load_ground_truth_workbook(str(workbook_path))

# ---------------------------------------------------------
# Sidebar Navigation & Filters
# ---------------------------------------------------------
with st.sidebar:
    st.markdown(
        """
        <div class="brand">
            <div class="brand-mark">N</div>
            <div>
                <div class="brand-name">NER Studio Pro</div>
                <div class="brand-sub">News NLP & Model Benchmarking</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    page = st.radio(
        "Workspace View",
        (
            "Overview",
            "Article explorer",
            "NER workbench",
            "spaCy vs BERT comparison",
            "Ground-truth benchmark",
            "Bias & error audit",
            "API & Use Cases",
        ),
        index=0,
    )

    st.markdown("---")
    st.markdown("##### Corpus Filters")
    all_categories = sorted(news_df["category"].unique().tolist())
    selected_cats = st.multiselect("News categories", all_categories, default=all_categories)
    search_term = st.text_input("Search corpus", placeholder="e.g. Modi, Tata, AI, Economy...")

    st.caption(f"Loaded {len(news_df):,} articles from 5 news domains.")
    st.markdown(
        """
        <div style="font-size: 11px; color: #64748b; margin-top: 10px; padding: 10px; background: #f1f5f9; border-radius: 8px;">
            <b style="color:#0f172a;">Active NLP Engines:</b><br>
            • spaCy (en_core_web_sm)<br>
            • BERT (dslim/bert-base-NER)<br>
            • 20 Ground-Truth Benchmarks
        </div>
        """,
        unsafe_allow_html=True,
    )

# Filter dataframe based on sidebar
filtered_df = news_df[news_df["category"].isin(selected_cats)]
if search_term.strip():
    q = search_term.strip()
    c_match = filtered_df["content"].str.contains(q, case=False, na=False, regex=False)
    h_match = filtered_df["headlines"].str.contains(q, case=False, na=False, regex=False)
    filtered_df = filtered_df[c_match | h_match]


# =========================================================
# PAGE 1: OVERVIEW
# =========================================================
if page == "Overview":
    st.markdown(
        """
        <div class="hero">
            <div class="eyebrow">Enterprise News Intelligence · NLP Analytics</div>
            <h1>Automated Named Entity Recognition at Scale</h1>
            <p>Compare transformer neural architectures (BERT) against fast industrial tokenizers (spaCy). Analyze entity distribution across news categories and evaluate ground-truth human annotations.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        render_metric_card("Corpus Volume", f"{len(filtered_df):,}", f"Out of {len(news_df):,} total stories")
    with col2:
        render_metric_card("Active Categories", f"{filtered_df['category'].nunique()}", "Business, Tech, Sports, etc.")
    with col3:
        avg_w = int(filtered_df["word_count"].mean()) if not filtered_df.empty else 0
        render_metric_card("Avg Article Length", f"{avg_w:,} words", "Across filtered stories")
    with col4:
        top_cat = filtered_df["category"].value_counts().index[0] if not filtered_df.empty else "—"
        render_metric_card("Dominant Category", str(top_cat), "By article count")

    st.markdown("### Coverage & Volume Distribution")
    chart_c1, chart_c2 = st.columns([1.2, 0.8], gap="medium")

    with chart_c1:
        with st.container(border=True):
            st.markdown("##### Articles by Category")
            if not filtered_df.empty:
                cat_counts = filtered_df["category"].value_counts()
                st.bar_chart(cat_counts, horizontal=True, color="#047857", width="stretch")
            else:
                st.info("No articles match the current filter selection.")

    with chart_c2:
        with st.container(border=True):
            st.markdown("##### Median Story Length (Words)")
            if not filtered_df.empty:
                med_len = filtered_df.groupby("category")["word_count"].median().sort_values(ascending=False)
                st.bar_chart(med_len, horizontal=True, color="#6366f1", width="stretch")
            else:
                st.info("No data available.")

    st.markdown("### Featured Sample Articles")
    if not filtered_df.empty:
        sample_n = min(3, len(filtered_df))
        samples = filtered_df.sample(n=sample_n, random_state=42)
        cols = st.columns(sample_n)
        for i, (_, row) in enumerate(samples.iterrows()):
            with cols[i]:
                snippet = row["description"] or row["content"][:220] + "..."
                st.markdown(
                    f"""
                    <div class="article-card">
                        <div class="article-meta">
                            <span class="tag">{escape(row['category'])}</span>
                            <span>{int(row['word_count']):,} words</span>
                        </div>
                        <div class="article-title">{escape(row['headlines'] or 'News Story')}</div>
                        <div class="article-snippet">{escape(snippet)}</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )


# =========================================================
# PAGE 2: ARTICLE EXPLORER
# =========================================================
elif page == "Article explorer":
    st.markdown('<div class="eyebrow">Corpus Browser</div>', unsafe_allow_html=True)
    st.title("News Article Explorer")
    st.caption("Search, filter, inspect full news articles, and test live named entity extraction.")

    if filtered_df.empty:
        st.warning("No articles match your search or category filters.")
    else:
        st.markdown(f"**Showing {len(filtered_df):,} articles**")
        p_col1, p_col2 = st.columns([1, 3])
        with p_col1:
            page_sz = st.selectbox("Articles per page", [10, 25, 50], index=0)
        with p_col2:
            max_pages = max(1, (len(filtered_df) + page_sz - 1) // page_sz)
            page_idx = st.number_input("Page", min_value=1, max_value=max_pages, value=1, step=1)

        start_row = (page_idx - 1) * page_sz
        slice_df = filtered_df.iloc[start_row : start_row + page_sz]

        st.dataframe(
            slice_df[["headlines", "category", "word_count", "description"]],
            width="stretch",
            hide_index=True,
            column_config={
                "headlines": st.column_config.TextColumn("Headline", width="large"),
                "category": st.column_config.TextColumn("Category", width="small"),
                "word_count": st.column_config.NumberColumn("Words", format="%d", width="small"),
                "description": st.column_config.TextColumn("Summary Snippet", width="large"),
            },
        )

        st.markdown("---")
        st.markdown("### Article Inspector & Reader")
        selected_idx = st.selectbox(
            "Select an article to inspect in full:",
            options=slice_df.index.tolist(),
            format_func=lambda idx: f"[{slice_df.loc[idx, 'category']}] {slice_df.loc[idx, 'headlines'] or f'Article #{idx}'}",
        )
        selected_art = news_df.loc[selected_idx]

        art_c1, art_c2 = st.columns([3, 1])
        with art_c1:
            st.markdown(f"#### {selected_art['headlines'] or 'News Article'}")
            st.caption(f"Category: **{selected_art['category']}** · Length: **{int(selected_art['word_count']):,} words**")
            st.write(selected_art["content"])
            if selected_art["url"].startswith("http"):
                st.link_button("Open Original Publication", selected_art["url"])

        with art_c2:
            with st.container(border=True):
                st.markdown("##### Quick Entity Scan")
                st.caption("Scan the first 1,000 characters using spaCy:")
                if st.button("Extract Entities Now", key="quick_scan_btn"):
                    with st.spinner("Extracting..."):
                        nlp = load_spacy()
                        quick_ents = extract_spacy_entities(nlp, selected_art["content"][:1000])
                    if quick_ents:
                        st.success(f"Detected {len(quick_ents)} entities!")
                        for ent in quick_ents[:12]:
                            color = LABEL_COLORS.get(ent["label"], "#047857")
                            st.markdown(
                                f'<span class="entity-pill" style="border-left:3px solid {color};">'
                                f'{escape(ent["text"])} '
                                f'<span class="entity-badge" style="background:{color};">{escape(ent["label"])}</span>'
                                f'</span>',
                                unsafe_allow_html=True,
                            )
                    else:
                        st.info("No entities detected.")


# =========================================================
# PAGE 3: NER WORKBENCH
# =========================================================
elif page == "NER workbench":
    st.markdown('<div class="eyebrow">Interactive NLP Engine</div>', unsafe_allow_html=True)
    st.title("Named Entity Recognition Workbench")
    st.caption("Run state-of-the-art pretrained models (spaCy & BERT) on pre-loaded news stories or custom text.")

    SAMPLE_STORIES = {
        "Nirmala Sitharaman (Finance/Budget)": (
            "Union Finance Minister Nirmala Sitharaman presented the Union Budget in Parliament in New Delhi on Monday. "
            "Representatives from Tata Group, Reliance Industries, and the Reserve Bank of India attended the summit. "
            "The capital expenditure outlay was raised to 11.11 lakh crore rupees for FY25."
        ),
        "OpenAI & Microsoft (Technology)": (
            "Microsoft CEO Satya Nadella announced an expanded partnership with OpenAI in San Francisco. "
            "The collaboration will deploy GPT-4 across Azure data centers located in Tokyo, London, and Dublin by November 2026."
        ),
        "UN Climate Summit (Geopolitics)": (
            "United Nations Secretary-General Antonio Guterres addressed world leaders at the COP summit in Paris. "
            "Officials from the European Union, India, and the United States signed an agreement to allocate $100 billion for green initiatives."
        ),
        "ICC Cricket World Cup (Sports)": (
            "Virat Kohli and Rohit Sharma led India to victory against Australia at the Narendra Modi Stadium in Ahmedabad. "
            "The BCCI and International Cricket Council declared attendance records with over 130,000 fans on Sunday."
        ),
    }

    w_col1, w_col2 = st.columns([2, 1])
    with w_col1:
        chosen_sample = st.selectbox("Quick Load Sample News Story:", ["-- Custom Input --"] + list(SAMPLE_STORIES.keys()))
    with w_col2:
        model_choice = st.radio("Active Engine:", ("spaCy (Fast & Lightweight)", "BERT (Deep Contextual)", "Dual (Both)"), horizontal=True)

    default_content = SAMPLE_STORIES[chosen_sample] if chosen_sample != "-- Custom Input--" else (
        filtered_df.iloc[0]["content"][:2000] if not filtered_df.empty else ""
    )
    user_input = st.text_area("Input Text for Entity Analysis:", value=default_content, height=180)

    run_btn = st.button("Extract Named Entities", type="primary", disabled=not user_input.strip())

    if run_btn and user_input.strip():
        text_to_eval = user_input.strip()
        t0 = time.perf_counter()

        spacy_results: list[dict[str, Any]] = []
        bert_results: list[dict[str, Any]] = []

        with st.spinner("Processing Named Entities..."):
            if "spaCy" in model_choice or "Dual" in model_choice:
                nlp = load_spacy()
                spacy_results = extract_spacy_entities(nlp, text_to_eval)

            if "BERT" in model_choice or "Dual" in model_choice:
                bert_pipe = load_bert()
                bert_results = extract_bert_entities(bert_pipe, text_to_eval)

        latency = round((time.perf_counter() - t0) * 1000, 1)

        st.markdown("---")
        st.markdown(f"#### In-Context Visual Entity Annotation &nbsp;<span style='font-size:12px;color:#64748b;'>⏱️ {latency} ms</span>", unsafe_allow_html=True)

        if "Dual" in model_choice:
            d_tab1, d_tab2 = st.tabs(["spaCy Output", "BERT Output"])
            with d_tab1:
                render_highlighted_text(text_to_eval, spacy_results)
            with d_tab2:
                render_highlighted_text(text_to_eval, bert_results)
        elif "BERT" in model_choice:
            render_highlighted_text(text_to_eval, bert_results)
        else:
            render_highlighted_text(text_to_eval, spacy_results)

        active_results = bert_results if "BERT" in model_choice and "Dual" not in model_choice else spacy_results

        st.markdown("---")
        st.markdown("#### Structured Entity Records & Metrics")
        m_c1, m_c2 = st.columns([1.3, 0.7], gap="medium")

        with m_c1:
            if active_results:
                disp_df = pd.DataFrame(active_results)
                st.dataframe(
                    disp_df[["text", "label", "start", "end", "score", "model"]],
                    width="stretch",
                    hide_index=True,
                    column_config={
                        "text": st.column_config.TextColumn("Detected Entity"),
                        "label": st.column_config.TextColumn("Entity Class"),
                        "start": st.column_config.NumberColumn("Start Char"),
                        "end": st.column_config.NumberColumn("End Char"),
                        "score": st.column_config.ProgressColumn("Confidence", min_value=0.0, max_value=1.0, format="%.2f"),
                        "model": st.column_config.TextColumn("Model"),
                    },
                )
                csv_data = disp_df.to_csv(index=False).encode("utf-8")
                st.download_button("Export Entities (CSV)", csv_data, "extracted_entities.csv", "text/csv")
            else:
                st.info("No entities were extracted from this text.")

        with m_c2:
            with st.container(border=True):
                st.markdown("##### Entity Mix")
                if active_results:
                    type_counts = pd.Series([e["label"] for e in active_results]).value_counts()
                    st.bar_chart(type_counts, horizontal=True, color="#047857", width="stretch")
                    st.caption(f"{len(active_results)} entities identified across {len(type_counts)} categories.")
                else:
                    st.write("No distribution available.")


# =========================================================
# PAGE 4: SPACY VS BERT COMPARISON
# =========================================================
elif page == "spaCy vs BERT comparison":
    st.markdown('<div class="eyebrow">Architecture Head-to-Head</div>', unsafe_allow_html=True)
    st.title("spaCy vs BERT Model Comparison")
    st.caption("Direct side-by-side comparison on accuracy, token segmentation, confidence, and computational trade-offs.")

    test_input = st.text_area(
        "Enter text to compare both models simultaneously:",
        value=(
            "Prime Minister Narendra Modi and US President Joe Biden held bilateral discussions in Washington. "
            "Representatives of Google, Amazon, and Infosys committed to investments exceeding $25 billion by 2027."
        ),
        height=130,
    )

    if st.button("Execute Comparative Analysis", type="primary"):
        nlp = load_spacy()
        bert_pipe = load_bert()

        t_spa = time.perf_counter()
        spa_ents = extract_spacy_entities(nlp, test_input)
        spa_time = round((time.perf_counter() - t_spa) * 1000, 2)

        t_bert = time.perf_counter()
        bert_ents = extract_bert_entities(bert_pipe, test_input)
        bert_time = round((time.perf_counter() - t_bert) * 1000, 2)

        # Calculate overlap
        spa_set = set((e["text"].lower(), e["label"]) for e in spa_ents)
        bert_set = set((e["text"].lower(), e["label"]) for e in bert_ents)
        common = spa_set & bert_set
        only_spa = spa_set - bert_set
        only_bert = bert_set - spa_set

        c1, c2, c3, c4 = st.columns(4)
        with c1:
            render_metric_card("spaCy Entities", f"{len(spa_ents)}", f"Extracted in {spa_time} ms")
        with c2:
            render_metric_card("BERT Entities", f"{len(bert_ents)}", f"Extracted in {bert_time} ms")
        with c3:
            render_metric_card("Full Agreement", f"{len(common)}", "Exact text + label matches")
        with c4:
            jaccard = round(len(common) / max(1, len(spa_set | bert_set)) * 100, 1)
            render_metric_card("Agreement Rate", f"{jaccard}%", "Jaccard similarity index")

        st.markdown("---")
        h1, h2 = st.columns(2, gap="medium")
        with h1:
            st.markdown("#### spaCy Engine (`en_core_web_sm`)")
            render_highlighted_text(test_input, spa_ents)
            if spa_ents:
                st.dataframe(pd.DataFrame(spa_ents)[["text", "label", "start", "end"]], width="stretch", hide_index=True)

        with h2:
            st.markdown("#### BERT Engine (`dslim/bert-base-NER`)")
            render_highlighted_text(test_input, bert_ents)
            if bert_ents:
                st.dataframe(pd.DataFrame(bert_ents)[["text", "label", "score", "start", "end"]], width="stretch", hide_index=True)

        st.markdown("---")
        st.markdown("#### Architectural Trade-offs")
        st.markdown(
            """
            | Dimension | spaCy (`en_core_web_sm`) | BERT (`dslim/bert-base-NER`) |
            | :--- | :--- | :--- |
            | **Model Architecture** | Tok2Vec + Transition-based CNN/Linear Parser | Bidirectional Transformer (110M Parameters) |
            | **Speed / Throughput** | ~5,000+ words/sec (Ultra-fast, CPU optimized) | ~200-500 words/sec (Computationally heavier) |
            | **Confidence Scores** | Deterministic rule/state logic (No probability) | Softmax probability confidence score (0.0 to 1.0) |
            | **Context Sensitivity** | Good for standard names, locations, dates | Superior at disambiguating polysemous entities |
            | **Recommended Production Role** | High-volume stream indexing, ETL pipelines | Deep document intelligence, compliance audits |
            """
        )


# =========================================================
# PAGE 5: GROUND-TRUTH BENCHMARK
# =========================================================
elif page == "Ground-truth benchmark":
    st.markdown('<div class="eyebrow">Human Verification & Metrics</div>', unsafe_allow_html=True)
    st.title("Ground-Truth Quantitative Evaluation")
    st.caption(
        "Benchmarking spaCy and BERT predictions against 20 human-verified ground-truth news articles from `NER_Annotation_Workbook.xlsx`."
    )

    if ground_truth_df.empty or "Manual_Entities" not in ground_truth_df.columns:
        st.error("Ground-truth workbook `datasets/NER_Annotation_Workbook.xlsx` could not be loaded or is missing.")
    else:
        filled_count = ground_truth_df["Manual_Entities"].dropna().astype(str).str.strip().ne("").sum()
        st.info(f"Loaded **{len(ground_truth_df)} evaluation articles** with **{filled_count} human verified annotations**.")

        if st.button("Run Ground-Truth Evaluation Benchmark", type="primary"):
            with st.spinner("Evaluating models against ground truth..."):
                nlp = load_spacy()
                bert_pipe = load_bert()

                all_manual = set()
                all_spacy = set()
                all_bert = set()

                for _, row in ground_truth_df.iterrows():
                    m_ents = parse_ground_truth_entities(row.get("Manual_Entities"))
                    all_manual.update(m_ents)

                    text_snippet = str(row.get("Annotation_Text", ""))[:1000]
                    # spaCy
                    doc = nlp(text_snippet)
                    for ent in doc.ents:
                        l = LABEL_MAPPING.get(ent.label_, ent.label_)
                        all_spacy.add((ent.text.strip().lower(), l))

                    # BERT
                    b_res = extract_bert_entities(bert_pipe, text_snippet)
                    for b in b_res:
                        all_bert.add((b["text"].lower(), b["label"]))

                # Calculate spaCy metrics
                tp_s = len(all_manual & all_spacy)
                fp_s = len(all_spacy - all_manual)
                fn_s = len(all_manual - all_spacy)
                prec_s = tp_s / (tp_s + fp_s) if (tp_s + fp_s) > 0 else 0
                rec_s = tp_s / (tp_s + fn_s) if (tp_s + fn_s) > 0 else 0
                f1_s = 2 * prec_s * rec_s / (prec_s + rec_s) if (prec_s + rec_s) > 0 else 0

                # Calculate BERT metrics
                tp_b = len(all_manual & all_bert)
                fp_b = len(all_bert - all_manual)
                fn_b = len(all_manual - all_bert)
                prec_b = tp_b / (tp_b + fp_b) if (tp_b + fp_b) > 0 else 0
                rec_b = tp_b / (tp_b + fn_b) if (tp_b + fn_b) > 0 else 0
                f1_b = 2 * prec_b * rec_b / (prec_b + rec_b) if (prec_b + rec_b) > 0 else 0

            # Render metrics
            c1, c2, c3 = st.columns(3)
            with c1:
                render_metric_card("spaCy F1-Score", f"{f1_s:.3f}", f"Precision: {prec_s:.3f} · Recall: {rec_s:.3f}")
            with c2:
                render_metric_card("BERT F1-Score", f"{f1_b:.3f}", f"Precision: {prec_b:.3f} · Recall: {rec_b:.3f}")
            with c3:
                render_metric_card("Verified Ground Truth", f"{len(all_manual)} entities", "Across 20 news articles")

            st.markdown("---")
            eval_df = pd.DataFrame({
                "Evaluation Metric": ["Precision", "Recall", "F1-Score", "True Positives (TP)", "False Positives (FP)", "False Negatives (FN)"],
                "spaCy Engine": [f"{prec_s:.3f}", f"{rec_s:.3f}", f"{f1_s:.3f}", tp_s, fp_s, fn_s],
                "BERT Engine": [f"{prec_b:.3f}", f"{rec_b:.3f}", f"{f1_b:.3f}", tp_b, fp_b, fn_b],
            })
            st.dataframe(eval_df, width="stretch", hide_index=True)

            # Bar comparison
            chart_df = pd.DataFrame({
                "Metric": ["Precision", "Recall", "F1-Score"],
                "spaCy": [prec_s, rec_s, f1_s],
                "BERT": [prec_b, rec_b, f1_b],
            }).set_index("Metric")
            st.bar_chart(chart_df, width="stretch")

        st.markdown("---")
        st.markdown("#### Ground-Truth Workbook Explorer")
        st.dataframe(
            ground_truth_df[["Article_ID", "Category" if "Category" in ground_truth_df.columns else "category", "Manual_Entities", "Annotation_Text"]],
            width="stretch",
            hide_index=True,
        )


# =========================================================
# PAGE 6: BIAS & ERROR AUDIT
# =========================================================
elif page == "Bias & error audit":
    st.markdown('<div class="eyebrow">Fairness, Categories & Error Analysis</div>', unsafe_allow_html=True)
    st.title("Bias & Performance Audit")
    st.caption("Investigate entity representation disparity across news categories and diagnose model edge cases.")

    tab1, tab2 = st.tabs(["Domain Category Distribution", "Diagnostic Error Patterns"])

    with tab1:
        st.markdown("##### Entity Frequency across 5 News Domains")
        st.caption("How frequently are people, organizations, and locations mentioned in different domains?")

        audit_samples = {
            "Business": "Reliance Industries and Adani Group pledged capital expenditure in Mumbai on Friday.",
            "Education": "Delhi University and IIT Bombay announced joint admissions with Stanford University for 2026.",
            "Entertainment": "Shah Rukh Khan and Deepika Padukone attended the film festival in Mumbai on Saturday.",
            "Sports": "Rohit Sharma scored a century against England at Old Trafford in Manchester.",
            "Technology": "Sundar Pichai unveiled Google Gemini AI models in Mountain View, California.",
        }

        nlp = load_spacy()
        cat_entities = []
        for cat, txt in audit_samples.items():
            doc = nlp(txt)
            for ent in doc.ents:
                cat_entities.append({
                    "Category": cat,
                    "Entity": ent.text,
                    "Type": LABEL_MAPPING.get(ent.label_, ent.label_)
                })

        cat_ent_df = pd.DataFrame(cat_entities)
        ctab = pd.crosstab(cat_ent_df["Category"], cat_ent_df["Type"])
        st.dataframe(ctab, width="stretch")

        st.markdown("##### Category Representation Insights")
        st.markdown(
            """
            - **Business News:** Heavy bias toward `ORGANIZATION` and `MONEY` entities.
            - **Entertainment & Sports:** Predominance of `PERSON` and `LOCATION` entities, with high vocabulary churn (celebrity and player names).
            - **Technology:** Frequent presence of multi-token product names (`MISC`/`PRODUCT`) which traditional gazetteers fail to tag.
            """
        )

    with tab2:
        st.markdown("##### Primary Failure Modes Observed")
        col_e1, col_e2 = st.columns(2, gap="medium")
        with col_e1:
            st.markdown(
                """
                <div style="background:#fee2e2; border-left:4px solid #ef4444; padding:15px; border-radius:8px;">
                    <b style="color:#991b1b;">1. Ambiguity & Boundary Errors</b>
                    <p style="color:#7f1d1d; font-size:13px; margin:5px 0 0;">
                        Phrases like <i>"Narendra Modi Stadium"</i> are frequently misclassified as <code>PERSON</code> instead of <code>LOCATION</code> by rule-based parsers because "Narendra Modi" is recognized first.
                    </p>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with col_e2:
            st.markdown(
                """
                <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:15px; border-radius:8px;">
                    <b style="color:#92400e;">2. Multi-word Acronyms & Tickers</b>
                    <p style="color:#78350f; font-size:13px; margin:5px 0 0;">
                        Financial abbreviations (e.g. <i>BSE, NSE, EBITDA</i>) and educational degrees (<i>PhD, MBA</i>) are occasionally mislabeled as <code>WORK_OF_ART</code> or <code>MISC</code>.
                    </p>
                </div>
                """,
                unsafe_allow_html=True,
            )


# =========================================================
# PAGE 7: API & USE CASES (API UC)
# =========================================================
elif page == "API & Use Cases":
    st.markdown('<div class="eyebrow">Developer REST API & Production Use Cases</div>', unsafe_allow_html=True)
    st.title("API Integration & Enterprise Use Cases (API UC)")
    st.caption("Interactive REST API test harness, real-time JSON payloads, and turnkey industry solutions.")

    api_tab, uc_tab = st.tabs(["⚡ Interactive API Sandbox", "💼 Enterprise Use Cases (UC)"])

    # ------------------ API SANDBOX ------------------
    with api_tab:
        st.markdown("### RESTful NER Inference API")
        st.caption("Simulate API calls, inspect raw JSON request/response bodies, and export curl/python client snippets.")

        api_c1, api_c2 = st.columns([1, 1], gap="medium")
        with api_c1:
            st.markdown("##### Request Parameters")
            endpoint = st.selectbox(
                "API Endpoint:",
                [
                    "/api/v1/extract/spacy (High Speed)",
                    "/api/v1/extract/bert (Deep Neural)",
                    "/api/v1/extract/hybrid (Ensemble)",
                ],
            )
            confidence_threshold = st.slider("Min Confidence Score Threshold:", 0.0, 1.0, 0.70, 0.05)
            sample_payload = {
                "text": "Nirmala Sitharaman announced new RBI guidelines in Mumbai for State Bank of India.",
                "min_score": confidence_threshold,
                "include_offsets": True,
            }
            req_json_str = st.text_area("Request JSON Payload (POST body):", value=json.dumps(sample_payload, indent=2), height=140)

            run_api = st.button("Send API Request", type="primary")

        with api_c2:
            st.markdown("##### Live Response Body")
            if run_api:
                try:
                    parsed_req = json.loads(req_json_str)
                    query_text = parsed_req.get("text", "")
                    t_start = time.perf_counter()

                    ents = []
                    if "spacy" in endpoint.lower():
                        nlp = load_spacy()
                        ents = extract_spacy_entities(nlp, query_text)
                    elif "bert" in endpoint.lower():
                        bert_pipe = load_bert()
                        ents = extract_bert_entities(bert_pipe, query_text)
                    else:
                        nlp = load_spacy()
                        bert_pipe = load_bert()
                        ents = extract_spacy_entities(nlp, query_text) + extract_bert_entities(bert_pipe, query_text)

                    # Filter by score
                    filtered_ents = [e for e in ents if e["score"] >= confidence_threshold]
                    api_latency = round((time.perf_counter() - t_start) * 1000, 2)

                    response_payload = {
                        "status": 200,
                        "message": "Success",
                        "latency_ms": api_latency,
                        "engine": "spaCy v3.8" if "spacy" in endpoint.lower() else "BERT Transformer",
                        "entity_count": len(filtered_ents),
                        "entities": filtered_ents,
                    }

                    st.markdown(
                        f"""
                        <div style="display:flex; gap:10px; margin-bottom:8px;">
                            <span style="background:#dcfce7; color:#15803d; font-weight:700; padding:2px 8px; border-radius:6px; font-size:12px;">HTTP 200 OK</span>
                            <span style="color:#64748b; font-size:12px;">Time: {api_latency}ms</span>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
                    st.json(response_payload)
                    st.download_button(
                        "Download JSON Response",
                        data=json.dumps(response_payload, indent=2),
                        file_name="api_response.json",
                        mime="application/json",
                    )
                except Exception as ex:
                    st.error(f"API Error: {ex}")
            else:
                st.info("Click **Send API Request** to trigger the pipeline and view the JSON response.")

        st.markdown("---")
        st.markdown("##### Client Code Snippets")
        snippet_tab1, snippet_tab2, snippet_tab3 = st.tabs(["cURL", "Python (requests)", "JavaScript (Fetch)"])
        
        with snippet_tab1:
            st.code(
                f"""curl -X POST "http://localhost:8501/api/v1/extract" \\
     -H "Content-Type: application/json" \\
     -d '{{"text": "Nirmala Sitharaman met RBI officials in Mumbai.", "min_score": 0.7}}'""",
                language="bash",
            )
        with snippet_tab2:
            st.code(
                """import requests

payload = {
    "text": "Nirmala Sitharaman met RBI officials in Mumbai.",
    "min_score": 0.7
}
response = requests.post("http://localhost:8501/api/v1/extract", json=payload)
data = response.json()
print("Extracted entities:", data["entities"])""",
                language="python",
            )
        with snippet_tab3:
            st.code(
                """const response = await fetch("http://localhost:8501/api/v1/extract", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "Nirmala Sitharaman met RBI officials in Mumbai.",
    min_score: 0.7
  })
});
const result = await response.json();
console.log(result.entities);""",
                language="javascript",
            )

    # ------------------ ENTERPRISE USE CASES (UC) ------------------
    with uc_tab:
        st.markdown("### Production Industry Use Cases (UC)")
        st.caption("Explore practical business and intelligence applications enabled by this NER system.")

        uc1, uc2 = st.columns(2, gap="medium")
        with uc1:
            st.markdown(
                """
                <div class="article-card">
                    <span class="tag">UC-1 · Capital Markets</span>
                    <h4 style="margin:8px 0 4px;">Automated Financial Intelligence & Market Signals</h4>
                    <p style="font-size:13px; color:#475569;">
                        Extract corporate ticker symbols, executive leadership appointments (<code>PERSON</code>), company mergers (<code>ORG</code>), and transaction amounts (<code>MONEY</code>) from live news feeds to generate automated quant trading triggers.
                    </p>
                </div>
                """,
                unsafe_allow_html=True,
            )
            st.markdown(
                """
                <div class="article-card">
                    <span class="tag">UC-2 · Media & Publishing</span>
                    <h4 style="margin:8px 0 4px;">Automated News Ticker & Content Tagging</h4>
                    <p style="font-size:13px; color:#475569;">
                        Enrich raw news wire articles with canonical tags (Geographic entities <code>GPE</code>, event names <code>EVENT</code>) for SEO indexing, semantic topic search, and personalized content recommendation engines.
                    </p>
                </div>
                """,
                unsafe_allow_html=True,
            )

        with uc2:
            st.markdown(
                """
                <div class="article-card">
                    <span class="tag">UC-3 · Defense & Geopolitics</span>
                    <h4 style="margin:8px 0 4px;">Geopolitical Risk & Conflict Monitoring</h4>
                    <p style="font-size:13px; color:#475569;">
                        Monitor bilateral summits, international treaties, and sanctions across international news feeds by tracking diplomatic relations between nation states (<code>GPE</code>) and multilateral bodies like the UN, NATO, and WTO.
                    </p>
                </div>
                """,
                unsafe_allow_html=True,
            )
            st.markdown(
                """
                <div class="article-card">
                    <span class="tag">UC-4 · Legal & Compliance</span>
                    <h4 style="margin:8px 0 4px;">KYC & Politically Exposed Persons (PEP) Screening</h4>
                    <p style="font-size:13px; color:#475569;">
                        Screen news streams against global sanction lists, law enforcement databases, and Politically Exposed Persons (PEPs) to flag financial crimes, bribery, and regulatory non-compliance in real-time.
                    </p>
                </div>
                """,
                unsafe_allow_html=True,
            )
