import express from "express"
import profileController from "../controllers/profile.controller.js"
import { attachUser } from "../middlewares/auth.js"
import { validate } from "../middlewares/validate.js"
import { validateObjectId } from "../validators/shared.validator.js"
import {
    createProfile,
    updateProfile,
    searchProfiles,
} from "../validators/profile.validator.js"

const router = express.Router()

router.use(attachUser)

router.get("/me", profileController.getMyProfile.bind(profileController))
router.get("/who-viewed-me", profileController.getWhoViewedMe.bind(profileController))
router.get("/search", searchProfiles, validate, profileController.searchProfiles.bind(profileController))
router.get("/user/:userId", validateObjectId("userId"), validate, profileController.getProfileByUserId.bind(profileController))
router.get("/:id", validateObjectId("id"), validate, profileController.getProfileById.bind(profileController))
router.post("/", createProfile, validate, profileController.createProfile.bind(profileController))
router.put("/me", updateProfile, validate, profileController.updateProfile.bind(profileController))
router.put("/", updateProfile, validate, profileController.updateProfile.bind(profileController))

export default router
