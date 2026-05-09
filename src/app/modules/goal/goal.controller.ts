import { Request, Response, NextFunction } from "express";
import { GoalService } from "./goal.service";

export const GoalController = {
  getGoals: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const result = await GoalService.getGoals(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
  createGoal: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const result = await GoalService.createGoal(userId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
  addSavings: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { goalId, amount } = req.body;
      const result = await GoalService.addSavings(userId, goalId, amount);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
  getAiAdvice: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const goalId = req.params.id as string;
      const result = await GoalService.getAiAdvice(userId, goalId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
};
