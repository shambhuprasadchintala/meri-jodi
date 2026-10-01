import BaseController from "./base.controller.js"
import interestService from "../services/interest.service.js"
import notificationService from "../services/notification.service.js"
import profileService from "../services/profile.service.js"

class InterestController extends BaseController {
    async sendInterest(req, res, next) {
        try {
            let senderProfile = await profileService.getByUserId(
                req.user._id
            )
            if (!senderProfile) {
                senderProfile = await profileService.create(req.user._id, { name: req.user.name })
            }

            const { interest, isMutual } = await interestService.send(
                senderProfile._id.toString(),
                req.body.receiverProfileId
            )

            // Create notification for receiver
            const receiverProfile = await profileService.getById(
                req.body.receiverProfileId
            )
            if (receiverProfile) {
                const receiverUserId = await profileService.getUserIdFromProfile(receiverProfile)
                if (receiverUserId) {
                    const message = isMutual
                        ? "You have a mutual match!"
                        : "You have received a new interest"
                    await notificationService.create(
                        receiverUserId,
                        isMutual ? "interest_accepted" : "new_interest",
                        message,
                        senderProfile._id
                    )
                }
            }

            const successMessage = isMutual
                ? "Mutual match! Both interests accepted"
                : "Interest sent"
            return this.sendSuccess(
                res,
                { interest, isMutual },
                successMessage,
                201
            )
        } catch (error) {
            if (error.message === "Interest already sent") {
                return this.sendError(res, error.message, 409)
            }
            if (error.message === "Cannot send interest to this user") {
                return this.sendError(res, error.message, 403)
            }
            next(error)
        }
    }

    async acceptInterest(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendError(res, "Profile not found", 404)
            }

            let interest
            try {
                interest = await interestService.respond(
                    req.params.id,
                    profile._id.toString(),
                    "accepted"
                )
            } catch (err) {
                if (
                    err.message === "Interest not found or already responded"
                ) {
                    return this.sendError(res, err.message, 404)
                }
                throw err
            }

            // Notify sender
            const senderProfile = await profileService.getById(
                interest.senderProfileId
            )
            if (senderProfile) {
                const senderUserId = await profileService.getUserIdFromProfile(senderProfile)
                if (senderUserId) {
                    await notificationService.create(
                        senderUserId,
                        "interest_accepted",
                        "Your interest has been accepted",
                        profile._id
                    )
                }
            }

            return this.sendSuccess(res, interest, "Interest accepted")
        } catch (error) {
            next(error)
        }
    }

    async declineInterest(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendError(res, "Profile not found", 404)
            }

            let interest
            try {
                interest = await interestService.respond(
                    req.params.id,
                    profile._id.toString(),
                    "declined"
                )
            } catch (err) {
                if (
                    err.message === "Interest not found or already responded"
                ) {
                    return this.sendError(res, err.message, 404)
                }
                throw err
            }

            // Notify sender
            const senderProfile = await profileService.getById(
                interest.senderProfileId
            )
            if (senderProfile) {
                const senderUserId = await profileService.getUserIdFromProfile(senderProfile)
                if (senderUserId) {
                    await notificationService.create(
                        senderUserId,
                        "system",
                        "Your interest has been declined",
                        profile._id
                    )
                }
            }

            return this.sendSuccess(res, interest, "Interest declined")
        } catch (error) {
            next(error)
        }
    }

    async withdrawInterest(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendError(res, "Profile not found", 404)
            }

            let interest
            try {
                interest = await interestService.withdraw(
                    req.params.id,
                    profile._id.toString()
                )
            } catch (err) {
                if (
                    err.message === "Interest not found or already processed"
                ) {
                    return this.sendError(res, err.message, 404)
                }
                throw err
            }

            return this.sendSuccess(res, interest, "Interest withdrawn")
        } catch (error) {
            next(error)
        }
    }

    async getSentInterests(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendSuccess(res, [], "Sent interests retrieved")
            }

            const interests = await interestService.getSent(
                profile._id.toString()
            )
            return this.sendSuccess(
                res,
                interests,
                "Sent interests retrieved"
            )
        } catch (error) {
            next(error)
        }
    }

    async getReceivedInterests(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendSuccess(res, [], "Received interests retrieved")
            }

            const interests = await interestService.getReceived(
                profile._id.toString()
            )
            return this.sendSuccess(
                res,
                interests,
                "Received interests retrieved"
            )
        } catch (error) {
            next(error)
        }
    }
}

export default new InterestController()
