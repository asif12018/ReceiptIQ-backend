import { prisma } from "../../../app";
import { groqJSON } from "../../utils/groq";

export const GoalService = {
  getGoals: async (userId: string) => {
    return await prisma.goal.findMany({
      where: { userId },
      orderBy: { targetDate: "asc" },
    });
  },

  createGoal: async (userId: string, payload: any) => {
    return await prisma.goal.create({
      data: {
        userId,
        title: payload.title,
        targetAmount: payload.targetAmount,
        targetDate: new Date(payload.targetDate),
        dailyBudgetCap: payload.dailyBudgetCap,
      },
    });
  },

  addSavings: async (userId: string, goalId: string, amount: number) => {
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal || goal.userId !== userId) throw new Error("Goal not found or unauthorized");

    return await prisma.goal.update({
      where: { id: goalId },
      data: { savedAmount: goal.savedAmount + amount },
    });
  },

  getAiAdvice: async (userId: string, goalId: string) => {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { user: true },
    });
    if (!goal || goal.userId !== userId) throw new Error("Goal not found or unauthorized");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReceipts = await prisma.receipt.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
    });

    const totalSpent = recentReceipts.reduce((acc, r) => acc + r.totalAmount, 0);
    const averageDailySpending = totalSpent / 30;

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

    const advice = await groqJSON(prompt, "Goal AI Advice Synthesis");

    // Persist the AI-calculated dailyBudgetCap back to the goal record
    await prisma.goal.update({
      where: { id: goalId },
      data: { dailyBudgetCap: advice.dailyBudgetCap },
    });

    return advice;
  },
};
