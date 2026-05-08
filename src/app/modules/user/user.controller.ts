import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service";


export const UserController = {
  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const file = req.file;
      const data = req.body.data ? JSON.parse(req.body.data) : req.body;
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
  }
};
