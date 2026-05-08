import { prisma } from "../../../app";
import { uploadToCloudinary } from "../../utils/cloudinary";

export const UserService = {
  updateProfile: async (userId: string, file?: Express.Multer.File, data?: any) => {
    let updateData: any = { ...data };

    if (file) {
      const avatarUrl = await uploadToCloudinary(file.buffer, file.mimetype);
      updateData.avatarUrl = avatarUrl;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No data provided to update");
    }

    return await prisma.user.update({
      where: { id: userId },
      data: updateData
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
