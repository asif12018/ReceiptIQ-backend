import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";

const app: Application = express();

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
app.all("/api/v1/auth/*path", toNodeHandler(auth));

// Global Error Handler
app.use(globalErrorHandler);

export default app;
