import OpenAI from "openai";

/**
 * OpenRouter provides free access to many vision-capable models.
 * Get your free key at: https://openrouter.ai/keys
 */
export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL || "https://receiptiq.vercel.app",
    "X-Title": "ReceiptIQ",
  },
});

/**
 * Vision model fallback chain — most reliable first.
 * All are free-tier on OpenRouter.
 */
const VISION_MODELS = [
  "google/gemini-2.0-flash-exp:free",           // Best OCR accuracy, free via OpenRouter (separate quota from direct Gemini)
  "meta-llama/llama-3.2-11b-vision-instruct:free", // Reliable fallback
  "qwen/qwen2.5-vl-72b-instruct:free",           // Powerful but can loop on structured output
];

/**
 * Analyze an image with automatic model fallback.
 * Retries with the next model if one fails (loop detection, rate limit, etc.)
 */
export async function analyzeImageWithVision(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  let lastError: unknown;

  for (const model of VISION_MODELS) {
    try {
      console.log(`[OpenRouter] Trying vision model: ${model}`);
      const response = await openrouter.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) throw new Error("Empty response from model");

      // Reject if OpenRouter loop detection triggered
      if (content.includes("looping content") || content.includes("flagged for loop")) {
        throw new Error("Loop detection triggered");
      }

      console.log(`[OpenRouter] Success with model: ${model}`);
      return content;
    } catch (err: any) {
      console.warn(`[OpenRouter] Model ${model} failed: ${err?.message ?? err}`);
      lastError = err;
      // Continue to next model in fallback chain
    }
  }

  throw new Error(`All vision models failed. Last error: ${(lastError as any)?.message ?? lastError}`);
}
