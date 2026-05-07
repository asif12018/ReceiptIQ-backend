"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoutes = void 0;
const express_1 = require("express");
const chat_controller_1 = require("./chat.controller");
const authGuard_1 = require("../../middlewares/authGuard");
const router = (0, express_1.Router)();
router.post("/", authGuard_1.authGuard, chat_controller_1.ChatController.chat);
exports.ChatRoutes = router;
