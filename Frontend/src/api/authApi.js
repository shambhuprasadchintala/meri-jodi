import axios from "axios"
import { AUTH_BASE_URL, API_TIMEOUT_MS } from "./apiConfig"

const unwrap = (response) => response.data?.data ?? response.data

const getToken = () => localStorage.getItem("token")

export const authApi = axios.create({
    baseURL: AUTH_BASE_URL,
    timeout: API_TIMEOUT_MS,
    withCredentials: true,
})

authApi.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Auto-refresh token interceptor on 401
authApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes("/login") &&
            !originalRequest.url.includes("/register") &&
            !originalRequest.url.includes("/refresh")
        ) {
            originalRequest._retry = true
            try {
                const refreshRes = await authApi.post("/refresh")
                const newToken = refreshRes.data?.data?.token || refreshRes.data?.data?.accessToken
                if (newToken) {
                    localStorage.setItem("token", newToken)
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return authApi(originalRequest)
                }
            } catch (_refreshErr) {
                localStorage.removeItem("token")
            }
        }
        return Promise.reject(error)
    }
)

/**
 * Register a new user:
 * Sends SMS OTP to user's phone via Twilio Verify
 */
export const registerUser = async ({ name, email, password, phone, gender, location }) => {
    const res = await authApi.post("/register", {
        name,
        email,
        password,
        phone,
        gender,
        location,
    })
    return unwrap(res)
}

/**
 * Verify registration OTP or verification token
 */
export const verifyEmailToken = async (tokenOrOtp, phone = null) => {
    const res = await authApi.post(`/verify/${tokenOrOtp}`, { phone, otp: tokenOrOtp })
    return unwrap(res)
}

export const verifyRegistrationOtp = async ({ phone, otp, token }) => {
    const res = await authApi.post("/verify", { phone, otp, token })
    return unwrap(res)
}

/**
 * Step 1: Login with Phone/Email & Password
 * Triggers 6-digit SMS OTP to user's phone via Twilio Verify
 */
export const loginWithCredentials = async ({ phone, email, identifier, password }) => {
    const res = await authApi.post("/login", { phone, email, identifier, password })
    return unwrap(res)
}

export const loginWithEmail = async (email, password) => {
    const res = await authApi.post("/login", { email, password })
    return unwrap(res)
}

export const loginWithPhone = async (phone, password) => {
    const res = await authApi.post("/login", { phone, password })
    return unwrap(res)
}

/**
 * Step 2: Verify Login OTP
 * Validates SMS OTP and returns dual tokens + user
 */
export const verifyLoginOtp = async ({ phone, email, otp }) => {
    const res = await authApi.post("/verify", { phone, email, otp })
    return unwrap(res)
}

/**
 * Resend SMS OTP code
 */
export const resendLoginOtp = async (phoneOrEmail) => {
    const isEmail = typeof phoneOrEmail === "string" && phoneOrEmail.includes("@")
    const payload = typeof phoneOrEmail === "object"
        ? phoneOrEmail
        : isEmail
        ? { email: phoneOrEmail }
        : { phone: phoneOrEmail }

    const res = await authApi.post("/resend-otp", payload)
    return unwrap(res)
}

/**
 * Google OAuth Login & Registration
 */
export const googleAuth = async ({ idToken, credential, accessToken, email, name, googleId, avatar, phone }) => {
    const res = await authApi.post("/google", {
        idToken,
        credential,
        accessToken,
        email,
        name,
        googleId,
        avatar,
        phone,
    })
    return unwrap(res)
}

export const loginWithGoogle = googleAuth

/**
 * Get current authenticated user
 */
export const getMe = async () => {
    const res = await authApi.get("/me")
    return unwrap(res)
}

/**
 * Log out user and revoke session
 */
export const logoutUser = async () => {
    try {
        const res = await authApi.post("/logout")
        return unwrap(res)
    } finally {
        localStorage.removeItem("token")
    }
}

// Aliases for compatibility
export const sendOtp = async (phoneOrEmail) => {
    return resendLoginOtp(phoneOrEmail)
}

export const verifyOtp = async (phoneOrEmail, code, _name) => {
    const isEmail = phoneOrEmail?.includes?.("@")
    if (isEmail) {
        return verifyLoginOtp({ email: phoneOrEmail, otp: code })
    }
    const res = await authApi.post("/verify", { phone: phoneOrEmail, otp: code })
    return unwrap(res)
}

/**
 * Request a password reset code
 */
export const forgotPassword = async (email) => {
    const res = await authApi.post("/forgot-password", { email })
    return unwrap(res)
}

/**
 * Reset password using the token/code
 */
export const resetPassword = async (token, newPassword) => {
    const res = await authApi.post(`/reset-password/${token}`, { newPassword })
    return unwrap(res)
}

/**
 * Change password for authenticated users
 */
export const changePassword = async (currentPassword, newPassword) => {
    const res = await authApi.put("/change-password", { currentPassword, newPassword })
    return unwrap(res)
}

/**
 * Send SMS OTP via Twilio
 */
export const sendPhoneOtp = async (phone) => {
    const res = await authApi.post("/phone/send-otp", { phone })
    return unwrap(res)
}

/**
 * Verify SMS OTP via Twilio
 */
export const verifyPhoneOtp = async (phone, otp) => {
    const res = await authApi.post("/phone/verify-otp", { phone, otp })
    return unwrap(res)
}

/**
 * Update authenticated user's phone number
 */
export const updateUserPhone = async (phone) => {
    const res = await authApi.put("/phone", { phone })
    return unwrap(res)
}

/**
 * Update authenticated user profile fields (name, gender, location, phone)
 */
export const updateUserProfile = async ({ name, gender, location, phone }) => {
    const res = await authApi.put("/me", { name, gender, location, phone })
    return unwrap(res)
}
