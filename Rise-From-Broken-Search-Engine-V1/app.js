/* =========================================================
   RISE FROM BROKEN — V2 SEARCH ENGINE
   All + Images + Videos + News
   Fuzzy + Multilingual + Banglish + Supabase
========================================================= */

const cfg = window.RISE_FROM_BROKEN_CONFIG || {};

let supabaseClient = null;

if (
  cfg.SUPABASE_URL &&
  cfg.SUPABASE_ANON_KEY &&
  window.supabase
) {
  supabaseClient = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY
  );
}

/* =========================================================
   DEMO DATABASE
========================================================= */

const demoResults = [
  {
    title: "Python Programming",
    url: "https://www.python.org/",
    description:
      "Python is a programming language used for software development, automation, data science and artificial intelligence.",
    keywords:
      "python pythn programming coding developer language software ai"
  },

  {
    title: "JavaScript",
    url:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    description:
      "JavaScript is a programming language widely used for interactive websites and applications.",
    keywords:
      "javascript javascript javascrit js programming web frontend coding"
  },

  {
    title: "HTML",
    url:
      "https://developer.mozilla.org/en-US/docs/Web/HTML",
    description:
      "HTML is the standard markup language used to structure websites.",
    keywords:
      "html website web markup frontend"
  },

  {
    title: "CSS",
    url:
      "https://developer.mozilla.org/en-US/docs/Web/CSS",
    description:
      "CSS is used to style websites, layouts, colors, fonts and animations.",
    keywords:
      "css style styling design website frontend"
  },

  {
    title: "React",
    url: "https://react.dev/",
    description:
      "React is a JavaScript library for building user interfaces.",
    keywords:
      "react javascript frontend ui web development"
  },

  {
    title: "Node.js",
    url: "https://nodejs.org/",
    description:
      "Node.js is a JavaScript runtime used to build scalable applications and servers.",
    keywords:
      "node nodejs javascript backend server programming"
  },

  {
    title: "GitHub",
    url: "https://github.com/",
    description:
      "A platform where developers can host, collaborate on and share software projects.",
    keywords:
      "github git code programming repository developer"
  },

  {
    title: "OWASP",
    url: "https://owasp.org/",
    description:
      "A global community focused on improving software and web application security.",
    keywords:
      "cyber security cybersecurity web security hacking"
  },

  {
    title: "Supabase",
    url: "https://supabase.com/",
    description:
      "An open source backend platform featuring PostgreSQL database, authentication and storage.",
    keywords:
      "supabase database postgres backend api authentication"
  },

  {
    title: "Google",
    url: "https://www.google.com/",
    description:
      "Google provides search, cloud computing, software and technology services.",
    keywords:
      "google search technology android cloud গুগল"
  },

  {
    title: "YouTube",
    url: "https://www.youtube.com/",
    description:
      "YouTube is an online video platform for watching, uploading and sharing videos.",
    keywords:
      "youtube video creator google entertainment ইউটিউব"
  },

  {
    title: "Wikipedia",
    url: "https://www.wikipedia.org/",
    description:
      "Wikipedia is a free online encyclopedia covering millions of topics.",
    keywords:
      "wikipedia encyclopedia information education"
  },

  {
    title: "বাংলাদেশ",
    url: "https://bn.wikipedia.org/wiki/বাংলাদেশ",
    description:
      "বাংলাদেশ দক্ষিণ এশিয়ার একটি দেশ। এর রাজধানী ঢাকা।",
    keywords:
      "বাংলাদেশ bangladesh bangla desh dhaka দেশ"
  },

  {
    title: "ঢাকা",
    url: "https://bn.wikipedia.org/wiki/ঢাকা",
    description:
      "ঢাকা বাংলাদেশের রাজধানী এবং অন্যতম প্রধান শহর।",
    keywords:
      "ঢাকা dhaka bangladesh capital city"
  }
];

/* =========================================================
   DOM
========================================================= */

const form = document.querySelector("#searchForm");
const input = document.querySelector("#searchInput");
const resultsSection =
  document.querySelector("#resultsSection");

const results = document.querySelector("#results");
const emptyState =
  document.querySelector("#emptyState");

const title =
  document.querySelector("#resultsTitle");

const count =
  document.querySelector("#resultCount");

const suggestions =
  document.querySelector("#suggestions");

const tabs =
  document.querySelectorAll(".search-tab");

/* =========================================================
   STATE
========================================================= */

let currentQuery = "";
let currentTab = "all";

/* =========================================================
   NORMALIZATION
========================================================= */

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function removeDiacritics(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* =========================================================
   TOKENIZER
========================================================= */

function tokenize(value) {
  const normalized = normalizeText(value);

  if (!normalized) return [];

  return normalized
    .split(
      /[\s\-_.,!?;:()[\]{}'"\/\\|+=*&^%$#@~`<>]+/
    )
    .filter(Boolean);
}

/* =========================================================
   LANGUAGE / TRANSLITERATION MAP
========================================================= */

const transliterationGroups = [
  ["dhaka", "ঢাকা"],
  ["bangladesh", "বাংলাদেশ"],
  ["bangla", "বাংলা"],
  ["desh", "দেশ"],
  ["manush", "মানুষ"],
  ["bhalo", "ভালো"],
  ["valo", "ভালো"],
  ["kemon", "কেমন"],
  ["ki", "কি"],
  ["kothay", "কোথায়"],
  ["kothai", "কোথায়"],
  ["ami", "আমি"],
  ["tumi", "তুমি"],
  ["google", "গুগল"],
  ["facebook", "ফেসবুক"],
  ["youtube", "ইউটিউব"],
  ["computer", "কম্পিউটার"],
  ["technology", "টেকনোলজি"],
  ["python", "পাইথন"],
  ["javascript", "জাভাস্ক্রিপ্ট"],
  ["programming", "প্রোগ্রামিং"],
  ["website", "ওয়েবসাইট"],
  ["search", "সার্চ"],
  ["engine", "ইঞ্জিন"],
  ["news", "নিউজ"],
  ["video", "ভিডিও"],
  ["image", "ছবি"],
  ["photo", "ছবি"]
];

function expandVariants(value) {
  const base = normalizeText(value);

  const variants = new Set([base]);

  for (const [english, native] of transliterationGroups) {
    if (base.includes(english)) {
      variants.add(
        base.replaceAll(english, native)
      );
    }

    if (base.includes(native)) {
      variants.add(
        base.replaceAll(native, english)
      );
    }
  }

  return [...variants];
}

/* =========================================================
   LEVENSHTEIN
========================================================= */

function levenshtein(a, b) {
  a = Array.from(normalizeText(a));
  b = Array.from(normalizeText(b));

  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from(
    { length: b.length + 1 },
    (_, i) => i
  );

  for (let i = 1; i <= a.length; i++) {
    const current = [i];

    for (let j = 1; j <= b.length; j++) {
      const insert =
        current[j - 1] + 1;

      const remove =
        previous[j] + 1;

      const replace =
        previous[j - 1] +
        (a[i - 1] === b[j - 1] ? 0 : 1);

      current[j] = Math.min(
        insert,
        remove,
        replace
      );
    }

    previous = current;
  }

  return previous[b.length];
}

/* =========================================================
   SIMILARITY
========================================================= */

function similarity(a, b) {
  a = removeDiacritics(a);
  b = removeDiacritics(b);

  if (!a || !b) return 0;

  if (a === b) return 1;

  if (
    a.includes(b) ||
    b.includes(a)
  ) {
    return 0.9;
  }

  const distance =
    levenshtein(a, b);

  const maxLength =
    Math.max(
      Array.from(a).length,
      Array.from(b).length
    );

  if (!maxLength) return 0;

  return 1 - distance / maxLength;
}

function wordSimilarity(queryWord, targetWord) {
  const q = removeDiacritics(queryWord);
  const t = removeDiacritics(targetWord);

  if (q === t) return 1;

  if (
    t.includes(q) ||
    q.includes(t)
  ) {
    return 0.9;
  }

  return similarity(q, t);
}

/* =========================================================
   SEARCH SCORE
========================================================= */

function score(item, query) {
  const variants = expandVariants(query);

  let bestVariantScore = 0;

  for (const variant of variants) {
    const queryWords =
      tokenize(variant);

    let total = 0;

    const fields = {
      title: tokenize(item.title),
      description:
        tokenize(item.description),
      keywords:
        tokenize(item.keywords || ""),
      url:
        tokenize(item.url)
    };

    for (const queryWord of queryWords) {
      let titleBest = 0;
      let keywordBest = 0;
      let descriptionBest = 0;
      let urlBest = 0;

      for (const word of fields.title) {
        titleBest = Math.max(
          titleBest,
          wordSimilarity(
            queryWord,
            word
          )
        );
      }

      for (const word of fields.keywords) {
        keywordBest = Math.max(
          keywordBest,
          wordSimilarity(
            queryWord,
            word
          )
        );
      }

      for (const word of fields.description) {
        descriptionBest = Math.max(
          descriptionBest,
          wordSimilarity(
            queryWord,
            word
          )
        );
      }

      for (const word of fields.url) {
        urlBest = Math.max(
          urlBest,
          wordSimilarity(
            queryWord,
            word
          )
        );
      }

      total += titleBest * 15;
      total += keywordBest * 8;
      total += descriptionBest * 4;
      total += urlBest * 2;
    }

    const normalizedQuery =
      normalizeText(variant);

    const normalizedTitle =
      normalizeText(item.title);

    const normalizedDescription =
      normalizeText(item.description);

    if (
      normalizedTitle.includes(
        normalizedQuery
      )
    ) {
      total += 25;
    }

    if (
      normalizedDescription.includes(
        normalizedQuery
      )
    ) {
      total += 5;
    }

    bestVariantScore =
      Math.max(
        bestVariantScore,
        total
      );
  }

  return bestVariantScore;
}

/* =========================================================
   DEMO SEARCH
========================================================= */

function searchDemo(query) {
  return demoResults
    .map(item => ({
      ...item,
      _score: score(
        item,
        query
      )
    }))
    .filter(
      item => item._score >= 5
    )
    .sort(
      (a, b) =>
        b._score - a._score
    )
    .slice(0, 20);
}

/* =========================================================
   SUPABASE SEARCH
========================================================= */

async function searchSupabase(query) {
  if (!supabaseClient) return null;

  try {
    const { data, error } =
      await supabaseClient
        .from(
          cfg.SEARCH_TABLE ||
            "search_documents"
        )
        .select(
          "title,url,description"
        )
        .textSearch(
          "search_vector",
          query,
          {
            type: "websearch",
            config: "simple"
          }
        )
        .limit(30);

    if (error) {
      console.warn(
        "Supabase:",
        error.message
      );

      return null;
    }

    return data || [];
  } catch (error) {
    console.warn(
      "Supabase unavailable:",
      error
    );

    return null;
  }
}

/* =========================================================
   WIKIPEDIA
========================================================= */

async function searchWikipedia(query) {
  try {
    const api =
      "https://en.wikipedia.org/w/api.php" +
      "?action=query" +
      "&list=search" +
      "&srsearch=" +
      encodeURIComponent(query) +
      "&format=json" +
      "&origin=*" +
      "&srlimit=10";

    const response =
      await fetch(api);

    if (!response.ok) {
      throw new Error(
        "Wikipedia request failed"
      );
    }

    const data =
      await response.json();

    if (
      !data.query ||
      !Array.isArray(
        data.query.search
      )
    ) {
      return [];
    }

    return data.query.search.map(
      item => ({
        title: item.title,

        url:
          "https://en.wikipedia.org/wiki/" +
          encodeURIComponent(
            item.title.replace(
              / /g,
              "_"
            )
          ),

        description:
          stripHtml(
            item.snippet
          ) + "..."
      })
    );
  } catch (error) {
    console.warn(
      "Wikipedia:",
      error
    );

    return [];
  }
}

/* =========================================================
   IMAGES
   Wikimedia Commons
========================================================= */

async function searchImages(query) {
  try {
    const url =
      "https://commons.wikimedia.org/w/api.php" +
      "?action=query" +
      "&generator=search" +
      "&gsrsearch=" +
      encodeURIComponent(query) +
      "&gsrnamespace=6" +
      "&gsrlimit=12" +
      "&prop=imageinfo" +
      "&iiprop=url|extmetadata" +
      "&iiurlwidth=500" +
      "&format=json" +
      "&origin=*";

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Image search failed"
      );
    }

    const data =
      await response.json();

    if (!data.query?.pages) {
      return [];
    }

    return Object.values(
      data.query.pages
    )
      .map(page => {
        const info =
          page.imageinfo?.[0];

        if (!info) return null;

        return {
          title:
            page.title
              .replace(
                /^File:/i,
                ""
              ),

          image:
            info.thumburl ||
            info.url,

          url:
            info.descriptionurl ||
            info.url
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn(
      "Images:",
      error
    );

    return [];
  }
}

/* =========================================================
   VIDEOS
   Wikimedia video search
========================================================= */

async function searchVideos(query) {
  try {
    const url =
      "https://commons.wikimedia.org/w/api.php" +
      "?action=query" +
      "&generator=search" +
      "&gsrsearch=" +
      encodeURIComponent(
        query + " filetype:video"
      ) +
      "&gsrnamespace=6" +
      "&gsrlimit=12" +
      "&prop=imageinfo" +
      "&iiprop=url|mime" +
      "&iiurlwidth=500" +
      "&format=json" +
      "&origin=*";

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Video search failed"
      );
    }

    const data =
      await response.json();

    if (!data.query?.pages) {
      return [];
    }

    return Object.values(
      data.query.pages
    )
      .map(page => {
        const info =
          page.imageinfo?.[0];

        if (!info) return null;

        const mime =
          info.mime || "";

        if (
          !mime.startsWith(
            "video/"
          )
        ) {
          return null;
        }

        return {
          title:
            page.title.replace(
              /^File:/i,
              ""
            ),

          thumbnail:
            info.thumburl ||
            "",

          url:
            info.descriptionurl ||
            info.url
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn(
      "Videos:",
      error
    );

    return [];
  }
}

/* =========================================================
   NEWS
   Uses Google News RSS through a public RSS endpoint.
========================================================= */

async function searchNews(query) {
  try {
    const rss =
      "https://news.google.com/rss/search?q=" +
      encodeURIComponent(query) +
      "&hl=en-US&gl=US&ceid=US:en";

    const proxy =
      "https://api.allorigins.win/raw?url=" +
      encodeURIComponent(rss);

    const response =
      await fetch(proxy);

    if (!response.ok) {
      throw new Error(
        "News request failed"
      );
    }

    const text =
      await response.text();

    const parser =
      new DOMParser();

    const xml =
      parser.parseFromString(
        text,
        "text/xml"
      );

    return [
      ...xml.querySelectorAll(
        "item"
      )
    ]
      .slice(0, 12)
      .map(item => ({
        title:
          item.querySelector(
            "title"
          )?.textContent || "",

        url:
          item.querySelector(
            "link"
          )?.textContent || "#",

        description:
          item.querySelector(
            "description"
          )?.textContent || "",

        source:
          item.querySelector(
            "source"
          )?.textContent || "News"
      }));
  } catch (error) {
    console.warn(
      "News:",
      error
    );

    return [];
  }
}

/* =========================================================
   RENDER WEB RESULTS
========================================================= */

function renderWebResults(
  data,
  query
) {
  results.innerHTML = "";

  count.textContent =
    `${data.length} result${
      data.length === 1
        ? ""
        : "s"
    }`;

  if (!data.length) {
    renderEmpty(query);
    return;
  }

  emptyState.hidden = true;

  data.forEach(item => {
    const a =
      document.createElement(
        "a"
      );

    a.className = "result";

    a.href =
      item.url || "#";

    a.target = "_blank";

    a.rel =
      "noopener noreferrer";

    a.innerHTML = `
      <div class="result-url">
        ${escapeHtml(
          item.url || ""
        )}
      </div>

      <h3>
        ${escapeHtml(
          item.title ||
            "Untitled"
        )}
      </h3>

      <p>
        ${escapeHtml(
          item.description ||
            "No description available."
        )}
      </p>
    `;

    results.appendChild(a);
  });
}

/* =========================================================
   RENDER IMAGES
========================================================= */

function renderImages(data) {
  results.innerHTML = "";

  count.textContent =
    `${data.length} image${
      data.length === 1
        ? ""
        : "s"
    }`;

  if (!data.length) {
    renderMediaEmpty(
      "No images found."
    );
    return;
  }

  emptyState.hidden = true;

  const grid =
    document.createElement(
      "div"
    );

  grid.className =
    "images-grid";

  data.forEach(item => {
    const card =
      document.createElement(
        "a"
      );

    card.className =
      "image-card";

    card.href =
      item.url || "#";

    card.target = "_blank";

    card.rel =
      "noopener noreferrer";

    card.innerHTML = `
      <img
        src="${escapeHtml(
          item.image
        )}"
        alt="${escapeHtml(
          item.title
        )}"
        loading="lazy"
      >

      <div class="image-card-content">
        <div class="image-card-title">
          ${escapeHtml(
            item.title
          )}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  results.appendChild(grid);
}

/* =========================================================
   RENDER VIDEOS
========================================================= */

function renderVideos(data) {
  results.innerHTML = "";

  count.textContent =
    `${data.length} video${
      data.length === 1
        ? ""
        : "s"
    }`;

  if (!data.length) {
    renderMediaEmpty(
      "No videos found."
    );
    return;
  }

  emptyState.hidden = true;

  const grid =
    document.createElement(
      "div"
    );

  grid.className =
    "videos-grid";

  data.forEach(item => {
    const card =
      document.createElement(
        "a"
      );

    card.className =
      "video-card";

    card.href =
      item.url || "#";

    card.target = "_blank";

    card.rel =
      "noopener noreferrer";

    card.innerHTML = `
      <div class="video-thumbnail">

        ${
          item.thumbnail
            ? `
          <img
            src="${escapeHtml(
              item.thumbnail
            )}"
            alt="${escapeHtml(
              item.title
            )}"
            loading="lazy"
          >
        `
            : `
          <div
            style="
              width:100%;
              height:100%;
              display:grid;
              place-items:center;
              background:#111827;
            "
          >
            🎬
          </div>
        `
        }

        <div class="video-play">
          ▶
        </div>

      </div>

      <div class="video-card-content">
        <div class="video-card-title">
          ${escapeHtml(
            item.title
          )}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  results.appendChild(grid);
}

/* =========================================================
   RENDER NEWS
========================================================= */

function renderNews(data) {
  results.innerHTML = "";

  count.textContent =
    `${data.length} news result${
      data.length === 1
        ? ""
        : "s"
    }`;

  if (!data.length) {
    renderMediaEmpty(
      "No news found."
    );
    return;
  }

  emptyState.hidden = true;

  const list =
    document.createElement(
      "div"
    );

  list.className =
    "news-list";

  data.forEach(item => {
    const card =
      document.createElement(
        "a"
      );

    card.className =
      "news-card";

    card.href =
      item.url || "#";

    card.target = "_blank";

    card.rel =
      "noopener noreferrer";

    card.innerHTML = `
      <div class="news-content">

        <div class="news-source">
          ${escapeHtml(
            item.source ||
              "News"
          )}
        </div>

        <div class="news-title">
          ${escapeHtml(
            item.title
          )}
        </div>

        <div class="news-description">
          ${escapeHtml(
            stripHtml(
              item.description
            )
          )}
        </div>

      </div>
    `;

    list.appendChild(card);
  });

  results.appendChild(list);
}

/* =========================================================
   EMPTY STATES
========================================================= */

function renderMediaEmpty(message) {
  emptyState.innerHTML = `
    <div class="empty-mark">
      ⌕
    </div>

    <h3>
      ${escapeHtml(
        message
      )}
    </h3>
  `;

  emptyState.hidden = false;
}

function renderEmpty(query) {
  const suggestion =
    findSuggestion(query);

  if (suggestion) {
    emptyState.innerHTML = `
      <div class="empty-mark">
        ⌕
      </div>

      <p>
        No exact results found.
      </p>

      <p>
        Did you mean
        <button
          class="suggestion"
          id="didYouMean"
        >
          ${escapeHtml(
            suggestion
          )}
        </button>
        ?
      </p>
    `;

    const button =
      document.querySelector(
        "#didYouMean"
      );

    if (button) {
      button.onclick =
        () => {
          input.value =
            suggestion;

          runSearch(
            suggestion
          );
        };
    }
  } else {
    emptyState.innerHTML = `
      <div class="empty-mark">
        ⌕
      </div>

      <h3>
        No results found
      </h3>

      <p>
        Try another search.
      </p>
    `;
  }

  emptyState.hidden = false;
}

/* =========================================================
   DID YOU MEAN
========================================================= */

function findSuggestion(query) {
  const words =
    tokenize(query);

  let bestMatch = null;
  let bestScore = 0;

  for (
    const item of demoResults
  ) {
    const candidates = [
      item.title,
      ...tokenize(
        item.keywords || ""
      )
    ];

    for (
      const candidate of candidates
    ) {
      for (
        const word of words
      ) {
        const s =
          wordSimilarity(
            word,
            candidate
          );

        if (
          s > bestScore &&
          s >= 0.65
        ) {
          bestScore = s;
          bestMatch =
            item.title;
        }
      }
    }
  }

  return bestMatch;
}

/* =========================================================
   MAIN SEARCH
========================================================= */

async function runSearch(
  query,
  tab = currentTab
) {
  query =
    String(query || "").trim();

  if (!query) return;

  currentQuery = query;
  currentTab = tab;

  resultsSection.hidden =
    false;

  emptyState.hidden =
    true;

  title.textContent =
    query;

  count.textContent =
    "Searching...";

  results.innerHTML = `
    <div class="empty">
      <div class="empty-mark">
        ⌕
      </div>

      <p>
        Searching...
      </p>
    </div>
  `;

  historyPush(query);

  if (tab === "images") {
    const data =
      await searchImages(
        query
      );

    renderImages(data);

  } else if (
    tab === "videos"
  ) {
    const data =
      await searchVideos(
        query
      );

    renderVideos(data);

  } else if (
    tab === "news"
  ) {
    const data =
      await searchNews(
        query
      );

    renderNews(data);

  } else {
    let data =
      await searchSupabase(
        query
      );

    if (
      data === null ||
      data.length === 0
    ) {
      data =
        searchDemo(query);
    }

    if (data.length === 0) {
      data =
        await searchWikipedia(
          query
        );
    }

    renderWebResults(
      data,
      query
    );
  }

  resultsSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/* =========================================================
   TAB SYSTEM
========================================================= */

tabs.forEach(tab => {
  tab.addEventListener(
    "click",
    () => {
      tabs.forEach(t =>
        t.classList.remove(
          "active"
        )
      );

      tab.classList.add(
        "active"
      );

      const selected =
        (
          tab.dataset.tab ||
          tab.textContent ||
          "all"
        )
          .toLowerCase()
          .trim();

      let mode = "all";

      if (
        selected.includes(
          "image"
        ) ||
        selected.includes(
          "photo"
        )
      ) {
        mode = "images";
      }

      if (
        selected.includes(
          "video"
        )
      ) {
        mode = "videos";
      }

      if (
        selected.includes(
          "news"
        )
      ) {
        mode = "news";
      }

      currentTab = mode;

      if (currentQuery) {
        runSearch(
          currentQuery,
          mode
        );
      }
    }
  );
});

/* =========================================================
   FORM
========================================================= */

if (form) {
  form.addEventListener(
    "submit",
    event => {
      event.preventDefault();

      runSearch(
        input.value,
        currentTab
      );
    }
  );
}

/* =========================================================
   QUICK SEARCH
========================================================= */

document
  .querySelectorAll(".quick")
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        input.value =
          button.dataset.q ||
          button.textContent.trim();

        suggestions.hidden =
          true;

        runSearch(
          input.value,
          "all"
        );
      }
    );
  });

/* =========================================================
   SUGGESTIONS
========================================================= */

if (input) {
  input.addEventListener(
    "input",
    () => {
      const query =
        normalizeText(
          input.value
        );

      if (!query) {
        suggestions.hidden =
          true;

        return;
      }

      const history =
        JSON.parse(
          localStorage.getItem(
            "rise-from-broken_history"
          ) || "[]"
        );

      const all = [
        ...history,

        ...demoResults.map(
          item =>
            item.title
        ),

        ...transliterationGroups.map(
          group =>
            group[0]
        ),

        ...transliterationGroups.map(
          group =>
            group[1]
        )
      ];

      const unique =
        [...new Set(all)];

      const matched =
        unique
          .map(item => ({
            item,

            score:
              Math.max(
                similarity(
                  query,
                  item
                ),

                ...tokenize(
                  item
                ).map(word =>
                  similarity(
                    query,
                    word
                  )
                )
              )
          }))
          .filter(
            item =>
              item.score >=
                0.35 ||
              normalizeText(
                item.item
              ).includes(query)
          )
          .sort(
            (a, b) =>
              b.score -
              a.score
          )
          .slice(0, 7)
          .map(
            item =>
              item.item
          );

      suggestions.innerHTML =
        matched
          .map(
            item => `
              <button
                type="button"
                class="suggestion"
              >
                ${escapeHtml(
                  item
                )}
              </button>
            `
          )
          .join("");

      suggestions.hidden =
        !matched.length;

      suggestions
        .querySelectorAll(
          "button"
        )
        .forEach(button => {
          button.onclick =
            () => {
              input.value =
                button.textContent.trim();

              suggestions.hidden =
                true;

              runSearch(
                input.value,
                currentTab
              );
            };
        });
    }
  );
}

/* =========================================================
   CLOSE SUGGESTIONS
========================================================= */

document.addEventListener(
  "click",
  event => {
    if (
      !event.target.closest(
        ".search-box"
      ) &&
      !event.target.closest(
        ".suggestions"
      )
    ) {
      suggestions.hidden =
        true;
    }
  }
);

/* =========================================================
   THEME
========================================================= */

const themeButton =
  document.querySelector(
    "#themeBtn"
  );

if (themeButton) {
  themeButton.addEventListener(
    "click",
    () => {
      document.body.classList.toggle(
        "light"
      );

      localStorage.setItem(
        "rise-from-broken_theme",
        document.body.classList.contains(
          "light"
        )
          ? "light"
          : "dark"
      );
    }
  );
}

if (
  localStorage.getItem(
    "rise-from-broken_theme"
  ) === "light"
) {
  document.body.classList.add(
    "light"
  );
}

/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    char =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[char]
  );
}

/* =========================================================
   STRIP HTML
========================================================= */

function stripHtml(value) {
  const div =
    document.createElement(
      "div"
    );

  div.innerHTML =
    String(value || "");

  return (
    div.textContent ||
    div.innerText ||
    ""
  );
}

/* =========================================================
   HISTORY
========================================================= */

function historyPush(query) {
  const history =
    JSON.parse(
      localStorage.getItem(
        "rise-from-broken_history"
      ) || "[]"
    );

  const cleaned =
    history.filter(
      item =>
        normalizeText(item) !==
        normalizeText(query)
    );

  cleaned.unshift(query);

  localStorage.setItem(
    "rise-from-broken_history",
    JSON.stringify(
      cleaned.slice(0, 10)
    )
  );
}
