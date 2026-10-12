import express from "express"
import photoController from "../controllers/photo.controller.js"
import { attachUser } from "../middlewares/auth.js"
import { validate } from "../middlewares/validate.js"
import { validateObjectId } from "../validators/shared.validator.js"
import { uploadPhoto, handleUploadError } from "../middlewares/upload.js"

const router = express.Router()

router.use(attachUser)

router.post("/", uploadPhoto.single("photo"), handleUploadError, photoController.uploadPhoto.bind(photoController))
router.post("/upload", uploadPhoto.single("photo"), handleUploadError, photoController.uploadPhoto.bind(photoController))
router.delete("/:photoId", validateObjectId("photoId"), validate, photoController.deletePhoto.bind(photoController))
router.put("/primary/:photoId", validateObjectId("photoId"), validate, photoController.setPrimaryPhoto.bind(photoController))

export default router
