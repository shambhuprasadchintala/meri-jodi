import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { loginWithEmail, verifyLoginOtp, resendLoginOtp, googleAuth } from "../api/authApi"
import logo from "../assets/logo2.png"
import OtpBoxInput from "../Components/OtpBoxInput"

import { useGoogleLogin } from "@react-oauth/google"

const LoginPage = () => {
    const navigate = useNavigate()
    const { signIn, isAuth } = useAuth()

    useEffect(() => {
        if (isAuth) navigate("/home", { replace: true })
    }, [isAuth, navigate])

    const [step, setStep] = useState("credentials") // 'credentials' | 'otp'
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [otp, setOtp] = useState("")
    const [error, setError] = useState("")
    const [infoMsg, setInfoMsg] = useState("")
    const [loading, setLoading] = useState(false)
    const [resendTimer, setResendTimer] = useState(60)
    const [canResend, setCanResend] = useState(false)

    const googleLoginHook = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true)
            setError("")
            try {
                const data = await googleAuth({
                    accessToken: tokenResponse.access_token,
                })
                try {
                    localStorage.removeItem("merijodi_draft_profile")
                    localStorage.removeItem("merijodi_draft_step")
                    localStorage.removeItem("merijodi_draft_userId")
                } catch (_) {}
                signIn(data.token || data.accessToken, data.user)
                if (!data.isNewUser || data.isProfileComplete) {
                    navigate("/home")
                } else {
                    navigate("/complete-profile")
                }
            } catch (err) {
                setError(err.response?.data?.message || "Google authentication failed.")
            } finally {
                setLoading(false)
            }
        },
        onError: () => {
            setError("Google Sign-In was cancelled or failed.")
        },
    })

    const handleGoogleLogin = () => {
        setError("")
        if (!import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID.includes("dummy")) {
            setError("Google Client ID is not configured. Please add your real Google OAuth Client ID to Frontend/.env (VITE_GOOGLE_CLIENT_ID) to use Google Sign-In.")
            return
        }
        googleLoginHook()
    }
    useEffect(() => {
        let timer
        if (step === "otp" && resendTimer > 0 && !canResend) {
            timer = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        setCanResend(true)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => clearInterval(timer)
    }, [step, resendTimer, canResend])

    // Step 1: Submit email & password
    const handleCredentialsSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setInfoMsg("")

        if (!email.trim() || !password) {
            setError("Please enter your email and password.")
            return
        }

        setLoading(true)
        try {
            const data = await loginWithEmail(email.trim(), password)
            setInfoMsg(data.message || "Verification code sent to your email.")
            setOtp("")
            setStep("otp")
            setResendTimer(60)
            setCanResend(false)
        } catch (err) {
            setError(err.response?.data?.message || "Invalid email or password.")
        } finally {
            setLoading(false)
        }
    }

    // Step 2: Submit OTP verification
    const handleOtpSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault()
        setError("")
        const otpCode = String(otp || "").trim()
        if (otpCode.length !== 6) {
            setError("Please enter the complete 6-digit verification code.")
            return
        }

        setLoading(true)
        try {
            const data = await verifyLoginOtp({ email: email.trim(), otp: otpCode })
            try {
                localStorage.removeItem("merijodi_draft_profile")
                localStorage.removeItem("merijodi_draft_step")
                localStorage.removeItem("merijodi_draft_userId")
            } catch (_) {}
            signIn(data.token || data.accessToken, data.user)
            navigate("/home")
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired verification code.")
        } finally {
            setLoading(false)
        }
    }

    // Resend OTP code
    const handleResendOtp = async () => {
        setError("")
        setLoading(true)
        try {
            await resendLoginOtp(email.trim())
            setInfoMsg("A new verification code has been sent to your email.")
            setResendTimer(60)
            setCanResend(false)
        } catch (err) {
            setError(err.response?.data?.message || "Unable to resend code right now.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex bg-[#FAF8F5]">
            {/* Left Hero Section (Desktop) */}
            <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-[#FFF0F2] to-[#FFE4E8] flex-col justify-between p-12 border-r border-[#FFE4E8]">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="MeriJodi" className="h-10" />
                </div>
                <div className="my-auto max-w-md">
                    <span className="inline-block px-3 py-1 bg-[#ED5463]/10 text-[#ED5463] text-xs font-semibold rounded-full mb-4">
                        Secure & Verified Matches
                    </span>
                    <h2 className="text-4xl font-extrabold text-[#842029] leading-tight mb-4 font-serif">
                        Where Trusted Indian Matrimony Begins.
                    </h2>
                    <p className="text-[#6B7280] text-base leading-relaxed">
                        Connect with verified profiles, find your ideal partner, and embark on a beautiful lifelong journey.
                    </p>
                </div>
                <div className="text-xs text-[#9CA3AF]">
                    © {new Date().getFullYear()} MeriJodi. All rights reserved.
                </div>
            </div>

            {/* Right Form Section */}
            <div className="w-full lg:w-7/12 flex flex-col justify-center items-center px-4 sm:px-8 md:px-16 py-8 sm:py-12">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <img src={logo} alt="MeriJodi" className="h-9 mx-auto mb-2" />
                        <p className="text-xs text-[#6B7280]">Where Beautiful Stories Begin</p>
                    </div>

                    {step === "credentials" ? (
                        /* STEP 1: Email & Password */
                        <div>
                            <div className="mb-8">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-serif">
                                    Welcome Back
                                </h1>
                                <p className="text-sm text-[#6B7280]">
                                    Sign in with your email address to access your MeriJodi account.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#ED5463] focus:ring-2 focus:ring-[#ED5463]/20 focus:outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-11 text-sm focus:border-[#ED5463] focus:ring-2 focus:ring-[#ED5463]/20 focus:outline-none transition-all"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="flex justify-end mt-1.5">
                                        <Link to="/forgot-password" className="text-xs text-[#ED5463] font-semibold hover:underline">
                                            Forgot Password?
                                        </Link>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-full bg-[#ED5463] py-3.5 text-white font-semibold text-sm shadow-md hover:bg-[#D4384B] hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                                >
                                    {loading ? "Sending verification code..." : "Sign In with Email"}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400">
                                    <span className="bg-[#FAF8F5] px-3">or continue with</span>
                                </div>
                            </div>

                            {/* Google Sign-In */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 rounded-full border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-60"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                </svg>
                                Continue with Google
                            </button>

                            {/* Sign up link */}
                            <div className="mt-8 text-center text-sm text-[#6B7280]">
                                New to MeriJodi?{" "}
                                <Link to="/register" className="text-[#ED5463] font-bold hover:underline">
                                    Create Free Account
                                </Link>
                            </div>
                        </div>
                    ) : (
                        /* STEP 2: Enter Email OTP */
                        <div>
                            <div className="mb-6">
                                <button
                                    onClick={() => setStep("credentials")}
                                    className="text-xs text-[#6B7280] hover:text-gray-900 font-medium mb-4 flex items-center gap-1.5 transition-colors"
                                >
                                    ← Back to Sign In
                                </button>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-serif">
                                    Enter Security Code
                                </h1>
                                <p className="text-sm text-[#6B7280]">
                                    We sent a 6-digit verification code to <span className="font-semibold text-gray-800">{email}</span>.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <a
                                        href="https://mail.google.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-[#ED5463] hover:bg-[#ED5463] hover:text-white border border-[#ED5463]/30 transition-all shadow-xs"
                                    >
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                        </svg>
                                        Open Gmail Inbox ↗
                                    </a>
                                    <a
                                        href="https://outlook.live.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all"
                                    >
                                        Open Webmail ↗
                                    </a>
                                </div>
                            </div>

                            {infoMsg && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm rounded-xl">
                                    ✓ {infoMsg}
                                </div>
                            )}

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
                                    <span>⚠️</span> {error}
                                </div>
                            )}

                            <form onSubmit={handleOtpSubmit} className="space-y-6">
                                <OtpBoxInput
                                    value={otp}
                                    onChange={setOtp}
                                    error={Boolean(error)}
                                    idPrefix="login-otp"
                                />

                                <div className="text-center text-xs sm:text-sm text-[#6B7280]">
                                    Didn't receive the code?{" "}
                                    {canResend ? (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            className="text-[#ED5463] font-bold hover:underline"
                                        >
                                            Resend Code
                                        </button>
                                    ) : (
                                        <span className="font-semibold text-gray-500">Resend in {resendTimer}s</span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || String(otp || "").length !== 6}
                                    className="w-full rounded-full bg-[#ED5463] py-3.5 text-white font-semibold text-sm shadow-md hover:bg-[#D4384B] hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Verifying..." : "Verify & Sign In"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default LoginPage
