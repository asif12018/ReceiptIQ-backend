import { analyzeImageWithVision } from "../../utils/openrouter";
import { groqJSON } from "../../utils/groq";
import { prisma } from "../../../app";

export const ReceiptService = {
  // parseImage now uses OpenRouter (free vision models) — no more Gemini rate limits
  parseImage: async (imageBuffer: Buffer, mimeType: string, userId: string) => {
    const prompt = `Analyze this receipt image. Extract the following information and return ONLY a strict JSON object with these exact English keys (no markdown, no code fences):
- merchantName (string, or null if not found)
- totalAmount (number)
- currency (string, e.g. "BDT" or "USD")
- category (string, best guess for the expense category, e.g. "Food", "Transport")
- items (array of objects with 'name' and 'price' keys, can be empty array if not visible)`;

    const rawText = await analyzeImageWithVision(
      imageBuffer.toString("base64"),
      mimeType,
      prompt
    );

    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleaned);

    return await prisma.receipt.create({
      data: {
        userId,
        merchantName: parsedData.merchantName,
        totalAmount: parsedData.totalAmount,
        currency: parsedData.currency || "BDT",
        category: parsedData.category,
        items: {
          create:
            parsedData.items?.map((item: any) => ({
              name: item.name,
              price: item.price,
            })) || [],
        },
      },
      include: { items: true },
    });
  },

  // parseVoice uses Groq — text-only, fast and generous limits
  parseVoice: async (textLog: string, userId: string) => {
    const prompt = `Extract expense data from the following Bengali/English text. 
Translate merchant names and all outputs to English. 
Return ONLY a strict JSON object with these exact keys:
- merchantName (string, or null if not found)
- amount (number)
- category (string, best guess)
- currency (string, default to "BDT" if not mentioned)

Text: "${textLog}"`;

    const parsedData = await groqJSON(prompt);

    return await prisma.receipt.create({
      data: {
        userId,
        merchantName: parsedData.merchantName,
        totalAmount: parsedData.amount,
        currency: parsedData.currency || "BDT",
        category: parsedData.category,
      },
    });
  },

  getMyReceipts: async (userId: string) => {
    return await prisma.receipt.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  },
};
