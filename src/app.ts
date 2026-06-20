import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";
import { getAuth } from "./app/lib/auth";
import rateLimit from "express-rate-limit";
import { logger } from "./app/utils/logger";

const app: Application = express();

const dynamicImport = async (packageName: string) => {
  return new Function('modulePath', 'return import(modulePath)')(packageName);
};

const corsOptions = {
  origin: [
    process.env.BETTER_AUTH_URL,
    process.env.FRONTEND_URL,
    "http://localhost:3000",
  ] as string[],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: "Too many requests, please try again later." }
});
app.use(limiter);

// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Root Route
app.get("/", (req, res) => {
  res.send("ReceiptIQ Backend is running!");
});

// Global Router
app.use("/api/v1", router);

// Custom Interceptor: Better-Auth hides "User already exists" by default for security (Enumeration Protection)
// since you have `requireEmailVerification` turned on. 
// This middleware explicitly throws the error you want before Better-Auth handles the request.
app.post("/api/v1/auth/sign-up/email", async (req, res, next) => {
  const settings = await prisma.systemSetting.findUnique({ where: { key: "GLOBAL_SETTINGS" } });
  if (settings && !settings.newRegistrations) {
    return res.status(403).json({ success: false, message: "New registrations are currently disabled by the administrator." });
  }

  const { email } = req.body;
  if (email) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }
  }
  next();
});

// Better-Auth handler (Catch-all for better-auth native routes)
app.all("/api/v1/auth/*path", async (req, res, next) => {
  const auth = await getAuth();
  const { toNodeHandler } = await dynamicImport("better-auth/node");
  return toNodeHandler(auth)(req, res, next as any);
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
