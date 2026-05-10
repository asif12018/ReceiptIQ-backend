"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const app_1 = require("../../../app");
const cloudinary_1 = require("../../utils/cloudinary");
const gemini_1 = require("../../utils/gemini");
exports.UserService = {
    getMe: async (userId) => {
        return await app_1.prisma.user.findUnique({
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
    suggestBudget: async (userId) => {
        const user = await app_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.monthlyIncome)
            throw new Error("Set your monthly income first.");
        // Last 3 months of receipts for spending pattern
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const receipts = await app_1.prisma.receipt.findMany({
            where: { userId, createdAt: { gte: threeMonthsAgo } },
        });
        const totalSpent = receipts.reduce((s, r) => s + r.totalAmount, 0);
        const avgMonthly = totalSpent / 3;
        // Category breakdown
        const byCategory = {};
        receipts.forEach((r) => {
            const cat = r.category || "General";
            byCategory[cat] = (byCategory[cat] || 0) + r.totalAmount;
        });
        const goals = await app_1.prisma.goal.findMany({ where: { userId, status: "IN_PROGRESS" } });
        const model = gemini_1.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    },
    updateProfile: async (userId, file, data) => {
        let updateData = { ...data };
        if (file) {
            const avatarUrl = await (0, cloudinary_1.uploadToCloudinary)(file.buffer, file.mimetype);
            updateData.avatarUrl = avatarUrl;
        }
        if (Object.keys(updateData).length === 0) {
            return await app_1.prisma.user.findUnique({ where: { id: userId } });
        }
        return await app_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
    },
    getAdminStats: async () => {
        const totalUsers = await app_1.prisma.user.count();
        const totalReceipts = await app_1.prisma.receipt.count();
        const totalGoals = await app_1.prisma.goal.count();
        return { totalUsers, totalReceipts, totalGoals, message: "Global platform analytics" };
    },
    updateBudget: async (userId, budget) => {
        return await app_1.prisma.user.update({
            where: { id: userId },
            data: { monthlyBudget: budget },
        });
    },
    updateUserRole: async (userId, role) => {
        return await app_1.prisma.user.update({
            where: { id: userId },
            data: { role },
        });
    },
};
