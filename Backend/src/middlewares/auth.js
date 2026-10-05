import jwt from "jsonwebtoken"
import { config } from "../config/config.js"
import { redisClient } from "../config/redis.js"
import { User } from "../models/User.js"
import { ROLES, USER_STATUS } from "../constants/index.js"

export const authenticate = async (req, res, next) => {
    try {
        let token = null

        // 1. Check Authorization Header (Bearer token)
        const authHeader = req.headers.authorization || ""
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.slice(7).trim()
        }

        // 2. Check HTTP-only Cookie
        if (!token && req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authorization token missing. Please sign in.",
            })
        }

        const decoded = jwt.verify(token, config.jwtSecret)
        const userId = decoded.userId || decoded.id

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload",
            })
        }

        req.userId = userId

        // Check Redis Cache for user
        const cacheKey = `user:${userId}`
        const cachedUserJson = await redisClient.get(cacheKey)

        if (cachedUserJson) {
            try {
                const cachedUser = JSON.parse(cachedUserJson)
                if (cachedUser.status && (cachedUser.status === USER_STATUS.BANNED || cachedUser.status === USER_STATUS.INACTIVE)) {
                    return res.status(403).json({
                        success: false,
                        message: "Your account is inactive or banned",
                    })
                }
                req.user = cachedUser
                return next()
            } catch (err) {
                // fall through to DB
            }
        }

        // Fetch from MongoDB if not cached
        const user = await User.findById(userId)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            })
        }

        if (user.status === USER_STATUS.BANNED || user.status === USER_STATUS.INACTIVE) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive or banned",
            })
        }

        const authUser = user.toAuthJSON()
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(authUser))

        req.user = authUser
        next()
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token has expired. Please refresh your session.",
                isExpired: true,
            })
        }
        return res.status(401).json({
            success: false,
            message: "Invalid or expired auth token",
        })
    }
}

export const requireApproved = async (req, res, next) => {
    try {
        if (!req.user && req.userId) {
            const user = await User.findById(req.userId)
            if (user) req.user = user.toAuthJSON()
        }
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            })
        }
        if (req.user.role === ROLES.ADMIN || req.user.role === "admin") {
            return next()
        }
        if (!req.user.isApproved || req.user.status === USER_STATUS.PENDING_APPROVAL) {
            return res.status(403).json({
                success: false,
                isPendingApproval: true,
                message: "Your profile is pending admin approval. You will be able to access matches and platform features once approved.",
            })
        }
        if (req.user.status === USER_STATUS.DECLINED) {
            return res.status(403).json({
                success: false,
                isDeclined: true,
                message: "Your account registration has been declined by the administrator.",
            })
        }
        next()
    } catch (error) {
        next(error)
    }
}

export const attachUser = async (req, res, next) => {
    try {
        if (!req.user && req.userId) {
            const cacheKey = `user:${req.userId}`
            const cachedUserJson = await redisClient.get(cacheKey)
            if (cachedUserJson) {
                try {
                    req.user = JSON.parse(cachedUserJson)
                    return next()
                } catch (e) {
                    // fall through
                }
            }
            const user = await User.findById(req.userId)
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found",
                })
            }
            const authUser = user.toAuthJSON()
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(authUser))
            req.user = authUser
        }
        next()
    } catch (error) {
        next(error)
    }
}

export const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user && req.userId) {
            const user = await User.findById(req.userId)
            if (user) req.user = user.toAuthJSON()
        }
        if (!req.user || (req.user.role !== ROLES.ADMIN && req.user.role !== "admin")) {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            })
        }
        next()
    } catch (error) {
        next(error)
    }
}
