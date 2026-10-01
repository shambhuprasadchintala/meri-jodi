import express from "express"
import matchingController from "../controllers/matching.controller.js"
import { attachUser } from "../middlewares/auth.js"

const router = express.Router()

router.use(attachUser)

router.get("/recommendations", matchingController.getMyMatches.bind(matchingController))
router.get("/matches", matchingController.getMyMatches.bind(matchingController))
router.get("/daily", matchingController.getMyMatches.bind(matchingController))
router.get("/", matchingController.getMyMatches.bind(matchingController))

export default router
