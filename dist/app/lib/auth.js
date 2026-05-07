"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const email_1 = require("../utils/email");
const prisma_1 = require("better-auth/adapters/prisma");
const prisma_2 = require("./prisma");
const plugins_1 = require("better-auth/plugins");
const config_1 = __importDefault(require("../config"));
exports.auth = (0, better_auth_1.betterAuth)({
    baseURL: config_1.default.BETTER_AUTH_URL,
    basePath: "/api/v1/auth",
    secret: config_1.default.BETTER_AUTH_SECRET,
    database: (0, prisma_1.prismaAdapter)(prisma_2.prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    //social provider || login with social media
    socialProviders: {
        google: {
            clientId: config_1.default.GOOGLE_CLIENT_ID,
            clientSecret: config_1.default.GOOGLE_CLIENT_SECRET,
            redirectURI: `${config_1.default.BETTER_AUTH_URL}/api/v1/auth/callback/google`,
            mapProfileToUser: () => {
                return {
                    role: "USER",
                    gender: "MALE",
                    emailVerified: true,
                };
            },
        },
    },
    // email verificaiton
    emailVerification: {
        sendOnSignUp: true,
        // sendOnSignIn: true,
        autoSignInAfterVerification: true,
    },
    //addictional fields for user
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "USER",
            },
            gender: {
                type: "string",
                required: true,
                defaultValue: "MALE",
            },
            banned: {
                type: "boolean",
                required: false,
                defaultValue: false,
            },
            banReason: {
                type: "string",
                required: false,
            },
            banExpires: {
                type: "date",
                required: false,
            },
        },
    },
    plugins: [
        (0, plugins_1.bearer)(),
        //plugins to send email for email verificaiton
        (0, plugins_1.emailOTP)({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp, type }) {
                //checking the type of email verification
                if (type === "email-verification") {
                    const user = await prisma_2.prisma.user.findFirst({
                        where: {
                            email,
                        },
                    });
                    if (!user) {
                        console.error("User not found for email: ", email);
                        return;
                    }
                    if (user && user.role === "ADMIN") {
                        console.log(`User with this email ${email} is admin, so not sending email`);
                        return;
                    }
                    //checking is it the first super admin on server
                    // const isItFirstSuperAdmin = await prisma.admin.count() === 1;
                    //checking if the user exist and not verified
                    if (user &&
                        // @ts-ignore
                        !user.emailVerified
                    //  || isItFirstSuperAdmin
                    // || user?.role !== Role.SUPER_ADMIN
                    ) {
                        await (0, email_1.sendEmail)({
                            to: email,
                            subject: "Verify Your email",
                            templateName: "otp",
                            templateData: {
                                name: user.name,
                                otp,
                            },
                        });
                    }
                }
                else if (type === "forget-password") {
                    const user = await prisma_2.prisma.user.findFirst({
                        where: {
                            email,
                        },
                    });
                    if (user) {
                        await (0, email_1.sendEmail)({
                            to: email,
                            subject: "Password Reset OTP",
                            templateName: "otp",
                            templateData: {
                                name: user.name,
                                otp,
                            },
                        });
                    }
                }
            },
            expiresIn: 2 * 60, // valid for 2mins
            otpLength: 6, // otp will be 6 digits long
        }),
    ],
    session: {
        expiresIn: 60 * 60 * 60 * 24, // 1day in seconds
        updateAge: 60 * 60 * 60 * 24, // 1day in seconds
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 60 * 24, // 1day in seconds
        },
    },
    // redirectURLs:{
    //   signIn: `${process.env.BETTER_AUTH_URL}/api/v1/auth/google/success`
    // },
    trustedOrigins: [
        process.env.BETTER_AUTH_URL || "http://localhost:5000",
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:3000",
    ],
    advanced: {
        disableCSRFCheck: true,
        useSecureCookies: true,
        crossSubdomainCookies: {
            enabled: false,
        },
        cookies: {
            state: {
                attributes: {
                    sameSite: "lax", // ← Changed from 'none' to 'lax' (same domain redirect)
                    secure: true,
                    httpOnly: true,
                    path: "/",
                },
            },
            sessionToken: {
                attributes: {
                    sameSite: "none", // ← Keep 'none' so frontend can read it cross-domain
                    secure: true,
                    httpOnly: true,
                    path: "/",
                },
            },
        },
    },
});
