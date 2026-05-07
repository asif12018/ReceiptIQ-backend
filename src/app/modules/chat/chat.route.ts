import { Router } from "express";
import { ChatController } from "./chat.controller";
import { authGuard } from "../../middlewares/authGuard";

const router = Router();

router.post("/", authGuard, ChatController.chat);

export const ChatRoutes = router;
