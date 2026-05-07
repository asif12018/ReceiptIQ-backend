"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authGuard_1 = require("../../middlewares/authGuard");
const receipt_controller_1 = require("./receipt.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post("/scan", authGuard_1.authGuard, upload.single("image"), receipt_controller_1.ReceiptController.scanReceipt);
router.post("/voice", authGuard_1.authGuard, receipt_controller_1.ReceiptController.scanVoice);
router.post("/text", authGuard_1.authGuard, receipt_controller_1.ReceiptController.scanText);
exports.ReceiptRoutes = router;
