import express from "express"
import messageController from "../controllers/message.controller.js"
import { attachUser, requireApproved } from "../middlewares/auth.js"
import { validate } from "../middlewares/validate.js"
import { validateObjectId } from "../validators/shared.validator.js"
import { sendMessage } from "../validators/message.validator.js"

const router = express.Router()

router.use(attachUser)
router.use(requireApproved)

router.get("/unread-count", messageController.getUnreadCount.bind(messageController))
router.get("/conversations", messageController.getConversations.bind(messageController))
router.get("/conversation/:profileId", validateObjectId("profileId"), validate, messageController.getConversation.bind(messageController))
router.get("/conversations/:profileId", validateObjectId("profileId"), validate, messageController.getConversation.bind(messageController))
router.post("/", sendMessage, validate, messageController.sendMessage.bind(messageController))
router.put("/:id/read", validateObjectId("id"), validate, messageController.markAsRead.bind(messageController))

export default router
