"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_1 = require("../../lib/auth");
const prisma_1 = require("../../lib/prisma");
exports.AuthController = {
    login: async (req, res, next) => {
        res.json({ message: "Login initiated." });
    },
    logout: async (req, res, next) => {
        res.json({ message: "Logout successful." });
    },
    getMe: async (req, res, next) => {
        try {
            res.json({ success: true, user: req.user });
        }
        catch (error) {
            next(error);
        }
    },
    // --- Custom Forget Password Flow ---
    forgetPassword: async (req, res, next) => {
        try {
            const { email } = req.body;
            if (!email)
                return res.status(400).json({ success: false, message: "Email is required" });
            // Trigger better-auth's request password reset which generates and sends the OTP
            await auth_1.auth.api.requestPasswordResetEmailOTP({
                body: { email },
            });
            res.json({ success: true, message: "OTP sent to your email" });
        }
        catch (error) {
            next(error);
        }
    },
    verifyOtp: async (req, res, next) => {
        try {
            const { email, otp } = req.body;
            if (!email || !otp)
                return res.status(400).json({ success: false, message: "Email and OTP are required" });
            // Manually verify OTP in database for custom verification step
            const verification = await prisma_1.prisma.verification.findFirst({
                where: { identifier: email, value: otp }
            });
            if (!verification) {
                return res.status(400).json({ success: false, message: "Invalid OTP code" });
            }
            if (verification.expiresAt && verification.expiresAt < new Date()) {
                return res.status(400).json({ success: false, message: "OTP code has expired" });
            }
            res.json({ success: true, message: "OTP verified successfully. You may now reset your password." });
        }
        catch (error) {
            next(error);
        }
    },
    resetPassword: async (req, res, next) => {
        try {
            const { email, otp, newPassword } = req.body;
            if (!email || !otp || !newPassword)
                return res.status(400).json({ success: false, message: "Email, OTP, and newPassword are required" });
            // Let better-auth handle resetting the password securely and invalidating the OTP
            await auth_1.auth.api.resetPasswordEmailOTP({
                body: { email, otp, password: newPassword },
            });
            res.json({ success: true, message: "Password has been reset successfully" });
        }
        catch (error) {
            next(error);
        }
    }
};
