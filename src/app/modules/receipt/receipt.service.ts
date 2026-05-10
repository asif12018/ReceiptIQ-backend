import { genAI } from "../../utils/gemini";
import { prisma } from "../../../app";

export const ReceiptService = {
  parseImage: async (imageBuffer: Buffer, mimeType: string, userId: string) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    return await prisma.receipt.create({
      data: {
        userId,
        merchantName: parsedData.merchantName,
        totalAmount: parsedData.totalAmount,
        currency: parsedData.currency || "BDT",
        category: parsedData.category,
        items: {
          create: parsedData.items?.map((item: any) => ({
            name: item.name,
            price: item.price
          })) || []
        }
      },
      include: { items: true }
    });
  },

  parseVoice: async (textLog: string, userId: string) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

    return await prisma.receipt.create({
      data: {
        userId,
        merchantName: parsedData.merchantName,
        totalAmount: parsedData.amount,
        currency: parsedData.currency || "BDT",
        category: parsedData.category,
      }
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

