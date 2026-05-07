"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("./user.service");
exports.UserController = {
    updateProfile: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const file = req.file;
            const result = await user_service_1.UserService.updateProfile(userId, file);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    },
    getAdminStats: async (req, res, next) => {
        try {
            const result = await user_service_1.UserService.getAdminStats();
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    },
    updateUserRole: async (req, res, next) => {
        try {
            const { targetUserId, role } = req.body;
            if (!targetUserId || !role) {
                return res.status(400).json({ success: false, message: "Target user ID and role are required." });
            }
            const result = await user_service_1.UserService.updateUserRole(targetUserId, role);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
};
