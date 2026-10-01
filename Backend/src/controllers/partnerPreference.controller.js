import BaseController from "./base.controller.js"
import partnerPreferenceService from "../services/partnerPreference.service.js"
import profileService from "../services/profile.service.js"

class PartnerPreferenceController extends BaseController {
    async getMyPreferences(req, res, next) {
        try {
            let profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                profile = await profileService.create(req.user._id, { name: req.user.name })
            }

            const preferences = await partnerPreferenceService.getByProfileId(
                profile._id
            )
            return this.sendSuccess(
                res,
                preferences || {},
                "Preferences retrieved"
            )
        } catch (error) {
            next(error)
        }
    }

    async updatePreferences(req, res, next) {
        try {
            let profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                profile = await profileService.create(req.user._id, { name: req.user.name })
            }

            const preferences = await partnerPreferenceService.createOrUpdate(
                profile._id,
                req.body
            )
            return this.sendSuccess(
                res,
                preferences,
                "Preferences updated"
            )
        } catch (error) {
            next(error)
        }
    }

    async deletePreferences(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendError(res, "Profile not found", 404)
            }

            await partnerPreferenceService.delete(profile._id)
            return this.sendSuccess(res, null, "Preferences deleted")
        } catch (error) {
            next(error)
        }
    }
}

export default new PartnerPreferenceController()
