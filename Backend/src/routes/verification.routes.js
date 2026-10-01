import express from "express"
import verificationController from "../controllers/verification.controller.js"
import { attachUser, requireAdmin } from "../middlewares/auth.js"
import { validate } from "../middlewares/validate.js"
import { validateObjectId } from "../validators/shared.validator.js"
import { submitDocument, reviewVerification } from "../validators/verification.validator.js"

const router = express.Router()

router.use(attachUser)

router.get("/me", verificationController.getMyVerification.bind(verificationController))
router.get("/my", verificationController.getMyVerification.bind(verificationController))
router.get("/status", verificationController.getMyVerification.bind(verificationController))
router.post("/", ...submitDocument, validate, verificationController.submitDocument.bind(verificationController))
router.get("/", requireAdmin, verificationController.getVerifications.bind(verificationController))
router.put("/:id/review", requireAdmin, validateObjectId("id"), ...reviewVerification, validate, verificationController.reviewVerification.bind(verificationController))

export default router
