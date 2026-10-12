import { Server } from "socket.io"
import { config } from "./config/config.js"
import { verifyAccessToken } from "./config/generateToken.js"
import { User } from "./models/User.js"
import { Profile } from "./models/Profile.js"
import { Message } from "./models/Message.js"
import { Block } from "./models/Block.js"

const setupSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: [
                config.frontendDomain,
                config.frontendUrl,
                "https://meri-jodi-amber.vercel.app",
                ...(config.env !== "production"
                    ? ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]
                    : []),
            ].filter(Boolean),
            methods: ["GET", "POST"],
            credentials: true,
        },
    })

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token
            if (!token) {
                return next(new Error("Authentication required"))
            }
            const decoded = verifyAccessToken(token)
            if (!decoded) {
                return next(new Error("Invalid or expired token"))
            }
            const userId = decoded.userId || decoded.id
            const user = await User.findById(userId)
            if (!user) {
                return next(new Error("User not found"))
            }
            const profile = await Profile.findOne({ userId: user._id })
            if (!profile) {
                return next(new Error("Profile not found"))
            }
            socket.userId = user._id.toString()
            socket.profileId = profile._id.toString()
            next()
        } catch (error) {
            next(new Error("Invalid token"))
        }
    })

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.profileId}`)

        socket.join(`profile:${socket.profileId}`)

        socket.on("join_conversation", (otherProfileId) => {
            const roomId = [socket.profileId, otherProfileId].sort().join(":")
            socket.join(roomId)
            socket.currentRoom = roomId
        })

        socket.on("leave_conversation", () => {
            if (socket.currentRoom) {
                socket.leave(socket.currentRoom)
                socket.currentRoom = null
            }
        })

        socket.on("send_message", async (data, callback) => {
            try {
                const { receiverProfileId, content } = data

                if (!receiverProfileId || !content?.trim()) {
                    callback?.({ error: "Invalid message data" })
                    return
                }

                const receiverProfile = await Profile.findById(receiverProfileId)
                if (!receiverProfile) {
                    callback?.({ error: "Recipient profile not found or no longer exists" })
                    return
                }

                const blocked = await Block.findOne({
                    $or: [
                        { blockerProfileId: receiverProfileId, blockedProfileId: socket.profileId },
                        { blockerProfileId: socket.profileId, blockedProfileId: receiverProfileId },
                    ],
                })
                if (blocked) {
                    callback?.({ error: "Cannot send message to this user" })
                    return
                }

                const message = await Message.create({
                    senderProfileId: socket.profileId,
                    receiverProfileId,
                    content: content.trim(),
                })

                const populated = await Message.findById(message._id)
                    .populate("senderProfileId", "name photos gender")
                    .populate("receiverProfileId", "name photos gender")

                const roomId = [socket.profileId, receiverProfileId].sort().join(":")
                io.to(roomId).emit("new_message", populated)

                io.to(`profile:${receiverProfileId}`).emit("new_message_notification", {
                    senderProfileId: socket.profileId,
                    content: content.trim(),
                    createdAt: message.createdAt,
                })

                callback?.({ success: true, message: populated })
            } catch (error) {
                console.error("Socket send_message error:", error)
                callback?.({ error: "Failed to send message" })
            }
        })

        socket.on("typing", (data) => {
            const { receiverProfileId, isTyping } = data
            const roomId = [socket.profileId, receiverProfileId].sort().join(":")
            socket.to(roomId).emit("user_typing", {
                profileId: socket.profileId,
                isTyping,
            })
        })

        socket.on("mark_read", async (data) => {
            try {
                const { senderProfileId } = data
                await Message.updateMany(
                    {
                        senderProfileId,
                        receiverProfileId: socket.profileId,
                        isRead: false,
                    },
                    { isRead: true, readAt: new Date() }
                )
                const roomId = [socket.profileId, senderProfileId].sort().join(":")
                io.to(roomId).emit("messages_read", {
                    readBy: socket.profileId,
                })
            } catch (error) {
                console.error("Socket mark_read error:", error)
            }
        })

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.profileId}`)
        })
    })

    return io
}

export default setupSocket
