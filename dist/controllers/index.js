"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const proxy_1 = require("../proxy");
const multer_1 = __importDefault(require("multer"));
const ai_vision_1 = require("../services/ai.vision");
const ai_voice_1 = require("../services/ai.voice");
const ai_coach_1 = require("../services/ai.coach");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const prisma = new client_1.PrismaClient();
// Test route
router.get("/health", (req, res) => {
    res.json({ status: "OK" });
});
// AI Vision: Multimodal Receipt Scanner
router.post("/ai/vision/receipt", proxy_1.verifyToken, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image provided" });
        }
        const result = await (0, ai_vision_1.parseReceipt)(req.file.buffer, req.file.mimetype);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// AI Voice: Multilingual Voice Logging
router.post("/ai/voice/log", proxy_1.verifyToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: "No text provided" });
        }
        const result = await (0, ai_voice_1.parseVoiceLog)(text);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// AI Coach: Proactive Goal Coach & Budgeting
router.get("/ai/coach/insights", proxy_1.verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const insights = await (0, ai_coach_1.analyzeGoals)(userId);
        res.json(insights);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Admin Route example
router.get("/admin/logs", proxy_1.verifyToken, (0, proxy_1.checkRole)(["ADMIN"]), async (req, res) => {
    try {
        // Return some platform logs
        res.json({ logs: "Admin view of platform logs" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
