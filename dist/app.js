"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
const globalErrorHandler_1 = require("./app/middlewares/globalErrorHandler");
const routes_1 = __importDefault(require("./app/routes"));
const node_1 = require("better-auth/node");
const auth_1 = require("./app/lib/auth");
const app = (0, express_1.default)();
const corsOptions = {
    origin: [
        process.env.BETTER_AUTH_URL,
        process.env.FRONTEND_URL,
        "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Root Route
app.get("/", (req, res) => {
    res.send("ReceiptIQ Backend is running!");
});
// Global Router
app.use("/api/v1", routes_1.default);
// Custom Interceptor: Better-Auth hides "User already exists" by default for security (Enumeration Protection)
// since you have `requireEmailVerification` turned on. 
// This middleware explicitly throws the error you want before Better-Auth handles the request.
app.post("/api/v1/auth/sign-up/email", async (req, res, next) => {
    const { email } = req.body;
    if (email) {
        const existingUser = await exports.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }
    }
    next();
});
// Better-Auth handler (Catch-all for better-auth native routes)
app.all("/api/v1/auth/*path", (0, node_1.toNodeHandler)(auth_1.auth));
// Global Error Handler
app.use(globalErrorHandler_1.globalErrorHandler);
exports.default = app;
