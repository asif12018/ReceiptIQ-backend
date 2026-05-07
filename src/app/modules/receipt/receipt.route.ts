import { Router } from "express";
import multer from "multer";

import { authGuard } from "../../middlewares/authGuard";
import { ReceiptController } from "./receipt.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/scan", authGuard, upload.single("image"), ReceiptController.scanReceipt);
router.post("/voice", authGuard, ReceiptController.scanVoice);
router.post("/text", authGuard, ReceiptController.scanText);

export const ReceiptRoutes = router;
