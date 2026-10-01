import express from "express"
import interestController from "../controllers/interest.controller.js"
import { attachUser } from "../middlewares/auth.js"
import { validate } from "../middlewares/validate.js"
import { validateObjectId } from "../validators/shared.validator.js"
import { sendInterest } from "../validators/interest.validator.js"

const router = express.Router()

router.use(attachUser)

router.get("/sent", interestController.getSentInterests.bind(interestController))
router.get("/received", interestController.getReceivedInterests.bind(interestController))
router.get("/", (req, res, next) => {
    if (req.query.type === "sent") {
        return interestController.getSentInterests(req, res, next)
    }
    return interestController.getReceivedInterests(req, res, next)
})
router.post("/", sendInterest, validate, interestController.sendInterest.bind(interestController))
router.put("/:id/accept", validateObjectId("id"), validate, interestController.acceptInterest.bind(interestController))
router.put("/:id/decline", validateObjectId("id"), validate, interestController.declineInterest.bind(interestController))
router.put("/:id/withdraw", validateObjectId("id"), validate, interestController.withdrawInterest.bind(interestController))

export default router
