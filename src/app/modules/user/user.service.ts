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

  getSystemConfig: async () => {
    const settings = await prisma.systemSetting.findUnique({
      where: { key: "GLOBAL_SETTINGS" },
      select: { newRegistrations: true, maintenanceMode: true }
    });
    return settings || { newRegistrations: true, maintenanceMode: false };
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
    const settings = await prisma.systemSetting.findUnique({ where: { key: "GLOBAL_SETTINGS" } });
    const systemPrompt = settings?.systemPrompt || "You are a highly intelligent financial assistant for ReceiptIQ...";

    const prompt = `${systemPrompt}
You are a personal finance AI. Suggest a monthly budget for this user.

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

    const response = await groqJSON(prompt, "Goal Coach generated budget advice");

    return response;
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
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    });
    
    const usersOverTime = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const dateStr = d.toISOString().split('T')[0];
      const count = recentUsers.filter(u => u.createdAt.toISOString().split('T')[0] === dateStr).length;
      return { date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), users: count };
    });

    let cumulative = totalUsers - recentUsers.length;
    const chartData = usersOverTime.map(item => {
      cumulative += item.users;
      return { name: item.date, users: cumulative };
    });

    return { totalUsers, totalReceipts, totalGoals, usersOverTime: chartData, message: "Global platform analytics" };
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

  getAllUsers: async () => {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  deleteUser: async (userId: string) => {
    // Manually cascade delete due to lack of Prisma relation rules
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });
    await prisma.expenseItem.deleteMany({ where: { receipt: { userId } } });
    await prisma.receipt.deleteMany({ where: { userId } });
    await prisma.goal.deleteMany({ where: { userId } });
    return await prisma.user.delete({ where: { id: userId } });
  },

  getAiInsights: async (userId: string, persona: string = "Professional") => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found.");

    // Peer Benchmarking
    let peerComparisonContext = "";
    if (user.occupation) {
      const peers = await prisma.user.findMany({
        where: { occupation: user.occupation, id: { not: userId } },
        select: { monthlyIncome: true, receipts: { select: { totalAmount: true } } }
      });
      if (peers.length > 0) {
        let totalPeerSpend = 0;
        let totalPeerIncome = 0;
        let validIncomes = 0;
        peers.forEach(p => {
          if (p.monthlyIncome) { totalPeerIncome += p.monthlyIncome; validIncomes++; }
          p.receipts.forEach(r => totalPeerSpend += r.totalAmount);
        });
        const avgPeerSpend = Math.round(totalPeerSpend / peers.length);
        const avgPeerIncome = validIncomes > 0 ? Math.round(totalPeerIncome / validIncomes) : 0;
        peerComparisonContext = `\nPeer Benchmark Context: Other users in the same occupation (${user.occupation}) spend an average of ৳${avgPeerSpend} and earn an average of ৳${avgPeerIncome}. Use this to anonymously compare the user to their peers in the 'spendingInsight'.`;
      }
    }

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

    let personaInstructions = "You are a professional, helpful financial assistant.";
    if (persona === "Roast Mode") {
      personaInstructions = "You are Gordon Ramsay as a financial advisor. You are brutally honest, use British slang, insult the user (playfully) for bad spending habits like eating out too much, and are extremely aggressive about saving money. Be highly entertaining and savage.";
    } else if (persona === "Hype Beast") {
      personaInstructions = "You are an over-the-top hype beast financial coach. You use words like 'YOOO', 'LFG', 'fire', and 'W'. You hype up any savings and aggressively encourage them to get that bag.";
    }

    const settings = await prisma.systemSetting.findUnique({ where: { key: "GLOBAL_SETTINGS" } });
    const systemPrompt = settings?.systemPrompt || "You are a highly intelligent financial assistant for ReceiptIQ...";

    const prompt = `${systemPrompt}
You are a personal finance AI coach for a user in Bangladesh.
${personaInstructions}

User Profile:
- Name: ${user.name || "User"}
- Occupation: ${user.occupation || "Unknown"}
- Monthly Income: ${user.monthlyIncome ? `৳${user.monthlyIncome}` : "Not set"}
- Current Monthly Budget: ${user.monthlyBudget ? `৳${user.monthlyBudget}` : "Not set"}
- Average Monthly Spending (last 3 months): ৳${avgMonthly}
- Spending by Category: ${JSON.stringify(byCategory)}
- Has Active Goals: ${hasGoals}
${peerComparisonContext}

Generate personalized, actionable financial insights for this user using your assigned persona voice.
${!hasGoals ? "Since the user has NO financial goals yet, also suggest 2-3 concrete, realistic financial goals they should consider based on their occupation and income." : ""}

Return ONLY a strict JSON object with these exact keys:
- occupationTips (array of 3 strings: occupation-specific money tips, practical and relevant to Bangladesh context)
- suggestedBudget (number: recommended monthly budget in BDT based on income and spending; 0 if income unknown)
- budgetReasoning (string: 1-2 sentences explaining the suggested budget)
- budgetBreakdown (object: keys are categories like "Food", "Transport", "Savings", "Entertainment", values are suggested monthly amounts in BDT)
${!hasGoals ? "- suggestedGoals (array of objects with keys: title (string), targetAmount (number), timelineMonths (number), reason (string))" : "- suggestedGoals (array, empty [])"}
- spendingInsight (string: 1 sentence observation about their current spending pattern or encouragement if no data)`;

    const response = await groqJSON(prompt, "AI generated financial insights");

    return response;
  },

  getSystemInfo: async () => {
    // AILogs
    const aiLogs = await prisma.aILog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10
    });

    // API Quota
    const today = new Date();
    today.setHours(0,0,0,0);
    const quota = await prisma.aPIQuota.findUnique({
      where: { date: today }
    });

    // Settings
    let settings = await prisma.systemSetting.findUnique({
      where: { key: "GLOBAL_SETTINGS" }
    });
    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: { key: "GLOBAL_SETTINGS" }
      });
    }

    return {
      aiLogs,
      dailyQuota: quota ? quota.requestsCount : 0,
      settings
    };
  },

  updateSystemSettings: async (data: any) => {
    return await prisma.systemSetting.upsert({
      where: { key: "GLOBAL_SETTINGS" },
      update: {
        newRegistrations: data.newRegistrations,
        maintenanceMode: data.maintenanceMode,
        systemPrompt: data.systemPrompt
      },
      create: {
        key: "GLOBAL_SETTINGS",
        newRegistrations: data.newRegistrations ?? true,
        maintenanceMode: data.maintenanceMode ?? false,
        systemPrompt: data.systemPrompt ?? "You are a highly intelligent financial assistant for ReceiptIQ..."
      }
    });
  },
};
