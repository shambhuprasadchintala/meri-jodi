import { useState } from "react"
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom"
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, KeyRound, ArrowLeft } from "lucide-react"
import { resetPassword } from "../api/authApi"

export default function ResetPasswordPage() {
    const { token: routeToken } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const initialToken = routeToken || searchParams.get("token") || searchParams.get("code") || ""
    const [token, setToken] = useState(initialToken)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if (!token.trim()) {
            return setError("Please enter your 6-digit verification code or reset token.")
        }
        if (password.length < 6) {
            return setError("Password must be at least 6 characters long.")
        }
        if (password !== confirmPassword) {
            return setError("Passwords do not match.")
        }

        setLoading(true)
        try {
            await resetPassword(token.trim(), password)
            setSuccess(true)
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password. The code or link may have expired.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-[#FBF9F9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-10 px-6 shadow-xl shadow-red-900/5 rounded-3xl border border-[#FFE4E8] text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 font-serif mb-2">Password Reset Successful</h2>
                        <p className="text-sm text-gray-600 mb-8">
                            Your password has been successfully updated. You can now log in with your new credentials.
                        </p>
                        <button
                            onClick={() => navigate("/login")}
                            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#640515] hover:bg-[#4a0410] focus:outline-none transition-colors cursor-pointer"
                        >
                            Continue to Login <ArrowRight size={16} className="ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FBF9F9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex justify-center mb-8">
                    <h2 className="text-3xl font-bold text-[#640515] font-serif">MeriJodi</h2>
                </Link>

                <div className="bg-white py-8 px-5 sm:px-10 shadow-xl shadow-red-900/5 rounded-3xl border border-[#FFE4E8]">
                    <div className="mb-6">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                            <ArrowLeft size={16} className="mr-2" />
                            Back to login
                        </Link>
                        <h2 className="text-2xl font-bold text-gray-900 font-serif mb-1">Create New Password</h2>
                        <p className="text-sm text-gray-600">
                            Enter your reset code and set a fresh, secure password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                                {error}
                            </div>
                        )}

                        {/* Reset Token or 6-digit OTP code input */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                                6-Digit Code or Reset Token *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <KeyRound className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter 6-digit code or paste token"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.trim())}
                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#640515] focus:border-[#640515] text-sm transition-colors font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                                New Password *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#640515] focus:border-[#640515] text-sm transition-colors"
                                    placeholder="Minimum 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                                Confirm New Password *
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="appearance-none block w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#640515] focus:border-[#640515] text-sm transition-colors"
                                    placeholder="Re-enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || !token || !password || !confirmPassword}
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#640515] hover:bg-[#4a0410] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#640515] disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                {loading ? "Resetting Password..." : "Reset Password"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
