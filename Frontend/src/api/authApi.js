import axios from "axios"

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
const AUTH_BASE = BASE.replace(/\/api\/v1\/?$/, "/api/auth")

const unwrap = (response) => response.data?.data ?? response.data

const getToken = () => localStorage.getItem("token")

export const authApi = axios.create({
    baseURL: AUTH_BASE,
    timeout: 20000,
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
 * Sends email verification link via Nodemailer
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
 * Verify email verification link token
 */
export const verifyEmailToken = async (token) => {
    const res = await authApi.post(`/verify/${token}`)
    return unwrap(res)
}

/**
 * Step 1: Login with Email & Password
 * Triggers 6-digit OTP to user's email via Nodemailer
 */
export const loginWithEmail = async (email, password) => {
    const res = await authApi.post("/login", { email, password })
    return unwrap(res)
}

/**
 * Step 2: Verify Login OTP
 * Validates OTP from email and returns tokens
 */
export const verifyLoginOtp = async ({ email, otp }) => {
    const res = await authApi.post("/verify", { email, otp })
    return unwrap(res)
}

/**
 * Resend OTP code to email
 */
export const resendLoginOtp = async (email) => {
    const res = await authApi.post("/resend-otp", { email })
    return unwrap(res)
}

/**
 * Google OAuth Login & Registration
 */
export const googleAuth = async ({ idToken, credential, accessToken, email, name, googleId, avatar }) => {
    const res = await authApi.post("/google", {
        idToken,
        credential,
        accessToken,
        email,
        name,
        googleId,
        avatar,
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
export const sendOtp = async (emailOrPhone) => {
    // If phone or email, route to login or resend
    if (emailOrPhone?.includes?.("@")) {
        return resendLoginOtp(emailOrPhone)
    }
    const res = await authApi.post("/login", { email: emailOrPhone, password: "temp_otp_pass" })
    return unwrap(res)
}

export const verifyOtp = async (emailOrPhone, code, _name) => {
    if (emailOrPhone?.includes?.("@")) {
        return verifyLoginOtp({ email: emailOrPhone, otp: code })
    }
    const res = await authApi.post("/verify", { email: emailOrPhone, otp: code })
    return unwrap(res)
}

/**
 * Request a password reset email
 */
export const forgotPassword = async (email) => {
    const res = await authApi.post("/forgot-password", { email })
    return unwrap(res)
}

/**
 * Reset password using the token from the email link
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
