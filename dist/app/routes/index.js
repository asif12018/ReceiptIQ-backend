"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = require("../modules/auth/auth.route");
const receipt_route_1 = require("../modules/receipt/receipt.route");
const goal_route_1 = require("../modules/goal/goal.route");
const user_route_1 = require("../modules/user/user.route");
const chat_route_1 = require("../modules/chat/chat.route");
const router = (0, express_1.Router)();
const moduleRoutes = [
    { path: "/auth", route: auth_route_1.AuthRoutes },
    { path: "/receipts", route: receipt_route_1.ReceiptRoutes },
    { path: "/goals", route: goal_route_1.GoalRoutes },
    { path: "/users", route: user_route_1.UserRoutes },
    { path: "/chat", route: chat_route_1.ChatRoutes },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
