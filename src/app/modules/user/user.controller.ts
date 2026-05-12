import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service";

export const UserController = {
  getMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const result = await UserService.getMe(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  suggestBudget: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const result = await UserService.suggestBudget(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const file = req.file;

      // FormData sends everything as strings — parse numbers explicitly
      const raw = req.body;
      const data: any = {};
      if (raw.name)          data.name          = raw.name;
      if (raw.occupation)    data.occupation    = raw.occupation;
      if (raw.monthlyIncome) data.monthlyIncome = parseFloat(raw.monthlyIncome);
      if (raw.monthlyBudget) data.monthlyBudget = parseFloat(raw.monthlyBudget);

      const result = await UserService.updateProfile(userId, file, data);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  getAdminStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await UserService.getAdminStats();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  updateUserRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetUserId, role } = req.body;
      if (!targetUserId || !role) {
        return res.status(400).json({ success: false, message: "Target user ID and role are required." });
      }
      const result = await UserService.updateUserRole(targetUserId, role);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  getAllUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await UserService.getAllUsers();
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await UserService.deleteUser(id);
      res.status(200).json({ success: true, data: result, message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  },

  getAiInsights: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const result = await UserService.getAiInsights(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
