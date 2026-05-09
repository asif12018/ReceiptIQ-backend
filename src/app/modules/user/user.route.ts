import { Router } from "express";
import multer from "multer";

import { authGuard, validateRole } from "../../middlewares/authGuard";
import { UserController } from "./user.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/me", authGuard, UserController.getMe);
router.post("/suggest-budget", authGuard, UserController.suggestBudget);
router.patch("/update-profile", authGuard, upload.single("avatar"), UserController.updateProfile);
router.get("/admin/stats", authGuard, validateRole("ADMIN"), UserController.getAdminStats);
router.patch("/admin/role", authGuard, validateRole("ADMIN"), UserController.updateUserRole);

export const UserRoutes = router;
