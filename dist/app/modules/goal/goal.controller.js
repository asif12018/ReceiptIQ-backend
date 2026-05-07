"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalController = void 0;
const goal_service_1 = require("./goal.service");
exports.GoalController = {
    createGoal: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const result = await goal_service_1.GoalService.createGoal(userId, req.body);
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    },
    addSavings: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { goalId, amount } = req.body;
            const result = await goal_service_1.GoalService.addSavings(userId, goalId, amount);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    },
    getAiAdvice: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const goalId = req.params.id;
            const result = await goal_service_1.GoalService.getAiAdvice(userId, goalId);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
};
