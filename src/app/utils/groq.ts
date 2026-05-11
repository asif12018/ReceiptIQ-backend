import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY || "";
export const groq = new Groq({ apiKey });

// Default model — fast, high free-tier limits
export const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Helper: send a prompt to Groq and get the text response.
 * Automatically strips markdown code fences from JSON responses.
 */
export async function groqComplete(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

/**
 * Helper: send a prompt expecting a strict JSON response.
 * Returns the parsed object or throws.
 */
export async function groqJSON<T = any>(prompt: string): Promise<T> {
  const text = await groqComplete(prompt);
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned) as T;
}
