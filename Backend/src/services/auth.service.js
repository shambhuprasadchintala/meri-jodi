import crypto from "crypto"
import bcrypt from "bcryptjs"
import { OAuth2Client } from "google-auth-library"
import { config } from "../config/config.js"
import { User } from "../models/User.js"
import { Profile } from "../models/Profile.js"
import { ROLES, USER_STATUS } from "../constants/index.js"
import { redisClient } from "../config/redis.js"
import sendMail from "../config/sendMail.js"
import { verifyGoogleIdentity } from "../utils/googleIdentity.js"
import { getOtpHtml, getVerifyEmailHtml, getResetPasswordHtml } from "../config/html.js"
import {
    generateToken,
    generateAccessToken,
    verifyRefreshToken,
    revokeRefreshToken,
} from "../config/generateToken.js"

import twilio from "twilio"

let twilioClient = null
const getTwilioClient = () => {
    if (twilioClient) return twilioClient
    const sid = config.twilio?.accountSid || process.env.TWILIO_ACCOUNT_SID
    const token = config.twilio?.authToken || process.env.TWILIO_AUTH_TOKEN
    if (sid && sid.startsWith("AC") && token) {
        try {
            twilioClient = twilio(sid, token)
        } catch (e) {
            console.warn("Twilio client initialization failed:", e.message)
        }
    }
    return twilioClient
}

const googleOAuthClient = new OAuth2Client({
    clientId: config.google.clientId || undefined,
    transporterOptions: { timeout: 8000, retry: false },
})

class AuthService {
    /**
     * Generate standard JWT Token (for backwards compatibility)
     */
    generateLegacyToken(user) {
        return generateAccessToken(user._id.toString())
    }

    /**
     * Format phone number to E.164 standard (e.g. +91XXXXXXXXXX)
     */
    formatPhoneNumber(phone) {
        if (!phone) return ""
        const clean = String(phone).trim().replace(/[\s-()]/g, "")
        if (clean.startsWith("+")) return clean
        if (/^\d{10}$/.test(clean)) return `+91${clean}`
        if (/^91\d{10}$/.test(clean)) return `+${clean}`
        return `+${clean}`
    }

    /**
     * Register a new user:
     * Direct registration without SMS OTP (Twilio SMS OTP verification commented out).
     * Creates User + Profile in MongoDB with status 'pending_approval' awaiting admin confirmation.
     * Generates authentication tokens so the user can complete profile details.
     */
    async registerUser({ name, email, password, phone, gender, location, res = null, reqIp = "127.0.0.1" }) {
        const cleanEmail = email ? email.toLowerCase().trim() : ""
        if (!cleanEmail || !cleanEmail.includes("@")) {
            const error = new Error("A valid email address is required for registration.")
            error.statusCode = 400
            throw error
        }

        const rawPhone = phone ? String(phone).trim() : ""
        const formattedPhone = this.formatPhoneNumber(rawPhone)

        if (!formattedPhone || formattedPhone.length < 10) {
            const error = new Error("A valid 10-digit mobile phone number is required.")
            error.statusCode = 400
            throw error
        }

        if (!password || password.length < 6) {
            const error = new Error("Password must be at least 6 characters long.")
            error.statusCode = 400
            throw error
        }

        // Check if user already exists with this email
        const existingEmailUser = await User.findOne({ email: cleanEmail })
        if (existingEmailUser) {
            const error = new Error("An account with this email address already exists. Please sign in.")
            error.statusCode = 400
            throw error
        }

        // Check if user already exists with this phone number
        const existingPhoneUser = await User.findOne({ phone: formattedPhone })
        if (existingPhoneUser) {
            const error = new Error("An account with this mobile number already exists. Please sign in.")
            error.statusCode = 400
            throw error
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10)

        const cleanGender = gender ? gender.toLowerCase().trim() : "female"
        const cleanLocation = location ? location.trim() : undefined

        // ==========================================
        // [COMMENTED OUT: TWILIO SMS OTP REGISTER]
        // Direct registration is enabled with admin confirmation workflow.
        /*
        const verifyOtp = Math.floor(100000 + Math.random() * 900000).toString()
        const activeTwilio = getTwilioClient()
        if (activeTwilio && config.twilio?.verifyServiceSid) {
            try {
                await activeTwilio.verify.v2
                    .services(config.twilio.verifyServiceSid)
                    .verifications.create({ to: formattedPhone, channel: "sms" })
                console.log(`[Twilio Verify SMS] SMS OTP dispatched to ${formattedPhone}`)
            } catch (twilioErr) {
                console.error(`[Twilio SMS Register Error] ${twilioErr.message}`)
            }
        }
        */
        // ==========================================

        // Create User directly in MongoDB
        const user = await User.create({
            name: name.trim(),
            email: cleanEmail,
            phone: formattedPhone,
            passwordHash,
            gender: cleanGender,
            location: cleanLocation,
            isPhoneVerified: true,
            isEmailVerified: true,
            isApproved: false,
            approvalStatus: "pending",
            status: USER_STATUS.PENDING_APPROVAL,
            lastLogin: new Date(),
        })

        // Automatically create initial profile with gender and location
        await Profile.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                name: user.name,
                gender: cleanGender,
                location: cleanLocation ? { city: cleanLocation, country: "India" } : undefined,
                isVerified: false,
                isApproved: false,
                approvalStatus: "pending",
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        // Generate Dual JWT tokens and set cookies
        const { accessToken, refreshToken } = await generateToken(user._id, res)

        // Cache user in Redis for 1 hour
        await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user.toAuthJSON()))

        return {
            message: "Registration successful! Your profile has been submitted for admin confirmation.",
            user: user.toAuthJSON(),
            token: accessToken,
            accessToken,
            refreshToken,
        }
    }

    /**
     * Verify SMS OTP (or verification token) and create User + Profile in MongoDB
     */
    async verifyEmailToken(tokenOrOtp, res = null, emailOrPhone = null) {
        if (!tokenOrOtp) {
            const error = new Error("Verification token or SMS code is required.")
            error.statusCode = 400
            throw error
        }

        const input = String(tokenOrOtp).trim()
        let resolvedPhone = null
        let resolvedEmail = null

        if (emailOrPhone) {
            const cleanParam = String(emailOrPhone).trim()
            if (cleanParam.includes("@")) {
                resolvedEmail = cleanParam.toLowerCase()
            } else {
                resolvedPhone = this.formatPhoneNumber(cleanParam)
            }
        }

        // 1. Check if recently verified (e.g. React StrictMode or double-click deduplication)
        const recentOtpVerified = await redisClient.get(`verified-code:${input}`)
        if (recentOtpVerified) {
            const cached = JSON.parse(recentOtpVerified)
            return {
                message: "Phone number verified successfully! Your account is active.",
                user: cached.user,
                token: cached.accessToken,
                accessToken: cached.accessToken,
                refreshToken: cached.refreshToken,
            }
        }

        const recentVerified = await redisClient.get(`verified:${input}`)
        if (recentVerified) {
            const cached = JSON.parse(recentVerified)
            return {
                message: "Phone number verified successfully! Your account is active.",
                user: cached.user,
                token: cached.accessToken,
                accessToken: cached.accessToken,
                refreshToken: cached.refreshToken,
            }
        }

        // 2. Resolve pending registration userData from Redis
        let userData = null
        let token = input

        if (/^\d{6}$/.test(input)) {
            // Check via phone registration key first
            if (resolvedPhone) {
                const phoneRegJson = await redisClient.get(`phone-register:${resolvedPhone}`)
                if (phoneRegJson) {
                    userData = JSON.parse(phoneRegJson)
                    token = userData.token || input
                }
            }

            // Check via verify-code mapping
            if (!userData) {
                const mappedToken = await redisClient.get(`verify-code:${input}`)
                if (mappedToken) {
                    token = mappedToken
                    const tokenData = await redisClient.get(`verify:${mappedToken}`)
                    if (tokenData) userData = JSON.parse(tokenData)
                }
            }

            // Check via email registration key
            if (!userData && resolvedEmail) {
                const regOtpJson = await redisClient.get(`verify-otp:${resolvedEmail}`)
                if (regOtpJson) {
                    const regData = JSON.parse(regOtpJson)
                    if (regData.otp === input) {
                        token = regData.token
                        const tokenData = await redisClient.get(`verify:${token}`)
                        if (tokenData) userData = JSON.parse(tokenData)
                    }
                }
            }
        } else {
            // Direct token
            const verifyKey = `verify:${token}`
            const tokenData = await redisClient.get(verifyKey)
            if (tokenData) userData = JSON.parse(tokenData)
        }

        if (!userData) {
            const error = new Error("Verification code or token has expired or is invalid. Please register again.")
            error.statusCode = 400
            throw error
        }

        const formattedPhone = userData.phone || resolvedPhone

        // 3. Verify OTP code with Twilio Verify Check (if 6-digit numeric code entered)
        let isApproved = false
        if (/^\d{6}$/.test(input)) {
            const activeTwilio = getTwilioClient()
            if (activeTwilio && config.twilio?.verifyServiceSid && formattedPhone) {
                try {
                    const check = await activeTwilio.verify.v2
                        .services(config.twilio.verifyServiceSid)
                        .verificationChecks.create({ to: formattedPhone, code: input })
                    isApproved = check.status === "approved"
                } catch (err) {
                    console.warn(`[Twilio Verify Check] ${err.message}`)
                }
            }

            // Fallback checks
            if (!isApproved && formattedPhone) {
                const simOtp = await redisClient.get(`simulated-phone-otp:${formattedPhone}`)
                if (simOtp && simOtp === input) {
                    isApproved = true
                    await redisClient.del(`simulated-phone-otp:${formattedPhone}`)
                }
            }

            if (!isApproved && userData.otp === input) {
                isApproved = true
            }

            if (!isApproved) {
                const error = new Error("Invalid or expired SMS verification code.")
                error.statusCode = 400
                throw error
            }
        }

        // 4. Remove pending registration keys from Redis
        await redisClient.del(`verify:${token}`)
        if (userData.token) await redisClient.del(`verify:${userData.token}`)
        if (userData.otp) await redisClient.del(`verify-code:${userData.otp}`)
        if (userData.phone) await redisClient.del(`phone-register:${userData.phone}`)
        if (userData.email) await redisClient.del(`verify-otp:${userData.email}`)

        // 5. Create or activate User in MongoDB
        let user = null
        if (formattedPhone) {
            user = await User.findOne({ phone: formattedPhone })
        }
        if (!user && userData.email) {
            user = await User.findOne({ email: userData.email })
        }

        if (!user) {
            user = await User.create({
                name: userData.name,
                email: userData.email || undefined,
                phone: formattedPhone,
                passwordHash: userData.passwordHash,
                gender: userData.gender,
                location: userData.location,
                isPhoneVerified: true,
                isEmailVerified: Boolean(userData.email),
                status: USER_STATUS.ACTIVE,
                lastLogin: new Date(),
            })

            // Automatically create initial profile with verified gender and location
            await Profile.findOneAndUpdate(
                { userId: user._id },
                {
                    userId: user._id,
                    name: user.name,
                    gender: userData.gender || "female",
                    location: userData.location ? { city: userData.location, country: "India" } : undefined,
                    isVerified: true,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            )
        } else {
            user.isPhoneVerified = true
            user.isEmailVerified = Boolean(userData.email || user.isEmailVerified)
            user.status = USER_STATUS.ACTIVE
            user.lastLogin = new Date()
            if (userData.passwordHash) user.passwordHash = userData.passwordHash
            if (formattedPhone) user.phone = formattedPhone
            if (userData.gender) user.gender = userData.gender
            if (userData.location) user.location = userData.location
            await user.save()

            if (userData.gender || userData.location) {
                await Profile.findOneAndUpdate(
                    { userId: user._id },
                    {
                        ...(userData.gender ? { gender: userData.gender } : {}),
                        ...(userData.location ? { "location.city": userData.location } : {}),
                        isVerified: true,
                    }
                )
            }
        }

        // 6. Generate Dual JWT tokens and set cookies
        const { accessToken, refreshToken } = await generateToken(user._id, res)

        // Cache user in Redis for 1 hour
        await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user.toAuthJSON()))

        // Cache verified token & code for 10 minutes to protect against double execution in React StrictMode
        const verifiedPayload = JSON.stringify({
            user: user.toAuthJSON(),
            accessToken,
            refreshToken,
        })
        await redisClient.set(`verified:${token}`, verifiedPayload, { EX: 600 })
        if (userData.otp) {
            await redisClient.set(`verified-code:${userData.otp}`, verifiedPayload, { EX: 600 })
        }
        if (input) {
            await redisClient.set(`verified-code:${input}`, verifiedPayload, { EX: 600 })
        }

        return {
            message: "Phone number verified successfully! Your account is active.",
            user: user.toAuthJSON(),
            token: accessToken,
            accessToken,
            refreshToken,
        }
    }

    /**
     * Admin Direct Login:
     * Validates credentials and verifies that user has ROLES.ADMIN, then issues dual JWT tokens.
     */
    async adminLogin({ email, password, res = null }) {
        const cleanEmail = email.toLowerCase().trim()
        const user = await User.findOne({ email: cleanEmail })
        if (!user) {
            const error = new Error("Invalid administrator credentials.")
            error.statusCode = 401
            throw error
        }

        const isPasswordValid = await user.validatePassword(password)
        if (!isPasswordValid) {
            const error = new Error("Invalid administrator credentials.")
            error.statusCode = 401
            throw error
        }

        if (user.role !== ROLES.ADMIN) {
            const error = new Error("Access denied. Administrator privileges required.")
            error.statusCode = 403
            throw error
        }

        if (user.status !== USER_STATUS.ACTIVE) {
            const error = new Error("Administrator account is inactive or suspended.")
            error.statusCode = 403
            throw error
        }

        user.lastLogin = new Date()
        await user.save()

        const { accessToken, refreshToken } = await generateToken(user._id, res, "7d")
        await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user.toAuthJSON()))

        return {
            message: "Admin authentication successful.",
            user: user.toAuthJSON(),
            token: accessToken,
            accessToken,
            refreshToken,
        }
    }

    /**
     * Login User:
     * Validates credentials with Phone (or Email) + Password.
     * Direct login without OTP (Twilio SMS OTP commented out).
     * Issues Dual JWT tokens and sets cookies directly.
     */
    async loginUser({ phone, email, identifier, password, res = null, reqIp = "127.0.0.1" }) {
        const inputId = phone || email || identifier || ""
        const cleanInput = String(inputId).trim()

        if (!cleanInput || !password) {
            const error = new Error("Phone number (or email) and password are required.")
            error.statusCode = 400
            throw error
        }

        let user = null
        let formattedPhone = null

        // If input contains @, look up by email
        if (cleanInput.includes("@")) {
            user = await User.findOne({ email: cleanInput.toLowerCase() })
            if (user && user.phone) {
                formattedPhone = this.formatPhoneNumber(user.phone)
            }
        } else {
            // Treat as phone number
            formattedPhone = this.formatPhoneNumber(cleanInput)
            if (formattedPhone) {
                user = await User.findOne({ phone: formattedPhone })
            }
            if (!user) {
                // Fallback attempt by email or raw input
                user = await User.findOne({ $or: [{ phone: cleanInput }, { email: cleanInput.toLowerCase() }] })
            }
        }

        if (!user) {
            const error = new Error("Invalid login credentials.")
            error.statusCode = 400
            throw error
        }

        // Verify password
        const isPasswordValid = await user.validatePassword(password)
        if (!isPasswordValid) {
            const error = new Error("Invalid login credentials.")
            error.statusCode = 400
            throw error
        }

        // Check if user is banned or inactive
        if (user.status === USER_STATUS.BANNED || user.status === USER_STATUS.INACTIVE) {
            const error = new Error("Your account has been deactivated or suspended.")
            error.statusCode = 403
            throw error
        }

        // ==========================================
        // [COMMENTED OUT: TWILIO SMS LOGIN OTP]
        // Direct login with credentials is now enabled.
        /*
        const targetPhone = formattedPhone || (user.phone ? this.formatPhoneNumber(user.phone) : null)
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const activeTwilio = getTwilioClient()
        if (activeTwilio && config.twilio?.verifyServiceSid && targetPhone) {
            try {
                await activeTwilio.verify.v2
                    .services(config.twilio.verifyServiceSid)
                    .verifications.create({ to: targetPhone, channel: "sms" })
            } catch (err) {
                console.error("Twilio login OTP error:", err.message)
            }
        }
        */
        // ==========================================

        user.lastLogin = new Date()
        await user.save()

        // Generate tokens and cookies
        const { accessToken, refreshToken } = await generateToken(user._id, res)

        // Cache user in Redis for 1 hour
        await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user.toAuthJSON()))

        return {
            message: `Welcome back, ${user.name || "Member"}!`,
            user: user.toAuthJSON(),
            token: accessToken,
            accessToken,
            refreshToken,
        }
    }

    /**
     * Verify Login OTP:
     * Checks SMS OTP in Twilio Verify and Redis / MongoDB.
     */
    async verifyLoginOtp({ phone, email, otp, res = null }) {
        const cleanOtp = String(otp || "").trim()
        if (!cleanOtp) {
            const error = new Error("Verification code is required.")
            error.statusCode = 400
            throw error
        }

        let formattedPhone = phone ? this.formatPhoneNumber(phone) : null
        let user = null

        if (formattedPhone) {
            user = await User.findOne({ phone: formattedPhone }).select("+otp +otpExpiresAt")
        }
        if (!user && email) {
            user = await User.findOne({ email: email.toLowerCase().trim() }).select("+otp +otpExpiresAt")
            if (user && user.phone) formattedPhone = this.formatPhoneNumber(user.phone)
        }

        if (!user && !formattedPhone) {
            const error = new Error("Phone number or account identifier is required.")
            error.statusCode = 400
            throw error
        }

        // StrictMode / duplicate call deduplication
        const dedupeKey = `login-verified:${formattedPhone || email}:${cleanOtp}`
        const recentLogin = await redisClient.get(dedupeKey)
        if (recentLogin) {
            const cached = JSON.parse(recentLogin)
            return {
                message: "Authentication successful.",
                user: cached.user,
                token: cached.accessToken,
                accessToken: cached.accessToken,
                refreshToken: cached.refreshToken,
            }
        }

        // 1. Verify via Twilio Verify Check
        let isApproved = false
        const activeTwilio = getTwilioClient()
        if (activeTwilio && config.twilio?.verifyServiceSid && formattedPhone) {
            try {
                const check = await activeTwilio.verify.v2
                    .services(config.twilio.verifyServiceSid)
                    .verificationChecks.create({ to: formattedPhone, code: cleanOtp })
                isApproved = check.status === "approved"
            } catch (err) {
                console.warn(`[Twilio Verify Check Error] ${err.message}`)
            }
        }

        // 2. Fallback checks
        if (!isApproved && formattedPhone) {
            const storedSimOtp = await redisClient.get(`simulated-phone-otp:${formattedPhone}`)
            if (storedSimOtp && storedSimOtp === cleanOtp) {
                isApproved = true
                await redisClient.del(`simulated-phone-otp:${formattedPhone}`)
            }
        }

        if (!isApproved && formattedPhone) {
            const storedOtp = await redisClient.get(`phone-otp:${formattedPhone}`)
            if (storedOtp && storedOtp === cleanOtp) {
                isApproved = true
            }
        }

        if (!isApproved && user && user.otp && user.otp === cleanOtp && user.otpExpiresAt && user.otpExpiresAt > new Date()) {
            isApproved = true
        }

        if (!isApproved) {
            // Check if this was a registration verification attempt
            if (formattedPhone) {
                const phoneRegJson = await redisClient.get(`phone-register:${formattedPhone}`)
                if (phoneRegJson) {
                    return this.verifyEmailToken(cleanOtp, res, formattedPhone)
                }
            }
            const error = new Error("Invalid or expired verification code. Please request a new code.")
            error.statusCode = 400
            throw error
        }

        if (!user && formattedPhone) {
            user = await User.findOne({ phone: formattedPhone })
        }

        if (!user) {
            const error = new Error("User account not found.")
            error.statusCode = 404
            throw error
        }

        // Clear used OTP
        if (formattedPhone) await redisClient.del(`phone-otp:${formattedPhone}`)
        user.otp = undefined
        user.otpExpiresAt = undefined
        user.isPhoneVerified = true
        user.lastLogin = new Date()
        await user.save()

        // Generate tokens and cookies
        const { accessToken, refreshToken } = await generateToken(user._id, res)

        // Cache user in Redis (1 hour)
        await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user.toAuthJSON()))

        // Cache recent login for 60 seconds to protect against React StrictMode duplicate invocations
        await redisClient.set(
            dedupeKey,
            JSON.stringify({
                user: user.toAuthJSON(),
                accessToken,
                refreshToken,
            }),
            { EX: 60 }
        )

        return {
            message: `Welcome back, ${user.name || "Member"}!`,
            user: user.toAuthJSON(),
            token: accessToken,
            accessToken,
            refreshToken,
        }
    }

    /**
     * Resend Login / Registration SMS OTP
     */
    async resendLoginOtp({ phone, email, reqIp = "127.0.0.1" }) {
        const input = phone || email || ""
        const cleanInput = String(input).trim()

        if (!cleanInput) {
            const error = new Error("Phone number or email is required.")
            error.statusCode = 400
            throw error
        }

        let formattedPhone = null
        if (cleanInput.includes("@")) {
            const user = await User.findOne({ email: cleanInput.toLowerCase() })
            if (user && user.phone) formattedPhone = this.formatPhoneNumber(user.phone)
        } else {
            formattedPhone = this.formatPhoneNumber(cleanInput)
        }

        if (!formattedPhone) {
            const error = new Error("A valid mobile phone number is required.")
            error.statusCode = 400
            throw error
        }

        const resendKey = `resend-otp:${formattedPhone}`
        if (await redisClient.get(resendKey)) {
            const error = new Error("Please wait 30 seconds before requesting another SMS code.")
            error.statusCode = 429
            throw error
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        await redisClient.set(`phone-otp:${formattedPhone}`, otp, { EX: 300 })

        // Check if there is an active pending registration in Redis and update its OTP
        const pendingRegJson = await redisClient.get(`phone-register:${formattedPhone}`)
        if (pendingRegJson) {
            const pendingData = JSON.parse(pendingRegJson)
            pendingData.otp = otp
            await redisClient.set(`phone-register:${formattedPhone}`, JSON.stringify(pendingData), { EX: 600 })
            if (pendingData.token) {
                await redisClient.set(`verify:${pendingData.token}`, JSON.stringify(pendingData), { EX: 600 })
                await redisClient.set(`verify-code:${otp}`, pendingData.token, { EX: 600 })
            }
        }

        // Send SMS OTP via Twilio Verify (channel: "sms")
        const activeTwilio = getTwilioClient()
        if (activeTwilio && config.twilio?.verifyServiceSid) {
            try {
                await activeTwilio.verify.v2
                    .services(config.twilio.verifyServiceSid)
                    .verifications.create({ to: formattedPhone, channel: "sms" })
                console.log(`[Twilio Verify SMS] Resend OTP sent to ${formattedPhone}`)
            } catch (twilioErr) {
                console.error(`[Twilio SMS Resend Error] ${twilioErr.message}. Storing simulated code fallback...`)
                await redisClient.set(`simulated-phone-otp:${formattedPhone}`, otp, { EX: 300 })
            }
        } else {
            await redisClient.set(`simulated-phone-otp:${formattedPhone}`, otp, { EX: 300 })
        }

        /*
        // ==========================================
        // [COMMENTED OUT: EMAIL VERIFICATION / SMTP / TWILIO EMAIL]
        // Switched to Twilio Phone SMS OTP as primary auth.
        // ==========================================
        */

        await redisClient.set(resendKey, "true", { EX: 30 })

        return {
            message: `A new verification code has been sent to ${formattedPhone} via SMS.`,
            phone: formattedPhone,
        }
    }

    /**
     * Google OAuth Login / Registration:
     * Supports both JWT ID tokens (from authorization code flow) and
     * access_tokens (from useGoogleLogin implicit flow).
     */
    async googleAuth({ idToken, credential, accessToken: incomingAccessToken, phone, res = null }) {
        const {
            googleId: verifiedGoogleId,
            email: verifiedEmail,
            name: verifiedName,
            avatar: verifiedAvatar,
        } = await verifyGoogleIdentity(
            { idToken, credential, accessToken: incomingAccessToken },
            { clientId: config.google.clientId, client: googleOAuthClient },
        )

        let formattedPhone = null
        if (phone) {
            formattedPhone = this.formatPhoneNumber(phone)
            if (formattedPhone && formattedPhone.length < 10) {
                const error = new Error("Please enter a valid 10-digit mobile phone number.")
                error.statusCode = 400
                throw error
            }
        }

        let user = null
        let isNewUser = false
        if (verifiedGoogleId) {
            user = await User.findOne({ googleId: verifiedGoogleId })
        }
        if (!user && verifiedEmail) {
            user = await User.findOne({ email: verifiedEmail.toLowerCase().trim() })
        }

        if (user) {
            if (user.status === USER_STATUS.BANNED || user.status === USER_STATUS.INACTIVE) {
                const error = new Error("Your account is inactive or suspended.")
                error.statusCode = 403
                throw error
            }
            if (user.googleId && user.googleId !== verifiedGoogleId) {
                const error = new Error("This email is linked to a different Google account.")
                error.statusCode = 401
                throw error
            }
            if (verifiedGoogleId && !user.googleId) user.googleId = verifiedGoogleId
            if (verifiedAvatar && !user.avatar) user.avatar = verifiedAvatar
            if (verifiedName && (!user.name || user.name === "Google Member" || user.name === "MeriJodi Member" || user.name === "New Member")) {
                user.name = verifiedName
            }
            if (formattedPhone && !user.phone) {
                const conflict = await User.findOne({ phone: formattedPhone, _id: { $ne: user._id } })
                if (conflict) {
                    const error = new Error("This mobile number is already registered with another account.")
                    error.statusCode = 400
                    throw error
                }
                user.phone = formattedPhone
                user.isPhoneVerified = true
            }
            user.isEmailVerified = true
            user.lastLogin = new Date()
            await user.save()

            // Also update initial profile if it was left with a placeholder name
            if (verifiedName) {
                await Profile.updateOne(
                    { userId: user._id, name: { $in: ["Google Member", "MeriJodi Member", "New Member", ""] } },
                    { $set: { name: verifiedName } }
                )
            }
        } else {
            isNewUser = true

            if (formattedPhone) {
                const conflict = await User.findOne({ phone: formattedPhone })
                if (conflict) {
                    const error = new Error("This mobile number is already registered with another account.")
                    error.statusCode = 400
                    throw error
                }
            }

            user = await User.create({
                name: verifiedName || "MeriJodi Member",
                email: verifiedEmail ? verifiedEmail.toLowerCase().trim() : undefined,
                phone: formattedPhone || undefined,
                googleId: verifiedGoogleId,
                avatar: verifiedAvatar,
                isEmailVerified: true,
                isPhoneVerified: Boolean(formattedPhone),
                isApproved: false,
                approvalStatus: "pending",
                status: USER_STATUS.PENDING_APPROVAL,
                lastLogin: new Date(),
            })

            // Create initial profile
            await Profile.findOneAndUpdate(
                { userId: user._id },
                {
                    userId: user._id,
                    name: user.name,
                    isVerified: false,
                    isApproved: false,
                    approvalStatus: "pending",
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            )
        }

        // Check if user already has an existing completed profile AND mobile number
        const userProfile = await Profile.findOne({ userId: user._id })
        const hasPhone = Boolean(user.phone && user.phone.trim().length >= 10)
        const needsPhone = !hasPhone
        const isProfileComplete = Boolean(
            userProfile &&
            (userProfile.profileCompletionPct >= 30 || userProfile.location?.city || userProfile.religion) &&
            hasPhone
        )

        // Generate dual tokens and cookies
        const { accessToken, refreshToken } = await generateToken(user._id, res)

        // Cache user in Redis
        await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user.toAuthJSON()))

        return {
            message: isNewUser ? "Account created successfully with Google." : "Google login successful.",
            user: user.toAuthJSON(),
            token: accessToken,
            accessToken,
            refreshToken,
            isNewUser,
            isProfileComplete,
            hasPhone,
            needsPhone,
        }
    }

    /**
     * Send SMS OTP via Twilio Verify
     */
    async sendPhoneOtp({ phone, reqIp = "127.0.0.1" }) {
        const formattedPhone = this.formatPhoneNumber(phone)
        if (!formattedPhone || formattedPhone.length < 10) {
            const error = new Error("Please enter a valid mobile phone number.")
            error.statusCode = 400
            throw error
        }

        const rateLimitKey = `phone-otp-rate:${reqIp}:${formattedPhone}`
        if (await redisClient.get(rateLimitKey)) {
            const error = new Error("Please wait 30 seconds before requesting another SMS code.")
            error.statusCode = 429
            throw error
        }

        const activeTwilio = getTwilioClient()
        if (activeTwilio && config.twilio?.verifyServiceSid) {
            try {
                const verification = await activeTwilio.verify.v2
                    .services(config.twilio.verifyServiceSid)
                    .verifications.create({ to: formattedPhone, channel: "sms" })

                await redisClient.set(rateLimitKey, "true", { EX: 30 })

                return {
                    message: `Verification code sent to ${formattedPhone}.`,
                    phone: formattedPhone,
                    sid: verification.sid,
                    status: verification.status,
                }
            } catch (err) {
                console.error("Twilio sendPhoneOtp error:", err.message)
                const error = new Error(`Failed to send SMS OTP: ${err.message}`)
                error.statusCode = 400
                throw error
            }
        }

        const simulatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
        await redisClient.set(`simulated-phone-otp:${formattedPhone}`, simulatedOtp, { EX: 300 })
        await redisClient.set(rateLimitKey, "true", { EX: 30 })

        return {
            message: `Verification code generated for ${formattedPhone}.`,
            phone: formattedPhone,
            simulated: true,
        }
    }

    /**
     * Verify Phone OTP via Twilio Verify
     */
    async verifyPhoneOtp({ phone, otp, userId = null }) {
        const formattedPhone = this.formatPhoneNumber(phone)
        const cleanOtp = String(otp || "").trim()

        if (!formattedPhone || !cleanOtp) {
            const error = new Error("Phone number and verification code are required.")
            error.statusCode = 400
            throw error
        }

        let isApproved = false

        const activeTwilio = getTwilioClient()
        if (activeTwilio && config.twilio?.verifyServiceSid) {
            try {
                const verificationCheck = await activeTwilio.verify.v2
                    .services(config.twilio.verifyServiceSid)
                    .verificationChecks.create({ to: formattedPhone, code: cleanOtp })

                isApproved = verificationCheck.status === "approved"
            } catch (err) {
                console.error("Twilio verifyPhoneOtp check error:", err.message)
            }
        }

        if (!isApproved) {
            const storedSimOtp = await redisClient.get(`simulated-phone-otp:${formattedPhone}`)
            if (storedSimOtp && storedSimOtp === cleanOtp) {
                isApproved = true
                await redisClient.del(`simulated-phone-otp:${formattedPhone}`)
            }
        }

        if (!isApproved) {
            const error = new Error("Invalid or expired SMS verification code.")
            error.statusCode = 400
            throw error
        }

        let updatedUser = null
        if (userId) {
            const existingUser = await User.findOne({ phone: formattedPhone, _id: { $ne: userId } })
            if (existingUser) {
                const error = new Error("This phone number is already registered with another account.")
                error.statusCode = 400
                throw error
            }

            updatedUser = await User.findByIdAndUpdate(
                userId,
                { phone: formattedPhone, isPhoneVerified: true },
                { new: true }
            )
            if (updatedUser) {
                await redisClient.setEx(`user:${userId}`, 3600, JSON.stringify(updatedUser.toAuthJSON()))
            }
        }

        return {
            message: "Phone number verified successfully!",
            phone: formattedPhone,
            verified: true,
            user: updatedUser ? updatedUser.toAuthJSON() : undefined,
        }
    }

    /**
     * Update User Phone Number
     */
    async updateUserPhone({ userId, phone }) {
        const formattedPhone = this.formatPhoneNumber(phone)
        if (!formattedPhone || formattedPhone.length < 10) {
            const error = new Error("Please provide a valid phone number (at least 10 digits).")
            error.statusCode = 400
            throw error
        }

        const existingUser = await User.findOne({ phone: formattedPhone, _id: { $ne: userId } })
        if (existingUser) {
            const error = new Error("This phone number is already associated with another account.")
            error.statusCode = 400
            throw error
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { phone: formattedPhone, isPhoneVerified: true },
            { new: true }
        )

        if (!updatedUser) {
            const error = new Error("User not found.")
            error.statusCode = 404
            throw error
        }

        await redisClient.setEx(`user:${userId}`, 3600, JSON.stringify(updatedUser.toAuthJSON()))

        return {
            message: "Phone number updated successfully.",
            user: updatedUser.toAuthJSON(),
        }
    }

    /**
     * Update User Profile (Name, Gender, Location, Phone)
     */
    async updateUserProfile({ userId, name, gender, location, phone }) {
        const updates = {}
        if (name?.trim()) updates.name = name.trim()
        if (gender?.trim()) updates.gender = gender.trim().toLowerCase()
        if (location?.trim()) updates.location = location.trim()
        if (phone?.trim()) {
            const formatted = this.formatPhoneNumber(phone)
            const existingPhone = await User.findOne({ phone: formatted, _id: { $ne: userId } })
            if (existingPhone) {
                const error = new Error("This phone number is already in use by another account.")
                error.statusCode = 400
                throw error
            }
            updates.phone = formatted
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true })
        if (!updatedUser) {
            const error = new Error("User not found.")
            error.statusCode = 404
            throw error
        }

        const profileUpdates = {}
        if (updates.name) profileUpdates.name = updates.name
        if (updates.gender) profileUpdates.gender = updates.gender
        if (updates.location) profileUpdates["location.city"] = updates.location

        if (Object.keys(profileUpdates).length > 0) {
            await Profile.findOneAndUpdate({ userId }, { $set: profileUpdates })
        }

        await redisClient.setEx(`user:${userId}`, 3600, JSON.stringify(updatedUser.toAuthJSON()))

        return {
            message: "Profile updated successfully.",
            user: updatedUser.toAuthJSON(),
        }
    }

    /**
     * Refresh Access Token
     */
    async refreshUserToken({ refreshToken, res = null }) {
        if (!refreshToken) {
            const error = new Error("Refresh token is required.")
            error.statusCode = 401
            throw error
        }

        const decoded = await verifyRefreshToken(refreshToken)
        if (!decoded) {
            const error = new Error("Invalid or expired refresh token. Please login again.")
            error.statusCode = 401
            throw error
        }

        const userId = decoded.userId || decoded.id
        const newAccessToken = generateAccessToken(userId, res)

        return {
            message: "Token refreshed successfully",
            token: newAccessToken,
            accessToken: newAccessToken,
        }
    }

    /**
     * Logout User: Revoke refresh token and clear cache
     */
    async logoutUser({ userId, res = null }) {
        if (userId) {
            await revokeRefreshToken(userId)
            await redisClient.del(`user:${userId}`)
        }

        if (res && res.clearCookie) {
            res.clearCookie("accessToken")
            res.clearCookie("refreshToken")
        }

        return { message: "Logged out successfully." }
    }

    /**
     * Get User by ID with Redis Cache
     */
    async getUserById(userId) {
        if (!userId) return null

        const cached = await redisClient.get(`user:${userId}`)
        if (cached) {
            try {
                return JSON.parse(cached)
            } catch (e) {
                // parse fallback
            }
        }

        const user = await User.findById(userId)
        if (user) {
            await redisClient.setEx(`user:${userId}`, 3600, JSON.stringify(user.toAuthJSON()))
            return user.toAuthJSON()
        }
        return null
    }

    /**
     * Forgot Password:
     * Generates a secure reset token and 6-digit OTP, stores in Redis (15 min TTL).
     * Email sending is commented out.
     */
    async forgotPassword({ email, reqIp = "127.0.0.1" }) {
        const cleanEmail = email.toLowerCase().trim()

        const rateLimitKey = `forgot-password-rate:${reqIp}:${cleanEmail}`
        if (await redisClient.get(rateLimitKey)) {
            const error = new Error("Please wait a few seconds before requesting another password reset.")
            error.statusCode = 429
            throw error
        }

        const user = await User.findOne({ email: cleanEmail })
        if (!user) {
            return {
                message: "If an account with this email exists, a password reset request has been initiated.",
            }
        }

        const resetToken = crypto.randomBytes(32).toString("hex")
        const resetOtp = Math.floor(100000 + Math.random() * 900000).toString()
        const resetKey = `password-reset:${resetToken}`
        const otpKey = `password-reset-otp:${resetOtp}`

        await redisClient.set(resetKey, JSON.stringify({ userId: user._id.toString(), email: cleanEmail }), { EX: 900 })
        await redisClient.set(otpKey, resetToken, { EX: 900 })

        /*
        // ==========================================
        // [COMMENTED OUT: EMAIL VERIFICATION / SMTP / TWILIO EMAIL]
        // ==========================================
        const baseUrl = config.frontendUrl || config.frontendDomain || "http://localhost:5173"
        const resetUrl = `${baseUrl.replace(/\/+$/, "")}/reset-password/${encodeURIComponent(resetToken)}`
        const subject = `${resetOtp} is your ${config.appName} password reset code`
        const html = getResetPasswordHtml({ email: cleanEmail, token: resetToken, otp: resetOtp, appName: config.appName })
        await sendMail({ email: cleanEmail, subject, html, text: `Your code: ${resetOtp}` })
        */

        await redisClient.set(rateLimitKey, "true", { EX: 5 })

        return {
            message: "Password reset request initiated.",
            sentTo: cleanEmail,
            token: resetToken,
        }
    }

    /**
     * Reset Password:
     * Validates the reset token or 6-digit OTP code from Redis and updates the user's password.
     */
    async resetPassword({ token, newPassword }) {
        if (!token || !newPassword) {
            const error = new Error("Reset token (or code) and new password are required.")
            error.statusCode = 400
            throw error
        }

        if (newPassword.length < 6) {
            const error = new Error("Password must be at least 6 characters long.")
            error.statusCode = 400
            throw error
        }

        const input = String(token).trim()
        let resolvedToken = input

        // If input is a 6-digit OTP code, resolve token from redis
        if (/^\d{6}$/.test(input)) {
            const mappedToken = await redisClient.get(`password-reset-otp:${input}`)
            if (mappedToken) {
                resolvedToken = mappedToken
            }
        }

        const resetKey = `password-reset:${resolvedToken}`
        const dataJson = await redisClient.get(resetKey)

        if (!dataJson) {
            const error = new Error("Password reset link or code has expired or is invalid.")
            error.statusCode = 400
            throw error
        }

        await redisClient.del(resetKey)

        const { userId } = JSON.parse(dataJson)
        const user = await User.findById(userId)
        if (!user) {
            const error = new Error("User account not found.")
            error.statusCode = 404
            throw error
        }

        await user.setPassword(newPassword)
        await user.save()

        await redisClient.del(`user:${userId}`)

        return {
            message: "Your password has been reset successfully. You can now log in with your new password.",
        }
    }

    /**
     * Change Password:
     * For authenticated users to update their password by providing old + new password.
     */
    async changePassword({ userId, currentPassword, newPassword }) {
        if (!currentPassword || !newPassword) {
            const error = new Error("Current password and new password are required.")
            error.statusCode = 400
            throw error
        }

        if (newPassword.length < 6) {
            const error = new Error("New password must be at least 6 characters long.")
            error.statusCode = 400
            throw error
        }

        const user = await User.findById(userId)
        if (!user) {
            const error = new Error("User not found.")
            error.statusCode = 404
            throw error
        }

        if (!user.passwordHash) {
            const error = new Error("Your account uses Google sign-in. Password change is not available.")
            error.statusCode = 400
            throw error
        }

        const isValid = await user.validatePassword(currentPassword)
        if (!isValid) {
            const error = new Error("Current password is incorrect.")
            error.statusCode = 400
            throw error
        }

        await user.setPassword(newPassword)
        await user.save()

        await redisClient.del(`user:${userId}`)

        return {
            message: "Your password has been changed successfully.",
        }
    }
}

const authService = new AuthService()
export { authService }
export default authService
