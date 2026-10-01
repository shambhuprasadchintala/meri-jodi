import BaseController from "./base.controller.js"
import verificationService from "../services/verification.service.js"
import profileService from "../services/profile.service.js"

class VerificationController extends BaseController {
    async submitDocument(req, res, next) {
        try {
            let profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                profile = await profileService.create(req.user._id, { name: req.user.name })
            }

            const verification = await verificationService.submit(
                profile._id.toString(),
                req.body.documentType,
                req.body.documentUrl
            )

            return this.sendSuccess(
                res,
                verification,
                "Verification document submitted",
                201
            )
        } catch (error) {
            if (
                error.message ===
                "You already have a pending verification request"
            ) {
                return this.sendError(res, error.message, 409)
            }
            next(error)
        }
    }

    async getMyVerification(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendSuccess(res, null, "No verification found")
            }
            const verification = await verificationService.getByProfileId(profile._id.toString())
            return this.sendSuccess(res, verification, "Verification status retrieved")
        } catch (error) {
            next(error)
        }
    }

    async getVerifications(req, res, next) {
        try {
            const result = await verificationService.getAll({
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
                status: req.query.status,
            })
            return this.sendSuccess(
                res,
                result,
                "Verifications retrieved"
            )
        } catch (error) {
            next(error)
        }
    }

    async reviewVerification(req, res, next) {
        try {
            const verification = await verificationService.review(
                req.params.id,
                req.body.status,
                req.body.reviewNote
            )
            if (!verification) {
                return this.sendError(
                    res,
                    "Verification not found",
                    404
                )
            }
            return this.sendSuccess(
                res,
                verification,
                "Verification reviewed"
            )
        } catch (error) {
            next(error)
        }
    }
}

export default new VerificationController()
