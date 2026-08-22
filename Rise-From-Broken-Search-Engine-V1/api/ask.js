// /api/ask.js
// RFB Ask — Tavily RAW SEARCH DEBUG

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
          topic: "general",
          max_results: 5,
          include_answer: true,
          include_raw_content: false
        })
      }
    );

    const data = await response.json();

    // ==========================================
    // TAVILY ERROR
    // ==========================================

    if (!response.ok) {
      return res.status(502).json({
        error: `Tavily Error: ${JSON.stringify(data)}`
      });
    }

    // ==========================================
    // MAKE RESULT VISIBLE IN CURRENT WIDGET
    // ==========================================

    const resultText = [
      `🔎 TAVILY SEARCH RESULT`,
      ``,
      `Question: ${question}`,
      ``,
      `Tavily Answer:`,
      data.answer || "কোনো direct answer পাওয়া যায়নি।",
      ``,
      `--------------------------------`,
      ``,

      ...(data.results || []).map((item, index) => {
        return [
          `SOURCE ${index + 1}`,
          `Title: ${item.title || "N/A"}`,
          `URL: ${item.url || "N/A"}`,
          `Score: ${item.score ?? "N/A"}`,
          `Content:`,
          item.content || "কোনো content পাওয়া যায়নি।",
          `--------------------------------`
        ].join("\n");
      })

    ].join("\n");

    // ==========================================
    // SEND TO CURRENT AI WIDGET
    // ==========================================

    return res.status(200).json({
      answer: resultText,
      usedSearch: true
    });

  } catch (error) {

    console.error(
      "Tavily Debug Error:",
      error
    );

    return res.status(500).json({
      error: `Server Error: ${error.message}`
    });
  }
}
