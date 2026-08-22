// /api/ask.js
// RFB Ask — Tavily RAW Search Test

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

    if (!question || typeof question !== "string") {
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

    const response = await fetch(
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
          topic: "news",
          max_results: 5,
          include_answer: true
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "Tavily API Error",
        details: data
      });
    }

    // ==========================================
    // RAW TAVILY RESULT
    // ==========================================

    return res.status(200).json({
      success: true,
      question: question,

      tavily_answer: data.answer || null,

      results: (data.results || []).map((item, index) => ({
        number: index + 1,
        title: item.title,
        url: item.url,
        content: item.content,
        score: item.score
      }))
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
