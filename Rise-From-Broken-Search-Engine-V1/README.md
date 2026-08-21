# Rise From Broken Search Engine

**RISE FROM BROKEN presents RISE FROM BROKEN**

A lightweight search-engine starter built with HTML, CSS, JavaScript and Supabase-ready PostgreSQL search.

## 1. Run locally

No build step is required. You can open `index.html` directly for the demo, or use a local server:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## 2. Connect Supabase

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Run `supabase-schema.sql`.
4. In Supabase Project Settings, copy the **Project URL** and **anon/public key**.
5. Put them into `config.js`:

```js
window.RISE FROM BROKEN_CONFIG = {
  SUPABASE_URL: "YOUR_PROJECT_URL",
  SUPABASE_ANON_KEY: "YOUR_ANON_PUBLIC_KEY",
  SEARCH_TABLE: "search_documents"
};
```

Do NOT use the `service_role` key in the browser.

## 3. Deploy to Vercel

Push this folder to GitHub, then import the repository into Vercel.

Because this is a static project, no framework is required.

## Roadmap

- V1: Search UI + Supabase/Postgres full-text search
- V2: Autocomplete + history + bookmarks
- V3: Better ranking + fuzzy matching
- V4: Semantic/AI search with embeddings and pgvector

The current starter already contains the V1 UI, V2 autocomplete/history foundation, and Supabase full-text-search foundation.


## Branding
The official search engine name is **Rise From Broken**. The provided Rise From Broken logo is included in `assets/shuch-logo.png` and is used throughout the interface.
