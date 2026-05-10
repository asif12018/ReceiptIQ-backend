"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeGoals = void 0;
const generative_ai_1 = require("@google/generative-ai");
const client_1 = require("@prisma/client");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const prisma = new client_1.PrismaClient();
const analyzeGoals = async (userId) => {
    // Fetch user's goals
    const goals = await prisma.goal.findMany({
        where: { userId, status: "IN_PROGRESS" }
    });
    if (goals.length === 0) {
        return { message: "No active goals found." };
    }
    // Fetch recent receipts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const receipts = await prisma.receipt.findMany({
        where: {
            userId,
            createdAt: { gte: thirtyDaysAgo }
        },
        include: { items: true }
    });
    const model = genAI.getGenerativeModel({ model: "gemini-2-flash" });
    const prompt = `You are a proactive Goal Coach and financial advisor.
Here are the user's active savings goals: ${JSON.stringify(goals)}
Here are the user's receipts from the last 30 days: ${JSON.stringify(receipts)}

Analyze their spending habits versus their goal target dates and remaining amounts.
1. Determine if they are on track.
2. If they spend too much on certain categories (e.g., "Entertainment"), generate a warning and suggest an adjusted dailyBudgetCap.
3. Provide actionable insights (e.g., suggesting cheaper alternatives like "Home-cooked Khichuri vs. Restaurant Biryani").

Return a strict JSON object with:
- warnings (array of strings)
- suggestions (array of strings)
- adjustedDailyBudgetCaps (object mapping goal ID to a new suggested daily budget cap number)
`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
        const insights = JSON.parse(text);
        // Optionally apply the suggested adjusted daily budget caps to the DB
        if (insights.adjustedDailyBudgetCaps) {
            for (const [goalId, newCap] of Object.entries(insights.adjustedDailyBudgetCaps)) {
                await prisma.goal.update({
                    where: { id: goalId },
                    data: { dailyBudgetCap: newCap }
                });
            }
        }
        return insights;
    }
    catch (error) {
        throw new Error("Failed to parse AI Coach insights");
    }
};
exports.analyzeGoals = analyzeGoals;
