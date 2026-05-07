"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const chat_service_1 = require("./chat.service");
exports.ChatController = {
    chat: async (req, res, next) => {
        try {
            const { message } = req.body;
            if (!message) {
                return res.status(400).json({ success: false, message: "No message provided" });
            }
            const userId = req.user.id;
            const responseText = await chat_service_1.ChatService.chatWithBot(userId, message);
            res.status(200).json({ success: true, data: { reply: responseText } });
        }
        catch (error) {
            next(error);
        }
    }
};
