import jwt from "jsonwebtoken"
import { config } from "./config.js"
import { redisClient } from "./redis.js"

export const generateToken = async (userId, res = null, customAccessExpiry = "15m") => {
    const idStr = userId.toString()

    const accessToken = jwt.sign(
        { userId: idStr, id: idStr },
        config.jwtSecret,
        { expiresIn: customAccessExpiry }
    )

    const refreshToken = jwt.sign(
        { userId: idStr, id: idStr },
        config.refreshSecret,
        { expiresIn: "7d" }
    )

    const refreshTokenKey = `refresh_token:${idStr}`
    await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken)

    if (res && res.cookie) {
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: config.env === "production",
            sameSite: config.env === "production" ? "none" : "lax",
            maxAge: 15 * 60 * 1000,
        })

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: config.env === "production",
            sameSite: config.env === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
    }

    return { accessToken, refreshToken }
}

export const verifyAccessToken = (token) => {
    try {
        if (!token) return null
        const decoded = jwt.verify(token, config.jwtSecret)
        return decoded
    } catch (error) {
        return null
    }
}

export const verifyRefreshToken = async (refreshToken) => {
    try {
        if (!refreshToken) return null
        const decoded = jwt.verify(refreshToken, config.refreshSecret)
        const id = decoded.userId || decoded.id
        const storedToken = await redisClient.get(`refresh_token:${id}`)

        if (storedToken && storedToken === refreshToken) {
            return decoded
        }
        return null
    } catch (error) {
        return null
    }
}

export const generateAccessToken = (userId, res = null) => {
    const idStr = userId.toString()
    const accessToken = jwt.sign(
        { userId: idStr, id: idStr },
        config.jwtSecret,
        { expiresIn: "15m" }
    )

    if (res && res.cookie) {
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: config.env === "production",
            sameSite: config.env === "production" ? "none" : "lax",
            maxAge: 15 * 60 * 1000,
        })
    }

    return accessToken
}

export const revokeRefreshToken = async (userId) => {
    const idStr = userId.toString()
    await redisClient.del(`refresh_token:${idStr}`)
}
