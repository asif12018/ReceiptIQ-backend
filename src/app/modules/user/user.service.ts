import { prisma } from "../../../app";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { groqJSON } from "../../utils/groq";

export const UserService = {
  getMe: async (userId: string) => {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        image: true,
        occupation: true,
        monthlyIncome: true,
        monthlyBudget: true,
        role: true,
        gender: true,
      },
    });
  },

  suggestBudget: async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.monthlyIncome) throw new Error("Set your monthly income first.");

    // Last 3 months of receipts for spending pattern
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const receipts = await prisma.receipt.findMany({
      where: { userId, createdAt: { gte: threeMonthsAgo } },
    });

    const totalSpent = receipts.reduce((s, r) => s + r.totalAmount, 0);
    const avgMonthly = totalSpent / 3;

    // Category breakdown
    const byCategory: Record<string, number> = {};
    receipts.forEach((r) => {
      const cat = r.category || "General";
      byCategory[cat] = (byCategory[cat] || 0) + r.totalAmount;
    });

    const goals = await prisma.goal.findMany({ where: { userId, status: "IN_PROGRESS" } });

    const prompt = `You are a personal finance AI. Suggest a monthly budget for this user.

User Profile:
- Occupation: ${user.occupation || "Unknown"}
- Monthly Income: ৳${user.monthlyIncome}
- Average Monthly Spending (last 3 months): ৳${Math.round(avgMonthly)}
- Spending by Category: ${JSON.stringify(byCategory)}
- Active Savings Goals: ${goals.map((g) => `${g.title} (৳${g.targetAmount - g.savedAmount} remaining)`).join(", ") || "None"}

Return ONLY a strict JSON object with these keys:
- suggestedBudget (number in BDT — this CAN be less than income if goals require saving)
- reasoning (string, 2-3 sentences explaining why, in plain English)
- breakdown (object: keys are category names, values are suggested monthly amounts in BDT)`;

    return await groqJSON(prompt);
  },

  updateProfile: async (userId: string, file?: Express.Multer.File, data?: any) => {
    let updateData: any = { ...data };

    if (file) {
      const avatarUrl = await uploadToCloudinary(file.buffer, file.mimetype);
      updateData.avatarUrl = avatarUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return await prisma.user.findUnique({ where: { id: userId } });
    }

    return await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  },

  getAdminStats: async () => {
    const totalUsers = await prisma.user.count();
    const totalReceipts = await prisma.receipt.count();
    const totalGoals = await prisma.goal.count();
    return { totalUsers, totalReceipts, totalGoals, message: "Global platform analytics" };
  },

  updateBudget: async (userId: string, budget: number) => {
    return await prisma.user.update({
      where: { id: userId },
      data: { monthlyBudget: budget },
    });
  },

  updateUserRole: async (userId: string, role: "USER" | "ADMIN") => {
    return await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  },

  getAiInsights: async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found.");

    // Gather recent spending data for context
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const receipts = await prisma.receipt.findMany({
      where: { userId, createdAt: { gte: threeMonthsAgo } },
    });

    const totalSpent = receipts.reduce((s, r) => s + r.totalAmount, 0);
    const avgMonthly = receipts.length > 0 ? Math.round(totalSpent / 3) : 0;

    const byCategory: Record<string, number> = {};
    receipts.forEach((r) => {
      const cat = r.category || "General";
      byCategory[cat] = (byCategory[cat] || 0) + r.totalAmount;
    });

    const goals = await prisma.goal.findMany({ where: { userId } });
    const hasGoals = goals.length > 0;

    const prompt = `You are a personal finance AI coach for a user in Bangladesh.

User Profile:
- Name: ${user.name || "User"}
- Occupation: ${user.occupation || "Unknown"}
- Monthly Income: ${user.monthlyIncome ? `৳${user.monthlyIncome}` : "Not set"}
- Current Monthly Budget: ${user.monthlyBudget ? `৳${user.monthlyBudget}` : "Not set"}
- Average Monthly Spending (last 3 months): ৳${avgMonthly}
- Spending by Category: ${JSON.stringify(byCategory)}
- Has Active Goals: ${hasGoals}

Generate personalized, actionable financial insights for this user.
${!hasGoals ? "Since the user has NO financial goals yet, also suggest 2-3 concrete, realistic financial goals they should consider based on their occupation and income." : ""}

Return ONLY a strict JSON object with these exact keys:
- occupationTips (array of 3 strings: occupation-specific money tips, practical and relevant to Bangladesh context)
- suggestedBudget (number: recommended monthly budget in BDT based on income and spending; 0 if income unknown)
- budgetReasoning (string: 1-2 sentences explaining the suggested budget)
- budgetBreakdown (object: keys are categories like "Food", "Transport", "Savings", "Entertainment", values are suggested monthly amounts in BDT)
${!hasGoals ? "- suggestedGoals (array of objects with keys: title (string), targetAmount (number), timelineMonths (number), reason (string))" : "- suggestedGoals (array, empty [])"}
- spendingInsight (string: 1 sentence observation about their current spending pattern or encouragement if no data)`;

    return await groqJSON(prompt);
  },
};
