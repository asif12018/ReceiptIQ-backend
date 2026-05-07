"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRole = exports.authGuard = void 0;
const auth_1 = require("../lib/auth");
const authGuard = async (req, res, next) => {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: req.headers
        });
        if (!session) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        req.user = session.user;
        next();
    }
    catch (error) {
        return res.status(401).json({ success: false, message: "Unauthorized", error });
    }
};
exports.authGuard = authGuard;
const validateRole = (role) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || user.role !== role) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        next();
    };
};
exports.validateRole = validateRole;
