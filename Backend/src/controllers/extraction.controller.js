import extractionService from "../services/extraction.service.js"
import ApiResponse from "../utils/ApiResponse.js"

class ExtractionController {
    async extractBiodata(req, res) {
        const apiResponse = new ApiResponse(res)
        // [COMMENTED OUT: AI BIODATA DOCUMENT EXTRACTION]
        // Document extraction has been disabled. Users must manually type their profile details.
        return apiResponse.error("Document extraction is disabled. Please enter your profile details manually.", 400)
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
