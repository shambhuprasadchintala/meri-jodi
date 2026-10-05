import express from "express"
import multer from "multer"
import extractionController from "../controllers/extraction.controller.js"

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// [COMMENTED OUT: AI BIODATA EXTRACTION & DOCUMENT PARSING ENDPOINTS]
// Document extraction has been disabled. All users must manually type their details.
// router.post("/extract-biodata", upload.single("file"), extractionController.extractBiodata.bind(extractionController))
// router.post("/extract", upload.single("file"), extractionController.extractBiodata.bind(extractionController))
// router.post("/upload-biodata", upload.single("file"), extractionController.extractBiodata.bind(extractionController))

router.post("/extract-biodata", extractionController.extractBiodata.bind(extractionController))
router.post("/extract", extractionController.extractBiodata.bind(extractionController))
router.post("/upload-biodata", extractionController.extractBiodata.bind(extractionController))
router.post("/generate-bio", extractionController.generateBio.bind(extractionController))
router.post("/chat-suggestions", extractionController.generateChatSuggestions.bind(extractionController))

export default router
