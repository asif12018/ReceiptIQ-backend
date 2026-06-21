import { sendEmail } from "../utils/email";
import { prisma } from "./prisma";
import config from "../config";

let authInstance: any = null;

const dynamicImport = async (packageName: string) => {
  return new Function('modulePath', 'return import(modulePath)')(packageName);
};

// Dummy requires for Vercel's bundler (@vercel/nft) to correctly trace ESM dependencies.
// Since these are ESM-only packages, we use dynamic import at runtime, 
// but Vercel's static analysis needs to see them to include them in the deployment.
if (false) {
  // @ts-ignore
  require("better-auth");
  // @ts-ignore
  require("better-auth/adapters/prisma");
  // @ts-ignore
  require("better-auth/plugins");
}

export const getAuth = async () => {
  if (authInstance) return authInstance;

  const { betterAuth } = await dynamicImport("better-auth");
  const { prismaAdapter } = await dynamicImport("better-auth/adapters/prisma");
  const { bearer, emailOTP } = await dynamicImport("better-auth/plugins");

  authInstance = betterAuth({
  baseURL: config.BETTER_AUTH_URL?.endsWith('/') ? config.BETTER_AUTH_URL.slice(0, -1) : config.BETTER_AUTH_URL,
  basePath: "/api/v1/auth",
  secret: config.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  //social provider || login with social media
  socialProviders: {
    google: {
      clientId: config.GOOGLE_CLIENT_ID as string,
      clientSecret: config.GOOGLE_CLIENT_SECRET as string,
      redirectURI: `${config.BETTER_AUTH_URL}/api/v1/auth/callback/google`,
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
      occupation: {
        type: "string",
        required: false,
      },
      monthlyIncome: {
        type: "number",
        required: false,
      },
      monthlyBudget: {
        type: "number",
        required: false,
      },
    },
  },
  plugins: [
    bearer(),
    //plugins to send email for email verificaiton
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        //checking the type of email verification
        if (type === "email-verification") {
          const user = await prisma.user.findFirst({
            where: {
              email,
            },
          });

          if (!user) {
            console.error("User not found for email: ", email);
            return;
          }
          if (user && user.role === "ADMIN") {
            console.log(
              `User with this email ${email} is admin, so not sending email`,
            );
            return;
          }
          //checking is it the first super admin on server
          // const isItFirstSuperAdmin = await prisma.admin.count() === 1;
          //checking if the user exist and not verified
          if (
            user &&
            // @ts-ignore
            !user.emailVerified
            //  || isItFirstSuperAdmin
            // || user?.role !== Role.SUPER_ADMIN
          ) {
            await sendEmail({
              to: email,
              subject: "Verify Your email",
              templateName: "otp",
              templateData: {
                name: user.name,
                otp,
              },
            });
          }
        } else if (type === "forget-password") {
          const user = await prisma.user.findFirst({
            where: {
              email,
            },
          });
          if (user) {
            await sendEmail({
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
    "https://receipt-iq-frontend.vercel.app",
    "https://receipt-iq-backend.vercel.app"
  ].filter(Boolean),
  advanced: {
    disableCSRFCheck: true,
    useSecureCookies: true,
    crossSubdomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
  },
});

  return authInstance;
};
