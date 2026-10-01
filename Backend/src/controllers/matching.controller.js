import BaseController from "./base.controller.js"
import matchingService from "../services/matching.service.js"
import profileService from "../services/profile.service.js"

class MatchingController extends BaseController {
    async getMyMatches(req, res, next) {
        try {
            let profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                profile = await profileService.create(req.user._id, { name: req.user.name })
            }

            const result = await matchingService.findMatches(
                profile._id.toString(),
                {
                    page: parseInt(req.query.page) || 1,
                    limit: parseInt(req.query.limit) || 20,
                }
            )

            return this.sendSuccess(res, result, "Matches found")
        } catch (error) {
            next(error)
        }
    }
}

export default new MatchingController()
