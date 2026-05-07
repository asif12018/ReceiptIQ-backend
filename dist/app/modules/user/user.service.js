"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const app_1 = require("../../../app");
const cloudinary_1 = require("../../utils/cloudinary");
exports.UserService = {
    updateProfile: async (userId, file) => {
        if (!file)
            throw new Error("No avatar provided");
        const avatarUrl = await (0, cloudinary_1.uploadToCloudinary)(file.buffer, file.mimetype);
        return await app_1.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl }
        });
    },
    getAdminStats: async () => {
        const totalUsers = await app_1.prisma.user.count();
        const totalReceipts = await app_1.prisma.receipt.count();
        const totalGoals = await app_1.prisma.goal.count();
        return {
            totalUsers,
            totalReceipts,
            totalGoals,
            message: "Global platform analytics"
        };
    },
    updateBudget: async (userId, budget) => {
        return await app_1.prisma.user.update({
            where: { id: userId },
            data: { monthlyBudget: budget }
        });
    },
    updateUserRole: async (userId, role) => {
        return await app_1.prisma.user.update({
            where: { id: userId },
            data: { role }
        });
    }
};
