"use strict";

/* =========================================================
   RISE FROM BROKEN
   SEARCH + RFB ASK + IMAGES + VIDEOS + NEWS
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const cfg =
  window.RISE_FROM_BROKEN_CONFIG || {};

let supabaseClient = null;


/* =========================================================
   DOM
========================================================= */

const form =
  document.querySelector("#searchForm");

const input =
  document.querySelector("#searchInput");

const resultsSection =
  document.querySelector("#resultsSection");

const results =
  document.querySelector("#results");

const emptyState =
  document.querySelector("#emptyState");

const loadingState =
  document.querySelector("#loadingState");

const resultsTitle =
  document.querySelector("#resultsTitle");

const resultCount =
  document.querySelector("#resultCount");

const clearBtn =
  document.querySelector("#clearBtn");

const voiceBtn =
  document.querySelector("#voiceBtn");

const suggestions =
  document.querySelector("#suggestions");

const homeInfo =
  document.querySelector("#homeInfo");

const tabs =
  document.querySelectorAll(".search-tab");


/* RFB ASK */

const rfbAskPanel =
  document.querySelector("#rfbAskPanel");

const rfbAskInput =
  document.querySelector("#rfbAskInput");

const rfbAskButton =
  document.querySelector("#rfbAskButton");

const rfbAskLoading =
  document.querySelector("#rfbAskLoading");

const rfbAskAnswer =
  document.querySelector("#rfbAskAnswer");

const inlineAsk =
  document.querySelector("#inlineAsk");

const inlineAskText =
  document.querySelector("#inlineAskText");


/* =========================================================
   STATE
========================================================= */

let currentQuery = "";
let currentTab = "all";


/* =========================================================
   SUPABASE
========================================================= */

function initSupabase() {

  if (
    !cfg.SUPABASE_URL ||
    !cfg.SUPABASE_ANON_KEY
  ) {
    return;
  }

  if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
  ) {
    return;
  }

  try {

    supabaseClient =
      window.supabase.createClient(
        cfg.SUPABASE_URL,
        cfg.SUPABASE_ANON_KEY
      );

  } catch (error) {

    console.warn(
      "Supabase initialization failed:",
      error
    );

    supabaseClient = null;
  }

}


(function waitForSupabase() {

  let attempts = 0;

  const timer =
    setInterval(() => {

      attempts++;

      if (window.supabase) {

        clearInterval(timer);

        initSupabase();

      }

      if (attempts >= 50) {

        clearInterval(timer);

      }

    }, 100);

})();


/* =========================================================
   DEMO DATA
========================================================= */

const demoResults = [

  {
    title: "Python",
    url: "https://www.python.org/",
    description:
      "Python is a programming language used for software development, automation, data science and artificial intelligence.",
    keywords:
      "python programming coding software language ai"
  },

  {
    title: "JavaScript",
    url:
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    description:
      "JavaScript is a programming language widely used for interactive websites and applications.",
    keywords:
      "javascript js programming web frontend coding"
  },

  {
    title: "HTML",
    url:
      "https://developer.mozilla.org/en-US/docs/Web/HTML",
    description:
      "HTML is the standard markup language used to create web pages.",
    keywords:
      "html website web markup frontend"
  },

  {
    title: "CSS",
    url:
      "https://developer.mozilla.org/en-US/docs/Web/CSS",
    description:
      "CSS is used to style and design websites.",
    keywords:
      "css style design website frontend"
  },

  {
    title: "React",
    url: "https://react.dev/",
    description:
      "React is a JavaScript library for building user interfaces.",
    keywords:
      "react javascript frontend ui"
  },

  {
    title: "GitHub",
    url: "https://github.com/",
    description:
      "GitHub is a platform for hosting and collaborating on software projects.",
    keywords:
      "github git code programming repository"
  },

  {
    title: "Supabase",
    url: "https://supabase.com/",
    description:
      "Supabase is an open source backend platform powered by PostgreSQL.",
    keywords:
      "supabase database postgres backend"
  },

  {
    title: "YouTube",
    url: "https://www.youtube.com/",
    description:
      "YouTube is an online video platform.",
    keywords:
      "youtube video videos creator"
  },

  {
    title: "Wikipedia",
    url: "https://www.wikipedia.org/",
    description:
      "Wikipedia is a free online encyclopedia.",
    keywords:
      "wikipedia encyclopedia education"
  },

  {
    title: "Bangladesh",
    url:
      "https://en.wikipedia.org/wiki/Bangladesh",
    description:
      "Bangladesh is a country in South Asia.",
    keywords:
      "bangladesh bangla country dhaka"
  }

];


/* =========================================================
   HELPERS
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

  const text =
    normalizeText(value);

  if (!text) return [];

  return text
    .split(/[\s\-_.,!?;:()[\]{}'"\/\\|+=*&^%$#@~`<>]+/)
    .filter(Boolean);

}


function escapeHtml(value) {

  return String(value || "")
    .replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[char]
    );

}


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
   DEMO SEARCH
========================================================= */

function searchDemo(query) {

  const words =
    tokenize(query);

  if (!words.length) {
    return [];
  }

  return demoResults
    .map(item => {

      const text =
        normalizeText(
          `${item.title} ${item.description} ${item.keywords}`
        );

      let score = 0;

      words.forEach(word => {

        if (text.includes(word)) {
          score++;
        }

      });

      return {
        ...item,
        _score: score
      };

    })
    .filter(item =>
      item._score > 0
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

  if (!supabaseClient) {
    return null;
  }

  try {

    const table =
      cfg.SEARCH_TABLE ||
      "search_documents";

    const safeQuery =
      String(query || "")
        .replace(/[%_]/g, "\\$&")
        .replace(/,/g, "\\,")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");

    const { data, error } =
      await supabaseClient
        .from(table)
        .select(
          "title,url,description,keywords"
        )
        .or(
          `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,keywords.ilike.%${safeQuery}%`
        )
        .limit(30);

    if (error) {

      console.warn(
        "Supabase search:",
        error.message
      );

      return null;
    }

    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {

    console.warn(
      "Supabase request:",
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
      "&srlimit=15";

    const response =
      await fetch(api);

    if (!response.ok) {
      return [];
    }

    const data =
      await response.json();

    if (
      !data.query ||
      !Array.isArray(data.query.search)
    ) {
      return [];
    }

    return data.query.search.map(item => ({

      title: item.title,

      url:
        "https://en.wikipedia.org/wiki/" +
        encodeURIComponent(
          item.title.replace(/ /g, "_")
        ),

      description:
        stripHtml(item.snippet) + "..."

    }));

  } catch {

    return [];
  }

}


/* =========================================================
   IMAGES
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
      "&iiprop=url|mime" +
      "&iiurlwidth=600" +
      "&format=json" +
      "&origin=*";

    const response =
      await fetch(api);

    if (!response.ok) {
      return [];
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
          String(info.mime || "")
            .toLowerCase();

        if (!mime.startsWith("image/")) {
          return null;
        }

        return {

          title:
            String(page.title || "")
              .replace(/^File:/i, ""),

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
      .filter(Boolean)
      .slice(0, 20);

  } catch {

    return [];
  }

}


/* =========================================================
   VIDEOS
========================================================= */

async function searchVideos(query) {

  try {

    const api =
      "https://commons.wikimedia.org/w/api.php" +
      "?action=query" +
      "&generator=search" +
      "&gsrsearch=" +
      encodeURIComponent(query) +
      "&gsrnamespace=6" +
      "&gsrlimit=60" +
      "&prop=imageinfo" +
      "&iiprop=url|mime" +
      "&iiurlwidth=600" +
      "&format=json" +
      "&origin=*";

    const response =
      await fetch(api);

    if (!response.ok) {
      return [];
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
          String(info.mime || "")
            .toLowerCase();

        if (!mime.startsWith("video/")) {
          return null;
        }

        return {

          title:
            String(page.title || "")
              .replace(/^File:/i, ""),

          thumbnail:
            info.thumburl || "",

          url:
            info.descriptionurl ||
            info.url ||
            "#"

        };

      })
      .filter(Boolean)
      .slice(0, 20);

  } catch {

    return [];
  }

}


/* =========================================================
   NEWS
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
      return [];
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
      ...xml.querySelectorAll("item")
    ]
      .slice(0, 20)
      .map(item => ({

        title:
          item.querySelector("title")
            ?.textContent || "",

        url:
          item.querySelector("link")
            ?.textContent || "#",

        description:
          item.querySelector("description")
            ?.textContent || "",

        source:
          item.querySelector("source")
            ?.textContent || "News"

      }));

  } catch {

    return [];
  }

}


/* =========================================================
   RFB ASK API
========================================================= */

async function askRfb(question) {

  const response =
    await fetch(
      "/api/ask",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          question
        })
      }
    );

  let data = {};

  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {

    throw new Error(
      data.error ||
      `RFB Ask failed (${response.status})`
    );

  }

  return (
    data.answer ||
    data.message ||
    "RFB could not generate an answer."
  );

}


/* =========================================================
   INLINE ASK
========================================================= */

async function runInlineAsk(query) {

  if (!inlineAsk || !inlineAskText) {
    return;
  }

  inlineAsk.hidden = false;

  inlineAskText.textContent =
    "Getting a quick explanation...";

  try {

    const answer =
      await askRfb(query);

    inlineAskText.textContent =
      answer;

  } catch (error) {

    console.warn(
      "Inline RFB Ask:",
      error
    );

    inlineAskText.textContent =
      "RFB Ask is temporarily unavailable.";

  }

}


/* =========================================================
   RFB ASK PANEL
========================================================= */

async function runAskPanel(question) {

  question =
    String(question || "").trim();

  if (!question) {
    return;
  }

  rfbAskButton.disabled = true;

  rfbAskLoading.hidden = false;

  rfbAskAnswer.hidden = true;

  try {

    const answer =
      await askRfb(question);

    rfbAskAnswer.textContent =
      answer;

    rfbAskAnswer.hidden = false;

  } catch (error) {

    rfbAskAnswer.textContent =
      "⚠️ " +
      error.message;

    rfbAskAnswer.hidden = false;

  } finally {

    rfbAskButton.disabled = false;

    rfbAskLoading.hidden = true;

  }

}


/* =========================================================
   RENDER WEB
========================================================= */

function renderWebResults(data) {

  results.innerHTML = "";

  resultCount.textContent =
    `${data.length} result${data.length === 1 ? "" : "s"}`;

  emptyState.hidden =
    data.length !== 0;

  if (!data.length) {
    return;
  }

  data.forEach(item => {

    const card =
      document.createElement("a");

    card.className =
      "result";

    card.href =
      item.url || "#";

    card.target =
      "_blank";

    card.rel =
      "noopener noreferrer";

    card.innerHTML = `

      <div class="result-url">
        ${escapeHtml(item.url || "")}
      </div>

      <h3>
        ${escapeHtml(
          item.title || "Untitled"
        )}
      </h3>

      <p>
        ${escapeHtml(
          item.description ||
          "No description available."
        )}
      </p>

    `;

    results.appendChild(card);

  });

}


/* =========================================================
   RENDER IMAGES
========================================================= */

function renderImages(data) {

  results.innerHTML = "";

  resultCount.textContent =
    `${data.length} image${data.length === 1 ? "" : "s"}`;

  if (!data.length) {

    emptyState.hidden = false;

    return;
  }

  emptyState.hidden = true;

  const grid =
    document.createElement("div");

  grid.className =
    "images-grid";

  data.forEach(item => {

    const card =
      document.createElement("a");

    card.className =
      "image-card";

    card.href =
      item.url || "#";

    card.target =
      "_blank";

    card.rel =
      "noopener noreferrer";

    card.innerHTML = `

      <img
        src="${escapeHtml(item.image)}"
        alt="${escapeHtml(item.title)}"
        loading="lazy"
      >

      <div class="image-card-content">
        ${escapeHtml(item.title)}
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

  resultCount.textContent =
    `${data.length} video${data.length === 1 ? "" : "s"}`;

  if (!data.length) {

    emptyState.hidden = false;

    return;
  }

  emptyState.hidden = true;

  const grid =
    document.createElement("div");

  grid.className =
    "videos-grid";

  data.forEach(item => {

    const card =
      document.createElement("a");

    card.className =
      "video-card";

    card.href =
      item.url || "#";

    card.target =
      "_blank";

    card.rel =
      "noopener noreferrer";

    card.innerHTML = `

      <div class="video-thumbnail">

        ${
          item.thumbnail
          ?
          `<img
             src="${escapeHtml(item.thumbnail)}"
             alt="${escapeHtml(item.title)}"
             loading="lazy"
           >`
          :
          `<div class="video-placeholder">
             🎬
           </div>`
        }

        <div class="video-play">
          ▶
        </div>

      </div>

      <div class="video-card-content">
        ${escapeHtml(item.title)}
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

  resultCount.textContent =
    `${data.length} news result${data.length === 1 ? "" : "s"}`;

  if (!data.length) {

    emptyState.hidden = false;

    return;
  }

  emptyState.hidden = true;

  const list =
    document.createElement("div");

  list.className =
    "news-list";

  data.forEach(item => {

    const card =
      document.createElement("a");

    card.className =
      "news-card";

    card.href =
      item.url || "#";

    card.target =
      "_blank";

    card.rel =
      "noopener noreferrer";

    card.innerHTML = `

      <div class="news-content">

        <div class="news-source">
          ${escapeHtml(
            item.source || "News"
          )}
        </div>

        <div class="news-title">
          ${escapeHtml(
            item.title || "Untitled"
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
   EMPTY
========================================================= */

function showEmpty(message) {

  results.innerHTML = "";

  emptyState.innerHTML = `

    <div class="empty-mark">
      ⌕
    </div>

    <h3>
      ${escapeHtml(message)}
    </h3>

    <p>
      Try another search.
    </p>

  `;

  emptyState.hidden = false;

  resultCount.textContent =
    "0 results";

}


/* =========================================================
   SET TAB
========================================================= */

function setActiveTab(tabName) {

  tabs.forEach(tab => {

    const active =
      tab.dataset.tab === tabName;

    tab.classList.toggle(
      "active",
      active
    );

  });

}


/* =========================================================
   MAIN SEARCH
========================================================= */

async function runSearch(
  query,
  tab = "all"
) {

  query =
    String(query || "").trim();

  if (!query) {
    return;
  }

  currentQuery = query;
  currentTab = tab;

  input.value = query;

  clearBtn.hidden = false;

  resultsSection.hidden = false;

  homeInfo.hidden = true;

  setActiveTab(tab);

  resultsTitle.textContent =
    query;

  results.innerHTML = "";

  emptyState.hidden = true;

  inlineAsk.hidden = true;

  loadingState.hidden = false;

  resultCount.textContent =
    "Searching...";

  try {

    /* =====================================================
       RFB ASK TAB
    ===================================================== */

    if (tab === "ask") {

      rfbAskPanel.hidden = false;

      results.innerHTML = "";

      resultCount.textContent =
        "AI answer";

      await runAskPanel(query);

      return;
    }


    rfbAskPanel.hidden = true;


    /* =====================================================
       INLINE AI + ALL
    ===================================================== */

    if (tab === "all") {

      runInlineAsk(query);

      let data =
        await searchSupabase(query);

      if (
        data === null ||
        !Array.isArray(data) ||
        data.length === 0
      ) {

        data =
          searchDemo(query);

      }

      if (
        !data.length
      ) {

        data =
          await searchWikipedia(query);

      }

      renderWebResults(
        data || []
      );

      return;
    }


    /* =====================================================
       IMAGES
    ===================================================== */

    if (tab === "images") {

      const data =
        await searchImages(query);

      renderImages(data);

      return;
    }


    /* =====================================================
       VIDEOS
    ===================================================== */

    if (tab === "videos") {

      const data =
        await searchVideos(query);

      renderVideos(data);

      return;
    }


    /* =====================================================
       NEWS
    ===================================================== */

    if (tab === "news") {

      const data =
        await searchNews(query);

      renderNews(data);

      return;
    }

  } catch (error) {

    console.error(
      "RFB Search Error:",
      error
    );

    showEmpty(
      "Search failed. Please try again."
    );

  } finally {

    loadingState.hidden =
      true;

  }

}


/* =========================================================
   FORM
========================================================= */

form.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    runSearch(
      input.value,
      currentTab === "ask"
        ? "all"
        : currentTab
    );

  }
);


/* =========================================================
   TABS
========================================================= */

tabs.forEach(tab => {

  tab.addEventListener(
    "click",
    () => {

      const mode =
        tab.dataset.tab;

      setActiveTab(mode);

      if (!currentQuery) {

        if (mode === "ask") {

          resultsSection.hidden = false;

          homeInfo.hidden = true;

          rfbAskPanel.hidden = false;

          rfbAskInput.focus();

        }

        return;
      }

      runSearch(
        currentQuery,
        mode
      );

    }
  );

});


/* =========================================================
   ASK BUTTON
========================================================= */

rfbAskButton.addEventListener(
  "click",
  () => {

    runAskPanel(
      rfbAskInput.value
    );

  }
);


rfbAskInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      event.preventDefault();

      runAskPanel(
        rfbAskInput.value
      );

    }

  }
);


/* =========================================================
   QUICK SEARCH
========================================================= */

document
  .querySelectorAll(".quick")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const query =
          button.dataset.q ||
          button.textContent.trim();

        currentTab = "all";

        runSearch(
          query,
          "all"
        );

      }
    );

  });


/* =========================================================
   CLEAR
========================================================= */

input.addEventListener(
  "input",
  () => {

    clearBtn.hidden =
      !input.value.trim();

  }
);


clearBtn.addEventListener(
  "click",
  () => {

    input.value = "";

    clearBtn.hidden = true;

    currentQuery = "";

    resultsSection.hidden = true;

    homeInfo.hidden = false;

    inlineAsk.hidden = true;

    rfbAskPanel.hidden = true;

    results.innerHTML = "";

    input.focus();

  }
);


/* =========================================================
   VOICE SEARCH
========================================================= */

voiceBtn.addEventListener(
  "click",
  () => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

      alert(
        "Voice search is not supported in this browser."
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang =
      "en-US";

    recognition.interimResults =
      false;

    recognition.maxAlternatives =
      1;

    recognition.onresult =
      event => {

        const text =
          event.results[0][0]
            .transcript;

        input.value = text;

        runSearch(
          text,
          "all"
        );

      };

    recognition.start();

  }
);


/* =========================================================
   SUGGESTIONS
========================================================= */

input.addEventListener(
  "input",
  () => {

    if (!suggestions) {
      return;
    }

    const query =
      normalizeText(
        input.value
      );

    if (!query) {

      suggestions.hidden =
        true;

      return;
    }

    const matches =
      demoResults
        .map(item => item.title)
        .filter(title =>
          normalizeText(title)
            .includes(query)
        )
        .slice(0, 6);

    if (!matches.length) {

      suggestions.hidden =
        true;

      return;
    }

    suggestions.innerHTML =
      matches
        .map(item => `
          <button
            class="suggestion"
            type="button"
          >
            ${escapeHtml(item)}
          </button>
        `)
        .join("");

    suggestions.hidden =
      false;

    suggestions
      .querySelectorAll(".suggestion")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            input.value =
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

  }
);


/* =========================================================
   CLOSE SUGGESTIONS
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      !event.target.closest(
        ".search-wrapper"
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

const themeBtn =
  document.querySelector(
    "#themeBtn"
  );


themeBtn.addEventListener(
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
   URL QUERY SUPPORT
   Example:
   ?q=python
========================================================= */

function loadQueryFromUrl() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const query =
    params.get("q");

  if (!query) {
    return;
  }

  const decoded =
    query.trim();

  if (!decoded) {
    return;
  }

  input.value =
    decoded;

  clearBtn.hidden =
    false;

  runSearch(
    decoded,
    "all"
  );

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setTimeout(
      loadQueryFromUrl,
      100
    );

  }
);


console.log(
  "Rise From Broken loaded successfully."
);
