// /api/ask.js
// RFB Ask — Tavily Search Debug Version

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST method allowed"
    });
  }

  try {
    const { question } = req.body || {};

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "প্রশ্ন পাঠাও"
      });
    }

    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

    if (!TAVILY_API_KEY) {
      return res.status(500).json({
        error: "TAVILY_API_KEY পাওয়া যায়নি"
      });
    }

    // ==========================================
    // TAVILY SEARCH
    // ==========================================

    const searchRes = await fetch(
      "https://api.tavily.com/search",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: question,
          search_depth: "advanced",
          topic: "general",
          max_results: 6,
          include_answer: true,
          include_raw_content: false
        })
      }
    );

    const searchText = await searchRes.text();

    if (!searchRes.ok) {
      return res.status(502).json({
        error: "Tavily Error",
        details: searchText
      });
    }

    let searchData;

    try {
      searchData = JSON.parse(searchText);
    } catch {
      return res.status(502).json({
        error: "Tavily JSON পাওয়া যায়নি",
        details: searchText
      });
    }

    // ==========================================
    // DEBUG RESPONSE
    // ==========================================

    return res.status(200).json({
      debug: true,

      question,

      tavilyAnswer: searchData.answer || null,

      results: (searchData.results || []).map((r, i) => ({
        number: i + 1,
        title: r.title || "",
        url: r.url || "",
        content: r.content || "",
        score: r.score ?? null
      })),

      message:
        "এটা DEBUG MODE। এখানে Tavily যে Internet Search Result দিয়েছে সেটাই দেখা যাচ্ছে।"
    });

  } catch (error) {

    console.error(
      "Tavily Debug Error:",
      error
    );

    return res.status(500).json({
      error: error.message
    });
  }
}
