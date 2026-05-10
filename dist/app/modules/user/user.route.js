"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authGuard_1 = require("../../middlewares/authGuard");
const user_controller_1 = require("./user.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.get("/me", authGuard_1.authGuard, user_controller_1.UserController.getMe);
router.post("/suggest-budget", authGuard_1.authGuard, user_controller_1.UserController.suggestBudget);
router.patch("/update-profile", authGuard_1.authGuard, upload.single("avatar"), user_controller_1.UserController.updateProfile);
router.get("/admin/stats", authGuard_1.authGuard, (0, authGuard_1.validateRole)("ADMIN"), user_controller_1.UserController.getAdminStats);
router.patch("/admin/role", authGuard_1.authGuard, (0, authGuard_1.validateRole)("ADMIN"), user_controller_1.UserController.updateUserRole);
exports.UserRoutes = router;
