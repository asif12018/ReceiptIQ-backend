import { Request, Response, NextFunction } from "express";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export const AuthController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: "Login initiated." });
  },
  logout: async (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: "Logout successful." });
  },
  getMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ success: true, user: (req as any).user });
    } catch (error) {
      next(error);
    }
  },

  // --- Custom Forget Password Flow ---

  forgetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: "Email is required" });

      // Trigger better-auth's request password reset which generates and sends the OTP
      await auth.api.requestPasswordResetEmailOTP({
        body: { email },
      });

      res.json({ success: true, message: "OTP sent to your email" });
    } catch (error: any) {
      next(error);
    }
  },

  verifyOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });

      // Manually verify OTP in database for custom verification step
      // Better-Auth stores the identifier with prefixes (e.g. email-verification-otp-test@test.com)
      // and appends retry counts to the value (e.g. 123456:0).
      const verification = await prisma.verification.findFirst({
        where: { 
          identifier: { endsWith: email }, 
          value: { startsWith: otp } 
        }
      });

      if (!verification) {
        return res.status(400).json({ success: false, message: "Invalid OTP code" });
      }

      if (verification.expiresAt && verification.expiresAt < new Date()) {
        return res.status(400).json({ success: false, message: "OTP code has expired" });
      }

      // Mark the user's email as verified since they successfully entered a valid OTP
      await prisma.user.update({
        where: { email },
        data: { emailVerified: true }
      });

      res.json({ success: true, message: "OTP verified successfully. You may now reset your password." });
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: "Email, OTP, and newPassword are required" });

      // Let better-auth handle resetting the password securely and invalidating the OTP
      await auth.api.resetPasswordEmailOTP({
        body: { email, otp, password: newPassword },
      });

      res.json({ success: true, message: "Password has been reset successfully" });
    } catch (error: any) {
      next(error);
    }
  }
};
