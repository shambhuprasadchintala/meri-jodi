import BaseController from "./base.controller.js"
import blockService from "../services/block.service.js"
import profileService from "../services/profile.service.js"

class BlockController extends BaseController {
    async blockUser(req, res, next) {
        try {
            let profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                profile = await profileService.create(req.user._id, { name: req.user.name })
            }

            const targetId = req.body.profileId || req.body.blockedProfileId
            await blockService.block(
                profile._id.toString(),
                targetId
            )

            return this.sendSuccess(res, null, "User blocked")
        } catch (error) {
            if (error.message === "Cannot block yourself") {
                return this.sendError(res, error.message, 400)
            }
            if (error.message === "User already blocked") {
                return this.sendError(res, error.message, 409)
            }
            next(error)
        }
    }

    async unblockUser(req, res, next) {
        try {
            let profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                profile = await profileService.create(req.user._id, { name: req.user.name })
            }

            await blockService.unblock(
                profile._id.toString(),
                req.params.profileId
            )

            return this.sendSuccess(res, null, "User unblocked")
        } catch (error) {
            next(error)
        }
    }

    async getBlocked(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendSuccess(res, [], "Blocked users retrieved")
            }

            const blocked = await blockService.getBlocked(
                profile._id.toString()
            )
            return this.sendSuccess(
                res,
                blocked,
                "Blocked users retrieved"
            )
        } catch (error) {
            next(error)
        }
    }
}

export default new BlockController()
