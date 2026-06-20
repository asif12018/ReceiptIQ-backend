import { Request, Response, NextFunction } from "express";
import { getAuth } from "../lib/auth";

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: req.headers as any
    });
    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    (req as any).user = session.user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized", error });
  }
};

export const validateRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};
