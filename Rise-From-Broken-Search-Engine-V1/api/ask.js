// /api/ask.js
// Rise From Broken — RFB Ask
// Tavily Web Search + Ollama Cloud GPT-OSS

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

    const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

    if (!OLLAMA_API_KEY) {
      return res.status(500).json({
        error: "OLLAMA_API_KEY পাওয়া যায়নি"
      });
    }

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
          max_results: 5,
          include_answer: true,
          include_raw_content: false
        })
      }
    );

    if (!searchRes.ok) {
      const errorText = await searchRes.text();

      return res.status(502).json({
        error: `Tavily Error: ${errorText}`
      });
    }

    const searchData = await searchRes.json();

    if (!searchData.results?.length && !searchData.answer) {
      return res.status(200).json({
        answer: "দুঃখিত, এই প্রশ্নের জন্য নির্ভরযোগ্য তথ্য পাওয়া যায়নি।",
        usedSearch: false,
        sources: []
      });
    }

    // ==========================================
    // SEARCH CONTEXT
    // ==========================================

    let searchContext = "";

    if (searchData.answer) {
      searchContext += `
TAVILY DIRECT ANSWER:
${searchData.answer}

`;
    }

    searchContext += (searchData.results || [])
      .map((r, i) => `
SOURCE ${i + 1}
TITLE: ${r.title || ""}
URL: ${r.url || ""}
CONTENT:
${r.content || ""}
`)
      .join("\n");

    const sources = (searchData.results || []).map(r => ({
      title: r.title || "",
      url: r.url || ""
    }));

    // ==========================================
    // SYSTEM PROMPT
    // ==========================================

    const systemPrompt = `
তোমার নাম RFB Ask।

তুমি Rise From Broken-এর AI Assistant।

সবচেয়ে গুরুত্বপূর্ণ নিয়ম:

Internet Search Result দেওয়া থাকলে সেটাই বর্তমান তথ্যের প্রধান উৎস।

তোমার নিজের পুরোনো knowledge এবং Search Result-এর মধ্যে
পার্থক্য থাকলে অবশ্যই Search Result অনুসরণ করবে।

বিশেষ করে বর্তমান:
- রাষ্ট্রপতি
- প্রধানমন্ত্রী
- সরকার
- রাজনীতি
- খবর
- খেলাধুলা
- দাম
- আবহাওয়া
- প্রযুক্তি
- সাম্প্রতিক ঘটনা

এসবের ক্ষেত্রে Search Result ছাড়া নিজের পুরোনো knowledge ব্যবহার করবে না।

নিয়ম:

1. Search Result মনোযোগ দিয়ে পড়বে।
2. একাধিক source থাকলে তথ্য মিলিয়ে দেখবে।
3. Search Result-এ পরিষ্কার উত্তর থাকলে সেটাই ব্যবহার করবে।
4. Search Result-এর বিপরীত কোনো পুরোনো তথ্য ব্যবহার করবে না।
5. তথ্য বানিয়ে বলবে না।
6. বাংলা প্রশ্নের উত্তর বাংলায় দেবে।
7. ইংরেজি প্রশ্নের উত্তর ইংরেজিতে দেবে।
8. বাংলিশ প্রশ্ন হলে বাংলিশে উত্তর দেবে।
9. সাধারণ প্রশ্নের উত্তর ১-২ লাইনে দেবে।
10. খুব প্রয়োজন না হলে ৩ লাইনের বেশি দেবে না।
11. "উত্তর:" লিখবে না।
12. অপ্রয়োজনীয় ব্যাখ্যা দেবে না।
13. কেউ তোমার নাম জিজ্ঞেস করলে বলবে:
"আমি RFB Ask — Rise From Broken-এর AI Assistant।"
`;

    // ==========================================
    // USER PROMPT
    // ==========================================

    const userPrompt = `
USER QUESTION:
${question}

CURRENT INTERNET SEARCH RESULTS:
${searchContext}

এই প্রশ্নের উত্তর দাও।

IMPORTANT:
Internet Search Result-এর বর্তমান তথ্যকে
তোমার নিজের পুরোনো knowledge-এর চেয়ে অগ্রাধিকার দাও।

শুধু প্রয়োজনীয় উত্তর দাও।
`;

    // ==========================================
    // OLLAMA
    // ==========================================

    const aiRes = await fetch(
      "https://ollama.com/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OLLAMA_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-oss:20b-cloud",

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

          temperature: 0.1,
          stream: false
        })
      }
    );

    if (!aiRes.ok) {
      const errorText = await aiRes.text();

      console.error(
        "Ollama API error:",
        errorText
      );

      return res.status(502).json({
        error: `Ollama Error: ${errorText}`
      });
    }

    const aiData = await aiRes.json();

    const answer =
      aiData.message?.content?.trim() ||
      "দুঃখিত, উত্তর তৈরি করা যায়নি।";

    return res.status(200).json({
      answer,
      usedSearch: true,
      sources
    });

  } catch (error) {

    console.error(
      "RFB Ask error:",
      error
    );

    return res.status(500).json({
      error: `Server Error: ${error.message}`
    });
  }
}
