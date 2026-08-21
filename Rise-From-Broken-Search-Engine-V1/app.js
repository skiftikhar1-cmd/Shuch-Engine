/* =========================================================
   RISE FROM BROKEN — FIXED SEARCH ENGINE
   Web + Images + Videos + News
========================================================= */

const cfg = window.RISE_FROM_BROKEN_CONFIG || {};

let supabaseClient = null;

/* =========================================================
   SUPABASE
========================================================= */

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
   DEMO WEB DATABASE
========================================================= */

const demoResults = [
  {
    title: "Python Programming",
    url: "https://www.python.org/",
    description:
      "Python is a programming language used for software development, automation, data science and artificial intelligence.",
    keywords:
      "python programming coding developer language software ai"
  },

  {
    title: "JavaScript",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    description:
      "JavaScript is a programming language widely used for interactive websites and applications.",
    keywords:
      "javascript js programming web frontend coding"
  },

  {
    title: "HTML",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
    description:
      "HTML is the standard markup language used to structure websites.",
    keywords: "html website web markup frontend"
  },

  {
    title: "CSS",
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS",
    description:
      "CSS is used to style websites, layouts, colors, fonts and animations.",
    keywords: "css style design website frontend"
  },

  {
    title: "React",
    url: "https://react.dev/",
    description:
      "React is a JavaScript library for building user interfaces.",
    keywords: "react javascript frontend ui web development"
  },

  {
    title: "GitHub",
    url: "https://github.com/",
    description:
      "A platform where developers can host and collaborate on software projects.",
    keywords: "github git code programming repository developer"
  },

  {
    title: "Supabase",
    url: "https://supabase.com/",
    description:
      "An open source backend platform featuring PostgreSQL database, authentication and storage.",
    keywords: "supabase database postgres backend api"
  },

  {
    title: "YouTube",
    url: "https://www.youtube.com/",
    description:
      "YouTube is an online video platform for watching and sharing videos.",
    keywords: "youtube video creator entertainment ইউটিউব"
  },

  {
    title: "বাংলাদেশ",
    url: "https://bn.wikipedia.org/wiki/বাংলাদেশ",
    description:
      "বাংলাদেশ দক্ষিণ এশিয়ার একটি দেশ। এর রাজধানী ঢাকা।",
    keywords: "বাংলাদেশ bangladesh bangla desh dhaka দেশ"
  },

  {
    title: "ঢাকা",
    url: "https://bn.wikipedia.org/wiki/ঢাকা",
    description:
      "ঢাকা বাংলাদেশের রাজধানী এবং অন্যতম প্রধান শহর।",
    keywords: "ঢাকা dhaka bangladesh capital city"
  }
];

/* =========================================================
   DOM
========================================================= */

const form = document.querySelector("#searchForm");
const input = document.querySelector("#searchInput");
const resultsSection = document.querySelector("#resultsSection");

const results = document.querySelector("#results");
const emptyState = document.querySelector("#emptyState");

const title = document.querySelector("#resultsTitle");
const count = document.querySelector("#resultCount");

const suggestions = document.querySelector("#suggestions");

const tabs = document.querySelectorAll(".search-tab");

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
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(/[\s\-_.,!?;:()[\]{}'"\/\\|+=*&^%$#@~`<>]+/)
    .filter(Boolean);
}

/* =========================================================
   SIMPLE SEARCH SCORE
========================================================= */

function similarity(a, b) {
  a = normalizeText(a);
  b = normalizeText(b);

  if (!a || !b) return 0;

  if (a === b) return 1;

  if (a.includes(b) || b.includes(a)) {
    return 0.9;
  }

  return 0;
}

function score(item, query) {
  const words = tokenize(query);

  let total = 0;

  const text = normalizeText(
    `${item.title} ${item.description} ${item.keywords || ""}`
  );

  for (const word of words) {
    if (text.includes(word)) {
      total += 10;
    }

    if (normalizeText(item.title).includes(word)) {
      total += 20;
    }
  }

  return total;
}

function searchDemo(query) {
  return demoResults
    .map(item => ({
      ...item,
      _score: score(item, query)
    }))
    .filter(item => item._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 20);
}

/* =========================================================
   SUPABASE WEB SEARCH
========================================================= */

async function searchSupabase(query) {
  if (!supabaseClient) return null;

  try {
    const { data, error } = await supabaseClient
      .from(cfg.SEARCH_TABLE || "search_documents")
      .select("title,url,description")
      .textSearch("search_vector", query, {
        type: "websearch",
        config: "simple"
      })
      .limit(30);

    if (error) {
      console.warn("Supabase:", error.message);
      return null;
    }

    return data || [];
  } catch (error) {
    console.warn("Supabase unavailable:", error);
    return null;
  }
}

/* =========================================================
   WIKIPEDIA
========================================================= */

async function searchWikipedia(query) {
  try {
    const url =
      "https://en.wikipedia.org/w/api.php" +
      "?action=query" +
      "&list=search" +
      "&srsearch=" +
      encodeURIComponent(query) +
      "&format=json" +
      "&origin=*" +
      "&srlimit=10";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Wikipedia request failed");
    }

    const data = await response.json();

    if (!data.query?.search) {
      return [];
    }

    return data.query.search.map(item => ({
      title: item.title,

      url:
        "https://en.wikipedia.org/wiki/" +
        encodeURIComponent(item.title.replace(/ /g, "_")),

      description: stripHtml(item.snippet) + "..."
    }));
  } catch (error) {
    console.warn("Wikipedia:", error);
    return [];
  }
}

/* =========================================================
   IMAGE SEARCH
   WIKIMEDIA COMMONS
========================================================= */

async function searchImages(query) {
  try {
    const api =
      "https://commons.wikimedia.org/w/api.php" +
      "?action=query" +
      "&generator=search" +
      "&gsrsearch=" +
      encodeURIComponent(query) +
      "&gsrnamespace=6" +
      "&gsrlimit=30" +
      "&prop=imageinfo" +
      "&iiprop=url|mime|extmetadata" +
      "&iiurlwidth=600" +
      "&format=json" +
      "&origin=*";

    const response = await fetch(api);

    if (!response.ok) {
      throw new Error("Wikimedia image request failed");
    }

    const data = await response.json();

    if (!data.query?.pages) {
      return [];
    }

    return Object.values(data.query.pages)
      .map(page => {
        const info = page.imageinfo?.[0];

        if (!info) return null;

        const mime = info.mime || "";

        /* Only images */
        if (!mime.startsWith("image/")) {
          return null;
        }

        return {
          title: page.title.replace(/^File:/i, ""),

          image:
            info.thumburl ||
            info.url ||
            "",

          url:
            info.descriptionurl ||
            info.url ||
            "#"
        };
      })
      .filter(item => item && item.image);
  } catch (error) {
    console.error("IMAGE SEARCH ERROR:", error);
    return [];
  }
}

/* =========================================================
   VIDEO SEARCH
   WIKIMEDIA COMMONS
========================================================= */

async function searchVideos(query) {
  try {
    /*
      IMPORTANT:
      We do NOT use:
      "filetype:video"

      because Wikimedia search does not reliably
      understand that syntax.

      Instead we search files normally and then
      check MIME type.
    */

    const api =
      "https://commons.wikimedia.org/w/api.php" +
      "?action=query" +
      "&generator=search" +
      "&gsrsearch=" +
      encodeURIComponent(query) +
      "&gsrnamespace=6" +
      "&gsrlimit=50" +
      "&prop=imageinfo" +
      "&iiprop=url|mime|thumbmime" +
      "&iiurlwidth=640" +
      "&format=json" +
      "&origin=*";

    const response = await fetch(api);

    if (!response.ok) {
      throw new Error("Wikimedia video request failed");
    }

    const data = await response.json();

    if (!data.query?.pages) {
      return [];
    }

    return Object.values(data.query.pages)
      .map(page => {
        const info = page.imageinfo?.[0];

        if (!info) return null;

        const mime = String(info.mime || "").toLowerCase();

        /*
          Wikimedia can contain:
          video/mp4
          video/webm
          video/ogg
          etc.
        */

        if (!mime.startsWith("video/")) {
          return null;
        }

        return {
          title: page.title.replace(/^File:/i, ""),

          thumbnail:
            info.thumburl ||
            "",

          url:
            info.descriptionurl ||
            info.url ||
            "#"
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("VIDEO SEARCH ERROR:", error);
    return [];
  }
}

/* =========================================================
   NEWS SEARCH
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

    const response = await fetch(proxy);

    if (!response.ok) {
      throw new Error("News request failed");
    }

    const text = await response.text();

    const parser = new DOMParser();

    const xml = parser.parseFromString(
      text,
      "text/xml"
    );

    return [...xml.querySelectorAll("item")]
      .slice(0, 12)
      .map(item => ({
        title:
          item.querySelector("title")?.textContent || "",

        url:
          item.querySelector("link")?.textContent || "#",

        description:
          item.querySelector("description")?.textContent || "",

        source:
          item.querySelector("source")?.textContent || "News"
      }));
  } catch (error) {
    console.error("NEWS ERROR:", error);
    return [];
  }
}

/* =========================================================
   CLEAR RESULTS
========================================================= */

function clearResults() {
  results.innerHTML = "";
  emptyState.hidden = true;
}

/* =========================================================
   LOADING
========================================================= */

function showLoading(message = "Searching...") {
  clearResults();

  count.textContent = message;

  results.innerHTML = `
    <div class="empty">
      <div class="empty-mark">⌕</div>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

/* =========================================================
   WEB RESULTS
========================================================= */

function renderWebResults(data) {
  clearResults();

  count.textContent =
    `${data.length} result${data.length === 1 ? "" : "s"}`;

  if (!data.length) {
    renderMediaEmpty("No results found.");
    return;
  }

  data.forEach(item => {
    const card = document.createElement("a");

    card.className = "result";

    card.href = item.url || "#";

    card.target = "_blank";

    card.rel = "noopener noreferrer";

    card.innerHTML = `
      <div class="result-url">
        ${escapeHtml(item.url || "")}
      </div>

      <h3>
        ${escapeHtml(item.title || "Untitled")}
      </h3>

      <p>
        ${escapeHtml(
          item.description || "No description available."
        )}
      </p>
    `;

    results.appendChild(card);
  });
}

/* =========================================================
   IMAGE RESULTS
========================================================= */

function renderImages(data) {
  clearResults();

  count.textContent =
    `${data.length} image${data.length === 1 ? "" : "s"}`;

  if (!data.length) {
    renderMediaEmpty(
      "No images found for this search."
    );
    return;
  }

  const grid = document.createElement("div");

  grid.className = "images-grid";

  data.forEach(item => {
    const card = document.createElement("a");

    card.className = "image-card";

    card.href = item.url || "#";

    card.target = "_blank";

    card.rel = "noopener noreferrer";

    card.innerHTML = `
      <div class="image-wrapper">
        <img
          src="${escapeHtml(item.image)}"
          alt="${escapeHtml(item.title)}"
          loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=\\'image-error\\'>Image unavailable</div>'"
        >
      </div>

      <div class="image-card-content">
        <div class="image-card-title">
          ${escapeHtml(item.title)}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  results.appendChild(grid);
}

/* =========================================================
   VIDEO RESULTS
========================================================= */

function renderVideos(data) {
  clearResults();

  count.textContent =
    `${data.length} video${data.length === 1 ? "" : "s"}`;

  if (!data.length) {
    renderMediaEmpty(
      "No videos found for this search."
    );
    return;
  }

  const grid = document.createElement("div");

  grid.className = "videos-grid";

  data.forEach(item => {
    const card = document.createElement("a");

    card.className = "video-card";

    card.href = item.url || "#";

    card.target = "_blank";

    card.rel = "noopener noreferrer";

    card.innerHTML = `
      <div class="video-thumbnail">

        ${
          item.thumbnail
            ? `
              <img
                src="${escapeHtml(item.thumbnail)}"
                alt="${escapeHtml(item.title)}"
                loading="lazy"
              >
            `
            : `
              <div class="video-no-image">
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
          ${escapeHtml(item.title)}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  results.appendChild(grid);
}

/* =========================================================
   NEWS RESULTS
========================================================= */

function renderNews(data) {
  clearResults();

  count.textContent =
    `${data.length} news result${data.length === 1 ? "" : "s"}`;

  if (!data.length) {
    renderMediaEmpty("No news found.");
    return;
  }

  const list = document.createElement("div");

  list.className = "news-list";

  data.forEach(item => {
    const card = document.createElement("a");

    card.className = "news-card";

    card.href = item.url || "#";

    card.target = "_blank";

    card.rel = "noopener noreferrer";

    card.innerHTML = `
      <div class="news-content">

        <div class="news-source">
          ${escapeHtml(item.source || "News")}
        </div>

        <div class="news-title">
          ${escapeHtml(item.title)}
        </div>

        <div class="news-description">
          ${escapeHtml(stripHtml(item.description))}
        </div>

      </div>
    `;

    list.appendChild(card);
  });

  results.appendChild(list);
}

/* =========================================================
   EMPTY
========================================================= */

function renderMediaEmpty(message) {
  emptyState.innerHTML = `
    <div class="empty-mark">⌕</div>

    <h3>
      ${escapeHtml(message)}
    </h3>

    <p>
      Try another keyword.
    </p>
  `;

  emptyState.hidden = false;
}

/* =========================================================
   MAIN SEARCH
========================================================= */

async function runSearch(
  query,
  tab = currentTab
) {
  query = String(query || "").trim();

  if (!query) return;

  currentQuery = query;
  currentTab = tab;

  resultsSection.hidden = false;

  emptyState.hidden = true;

  title.textContent = query;

  historyPush(query);

  /* =========================================
     IMAGES
  ========================================= */

  if (tab === "images") {
    showLoading("Loading images...");

    const data = await searchImages(query);

    renderImages(data);

    scrollToResults();

    return;
  }

  /* =========================================
     VIDEOS
  ========================================= */

  if (tab === "videos") {
    showLoading("Loading videos...");

    const data = await searchVideos(query);

    renderVideos(data);

    scrollToResults();

    return;
  }

  /* =========================================
     NEWS
  ========================================= */

  if (tab === "news") {
    showLoading("Loading news...");

    const data = await searchNews(query);

    renderNews(data);

    scrollToResults();

    return;
  }

  /* =========================================
     WEB / ALL
  ========================================= */

  showLoading("Searching the web...");

  let data = await searchSupabase(query);

  if (!data || !data.length) {
    data = searchDemo(query);
  }

  if (!data.length) {
    data = await searchWikipedia(query);
  }

  renderWebResults(data);

  scrollToResults();
}

/* =========================================================
   SCROLL
========================================================= */

function scrollToResults() {
  setTimeout(() => {
    resultsSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 100);
}

/* =========================================================
   TAB SYSTEM
========================================================= */

tabs.forEach(tab => {
  tab.addEventListener("click", () => {

    tabs.forEach(t => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });

    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");

    /*
      IMPORTANT:
      Your HTML uses data-type, not data-tab.
    */

    const mode =
      tab.dataset.type || "all";

    currentTab = mode;

    if (currentQuery) {
      runSearch(
        currentQuery,
        mode
      );
    }
  });
});

/* =========================================================
   SEARCH FORM
========================================================= */

if (form) {
  form.addEventListener("submit", event => {
    event.preventDefault();

    runSearch(
      input.value,
      currentTab
    );
  });
}

/* =========================================================
   QUICK SEARCH
========================================================= */

document
  .querySelectorAll(".quick")
  .forEach(button => {

    button.addEventListener("click", () => {

      input.value =
        button.dataset.q ||
        button.textContent.trim();

      suggestions.hidden = true;

      currentTab = "all";

      tabs.forEach(tab => {
        tab.classList.remove("active");
        tab.setAttribute("aria-selected", "false");

        if (tab.dataset.type === "all") {
          tab.classList.add("active");
          tab.setAttribute("aria-selected", "true");
        }
      });

      runSearch(
        input.value,
        "all"
      );
    });
  });

/* =========================================================
   SUGGESTIONS
========================================================= */

if (input) {

  input.addEventListener("input", () => {

    const query =
      normalizeText(input.value);

    if (!query) {
      suggestions.hidden = true;
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
        item => item.title
      )
    ];

    const unique =
      [...new Set(all)];

    const matched =
      unique
        .map(item => ({
          item,
          score: similarity(
            query,
            item
          )
        }))
        .filter(
          item =>
            item.score >= 0.35 ||
            normalizeText(
              item.item
            ).includes(query)
        )
        .sort(
          (a, b) =>
            b.score - a.score
        )
        .slice(0, 7)
        .map(item => item.item);

    suggestions.innerHTML =
      matched
        .map(
          item => `
            <button
              type="button"
              class="suggestion"
            >
              ${escapeHtml(item)}
            </button>
          `
        )
        .join("");

    suggestions.hidden =
      !matched.length;

    suggestions
      .querySelectorAll("button")
      .forEach(button => {

        button.onclick = () => {

          input.value =
            button.textContent.trim();

          suggestions.hidden = true;

          runSearch(
            input.value,
            currentTab
          );
        };
      });
  });
}

/* =========================================================
   CLOSE SUGGESTIONS
========================================================= */

document.addEventListener("click", event => {

  if (
    !event.target.closest(".search-box") &&
    !event.target.closest(".suggestions")
  ) {
    suggestions.hidden = true;
  }
});

/* =========================================================
   THEME
========================================================= */

const themeButton =
  document.querySelector("#themeBtn");

if (themeButton) {

  themeButton.addEventListener("click", () => {

    document.body.classList.toggle("light");

    localStorage.setItem(
      "rise-from-broken_theme",
      document.body.classList.contains("light")
        ? "light"
        : "dark"
    );
  });
}

if (
  localStorage.getItem(
    "rise-from-broken_theme"
  ) === "light"
) {
  document.body.classList.add("light");
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
    document.createElement("div");

  div.innerHTML =
    String(value || "");

  return (
    div.textContent ||
    div.innerText ||
    ""
  );
}

/* =========================================================
   SEARCH HISTORY
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
          
   
