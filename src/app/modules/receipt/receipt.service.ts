import { analyzeImageWithVision } from "../../utils/openrouter";
import { groqJSON } from "../../utils/groq";
import { prisma } from "../../../app";

export const ReceiptService = {
  // parseImage now uses OpenRouter (free vision models) — no more Gemini rate limits
  parseImage: async (imageBuffer: Buffer, mimeType: string, userId: string) => {
    const settings = await prisma.systemSetting.findUnique({ where: { key: "GLOBAL_SETTINGS" } });
    const systemPrompt = settings?.systemPrompt || "You are a highly intelligent financial assistant for ReceiptIQ...";

    const prompt = `${systemPrompt}
Analyze this receipt image. Extract the following information and return ONLY a strict JSON object with these exact English keys (no markdown, no code fences):
- merchantName (string, or null if not found)
- totalAmount (number)
- currency (string, e.g. "BDT" or "USD")
- category (string, best guess for the expense category, e.g. "Food", "Transport")
- items (array of objects with 'name' and 'price' keys, can be empty array if not visible)`;

    const rawText = await analyzeImageWithVision(
      imageBuffer.toString("base64"),
      mimeType,
      prompt,
    );

    const cleaned = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
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

  // parseVoice uses Groq — text-only, fast and generous limits. Upgraded for "Brain Dump" multi-expense entry.
  parseVoice: async (textLog: string, userId: string) => {
    const settings = await prisma.systemSetting.findUnique({ where: { key: "GLOBAL_SETTINGS" } });
    const systemPrompt = settings?.systemPrompt || "You are a highly intelligent financial assistant for ReceiptIQ...";

    const prompt = `${systemPrompt}
Extract expense data from the following Bengali/English text. It might be a messy "brain dump" containing multiple expenses.
Translate merchant names and all outputs to English. 
Return ONLY a strict JSON array of objects. Even if there is only one expense, return it inside an array. Each object must have these exact keys:
- merchantName (string, or null if not found)
- amount (number)
- category (string, best guess)
- currency (string, default to "BDT" if not mentioned)

Text: "${textLog}"`;

    const parsedData = await groqJSON(prompt);
    const expenses = Array.isArray(parsedData) ? parsedData : [parsedData];

    const createdReceipts = await Promise.all(
      expenses.map((exp: any) =>
        prisma.receipt.create({
          data: {
            userId,
            merchantName: exp.merchantName,
            totalAmount: exp.amount,
            currency: exp.currency || "BDT",
            category: exp.category,
          },
        })
      )
    );
    return createdReceipts;
  },

  getMyReceipts: async (userId: string) => {
    return await prisma.receipt.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  },

  findSubscriptions: async (userId: string) => {
    // Subscription Sniper Agent
    const receipts = await prisma.receipt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50 // last 50 receipts to analyze
    });

    if (receipts.length === 0) return [];

    const settings = await prisma.systemSetting.findUnique({ where: { key: "GLOBAL_SETTINGS" } });
    const systemPrompt = settings?.systemPrompt || "You are a highly intelligent financial assistant for ReceiptIQ...";

    const prompt = `${systemPrompt}
You are a "Subscription Sniper" AI agent. Look at the following user expenses and identify likely recurring subscriptions (e.g., Netflix, Spotify, Gym, Cloud Hosting, ISPs, etc.).
    
Expenses JSON: ${JSON.stringify(receipts.map(r => ({ merchant: r.merchantName, amount: r.totalAmount, date: r.createdAt })))}

Find any recurring subscriptions and return ONLY a strict JSON array of objects. Each object must have these exact keys:
- merchant (string)
- estimatedMonthlyCost (number)
- draftCancellationEmail (string, a short professional email template to cancel the service, ready to send)

If none found, return an empty array [].`;

    const subscriptions = await groqJSON(prompt);
    return Array.isArray(subscriptions) ? subscriptions : [];
  },
};
