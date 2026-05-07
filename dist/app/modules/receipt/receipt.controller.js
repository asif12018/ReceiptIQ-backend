"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptController = void 0;
const receipt_service_1 = require("./receipt.service");
exports.ReceiptController = {
    scanReceipt: async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: "No image provided" });
            }
            const userId = req.user.id;
            const result = await receipt_service_1.ReceiptService.parseImage(req.file.buffer, req.file.mimetype, userId);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    },
    scanVoice: async (req, res, next) => {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ success: false, message: "No text provided" });
            }
            const userId = req.user.id;
            const result = await receipt_service_1.ReceiptService.parseVoice(text, userId);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    },
    scanText: async (req, res, next) => {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ success: false, message: "No text provided" });
            }
            const userId = req.user.id;
            // We reuse the parseVoice NLP logic which beautifully structures text into a receipt
            const result = await receipt_service_1.ReceiptService.parseVoice(text, userId);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
};
