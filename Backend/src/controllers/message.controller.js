import BaseController from "./base.controller.js"
import messageService from "../services/message.service.js"
import notificationService from "../services/notification.service.js"
import profileService from "../services/profile.service.js"

class MessageController extends BaseController {
    async sendMessage(req, res, next) {
        try {
            let senderProfile = await profileService.getByUserId(
                req.user._id
            )
            if (!senderProfile) {
                senderProfile = await profileService.create(req.user._id, { name: req.user.name })
            }

            const message = await messageService.send(
                senderProfile._id.toString(),
                req.body.receiverProfileId,
                req.body.content
            )

            // Notify receiver
            const receiverProfile = await profileService.getById(
                req.body.receiverProfileId
            )
            if (receiverProfile) {
                const receiverUserId = await profileService.getUserIdFromProfile(receiverProfile)
                if (receiverUserId) {
                    await notificationService.create(
                        receiverUserId,
                        "new_message",
                        "You have a new message",
                        senderProfile._id
                    )
                }
            }

            return this.sendSuccess(res, message, "Message sent", 201)
        } catch (error) {
            if (error.message === "Cannot send message to this user") {
                return this.sendError(res, error.message, 403)
            }
            next(error)
        }
    }

    async getConversation(req, res, next) {
        try {
            let profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendSuccess(res, [], "Conversation retrieved")
            }

            const messages = await messageService.getConversation(
                profile._id.toString(),
                req.params.profileId,
                {
                    page: parseInt(req.query.page) || 1,
                    limit: parseInt(req.query.limit) || 50,
                }
            )

            return this.sendSuccess(
                res,
                messages,
                "Conversation retrieved"
            )
        } catch (error) {
            next(error)
        }
    }

    async markAsRead(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendSuccess(res, null, "Message marked as read")
            }

            const message = await messageService.markAsRead(
                req.params.id,
                profile._id.toString()
            )

            return this.sendSuccess(
                res,
                message,
                "Message marked as read"
            )
        } catch (error) {
            next(error)
        }
    }

    async getUnreadCount(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendSuccess(res, { unreadCount: 0 }, "Unread count retrieved")
            }

            const count = await messageService.getUnreadCount(
                profile._id.toString()
            )

            return this.sendSuccess(res, { unreadCount: count }, "Unread count retrieved")
        } catch (error) {
            next(error)
        }
    }

    async getConversations(req, res, next) {
        try {
            const profile = await profileService.getByUserId(req.user._id)
            if (!profile) {
                return this.sendSuccess(res, [], "Conversations retrieved")
            }

            const conversations = await messageService.getConversations(
                profile._id.toString()
            )

            return this.sendSuccess(
                res,
                conversations,
                "Conversations retrieved"
            )
        } catch (error) {
            next(error)
        }
    }
}

export default new MessageController()
