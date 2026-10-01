import { useEffect, useState, useRef } from "react"
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { verifyEmailToken } from "../api/authApi"
import logo from "../assets/logo2.png"
import OtpBoxInput from "../Components/OtpBoxInput"

const VerifyEmailPage = () => {
    const { token: routeToken } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { signIn } = useAuth()

    const token = routeToken || searchParams.get("token") || searchParams.get("code") || ""

    const [status, setStatus] = useState(token ? "verifying" : "input") // 'verifying' | 'success' | 'error' | 'input'
    const [message, setMessage] = useState("")
    const [manualCode, setManualCode] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const hasCalledRef = useRef(false)

    const doVerify = async (tokenToVerify) => {
        setSubmitting(true)
        setStatus("verifying")
        try {
            const data = await verifyEmailToken(tokenToVerify)
            setStatus("success")
            setMessage(data.message || "Your email has been verified successfully!")
            if (data.token || data.accessToken) {
                signIn(data.token || data.accessToken, data.user)
            }
            setTimeout(() => {
                navigate("/complete-profile")
            }, 2500)
        } catch (err) {
            setStatus("error")
            setMessage(
                err.response?.data?.message ||
                    "Verification link or code has expired or is invalid. Please enter your 6-digit code or sign up again."
            )
        } finally {
            setSubmitting(false)
        }
    }

    useEffect(() => {
        if (!token) {
            setStatus("input")
            return
        }

        if (hasCalledRef.current) return
        hasCalledRef.current = true

        doVerify(token)
    }, [token])

    const handleManualSubmit = (e) => {
        if (e?.preventDefault) e.preventDefault()
        if (!manualCode.trim()) return
        doVerify(manualCode.trim())
    }

    return (
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#FFE4E8] p-8 sm:p-10 text-center">
                <img src={logo} alt="MeriJodi" className="h-10 mx-auto mb-6" />

                {status === "verifying" && (
                    <div className="py-8">
                        <div className="w-14 h-14 border-4 border-[#FFE4E8] border-t-[#ED5463] rounded-full animate-spin mx-auto mb-6"></div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2 font-serif">Verifying Your Email...</h2>
                        <p className="text-sm text-[#6B7280]">
                            Please hold on while we verify your account credentials.
                        </p>
                    </div>
                )}

                {status === "success" && (
                    <div className="py-6">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
                            ✓
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-serif">Account Verified!</h2>
                        <p className="text-sm text-[#4B5563] mb-6">{message}</p>
                        <p className="text-xs text-[#9CA3AF] mb-6">Redirecting to profile setup in a few seconds...</p>
                        <button
                            onClick={() => navigate("/complete-profile")}
                            className="w-full rounded-full bg-[#ED5463] py-3 text-white font-semibold text-sm hover:bg-[#D4384B] transition-all shadow-md cursor-pointer"
                        >
                            Continue to Profile Setup →
                        </button>
                    </div>
                )}

                {(status === "error" || status === "input") && (
                    <div className="py-4">
                        {status === "error" ? (
                            <div className="mb-6">
                                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                                    ⚠️
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2 font-serif">Verification Needed</h2>
                                <p className="text-xs text-[#6B7280] mb-4">{message}</p>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <div className="w-14 h-14 bg-[#FFF0F2] text-[#ED5463] rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                                    ✉️
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2 font-serif">Verify Your Account</h2>
                                <p className="text-xs text-[#6B7280] mb-4">
                                    Please enter the 6-digit verification code sent to your email.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-center gap-2 mb-6">
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

                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <OtpBoxInput
                                value={manualCode}
                                onChange={setManualCode}
                                error={status === "error"}
                                idPrefix="verify-email-otp"
                            />
                            <button
                                type="submit"
                                disabled={String(manualCode || "").length !== 6 || submitting}
                                className="w-full rounded-full bg-[#ED5463] py-3 text-white font-semibold text-sm hover:bg-[#D4384B] disabled:opacity-50 transition-all shadow-md cursor-pointer"
                            >
                                {submitting ? "Verifying..." : "Verify Code →"}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
                            <Link
                                to="/register"
                                className="block text-xs text-[#ED5463] font-semibold hover:underline"
                            >
                                Need a new account? Sign up here
                            </Link>
                            <Link
                                to="/login"
                                className="block text-xs text-gray-500 hover:text-gray-700"
                            >
                                Back to Sign In
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VerifyEmailPage
