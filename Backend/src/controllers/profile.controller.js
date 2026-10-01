import BaseController from "./base.controller.js"
import profileService from "../services/profile.service.js"
import blockService from "../services/block.service.js"

class ProfileController extends BaseController {
    async getMyProfile(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendError(res, "Profile not found", 404)
            }
            return this.sendSuccess(res, profile, "Profile retrieved")
        } catch (error) {
            next(error)
        }
    }

    async getProfileById(req, res, next) {
        try {
            const profile = await profileService.getById(req.params.id)
            if (!profile) {
                return this.sendError(res, "Profile not found", 404)
            }

            // Check if blocked
            const myProfile = await profileService.getByUserId(req.user._id)
            if (myProfile) {
                const isBlocked = await blockService.isEitherBlocked(
                    myProfile._id.toString(),
                    profile._id.toString()
                )
                if (isBlocked) {
                    return this.sendError(res, "Profile not found", 404)
                }
            }

            // Record profile view asynchronously
            profileService.recordView(req.user._id, profile._id.toString()).catch(() => {})

            return this.sendSuccess(res, profile, "Profile retrieved")
        } catch (error) {
            next(error)
        }
    }

    async getProfileByUserId(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.params.userId)
            if (!profile) {
                return this.sendError(res, "Profile not found", 404)
            }
            return this.sendSuccess(res, profile, "Profile retrieved")
        } catch (error) {
            next(error)
        }
    }

    async getWhoViewedMe(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 10
            const viewers = await profileService.getWhoViewedMe(req.user._id, limit)
            return this.sendSuccess(res, viewers, "Viewers retrieved")
        } catch (error) {
            next(error)
        }
    }

    async createProfile(req, res, next) {
        try {
            const existing = await profileService.getByUserId(req.user._id)
            if (existing) {
                const profile = await profileService.update(req.user._id, req.body)
                return this.sendSuccess(res, profile, "Profile updated", 200)
            }
            const profile = await profileService.create(req.user._id, req.body)
            return this.sendSuccess(res, profile, "Profile created", 201)
        } catch (error) {
            next(error)
        }
    }

    async updateProfile(req, res, next) {
        try {
            const profile = await profileService.update(req.user._id, req.body)
            if (!profile) {
                return this.sendError(res, "Profile not found", 404)
            }
            return this.sendSuccess(res, profile, "Profile updated")
        } catch (error) {
            next(error)
        }
    }

    async searchProfiles(req, res, next) {
        try {
            const result = await profileService.search(req.query, {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                excludeUserId: req.user._id,
            })
            return this.sendSuccess(res, result, "Profiles found")
        } catch (error) {
            next(error)
        }
    }
}

export default new ProfileController()
