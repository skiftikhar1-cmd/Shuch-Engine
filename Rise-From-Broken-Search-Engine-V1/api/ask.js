// /api/ask.js
// Rise From Broken — RFB Ask
// Ollama Cloud + GLM-5

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

    if (!OLLAMA_API_KEY) {
      return res.status(500).json({
        error: "OLLAMA_API_KEY পাওয়া যায়নি"
      });
    }

    const systemPrompt = `
তোমার নাম RFB Ask।

তুমি Rise From Broken সার্চ ইঞ্জিনের AI Assistant।

নিয়ম:
- বাংলা প্রশ্নের উত্তর বাংলায় দেবে।
- ইংরেজি প্রশ্নের উত্তর ইংরেজিতে দেবে।
- বাংলিশ হলে বাংলিশেই উত্তর দেওয়ার চেষ্টা করবে।
- সাধারণ প্রশ্নের উত্তর সংক্ষিপ্ত রাখবে।
- গণিতের প্রশ্ন হলে সরাসরি সঠিক উত্তর দেবে।
- যেমন: 25 × 48 = 1200
- অপ্রয়োজনীয় ভূমিকা দেবে না।
- কেউ তোমার নাম জিজ্ঞেস করলে বলবে:
  "আমি RFB Ask — Rise From Broken-এর AI Assistant।"
`;

    const aiRes = await fetch(
      "https://ollama.com/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OLLAMA_API_KEY}`
        },

        body: JSON.stringify({
          model: "glm-5",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: question
            }
          ],
          stream: false
        })
      }
    );

    if (!aiRes.ok) {
      const errorText = await aiRes.text();

      console.error("Ollama API error:", errorText);

      return res.status(502).json({
        error: `Ollama Error: ${errorText}`
      });
    }

    const data = await aiRes.json();

    const answer =
      data.message?.content?.trim() ||
      "দুঃখিত, উত্তর তৈরি করা যায়নি।";

    return res.status(200).json({
      answer
    });

  } catch (error) {
    console.error("RFB Ask error:", error);

    return res.status(500).json({
      error: `Server Error: ${error.message}`
    });
  }
}
