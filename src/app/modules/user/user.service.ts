import { prisma } from "../../../app";
import { uploadToCloudinary } from "../../utils/cloudinary";

export const UserService = {
  updateProfile: async (userId: string, file?: Express.Multer.File) => {
    if (!file) throw new Error("No avatar provided");
    const avatarUrl = await uploadToCloudinary(file.buffer, file.mimetype);

    return await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl }
    });
  },

  getAdminStats: async () => {
    const totalUsers = await prisma.user.count();
    const totalReceipts = await prisma.receipt.count();
    const totalGoals = await prisma.goal.count();
    
    return {
      totalUsers,
      totalReceipts,
      totalGoals,
      message: "Global platform analytics"
    };
  },

  updateBudget: async (userId: string, budget: number) => {
    return await prisma.user.update({
      where: { id: userId },
      data: { monthlyBudget: budget }
    });
  },

  updateUserRole: async (userId: string, role: "USER" | "ADMIN") => {
    return await prisma.user.update({
      where: { id: userId },
      data: { role }
    });
  }
};
