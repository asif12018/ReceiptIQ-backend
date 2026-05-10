"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalService = void 0;
const app_1 = require("../../../app");
const gemini_1 = require("../../utils/gemini");
exports.GoalService = {
    getGoals: async (userId) => {
        return await app_1.prisma.goal.findMany({
            where: { userId },
            orderBy: { targetDate: "asc" },
        });
    },
    createGoal: async (userId, payload) => {
        return await app_1.prisma.goal.create({
            data: {
                userId,
                title: payload.title,
                targetAmount: payload.targetAmount,
                targetDate: new Date(payload.targetDate),
                dailyBudgetCap: payload.dailyBudgetCap,
            },
        });
    },
    addSavings: async (userId, goalId, amount) => {
        const goal = await app_1.prisma.goal.findUnique({ where: { id: goalId } });
        if (!goal || goal.userId !== userId)
            throw new Error("Goal not found or unauthorized");
        return await app_1.prisma.goal.update({
            where: { id: goalId },
            data: { savedAmount: goal.savedAmount + amount },
        });
    },
    getAiAdvice: async (userId, goalId) => {
        const goal = await app_1.prisma.goal.findUnique({
            where: { id: goalId },
            include: { user: true },
        });
        if (!goal || goal.userId !== userId)
            throw new Error("Goal not found or unauthorized");
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentReceipts = await app_1.prisma.receipt.findMany({
            where: { userId, createdAt: { gte: thirtyDaysAgo } },
        });
        const totalSpent = recentReceipts.reduce((acc, r) => acc + r.totalAmount, 0);
        const averageDailySpending = totalSpent / 30;
        const model = gemini_1.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Data Synthesis:
- Goal Target: ${goal.targetAmount}
- Goal Saved: ${goal.savedAmount}
- Goal Target Date: ${goal.targetDate}
- User Occupation: ${goal.user.occupation || "UNKNOWN"}
- Monthly Income: ${goal.user.monthlyIncome || "UNKNOWN"}
- Average Daily Spending (last 30 days): ${averageDailySpending}
- Receipts: ${JSON.stringify(recentReceipts)}

Calculate the delta to hit the goal in time considering their monthly income. If the goal mathematically starves the user based on their income, adjust the advice to be realistic and occupation-specific.
Return ONLY a strict JSON object with these keys:
- dailyBudgetCap (number, suggested limit)
- costingSuggestions (array of strings, provide occupation-specific tips in Bengali and English to save money, e.g. advising a FREELANCER to save 20% for taxes before funding their motorcycle goal)`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const advice = JSON.parse(text);
        // Persist the AI-calculated dailyBudgetCap back to the goal record
        await app_1.prisma.goal.update({
            where: { id: goalId },
            data: { dailyBudgetCap: advice.dailyBudgetCap },
        });
        return advice;
    },
};
