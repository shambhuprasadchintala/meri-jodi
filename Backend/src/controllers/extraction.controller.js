import extractionService from "../services/extraction.service.js"
import ApiResponse from "../utils/ApiResponse.js"

class ExtractionController {
    async extractBiodata(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            if (!req.file && !req.body?.text) {
                return apiResponse.error("No file uploaded.", 400)
            }

            let data
            if (req.file) {
                data = await extractionService.extractBiodata(req.file.buffer, req.file.mimetype)
            } else {
                data = await extractionService.extractBiodata(Buffer.from(req.body.text, "utf-8"), "text/plain")
            }
            return apiResponse.success(data, "Biodata extracted successfully")
        } catch (error) {
            console.error("Extraction error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    async generateBio(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const bio = await extractionService.generateBio(req.body)
            return apiResponse.success({ bio }, "Bio generated successfully")
        } catch (error) {
            console.error("Bio generation error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    async generateChatSuggestions(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const { partnerDetails, lastMessage, category } = req.body
            const suggestions = await extractionService.generateChatSuggestions(
                partnerDetails || {},
                lastMessage || "",
                category || "icebreaker"
            )
            return apiResponse.success({ suggestions }, "Chat suggestions generated successfully")
        } catch (error) {
            console.error("Chat suggestion generation error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }
}

export default new ExtractionController()
