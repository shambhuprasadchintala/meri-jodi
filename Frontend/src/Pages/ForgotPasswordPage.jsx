import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Mail, CheckCircle2, KeyRound, ExternalLink, ArrowRight } from "lucide-react"
import { forgotPassword } from "../api/authApi"

export default function ForgotPasswordPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [devData, setDevData] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)
        try {
            const data = await forgotPassword(email.trim())
            setDevData(data)
            setSuccess(true)
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#FBF9F9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex justify-center mb-8">
                    <h2 className="text-3xl font-bold text-[#640515] font-serif">MeriJodi</h2>
                </Link>

                <div className="bg-white py-8 px-5 sm:px-10 shadow-xl shadow-red-900/5 rounded-3xl border border-[#FFE4E8]">
                    <div className="mb-6">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                            <ArrowLeft size={16} className="mr-2" />
                            Back to login
                        </Link>
                        <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Forgot Password</h2>
                        <p className="text-sm text-gray-600">
                            Enter your registered email address and we'll send you a password reset code and link.
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center py-4 space-y-5">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 font-serif mb-1">Check Your Email</h3>
                                <p className="text-sm text-gray-600">
                                    We've sent a 6-digit password reset code to <strong className="text-gray-900">{email}</strong>.
                                </p>
                            </div>

                            {/* Direct Action Buttons */}
                            <div className="flex flex-col gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}${devData?.devOtp ? `&code=${devData.devOtp}` : ""}`)}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-[#640515] hover:bg-[#4a0410] transition-colors cursor-pointer"
                                >
                                    <KeyRound size={16} /> Enter 6-Digit Code / Reset Password <ArrowRight size={16} />
                                </button>

                                <a
                                    href="https://mail.google.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-[#FFE4E8] rounded-xl text-xs font-semibold text-[#640515] bg-[#FFF5F6] hover:bg-[#FFE4E8] transition-colors"
                                >
                                    <ExternalLink size={14} /> Open Gmail Inbox ↗
                                </a>
                            </div>

                            {/* Dev Helper Banner if available */}
                            {devData?.devOtp && (
                                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-amber-900">⚡ Dev Quick Access Code:</span>
                                        <span className="font-mono font-extrabold text-sm text-amber-950 bg-amber-200/70 px-2.5 py-0.5 rounded-lg tracking-widest">{devData.devOtp}</span>
                                    </div>
                                    <Link
                                        to={`/reset-password/${devData.devToken || devData.devOtp}`}
                                        className="text-amber-800 underline hover:text-amber-950 block font-medium"
                                    >
                                        Click here to reset password directly →
                                    </Link>
                                </div>
                            )}

                            <div className="pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => { setSuccess(false); setEmail(""); setDevData(null); }}
                                    className="text-xs font-medium text-gray-500 hover:text-gray-800 underline cursor-pointer"
                                >
                                    Try another email address
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Email address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#640515] focus:border-[#640515] sm:text-sm transition-colors"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#640515] hover:bg-[#4a0410] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#640515] disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                    {loading ? "Sending reset code..." : "Send Reset Link & Code"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
