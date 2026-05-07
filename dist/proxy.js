"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = exports.verifyToken = void 0;
exports.setupProxy = setupProxy;
const auth_1 = require("./utils/auth");
function setupProxy(app) {
    // Rate limiting placeholder - could use express-rate-limit in production
    const rateLimit = (req, res, next) => {
        // In a real application, implement actual rate limiting
        next();
    };
    // Attach rate limit to AI routes
    app.use("/api/ai", rateLimit);
}
const verifyToken = async (req, res, next) => {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: req.headers
        });
        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        req.user = session.user;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: "Unauthorized" });
    }
};
exports.verifyToken = verifyToken;
const checkRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
};
exports.checkRole = checkRole;
