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
   RISE FROM BROKEN SEARCH ENGINE V2
   Universal / Multilingual / Fuzzy Search
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
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org/",
    description:
      "Documentation and resources for HTML, CSS, JavaScript and modern web development.",
    keywords:
      "html css javascript web development programming frontend"
  },

  {
    title: "OWASP",
    url: "https://owasp.org/",
    description:
      "A global community focused on improving software and web application security.",
    keywords:
      "cyber security cybersecurity web security hacking safety"
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
    title: "Supabase",
    url: "https://supabase.com/",
    description:
      "An open source backend platform featuring PostgreSQL database, authentication and storage.",
    keywords:
      "supabase database postgres backend api authentication"
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
      "HTML is the standard markup language used to structure content on websites.",
    keywords:
      "html website web markup frontend"
  },

  {
    title: "CSS",
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS",
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
    title: "Google",
    url: "https://www.google.com/",
    description:
      "Google provides search, cloud computing, software and technology services.",
    keywords:
      "google search technology android cloud"
  },

  {
    title: "Microsoft",
    url: "https://www.microsoft.com/",
    description:
      "Microsoft develops software, cloud services, operating systems and technology products.",
    keywords:
      "microsoft windows software technology cloud"
  },

  {
    title: "Facebook",
    url: "https://www.facebook.com/",
    description:
      "Facebook is a social networking platform for connecting and communicating online.",
    keywords:
      "facebook social media meta messenger"
  },

  {
    title: "YouTube",
    url: "https://www.youtube.com/",
    description:
      "YouTube is an online video platform for watching, uploading and sharing videos.",
    keywords:
      "youtube video creator google entertainment"
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
const resultsSection = document.querySelector("#resultsSection");
const results = document.querySelector("#results");
const emptyState = document.querySelector("#emptyState");
const title = document.querySelector("#resultsTitle");
const count = document.querySelector("#resultCount");
const suggestions = document.querySelector("#suggestions");

/* =========================================================
   Unicode Normalization
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

/* =========================================================
   Remove accents where possible
   Works for many Latin-based languages.
========================================================= */

function removeDiacritics(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* =========================================================
   Tokenization
   Unicode aware — works with many scripts.
========================================================= */

function tokenize(value) {
  const normalized = normalizeText(value);

  if (!normalized) return [];

  return normalized
    .split(/[\s\-_.,!?;:()[\]{}'"\/\\|+=*&^%$#@~`<>]+/)
    .filter(Boolean);
}

/* =========================================================
   Small Banglish / common spelling variants
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
  ["technology", "টেকনোলজি"]
];

function expandVariants(value) {
  const base = normalizeText(value);
  const variants = new Set([base]);

  for (const group of transliterationGroups) {
    const [english, native] = group;

    if (base.includes(english)) {
      variants.add(base.replaceAll(english, native));
    }

    if (base.includes(native)) {
      variants.add(base.replaceAll(native, english));
    }
  }

  return [...variants];
}

/* =========================================================
   Levenshtein Distance
   Unicode-safe enough for normal JS strings.
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
      const insert = current[j - 1] + 1;
      const remove = previous[j] + 1;
      const replace =
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);

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
   Similarity
========================================================= */

function similarity(a, b) {
  a = normalizeText(a);
  b = normalizeText(b);

  if (!a || !b) return 0;
  if (a === b) return 1;

  if (a.includes(b) || b.includes(a)) {
    return 0.9;
  }

  const distance = levenshtein(a, b);
  const maxLength = Math.max(
    Array.from(a).length,
    Array.from(b).length
  );

  if (!maxLength) return 0;

  return 1 - distance / maxLength;
}

/* =========================================================
   Word matching
========================================================= */

function wordSimilarity(queryWord, targetWord) {
  const q = removeDiacritics(queryWord);
  const t = removeDiacritics(targetWord);

  if (q === t) return 1;

  if (t.includes(q) || q.includes(t)) {
    return 0.9;
  }

  return similarity(q, t);
}

/* =========================================================
   Search Score
========================================================= */

function score(item, query) {
  const queryWords = tokenize(query);

  if (!queryWords.length) return 0;

  const fields = {
    title: tokenize(item.title),
    description: tokenize(item.description),
    keywords: tokenize(item.keywords || ""),
    url: tokenize(item.url)
  };

  let total = 0;

  for (const queryWord of queryWords) {
    let best = 0;

    for (const word of fields.title) {
      best = Math.max(
        best,
        wordSimilarity(queryWord, word)
      );
    }

    if (best >= 0.95) {
      total += 15;
    } else if (best >= 0.8) {
      total += 10;
    } else if (best >= 0.65) {
      total += 5;
    }

    for (const word of fields.keywords) {
      const similarityScore =
        wordSimilarity(queryWord, word);

      if (similarityScore >= 0.85) {
        total += 7;
        break;
      }
    }

    for (const word of fields.description) {
      const similarityScore =
        wordSimilarity(queryWord, word);

      if (similarityScore >= 0.9) {
        total += 3;
        break;
      }
    }
  }

  /* Exact phrase bonus */

  const normalizedQuery = normalizeText(query);
  const normalizedTitle = normalizeText(item.title);
  const normalizedDescription =
    normalizeText(item.description);

  if (normalizedTitle.includes(normalizedQuery)) {
    total += 20;
  }

  if (normalizedDescription.includes(normalizedQuery)) {
    total += 5;
  }

  return total;
}

/* =========================================================
   Demo Search
========================================================= */

function searchDemo(query) {
  return demoResults
    .map(item => ({
      ...item,
      _score: score(item, query)
    }))
    .filter(item => item._score >= 4)
    .sort((a, b) => b._score - a._score)
    .slice(0, 10);
}

/* =========================================================
   Did You Mean
========================================================= */

function findSuggestion(query) {
  const words = tokenize(query);

  let bestMatch = null;
  let bestScore = 0;

  for (const item of demoResults) {
    const candidates = [
      item.title,
      ...(item.keywords || "").split(" ")
    ];

    for (const candidate of candidates) {
      for (const word of words) {
        const s = wordSimilarity(word, candidate);

        if (s > bestScore && s >= 0.65) {
          bestScore = s;
          bestMatch = item.title;
        }
      }
    }
  }

  return bestMatch;
}

/* =========================================================
   Supabase Search
========================================================= */

async function searchSupabase(query) {
  if (!supabaseClient) return null;

  try {
    const { data, error } = await supabaseClient
      .from(
        cfg.SEARCH_TABLE || "search_documents"
      )
      .select("title,url,description")
      .textSearch(
        "search_vector",
        query,
        {
          type: "websearch",
          config: "english"
        }
      )
      .limit(30);

    if (error) {
      console.warn(
        "Supabase search:",
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
   Wikipedia Search
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

    const response = await fetch(api);

    if (!response.ok) {
      throw new Error(
        "Wikipedia request failed"
      );
    }

    const data = await response.json();

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
  } catch (error) {
    console.warn(
      "Wikipedia search failed:",
      error
    );

    return [];
  }
}

/* =========================================================
   Render Results
========================================================= */

function renderResults(data, query) {
  results.innerHTML = "";

  count.textContent =
    `${data.length} result${data.length === 1 ? "" : "s"}`;

  if (!data.length) {
    const suggestion = findSuggestion(query);

    if (suggestion) {
      emptyState.innerHTML = `
        <div class="empty-mark">⌕</div>
        <p>
          No exact results found.
        </p>
        <p>
          Did you mean
          <button
            class="suggestion"
            id="didYouMean"
          >
            ${escapeHtml(suggestion)}
          </button>
          ?
        </p>
      `;

      const button =
        document.querySelector("#didYouMean");

      if (button) {
        button.addEventListener(
          "click",
          () => {
            input.value = suggestion;
            runSearch(suggestion);
          }
        );
      }
    }

    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  data.forEach(item => {
    const a = document.createElement("a");

    a.className = "result";

    a.href = item.url || "#";

    a.target = "_blank";

    a.rel =
      "noopener noreferrer";

    a.innerHTML = `
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

    results.appendChild(a);
  });
}

/* =========================================================
   MAIN SEARCH
========================================================= */

async function runSearch(query) {
  query = query.trim();

  if (!query) return;

  resultsSection.hidden = false;

  emptyState.hidden = true;

  title.textContent = query;

  count.textContent = "Searching...";

  results.innerHTML = `
    <div class="empty">
      <div class="empty-mark">⌕</div>
      <p>Searching...</p>
    </div>
  `;

  historyPush(query);

  /* ---------------------------------
     1. Supabase
  --------------------------------- */

  let data =
    await searchSupabase(query);

  /* ---------------------------------
     2. Local intelligent search
  --------------------------------- */

  if (
    data === null ||
    data.length === 0
  ) {
    data = searchDemo(query);
  }

  /* ---------------------------------
     3. Wikipedia fallback
  --------------------------------- */

  if (data.length === 0) {
    data =
      await searchWikipedia(query);
  }

  renderResults(data, query);

  resultsSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/* =========================================================
   HTML Escape
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
   Remove HTML
========================================================= */

function stripHtml(value) {
  const div =
    document.createElement("div");

  div.innerHTML = value;

  return (
    div.textContent ||
    div.innerText ||
    ""
  );
}

/* =========================================================
   History
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

/* =========================================================
   Form Submit
========================================================= */

if (form) {
  form.addEventListener(
    "submit",
    event => {
      event.preventDefault();

      runSearch(input.value);
    }
  );
}

/* =========================================================
   Quick Search
========================================================= */

document
  .querySelectorAll(".quick")
  .forEach(button => {
    button.addEventListener(
      "click",
      () => {
        input.value =
          button.dataset.q;

        suggestions.hidden = true;

        runSearch(
          button.dataset.q
        );
      }
    );
  });

/* =========================================================
   Suggestions
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
        suggestions.hidden = true;
        return;
      }

      const history =
        JSON.parse(
          localStorage.getItem(
            "rise-from-broken_history"
          ) || "[]"
        );

      const all =
        [
          ...history,
          ...demoResults.map(
            item => item.title
          )
        ];

      const unique =
        [
          ...new Set(all)
        ];

      const matched =
        unique
          .map(item => ({
            item,
            score:
              wordSimilarity(
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
          .slice(0, 6)
          .map(
            item => item.item
          );

      suggestions.innerHTML =
        matched
          .map(
            item =>
              `<button class="suggestion">
                ${escapeHtml(item)}
              </button>`
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
                input.value
              );
            };
        });
    }
  );
}

/* =========================================================
   Close Suggestions
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
      suggestions.hidden = true;
    }
  }
);

/* =========================================================
   Theme
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

/* Restore Theme */

if (
  localStorage.getItem(
    "rise-from-broken_theme"
  ) === "light"
) {
  document.body.classList.add(
    "light"
  );
}
