"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseVoiceLog = void 0;
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const parseVoiceLog = async (textLog) => {
    const model = genAI.getGenerativeModel({ model: "gemini-2-flash" });
    const prompt = `Extract expense data from the following Bengali/English text. 
Translate merchant names to English. 
Return ONLY a strict JSON object with these exact keys:
- merchantName (string, or null if not found)
- amount (number)
- category (string, best guess)
- currency (string, default to "BDT" if not mentioned)

Text: "${textLog}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    // Clean up potential markdown formatting in response
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
        return JSON.parse(text);
    }
    catch (error) {
        throw new Error("Failed to parse JSON from AI response");
    }
};
exports.parseVoiceLog = parseVoiceLog;
