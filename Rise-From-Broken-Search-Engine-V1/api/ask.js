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
    // TAVILY WEB SEARCH
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
            search_depth: "advanced",
            topic: "general",
            max_results: 6,
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

        return res.status(502).json({
          error: `Tavily Error: ${searchError}`
        });
      }

      const searchData = await searchRes.json();

      // ------------------------------------------
      // Tavily direct answer
      // ------------------------------------------

      if (searchData.answer) {
        searchContext += `
TAVILY DIRECT ANSWER:
${searchData.answer}

`;
      }

      // ------------------------------------------
      // Search results
      // ------------------------------------------

      if (searchData.results?.length) {
        searchData.results.forEach((r, i) => {
          searchContext += `
SOURCE ${i + 1}
Title: ${r.title || ""}
URL: ${r.url || ""}
Content:
${r.content || ""}
--------------------------------
`;

          if (r.title && r.url) {
            sources.push({
              title: r.title,
              url: r.url
            });
          }
        });
      }

      // ------------------------------------------
      // No search result
      // ------------------------------------------

      if (!searchContext.trim()) {
        return res.status(200).json({
          answer:
            "দুঃখিত, এই প্রশ্নের জন্য বর্তমানে নির্ভরযোগ্য Internet Search Result পাওয়া যায়নি।",
          usedSearch: false,
          sources: []
        });
      }

    } catch (searchError) {
      console.error(
        "Tavily search error:",
        searchError
      );

      return res.status(502).json({
        error: `Tavily Search Error: ${searchError.message}`
      });
    }

    // ==========================================
    // RFB ASK SYSTEM PROMPT
    // ==========================================

    const systemPrompt = `
তোমার নাম "RFB Ask"।

তুমি Rise From Broken সার্চ ইঞ্জিনের AI Assistant।

সবচেয়ে গুরুত্বপূর্ণ নিয়ম:

তোমাকে Internet Search Result দেওয়া হবে।
সাম্প্রতিক বা পরিবর্তনশীল তথ্যের ক্ষেত্রে Internet Search Result-ই
তোমার প্রধান এবং অগ্রাধিকারপ্রাপ্ত তথ্যের উৎস।

যদি তোমার নিজের পুরোনো knowledge এবং Internet Search Result-এর মধ্যে
কোনো পার্থক্য থাকে, তাহলে Internet Search Result অনুসরণ করবে।

কখনো নিজের পুরোনো knowledge ব্যবহার করে Search Result-এর বর্তমান তথ্য
বাতিল করবে না।

নিয়ম:

1. Search Result ভালোভাবে পড়বে।
2. একাধিক source থাকলে তথ্য মিলিয়ে দেখবে।
3. বর্তমান ব্যক্তি, পদ, সরকার, খবর, রাজনীতি, দাম, আবহাওয়া,
   খেলাধুলা বা অন্য পরিবর্তনশীল তথ্যের ক্ষেত্রে Search Result-কে
   সর্বোচ্চ অগ্রাধিকার দেবে।
4. Search Result-এ স্পষ্ট তথ্য থাকলে সেটাই উত্তর দেবে।
5. Search Result-এর বাইরে কোনো তথ্য বানিয়ে বলবে না।
6. Search Result পরস্পরবিরোধী হলে সেটা উল্লেখ করবে।
7. বাংলা প্রশ্নের উত্তর বাংলায় দেবে।
8. ইংরেজি প্রশ্নের উত্তর ইংরেজিতে দেবে।
9. বাংলিশ প্রশ্ন হলে বাংলিশে উত্তর দেওয়ার চেষ্টা করবে।
10. গণিতের প্রশ্ন হলে সরাসরি সঠিক উত্তর দেবে।
11. সাধারণ উত্তর সংক্ষিপ্ত রাখবে।
12. সাধারণত ১-৪ লাইনের মধ্যে উত্তর দেবে।
13. অপ্রয়োজনীয় ভূমিকা দেবে না।
14. উত্তর দেওয়ার আগে "উত্তর:" লিখবে না।
15. Search Result-এর URL বা source নিজে থেকে বানাবে না।

কেউ তোমার নাম জিজ্ঞেস করলে বলবে:

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

উপরের Internet Search Result ব্যবহার করে প্রশ্নটির উত্তর দাও।

বিশেষ নির্দেশনা:
- Search Result-এর তথ্যকে অগ্রাধিকার দাও।
- নিজের পুরোনো knowledge দিয়ে Search Result-এর তথ্য পরিবর্তন করো না।
- বর্তমান তথ্য হলে Search Result-এর সাম্প্রতিক তথ্য ব্যবহার করো।
- Search Result-এ উত্তর পাওয়া গেলে সরাসরি সেই তথ্য অনুযায়ী উত্তর দাও।
`;

    // ==========================================
    // OLLAMA CLOUD
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
      usedSearch: true,
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
