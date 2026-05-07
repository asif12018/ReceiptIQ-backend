import { Request, Response, NextFunction } from "express";
import { ChatService } from "./chat.service";

export const ChatController = {
  chat: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, message: "No message provided" });
      }
      const userId = (req as any).user.id;
      const responseText = await ChatService.chatWithBot(userId, message);
      res.status(200).json({ success: true, data: { reply: responseText } });
    } catch (error) {
      next(error);
    }
  }
};
