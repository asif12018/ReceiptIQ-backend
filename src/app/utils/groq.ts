import Groq from "groq-sdk";
import { prisma } from "../../app";

const apiKey = process.env.GROQ_API_KEY || "";
export const groq = new Groq({ apiKey });

// Default model — fast, high free-tier limits
export const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Helper: send a prompt to Groq and get the text response.
 * Automatically strips markdown code fences from JSON responses.
 */
export async function groqComplete(prompt: string, logAction: string = "AI System Action"): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const today = new Date();
  today.setHours(0,0,0,0);
  await prisma.aPIQuota.upsert({
    where: { date: today },
    update: { requestsCount: { increment: 1 } },
    create: { date: today, requestsCount: 1 }
  });
  
  const tokens = completion.usage?.total_tokens || Math.round(prompt.length / 4);
  await prisma.aILog.create({
    data: {
      action: logAction,
      tokens
    }
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

/**
 * Helper: send a prompt expecting a strict JSON response.
 * Returns the parsed object or throws.
 */
export async function groqJSON<T = any>(prompt: string, logAction: string = "AI System Action (JSON)"): Promise<T> {
  const text = await groqComplete(prompt, logAction);
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned) as T;
}
