const cfg = window.RISE_FROM_BROKEN_CONFIG || {};
let supabaseClient = null;

if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase) {
  supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
}

const demoResults = [
  { title:"Python Programming", url:"https://www.python.org/", description:"Python is a programming language that lets you work quickly and integrate systems effectively." },
  { title:"MDN Web Docs", url:"https://developer.mozilla.org/", description:"Resources for developers, including HTML, CSS, JavaScript, web APIs, and modern web development." },
  { title:"OWASP", url:"https://owasp.org/", description:"A community dedicated to improving software security through open projects, standards, and education." },
  { title:"GitHub", url:"https://github.com/", description:"Build, collaborate, and share code with developers around the world." },
  { title:"Supabase", url:"https://supabase.com/", description:"An open source Firebase alternative with Postgres database, authentication, storage, and more." }
];

const form = document.querySelector("#searchForm");
const input = document.querySelector("#searchInput");
const resultsSection = document.querySelector("#resultsSection");
const results = document.querySelector("#results");
const emptyState = document.querySelector("#emptyState");
const title = document.querySelector("#resultsTitle");
const count = document.querySelector("#resultCount");
const suggestions = document.querySelector("#suggestions");

function score(item, q) {
  const text = `${item.title} ${item.description} ${item.url}`.toLowerCase();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return words.reduce((n,w) => n + (item.title.toLowerCase().includes(w) ? 5 : 0)
    + (item.description.toLowerCase().includes(w) ? 2 : 0)
    + (text.includes(w) ? 1 : 0), 0);
}

async function searchSupabase(q) {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient
    .from(cfg.SEARCH_TABLE || "search_documents")
    .select("title,url,description")
    .textSearch("search_vector", q, { type:"websearch", config:"english" })
    .limit(30);
  if (error) {
    console.warn("Supabase search:", error.message);
    return null;
  }
  return data || [];
}

async function runSearch(q) {
  q = q.trim();
  if (!q) return;
  resultsSection.hidden = false;
  results.innerHTML = '<div class="empty"><div class="empty-mark">⌕</div><p>Searching...</p></div>';
  emptyState.hidden = true;
  title.textContent = q;
  historyPush(q);

  let data = await searchSupabase(q);
  if (data === null) {
    data = demoResults.filter(x => score(x,q) > 0).sort((a,b)=>score(b,q)-score(a,q));
  }

  results.innerHTML = "";
  count.textContent = `${data.length} result${data.length === 1 ? "" : "s"}`;

  if (!data.length) {
    emptyState.hidden = false;
    return;
  }

  data.forEach(item => {
    const a = document.createElement("a");
    a.className = "result";
    a.href = item.url || "#";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerHTML = `
      <div class="result-url">${escapeHtml(item.url || "")}</div>
      <h3>${escapeHtml(item.title || "Untitled")}</h3>
      <p>${escapeHtml(item.description || "")}</p>
    `;
    results.appendChild(a);
  });
  resultsSection.scrollIntoView({behavior:"smooth", block:"start"});
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function historyPush(q) {
  const h = JSON.parse(localStorage.getItem("rise-from-broken_history") || "[]").filter(x => x !== q);
  h.unshift(q);
  localStorage.setItem("rise-from-broken_history", JSON.stringify(h.slice(0,10)));
}

form.addEventListener("submit", e => { e.preventDefault(); runSearch(input.value); });
document.querySelectorAll(".quick").forEach(b => b.addEventListener("click", () => {
  input.value = b.dataset.q; runSearch(b.dataset.q);
}));

input.addEventListener("input", () => {
  const q = input.value.trim().toLowerCase();
  if (!q) { suggestions.hidden = true; return; }
  const h = JSON.parse(localStorage.getItem("rise-from-broken_history") || "[]");
  const s = [...new Set([...h, ...demoResults.map(x=>x.title)])]
    .filter(x=>x.toLowerCase().includes(q)).slice(0,5);
  suggestions.innerHTML = s.map(x => `<button class="suggestion">${escapeHtml(x)}</button>`).join("");
  suggestions.hidden = !s.length;
  suggestions.querySelectorAll("button").forEach(b => b.onclick=()=>{ input.value=b.textContent; suggestions.hidden=true; runSearch(input.value); });
});

document.addEventListener("click", e => {
  if (!e.target.closest(".search-box") && !e.target.closest(".suggestions")) suggestions.hidden = true;
});

document.querySelector("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("rise-from-broken_theme", document.body.classList.contains("light") ? "light" : "dark");
});
if (localStorage.getItem("rise-from-broken_theme") === "light") document.body.classList.add("light");
