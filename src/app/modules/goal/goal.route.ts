import { Router } from "express";
import { GoalController } from "./goal.controller";
import { authGuard } from "../../middlewares/authGuard";

const router = Router();

router.get("/", authGuard, GoalController.getGoals);
router.post("/create", authGuard, GoalController.createGoal);
router.patch("/add-savings", authGuard, GoalController.addSavings);
router.get("/:id/ai-advice", authGuard, GoalController.getAiAdvice);

export const GoalRoutes = router;
