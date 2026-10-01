import express from "express"
import authService from "../services/auth.service.js"
import { authenticate, attachUser } from "../middlewares/auth.js"
import { sanitizeBody } from "../middlewares/sanitize.js"
import ApiResponse from "../utils/ApiResponse.js"
import {
    registerSchema,
    loginSchema,
    verifyOtpSchema,
    resendOtpSchema,
    googleAuthSchema,
} from "../config/zod.js"

const router = express.Router()

// Helper to format Zod error messages
const formatZodError = (validation) => {
    if (!validation.success) {
        const issues = validation.error.issues || []
        const firstMessage = issues[0]?.message || "Validation failed"
        const errors = issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
        }))
        return { message: firstMessage, errors }
    }
    return null
}

/**
 * POST /api/auth/register
 * Register a new user:
 * Validates input, hashes password, stores pending user in Redis (5 min), and sends verification email via Nodemailer.
 */
router.post("/register", sanitizeBody, async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        const validation = registerSchema.safeParse(req.body)
        const errorDetails = formatZodError(validation)
        if (errorDetails) {
            return apiResponse.error(errorDetails.message, 400)
        }

        const { name, email, password, phone, gender, location } = validation.data
        const reqIp = req.ip || req.connection?.remoteAddress || "127.0.0.1"

        const result = await authService.registerUser({
            name,
            email,
            password,
            phone,
            gender,
            location,
            reqIp,
        })

        return apiResponse.success(result, result.message, 201)
    } catch (error) {
        return apiResponse.error(error.message, error.statusCode || 400)
    }
})

/**
 * GET /api/auth/verify/:token
 * POST /api/auth/verify/:token
 * Verify email verification token from Redis, create user + profile in MongoDB, issue tokens & set cookies.
 */
const handleEmailVerification = async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        const token = req.params.token || req.body?.token || req.body?.otp || req.body?.code
        const email = req.body?.email || req.query?.email
        if (!token) {
            return apiResponse.error("Verification token or code is missing", 400)
        }

        const result = await authService.verifyEmailToken(token, res, email)
        return apiResponse.success(result, result.message, 200)
    } catch (error) {
        return apiResponse.error(error.message, error.statusCode || 400)
    }
}

router.get("/verify/:token", sanitizeBody, handleEmailVerification)
router.post("/verify/:token", sanitizeBody, handleEmailVerification)

/**
 * POST /api/auth/admin-login
 * Direct administrator login with email and password (no OTP required for admin access).
 */
router.post("/admin-login", sanitizeBody, async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return apiResponse.error("Admin email and password are required", 400)
        }

        const result = await authService.adminLogin({ email, password, res })
        return apiResponse.success(result, result.message, 200)
    } catch (error) {
        return apiResponse.error(error.message, error.statusCode || 401)
    }
})

/**
 * POST /api/auth/login
 * Step 1 of Login:
 * Validates email & password, generates 6-digit OTP, stores in Redis (5 min), and sends email via Nodemailer.
 */
router.post("/login", sanitizeBody, async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        const validation = loginSchema.safeParse(req.body)
        const errorDetails = formatZodError(validation)
        if (errorDetails) {
            return apiResponse.error(errorDetails.message, 400)
        }

        const { email, password } = validation.data
        const reqIp = req.ip || req.connection?.remoteAddress || "127.0.0.1"

        const result = await authService.loginUser({ email, password, reqIp })
        return apiResponse.success(result, result.message, 200)
    } catch (error) {
        return apiResponse.error(error.message, error.statusCode || 400)
    }
})

/**
 * POST /api/auth/verify
 * POST /api/auth/verify-otp
 * Step 2 of Login:
 * Verifies OTP from Redis, issues dual JWT tokens (Access + Refresh), sets HTTP-only cookies, and returns user.
 */
const handleVerifyOtp = async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        // If request provides token or code without email, resolve via email verification handler
        if (req.body?.token || (req.body?.code && !req.body?.email)) {
            const token = req.body.token || req.body.code
            const result = await authService.verifyEmailToken(token, res, req.body.email)
            return apiResponse.success(result, result.message, 200)
        }

        const validation = verifyOtpSchema.safeParse(req.body)
        const errorDetails = formatZodError(validation)
        if (errorDetails) {
            return apiResponse.error(errorDetails.message, 400)
        }

        const { email, otp } = validation.data
        const result = await authService.verifyLoginOtp({ email, otp, res })

        return apiResponse.success(result, result.message, 200)
    } catch (error) {
        return apiResponse.error(error.message, error.statusCode || 400)
    }
}

router.post("/verify", sanitizeBody, handleVerifyOtp)
router.post("/verify-otp", sanitizeBody, handleVerifyOtp)

/**
 * POST /api/auth/resend-otp
 * Resend OTP code to email with 60s rate limit.
 */
router.post("/resend-otp", sanitizeBody, async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        const validation = resendOtpSchema.safeParse(req.body)
        const errorDetails = formatZodError(validation)
        if (errorDetails) {
            return apiResponse.error(errorDetails.message, 400)
        }

        const { email } = validation.data
        const reqIp = req.ip || req.connection?.remoteAddress || "127.0.0.1"

        const result = await authService.resendLoginOtp({ email, reqIp })
        return apiResponse.success(result, result.message, 200)
    } catch (error) {
        return apiResponse.error(error.message, error.statusCode || 400)
    }
})

/**
 * POST /api/auth/google
 * Google OAuth Login / Registration:
 * Verifies Google ID token, finds or creates User + Profile, issues tokens and sets cookies.
 */
router.post("/google", sanitizeBody, async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        const validation = googleAuthSchema.safeParse(req.body)
        const errorDetails = formatZodError(validation)
        if (errorDetails) {
            return apiResponse.error(errorDetails.message, 400)
        }

        const { idToken, credential, accessToken, email, name, googleId, avatar } = validation.data
        const result = await authService.googleAuth({
            idToken,
            credential,
            accessToken,
            email,
            name,
            googleId,
            avatar,
            res,
        })

        return apiResponse.success(result, result.message, 200)
    } catch (error) {
        return apiResponse.error(error.message, error.statusCode || 400)
    }
})

/**
 * POST /api/auth/refresh
 * Refresh Access Token using Refresh Token from cookies or request body.
 */
router.post("/refresh", sanitizeBody, async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken
        const result = await authService.refreshUserToken({ refreshToken, res })
        return apiResponse.success(result, result.message, 200)
    } catch (error) {
        return apiResponse.error(error.message, error.statusCode || 401)
    }
})

/**
 * POST /api/auth/logout
 * Log out user, revoke refresh token from Redis, and clear HTTP cookies.
 */
router.post("/logout", authenticate, async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        const result = await authService.logoutUser({ userId: req.userId, res })
        return apiResponse.success(result, result.message, 200)
    } catch (error) {
        return apiResponse.error(error.message, 400)
    }
})

/**
 * GET /api/auth/me
 * Get current authenticated user details (cached in Redis).
 */
router.get("/me", authenticate, attachUser, async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        return apiResponse.success(
            { user: req.user },
            "User retrieved successfully"
        )
    } catch (error) {
        return apiResponse.error(error.message, 400)
    }
})

/**
 * POST /api/auth/forgot-password
 * Request a password reset link via email.
 */
router.post("/forgot-password", sanitizeBody, async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        const { email } = req.body
        if (!email) return apiResponse.error("Email is required", 400)

        const reqIp = req.ip || req.connection?.remoteAddress || "127.0.0.1"
        const result = await authService.forgotPassword({ email, reqIp })
        return apiResponse.success(result, result.message, 200)
    } catch (error) {
        return apiResponse.error(error.message, error.statusCode || 400)
    }
})

/**
 * POST /api/auth/reset-password/:token
 * Reset password using the token from the email link.
 */
router.post("/reset-password/:token", sanitizeBody, async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        const { token } = req.params
        const { newPassword, password } = req.body
        const result = await authService.resetPassword({ token, newPassword: newPassword || password })
        return apiResponse.success(result, result.message, 200)
    } catch (error) {
        return apiResponse.error(error.message, error.statusCode || 400)
    }
})

/**
 * POST /api/auth/reset-password
 * Reset password using token or 6-digit OTP code in request body.
 */
router.post("/reset-password", sanitizeBody, async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        const { token, code, otp, newPassword, password } = req.body
        const tokenToUse = token || code || otp
        const passToUse = newPassword || password
        const result = await authService.resetPassword({ token: tokenToUse, newPassword: passToUse })
        return apiResponse.success(result, result.message, 200)
    } catch (error) {
        return apiResponse.error(error.message, error.statusCode || 400)
    }
})

/**
 * PUT /api/auth/change-password
 * Change password for authenticated users (requires current + new password).
 */
router.put("/change-password", authenticate, sanitizeBody, async (req, res) => {
    const apiResponse = new ApiResponse(res)
    try {
        const { currentPassword, newPassword } = req.body
        const result = await authService.changePassword({
            userId: req.userId,
            currentPassword,
            newPassword,
        })
        return apiResponse.success(result, result.message, 200)
    } catch (error) {
        return apiResponse.error(error.message, error.statusCode || 400)
    }
})

/*
 * ==============================================================================
 * TWILIO SMS OTP ROUTES - COMMENTED FOR REFERENCE AS REQUESTED
 * ==============================================================================
 * 
 * router.post("/send-otp", async (req, res) => {
 *     const apiResponse = new ApiResponse(res)
 *     try {
 *         const { phone } = req.body
 *         if (!phone) return apiResponse.error("Phone number is required", 400)
 *         const result = await authService.sendOtp(phone)
 *         return apiResponse.success({ sid: result.sid }, "OTP sent successfully")
 *     } catch (error) {
 *         return apiResponse.error(error.message, 400)
 *     }
 * })
 * ==============================================================================
 */

export default router
