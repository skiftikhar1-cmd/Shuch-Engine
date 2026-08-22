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

    // ==========================================
    // API KEYS
    // ==========================================

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
    // TAVILY INTERNET SEARCH
    // ==========================================

    let searchContext = "";
    let sources = [];

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
            max_results: 5,
            include_answer: true,
            include_raw_content: false
          })
        }
      );

      if (!searchRes.ok) {
        const searchError = await searchRes.text();

        console.error(
          "Tavily API error:",
          searchError
        );

      } else {
        const searchData = await searchRes.json();

        // Tavily results
        if (searchData.results?.length) {
          searchContext = searchData.results
            .map(
              (r, i) =>
                `[${i + 1}]
Title: ${r.title}
URL: ${r.url}
Content: ${r.content}`
            )
            .join("\n\n");

          sources = searchData.results.map((r) => ({
            title: r.title,
            url: r.url
          }));
        }

        // Tavily direct answer
        if (searchData.answer) {
          searchContext =
            `Tavily Answer:
${searchData.answer}

${searchContext}`;
        }
      }

    } catch (searchError) {
      console.error(
        "Tavily search error:",
        searchError
      );
    }

    // ==========================================
    // RFB ASK SYSTEM PROMPT
    // ==========================================

    const systemPrompt = `
তোমার নাম "RFB Ask"।

তুমি Rise From Broken সার্চ ইঞ্জিনের AI Assistant।

তোমার কাজ:

1. ইউজারের প্রশ্ন বুঝবে।
2. Internet Search Result দেওয়া থাকলে সেটা ব্যবহার করবে।
3. সাম্প্রতিক তথ্যের ক্ষেত্রে Search Result-কে অগ্রাধিকার দেবে।
4. Search Result না থাকলে নিজের জ্ঞান ব্যবহার করবে।
5. Search Result-এর তথ্য বানিয়ে পরিবর্তন করবে না।
6. বাংলা প্রশ্নের উত্তর বাংলায় দেবে।
7. ইংরেজি প্রশ্নের উত্তর ইংরেজিতে দেবে।
8. বাংলিশ প্রশ্ন হলে বাংলিশে উত্তর দেওয়ার চেষ্টা করবে।
9. গণিতের প্রশ্ন হলে সরাসরি সঠিক উত্তর দেবে।
10. সাধারণ উত্তর সংক্ষিপ্ত রাখবে।
11. সাধারণত ১-৪ লাইনে উত্তর দেবে।
12. অপ্রয়োজনীয় ভূমিকা দেবে না।

কেউ তোমার নাম জিজ্ঞেস করলে বলবে:

"আমি RFB Ask — Rise From Broken-এর AI Assistant।"
`;

    const userPrompt = searchContext
      ? `
প্রশ্ন:
${question}

নিচের Internet Search Result ব্যবহার করে প্রশ্নটির উত্তর দাও:

${searchContext}
`
      : `
প্রশ্ন:
${question}

কোনো Internet Search Result পাওয়া যায়নি।
নিজের জ্ঞান ব্যবহার করে উত্তর দাও।
`;

    // ==========================================
    // OLLAMA CLOUD — GPT OSS
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

          stream: false
        })
      }
    );

    // ==========================================
    // OLLAMA ERROR
    // ==========================================

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

    // ==========================================
    // FINAL RESPONSE
    // ==========================================

    return res.status(200).json({
      answer,
      usedSearch: Boolean(searchContext),
      sources
    });

  } catch (error) {

    console.error(
      "RFB Ask server error:",
      error
    );

    return res.status(500).json({
      error: `Server Error: ${error.message}`
    });
  }
}
