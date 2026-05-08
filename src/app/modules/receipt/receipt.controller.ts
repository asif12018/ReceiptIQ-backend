import { Request, Response, NextFunction } from "express";
import { ReceiptService } from "./receipt.service";

export const ReceiptController = {
  scanReceipt: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image provided" });
      }
      const userId = (req as any).user.id;
      const result = await ReceiptService.parseImage(req.file.buffer, req.file.mimetype, userId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  scanVoice: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, message: "No text provided" });
      }
      const userId = (req as any).user.id;
      const result = await ReceiptService.parseVoice(text, userId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  scanText: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, message: "No text provided" });
      }
      const userId = (req as any).user.id;
      const result = await ReceiptService.parseVoice(text, userId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  getMyReceipts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const result = await ReceiptService.getMyReceipts(userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};

