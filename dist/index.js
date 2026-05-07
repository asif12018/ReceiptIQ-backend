"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const proxy_1 = require("./proxy");
const controllers_1 = __importDefault(require("./controllers"));
const node_1 = require("better-auth/node");
const auth_1 = require("./utils/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Better-auth handler
app.all("/api/auth/*", (0, node_1.toNodeHandler)(auth_1.auth));
// Proxy setup (rate limiter, etc.)
(0, proxy_1.setupProxy)(app);
// API router
app.use("/api", controllers_1.default);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
