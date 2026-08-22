```javascript
"use strict";

/* =========================================================
   RISE FROM BROKEN — FINAL SEARCH ENGINE
   ---------------------------------------------------------
   ALL
   ├── RFB Ask 1-line explanation
   └── Web results

   RFB ASK
   └── Full AI answer + sources

   IMAGES
   VIDEOS
   NEWS

   Supabase + Wikipedia + Wikimedia + Google News
   RFB Ask → /api/ask
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

const title =
    document.querySelector("#resultsTitle");

const count =
    document.querySelector("#resultCount");

const suggestions =
    document.querySelector("#suggestions");

const tabs =
    document.querySelectorAll(".search-tab");

const loadingState =
    document.querySelector("#loadingState");

const clearBtn =
    document.querySelector("#clearBtn");

const voiceBtn =
    document.querySelector("#voiceBtn");


/* =========================================================
   RFB WEB ANSWER DOM
========================================================= */

const rfbWebAnswer =
    document.querySelector("#rfbWebAnswer");

const rfbWebAnswerText =
    document.querySelector("#rfbWebAnswerText");

const rfbWebSources =
    document.querySelector("#rfbWebSources");


/* =========================================================
   RFB ASK DOM
========================================================= */

const rfbAskSection =
    document.querySelector("#rfbAskSection");

const rfbAiInput =
    document.querySelector("#rfbAiInput");

const rfbAiBtn =
    document.querySelector("#rfbAiBtn");

const rfbAiLoading =
    document.querySelector("#rfbAiLoading");

const rfbAiAnswer =
    document.querySelector("#rfbAiAnswer");

const rfbAiSources =
    document.querySelector("#rfbAiSources");

const rfbAiSourceList =
    document.querySelector("#rfbAiSourceList");


/* =========================================================
   STATE
========================================================= */

let currentQuery = "";

let currentTab = "all";


/* =========================================================
   SUPABASE INITIALIZATION
========================================================= */

function initSupabase() {

    if (
        !cfg.SUPABASE_URL ||
        !cfg.SUPABASE_ANON_KEY
    ) {

        console.warn(
            "Supabase configuration missing."
        );

        return;
    }


    if (
        !window.supabase ||
        typeof window.supabase.createClient !==
            "function"
    ) {

        console.warn(
            "Supabase library not ready."
        );

        return;
    }


    try {

        supabaseClient =
            window.supabase.createClient(
                cfg.SUPABASE_URL,
                cfg.SUPABASE_ANON_KEY
            );


        console.log(
            "Rise From Broken: Supabase connected."
        );

    } catch (error) {

        console.error(
            "Supabase initialization error:",
            error
        );

        supabaseClient = null;

    }

}


/* =========================================================
   WAIT FOR SUPABASE
========================================================= */

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


                if (!supabaseClient) {

                    console.warn(
                        "Supabase library was not loaded."
                    );

                }

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
            "Python is a powerful programming language used for software development, automation, data science and artificial intelligence.",
        keywords:
            "python programming coding software developer language ai"
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
            "HTML is the standard markup language used to create and structure web pages.",
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
        url:
            "https://react.dev/",
        description:
            "React is a JavaScript library for building user interfaces.",
        keywords:
            "react javascript frontend ui web development"
    },


    {
        title: "Node.js",
        url:
            "https://nodejs.org/",
        description:
            "Node.js is a JavaScript runtime used to build scalable applications and servers.",
        keywords:
            "node nodejs javascript backend server programming"
    },


    {
        title: "GitHub",
        url:
            "https://github.com/",
        description:
            "GitHub is a platform for hosting and collaborating on software projects.",
        keywords:
            "github git code programming repository developer"
    },


    {
        title: "Supabase",
        url:
            "https://supabase.com/",
        description:
            "Supabase is an open source backend platform powered by PostgreSQL.",
        keywords:
            "supabase database postgres backend api"
    },


    {
        title: "Google",
        url:
            "https://www.google.com/",
        description:
            "Google provides search, cloud computing, software and technology services.",
        keywords:
            "google search technology android cloud"
    },


    {
        title: "YouTube",
        url:
            "https://www.youtube.com/",
        description:
            "YouTube is an online video platform for watching, uploading and sharing videos.",
        keywords:
            "youtube video videos creator entertainment"
    },


    {
        title: "Wikipedia",
        url:
            "https://www.wikipedia.org/",
        description:
            "Wikipedia is a free online encyclopedia covering millions of topics.",
        keywords:
            "wikipedia encyclopedia information education"
    },


    {
        title: "বাংলাদেশ",
        url:
            "https://bn.wikipedia.org/wiki/বাংলাদেশ",
        description:
            "বাংলাদেশ দক্ষিণ এশিয়ার একটি দেশ। এর রাজধানী ঢাকা।",
        keywords:
            "বাংলাদেশ bangladesh bangla country দেশ ঢাকা"
    },


    {
        title: "ঢাকা",
        url:
            "https://bn.wikipedia.org/wiki/ঢাকা",
        description:
            "ঢাকা বাংলাদেশের রাজধানী এবং অন্যতম প্রধান শহর।",
        keywords:
            "ঢাকা dhaka bangladesh capital city"
    }

];


/* =========================================================
   TEXT NORMALIZATION
========================================================= */

function normalizeText(value) {

    return String(value || "")
        .normalize("NFKC")
        .toLocaleLowerCase()
        .replace(
            /[\u200B-\u200D\uFEFF]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/* =========================================================
   TOKENIZER
========================================================= */

function tokenize(value) {

    const text =
        normalizeText(value);


    if (!text) {
        return [];
    }


    return text
        .split(
            /[\s\-_.,!?;:()[\]{}'"\/\\|+=*&^%$#@~`<>]+/
        )
        .filter(Boolean);

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

            const titleText =
                normalizeText(item.title);

            const keywordText =
                normalizeText(item.keywords);

            const descriptionText =
                normalizeText(item.description);


            let matched = 0;


            words.forEach(word => {

                if (
                    titleText.includes(word) ||
                    keywordText.includes(word) ||
                    descriptionText.includes(word)
                ) {

                    matched++;

                }

            });


            return {
                ...item,
                _matched: matched
            };

        })


        .filter(
            item =>
                item._matched === words.length
        )


        .sort(
            (a, b) =>
                b._matched - a._matched
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
                .replace(
                    /[%_]/g,
                    "\\$&"
                )
                .replace(
                    /,/g,
                    "\\,"
                )
                .replace(
                    /\(/g,
                    "\\("
                )
                .replace(
                    /\)/g,
                    "\\)"
                );


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
                "Supabase search error:",
                error.message
            );

            return null;

        }


        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.warn(
            "Supabase request failed:",
            error
        );

        return null;

    }

}


/* =========================================================
   DIRECT URL
========================================================= */

function isUrl(text) {

    try {

        const url =
            new URL(text);


        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );

    } catch {

        return false;

    }

}


/* =========================================================
   URL RESULT
========================================================= */

function createUrlResult(url) {

    let host = url;


    try {

        host =
            new URL(url).hostname;

    } catch {}


    return [{

        title: host,

        url: url,

        description:
            "Open this website directly from Rise From Broken."

    }];

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

            throw new Error(
                "Wikipedia API failed"
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

                title:
                    item.title,

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
            "Wikipedia error:",
            error
        );

        return [];

    }

}


/* =========================================================
   WIKIMEDIA IMAGES
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

            throw new Error(
                "Wikimedia image API failed"
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


            if (!info) {
                return null;
            }


            const mime =
                String(
                    info.mime || ""
                ).toLowerCase();


            if (
                !mime.startsWith(
                    "image/"
                )
            ) {

                return null;

            }


            return {

                title:
                    String(
                        page.title || ""
                    ).replace(
                        /^File:/i,
                        ""
                    ),

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


        .filter(
            item =>
                item &&
                item.image
        )


        .slice(0, 20);

    } catch (error) {

        console.warn(
            "Image search error:",
            error
        );

        return [];

    }

}


/* =========================================================
   WIKIMEDIA VIDEOS
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

            throw new Error(
                "Wikimedia video API failed"
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


            if (!info) {
                return null;
            }


            const mime =
                String(
                    info.mime || ""
                ).toLowerCase();


            if (
                !mime.startsWith(
                    "video/"
                )
            ) {

                return null;

            }


            return {

                title:
                    String(
                        page.title || ""
                    ).replace(
                        /^File:/i,
                        ""
                    ),

                thumbnail:
                    info.thumburl || "",

                url:
                    info.descriptionurl ||
                    info.url ||
                    "#",

                videoUrl:
                    info.url || ""

            };

        })


        .filter(Boolean)
        .slice(0, 20);

    } catch (error) {

        console.warn(
            "Video search error:",
            error
        );

        return [];

    }

}


/* =========================================================
   GOOGLE NEWS
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
                "News API failed"
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
            ...xml.querySelectorAll("item")
        ]


        .slice(0, 20)


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
                )?.textContent ||
                "News"

        }));

    } catch (error) {

        console.warn(
            "News search error:",
            error
        );

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

                body:
                    JSON.stringify({
                        question
                    })
            }
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch {

        data = null;

    }


    if (!response.ok) {

        throw new Error(
            data?.error ||
            "RFB Ask request failed."
        );

    }


    return data || {};

}


/* =========================================================
   RFB ASK — ONE LINE WEB SUMMARY
========================================================= */

async function loadRfbWebAnswer(
    question
) {

    if (!rfbWebAnswer) {
        return;
    }


    rfbWebAnswer.hidden = false;


    if (rfbWebAnswerText) {

        rfbWebAnswerText.textContent =
            "RFB Ask is analyzing the web results...";

    }


    if (rfbWebSources) {

        rfbWebSources.innerHTML = "";

    }


    try {

        const data =
            await askRfb(question);


        const answer =
            String(
                data.answer || ""
            ).trim();


        if (rfbWebAnswerText) {

            if (answer) {

                /*
                  Keep only the first useful line
                  for the All page.
                */

                const firstLine =
                    answer
                        .split(/\n+/)
                        .map(
                            line =>
                                line.trim()
                        )
                        .find(Boolean) ||
                    answer;


                rfbWebAnswerText.textContent =
                    firstLine;

            } else {

                rfbWebAnswerText.textContent =
                    "No AI explanation available.";

            }

        }


        renderRfbWebSources(
            data.sources || []
        );

    } catch (error) {

        console.warn(
            "RFB web answer error:",
            error
        );


        if (rfbWebAnswerText) {

            rfbWebAnswerText.textContent =
                "RFB Ask explanation is temporarily unavailable.";

        }

    }

}


/* =========================================================
   RFB WEB SOURCES
========================================================= */

function renderRfbWebSources(
    sources
) {

    if (!rfbWebSources) {
        return;
    }


    rfbWebSources.innerHTML = "";


    if (
        !Array.isArray(sources) ||
        !sources.length
    ) {

        return;

    }


    const title =
        document.createElement("div");


    title.className =
        "rfb-web-sources-title";


    title.textContent =
        "Web sources";


    rfbWebSources.appendChild(
        title
    );


    sources
        .slice(0, 5)
        .forEach(source => {

            if (!source?.url) {
                return;
            }


            const link =
                document.createElement("a");


            link.href =
                source.url;


            link.target =
                "_blank";


            link.rel =
                "noopener noreferrer";


            link.className =
                "rfb-web-source";


            link.textContent =
                source.title ||
                source.url;


            rfbWebSources.appendChild(
                link
            );

        });

}


/* =========================================================
   RENDER WEB RESULTS
========================================================= */

function renderWebResults(data) {

    results.innerHTML = "";


    count.textContent =
        `${data.length} result${
            data.length === 1
                ? ""
                : "s"
        }`;


    if (!data.length) {

        renderEmpty(
            "No results found."
        );

        return;

    }


    emptyState.hidden = true;


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


        results.appendChild(
            card
        );

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

        renderEmpty(
            "No images found."
        );

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
            src="${escapeHtml(
                item.image
            )}"
            alt="${escapeHtml(
                item.title
            )}"
            loading="lazy"
            onerror="
              this.style.display='none'
            "
          >

          <div class="image-card-content">

            <div class="image-card-title">
              ${escapeHtml(
                  item.title
              )}
            </div>

          </div>

        `;


        grid.appendChild(
            card
        );

    });


    results.appendChild(
        grid
    );

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

        renderEmpty(
            "No videos found."
        );

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
                `
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
                    :
                `
                <div class="video-placeholder">
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


        grid.appendChild(
            card
        );

    });


    results.appendChild(
        grid
    );

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

        renderEmpty(
            "No news found."
        );

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
                  item.source ||
                  "News"
              )}
            </div>

            <div class="news-title">
              ${escapeHtml(
                  item.title ||
                  "Untitled"
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


        list.appendChild(
            card
        );

    });


    results.appendChild(
        list
    );

}


/* =========================================================
   EMPTY
========================================================= */

function renderEmpty(message) {

    results.innerHTML = "";


    emptyState.innerHTML = `

      <div class="empty-mark">
        ⌕
      </div>

      <h3>
        ${escapeHtml(
            message
        )}
      </h3>

      <p>
        Try another search.
      </p>

    `;


    emptyState.hidden = false;


    count.textContent =
        "0 results";

}


/* =========================================================
   HIDE RFB WEB ANSWER
========================================================= */

function hideRfbWebAnswer() {

    if (!rfbWebAnswer) {
        return;
    }


    rfbWebAnswer.hidden = true;


    if (rfbWebAnswerText) {

        rfbWebAnswerText.textContent =
            "";

    }


    if (rfbWebSources) {

        rfbWebSources.innerHTML =
            "";

    }

}


/* =========================================================
   SHOW NORMAL SEARCH
========================================================= */

function showNormalSearch() {

    if (resultsSection) {
        resultsSection.hidden = false;
    }


    if (rfbAskSection) {
        rfbAskSection.hidden = true;
    }


    if (rfbWebAnswer) {

        /*
          Only All tab uses the
          RFB web explanation.
        */

        rfbWebAnswer.hidden =
            currentTab !== "all";

    }

}


/* =========================================================
   SHOW RFB ASK
========================================================= */

function showRfbAsk() {

    if (resultsSection) {
        resultsSection.hidden = false;
    }


    if (rfbAskSection) {

        rfbAskSection.hidden =
            false;

    }


    if (rfbWebAnswer) {

        rfbWebAnswer.hidden =
            true;

    }


    if (results) {

        results.innerHTML =
            "";

    }


    if (emptyState) {

        emptyState.hidden =
            true;

    }


    if (count) {

        count.textContent =
            "";

    }


    if (title) {

        title.textContent =
            "Ask RFB Ask";

    }


    /*
      Put focus directly in AI box.
    */

    if (rfbAiInput) {

        setTimeout(
            () =>
                rfbAiInput.focus(),
            100
        );

    }

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


    if (!query) {
        return;
    }


    currentQuery =
        query;


    currentTab =
        tab;


    historyPush(
        query
    );


    /* =====================================================
       RFB ASK TAB
    ====================================================== */

    if (tab === "ask") {

        showRfbAsk();

        return;

    }


    /* =====================================================
       NORMAL SEARCH
    ====================================================== */

    showNormalSearch();


    if (rfbAskSection) {

        rfbAskSection.hidden =
            true;

    }


    resultsSection.hidden =
        false;


    emptyState.hidden =
        true;


    title.textContent =
        query;


    count.textContent =
        "Searching...";


    results.innerHTML =
        "";


    if (loadingState) {

        loadingState.hidden =
            false;

    }


    try {

        /* =================================================
           DIRECT URL
        ================================================= */

        if (
            tab === "all" &&
            isUrl(query)
        ) {

            hideRfbWebAnswer();


            renderWebResults(
                createUrlResult(
                    query
                )
            );


            return;

        }


        /* =================================================
           IMAGES
        ================================================= */

        if (tab === "images") {

            hideRfbWebAnswer();


            const data =
                await searchImages(
                    query
                );


            renderImages(
                data
            );


            return;

        }


        /* =================================================
           VIDEOS
        ================================================= */

        if (tab === "videos") {

            hideRfbWebAnswer();


            const data =
                await searchVideos(
                    query
                );


            renderVideos(
                data
            );


            return;

        }


        /* =================================================
           NEWS
        ================================================= */

        if (tab === "news") {

            hideRfbWebAnswer();


            const data =
                await searchNews(
                    query
                );


            renderNews(
                data
            );


            return;

        }


        /* =================================================
           ALL / WEB
        ================================================= */

        let data =
            await searchSupabase(
                query
            );


        /* Supabase unavailable */

        if (data === null) {

            data =
                searchDemo(
                    query
                );

        }


        /* Supabase empty */

        if (
            Array.isArray(data) &&
            data.length === 0
        ) {

            data =
                searchDemo(
                    query
                );

        }


        /* Wikipedia fallback */

        if (
            Array.isArray(data) &&
            data.length === 0
        ) {

            data =
                await searchWikipedia(
                    query
                );

        }


        renderWebResults(
            data || []
        );


        /*
          IMPORTANT:

          Web result render হওয়ার পর
          RFB Ask background-এ 1-line
          explanation তৈরি করবে।

          এতে search result আটকে থাকবে না।
        */

        if (
            Array.isArray(data) &&
            data.length
        ) {

            loadRfbWebAnswer(
                query
            );

        } else {

            hideRfbWebAnswer();

        }

    } catch (error) {

        console.error(
            "Search error:",
            error
        );


        renderEmpty(
            "Search failed. Please try again."
        );

    } finally {

        if (loadingState) {

            loadingState.hidden =
                true;

        }

    }


    resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =========================================================
   RFB ASK — DIRECT QUESTION
========================================================= */

async function submitRfbAsk() {

    if (!rfbAiInput) {
        return;
    }


    const question =
        rfbAiInput.value.trim();


    if (!question) {
        return;
    }


    if (rfbAiBtn) {

        rfbAiBtn.disabled =
            true;

    }


    if (rfbAiLoading) {

        rfbAiLoading.hidden =
            false;

    }


    if (rfbAiAnswer) {

        rfbAiAnswer.hidden =
            true;

        rfbAiAnswer.textContent =
            "";

    }


    if (rfbAiSources) {

        rfbAiSources.hidden =
            true;

    }


    if (rfbAiSourceList) {

        rfbAiSourceList.innerHTML =
            "";

    }


    try {

        const data =
            await askRfb(
                question
            );


        const answer =
            String(
                data.answer || ""
            ).trim();


        if (rfbAiAnswer) {

            rfbAiAnswer.textContent =
                answer ||
                "দুঃখিত, কোনো উত্তর পাওয়া যায়নি।";


            rfbAiAnswer.hidden =
                false;

        }


        renderAiSources(
            data.sources || []
        );

    } catch (error) {

        console.error(
            "RFB Ask error:",
            error
        );


        if (rfbAiAnswer) {

            rfbAiAnswer.textContent =
                "⚠️ " +
                (
                    error.message ||
                    "RFB Ask-এ সমস্যা হয়েছে।"
                );


            rfbAiAnswer.hidden =
                false;

        }

    } finally {

        if (rfbAiLoading) {

            rfbAiLoading.hidden =
                true;

        }


        if (rfbAiBtn) {

            rfbAiBtn.disabled =
                false;

        }

    }

}


/* =========================================================
   RFB ASK SOURCES
========================================================= */

function renderAiSources(
    sources
) {

    if (
        !rfbAiSources ||
        !rfbAiSourceList
    ) {

        return;

    }


    rfbAiSourceList.innerHTML =
        "";


    if (
        !Array.isArray(sources) ||
        !sources.length
    ) {

        rfbAiSources.hidden =
            true;

        return;

    }


    sources
        .slice(0, 10)
        .forEach(source => {

            if (!source?.url) {
                return;
            }


            const link =
                document.createElement("a");


            link.href =
                source.url;


            link.target =
                "_blank";


            link.rel =
                "noopener noreferrer";


            link.className =
                "rfb-ai-source";


            link.textContent =
                source.title ||
                source.url;


            rfbAiSourceList.appendChild(
                link
            );

        });


    rfbAiSources.hidden =
        !rfbAiSourceList.children.length;

}


/* =========================================================
   TABS
========================================================= */

tabs.forEach(tab => {

    tab.addEventListener(
        "click",
        () => {

            tabs.forEach(
                other => {

                    other.classList.remove(
                        "active"
                    );


                    other.setAttribute(
                        "aria-selected",
                        "false"
                    );

                }
            );


            tab.classList.add(
                "active"
            );


            tab.setAttribute(
                "aria-selected",
                "true"
            );


            const mode =
                tab.dataset.tab ||
                "all";


            currentTab =
                mode;


            if (mode === "ask") {

                showRfbAsk();

                return;

            }


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
   RFB ASK BUTTON
========================================================= */

if (rfbAiBtn) {

    rfbAiBtn.addEventListener(
        "click",
        submitRfbAsk
    );

}


if (rfbAiInput) {

    rfbAiInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                submitRfbAsk();

            }

        }
    );

}


/* =========================================================
   CLEAR
========================================================= */

if (
    input &&
    clearBtn
) {

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

            input.value =
                "";


            clearBtn.hidden =
                true;


            input.focus();


            if (suggestions) {

                suggestions.hidden =
                    true;

            }

        }
    );

}


/* =========================================================
   QUICK SEARCH
========================================================= */

document
    .querySelectorAll(
        ".quick"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    input.value =
                        button.dataset.q ||
                        button.textContent.trim();


                    if (clearBtn) {

                        clearBtn.hidden =
                            false;

                    }


                    currentTab =
                        "all";


                    tabs.forEach(
                        tab => {

                            const active =
                                tab.dataset.tab ===
                                "all";


                            tab.classList.toggle(
                                "active",
                                active
                            );


                            tab.setAttribute(
                                "aria-selected",
                                active
                                    ? "true"
                                    : "false"
                            );

                        }
                    );


                    runSearch(
                        input.value,
                        "all"
                    );

                }
            );

        }
    );


/* =========================================================
   SUGGESTIONS
========================================================= */

if (
    input &&
    suggestions
) {

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


            let history =
                [];


            try {

                history =
                    JSON.parse(
                        localStorage.getItem(
                            "rise-from-broken_history"
                        ) ||
                        "[]"
                    );

            } catch {}


            const demoTitles =
                demoResults.map(
                    item =>
                        item.title
                );


            const unique =
                [
                    ...new Set([
                        ...history,
                        ...demoTitles
                    ])
                ];


            const matched =
                unique
                    .filter(
                        item =>
                            normalizeText(
                                item
                            ).includes(
                                query
                            )
                    )
                    .slice(0, 7);


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
                .forEach(
                    button => {

                        button.onclick =
                            () => {

                                input.value =
                                    button
                                        .textContent
                                        .trim();


                                suggestions.hidden =
                                    true;


                                if (clearBtn) {

                                    clearBtn.hidden =
                                        false;

                                }


                                runSearch(
                                    input.value,
                                    currentTab
                                );

                            };

                    }
                );

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

            if (suggestions) {

                suggestions.hidden =
                    true;

            }

        }

    }
);


/* =========================================================
   VOICE SEARCH
========================================================= */

if (voiceBtn) {

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
                        event
                            .results[0][0]
                            .transcript;


                    input.value =
                        text;


                    if (clearBtn) {

                        clearBtn.hidden =
                            false;

                    }


                    runSearch(
                        text,
                        currentTab
                    );

                };


            recognition.onerror =
                error => {

                    console.warn(
                        "Voice search:",
                        error
                    );

                };


            recognition.start();

        }
    );

}


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

    return String(value || "")
        .replace(
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
   SEARCH HISTORY
========================================================= */

function historyPush(query) {

    try {

        const history =
            JSON.parse(
                localStorage.getItem(
                    "rise-from-broken_history"
                ) ||
                "[]"
            );


        const cleaned =
            history.filter(
                item =>
                    normalizeText(
                        item
                    ) !==
                    normalizeText(
                        query
                    )
            );


        cleaned.unshift(
            query
        );


        localStorage.setItem(
            "rise-from-broken_history",
            JSON.stringify(
                cleaned.slice(
                    0,
                    10
                )
            )
        );

    } catch (error) {

        console.warn(
            "History error:",
            error
        );

    }

}


/* =========================================================
   START
========================================================= */

console.log(
    "Rise From Broken Search Engine loaded successfully."
);

console.log(
    "RFB Ask integration loaded."
);
```
