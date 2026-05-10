"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptService = void 0;
const gemini_1 = require("../../utils/gemini");
const app_1 = require("../../../app");
exports.ReceiptService = {
    parseImage: async (imageBuffer, mimeType, userId) => {
        const model = gemini_1.genAI.getGenerativeModel({ model: "gemini-2-flash" });
        const prompt = `Analyze this receipt. Extract the following information and return ONLY a strict JSON object with these exact English keys:
- merchantName (string, or null if not found)
- totalAmount (number)
- currency (string, e.g. "BDT" or "USD")
- category (string, best guess for the expense category, e.g. "Food", "Transport")
- items (array of objects with 'name' and 'price' keys)`;
        const imageParts = [{ inlineData: { data: imageBuffer.toString("base64"), mimeType } }];
        const result = await model.generateContent([prompt, ...imageParts]);
        let text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedData = JSON.parse(text);
        return await app_1.prisma.receipt.create({
            data: {
                userId,
                merchantName: parsedData.merchantName,
                totalAmount: parsedData.totalAmount,
                currency: parsedData.currency || "BDT",
                category: parsedData.category,
                items: {
                    create: parsedData.items?.map((item) => ({
                        name: item.name,
                        price: item.price
                    })) || []
                }
            },
            include: { items: true }
        });
    },
    parseVoice: async (textLog, userId) => {
        const model = gemini_1.genAI.getGenerativeModel({ model: "gemini-2-flash" });
        const prompt = `Extract expense data from the following Bengali/English text. 
Translate merchant names and all outputs to English. 
Return ONLY a strict JSON object with these exact keys:
- merchantName (string, or null if not found)
- amount (number)
- category (string, best guess)
- currency (string, default to "BDT" if not mentioned)

Text: "${textLog}"`;
        const result = await model.generateContent(prompt);
        let text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedData = JSON.parse(text);
        return await app_1.prisma.receipt.create({
            data: {
                userId,
                merchantName: parsedData.merchantName,
                totalAmount: parsedData.amount,
                currency: parsedData.currency || "BDT",
                category: parsedData.category,
            }
        });
    }
};
