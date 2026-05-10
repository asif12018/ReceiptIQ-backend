"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseReceipt = void 0;
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const parseReceipt = async (imageBuffer, mimeType) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze this receipt. Extract the following information and return ONLY a strict JSON object with these exact keys:
- merchantName (string, or null if not found)
- totalAmount (number)
- currency (string, e.g. "BDT" or "USD")
- category (string, best guess for the expense category, e.g. "Food", "Transport")
- items (array of objects with 'name' and 'price' keys)`;
    const imageParts = [
        {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType
            },
        },
    ];
    const result = await model.generateContent([prompt, ...imageParts]);
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
exports.parseReceipt = parseReceipt;
