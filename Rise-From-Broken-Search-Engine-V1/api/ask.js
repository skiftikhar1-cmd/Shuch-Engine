// /api/ask.js
// Rise From Broken — RFB Ask
// Cerebras AI + optional Tavily Search

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

    const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

    if (!CEREBRAS_API_KEY) {
      return res.status(500).json({
        error: "CEREBRAS_API_KEY Vercel Environment Variables-এ পাওয়া যায়নি"
      });
    }

    // ==========================================
    // OPTIONAL INTERNET SEARCH — TAVILY
    // ==========================================

    let searchContext = "";

    if (TAVILY_API_KEY) {
      try {
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
              search_depth: "basic",
              max_results: 4
            })
          }
        );

        if (searchRes.ok) {
          const searchData = await searchRes.json();

          if (searchData.results?.length) {
            searchContext = searchData.results
              .map(
                (r, i) =>
                  `[${i + 1}] ${r.title}: ${r.content}`
              )
              .join("\n");
          }
        }
      } catch (searchError) {
        console.error("Tavily search error:", searchError);
      }
    }

    // ==========================================
    // RFB ASK SYSTEM PROMPT
    // ==========================================

    const systemPrompt = `
তোমার নাম "RFB Ask"।

তুমি Rise From Broken সার্চ ইঞ্জিনের AI Assistant।

নিয়ম:

1. ইউজার বাংলা, ইংরেজি বা বাংলিশে প্রশ্ন করলে সেই ভাষাতেই উত্তর দেবে।
2. সাধারণ প্রশ্নের উত্তর সংক্ষিপ্ত রাখবে।
3. সাধারণত ১-৩ লাইনে উত্তর দেবে।
4. গণিতের প্রশ্ন হলে সরাসরি সঠিক উত্তর দেবে।
5. অপ্রয়োজনীয় ভূমিকা বা অতিরিক্ত কথা বলবে না।
6. Search Result দেওয়া থাকলে প্রয়োজন অনুযায়ী ব্যবহার করবে।
7. Search Result না থাকলে নিজের জ্ঞান ব্যবহার করবে।
8. কেউ তোমার নাম জিজ্ঞেস করলে বলবে:
"আমি RFB Ask — Rise From Broken-এর AI Assistant।"
`;

    const userPrompt = searchContext
      ? `প্রশ্ন:
${question}

Internet Search Result:
${searchContext}`
      : `প্রশ্ন:
${question}`;

    // ==========================================
    // CEREBRAS AI
    // ==========================================

    const aiRes = await fetch(
      "https://api.cerebras.ai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CEREBRAS_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-oss-120b",

          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],

          temperature: 0.2,
          max_tokens: 300
        })
      }
    );

    // ==========================================
    // SHOW REAL CEREBRAS ERROR
    // ==========================================

    if (!aiRes.ok) {
      const errorText = await aiRes.text();

      console.error("Cerebras API error:", errorText);

      return res.status(502).json({
        error: `Cerebras Error: ${errorText}`
      });
    }

    const aiData = await aiRes.json();

    const answer =
      aiData.choices?.[0]?.message?.content?.trim() ||
      "দুঃখিত, উত্তর তৈরি করা যায়নি।";

    return res.status(200).json({
      answer,
      usedSearch: Boolean(searchContext)
    });

  } catch (error) {
    console.error("RFB Ask server error:", error);

    return res.status(500).json({
      error: `Server Error: ${error.message}`
    });
  }
}
