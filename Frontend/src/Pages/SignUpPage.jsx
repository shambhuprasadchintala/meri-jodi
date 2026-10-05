import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Eye, EyeOff, ShieldCheck, Mail, Lock, User, Phone, MapPin } from "lucide-react"
import { registerUser, googleAuth } from "../api/authApi"
import { useAuth } from "../context/AuthContext"
import GooglePhoneModal from "../Components/GooglePhoneModal"
import logo from "../assets/logo2.png"

import { useGoogleLogin } from "@react-oauth/google"

const SignUpPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { signIn, updateUser } = useAuth()

    const [name, setName] = useState(location.state?.name || "")
    const [email, setEmail] = useState(location.state?.email || "")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [gender, setGender] = useState(location.state?.gender ? String(location.state.gender).toLowerCase() : "female")
    const [locationCity, setLocationCity] = useState(location.state?.city || location.state?.location || "")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    // Google Phone Capture Modal State
    const [showPhoneModal, setShowPhoneModal] = useState(false)
    const [pendingGoogleData, setPendingGoogleData] = useState(null)

    // Direct registration without SMS OTP
    const handleSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault()
        setError("")

        if (!name.trim()) {
            setError("Please enter your full name.")
            return
        }

        const cleanEmail = email.trim().toLowerCase()
        if (!cleanEmail || !cleanEmail.includes("@")) {
            setError("Please enter a valid email address.")
            return
        }

        const cleanPhone = phone.trim().replace(/\D/g, "")
        if (cleanPhone.length !== 10) {
            setError("Please enter a valid 10-digit mobile phone number.")
            return
        }

        if (!password || password.length < 6) {
            setError("Password must be at least 6 characters long.")
            return
        }

        setLoading(true)
        try {
            const formattedPhone = `+91${cleanPhone}`

            const data = await registerUser({
                name: name.trim(),
                email: cleanEmail,
                password,
                phone: formattedPhone,
                gender,
                location: locationCity.trim() || undefined,
            })

            // Clear draft keys from local storage
            try {
                localStorage.removeItem("merijodi_draft_profile")
                localStorage.removeItem("merijodi_draft_step")
                localStorage.removeItem("merijodi_draft_userId")
            } catch (_) {}

            // Sign in directly and navigate to profile setup
            if (data.token || data.accessToken) {
                signIn(data.token || data.accessToken, data.user)
                navigate("/complete-profile")
            } else {
                navigate("/login", { state: { message: "Registration successful. Please log in." } })
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please check your details and try again.")
        } finally {
            setLoading(false)
        }
    }

    const googleRegisterHook = useGoogleLogin({
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

                // If Google user has no phone number, prompt for mandatory phone capture
                const userPhone = data.user?.phone
                if (data.needsPhone || !userPhone || String(userPhone).trim().length < 10) {
                    setPendingGoogleData(data)
                    setShowPhoneModal(true)
                } else {
                    if (data.isNewUser || !data.isProfileComplete) {
                        navigate("/complete-profile")
                    } else {
                        navigate("/home")
                    }
                }
            } catch (err) {
                setError(err.response?.data?.message || "Google registration failed. Please try again.")
            } finally {
                setLoading(false)
            }
        },
        onError: () => {
            setError("Google Registration was cancelled or failed.")
        },
    })

    const handleGoogleRegister = () => {
        setError("")
        if (!import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID.includes("dummy")) {
            setError("Google Client ID is not configured. Please add your real Google OAuth Client ID to Frontend/.env (VITE_GOOGLE_CLIENT_ID) to register with Google.")
            return
        }
        googleRegisterHook()
    }

    const handleGooglePhoneSuccess = (updatedUser) => {
        setShowPhoneModal(false)
        updateUser(updatedUser)
        navigate("/complete-profile")
    }

    return (
        <div className="min-h-screen w-full flex bg-[#FAF8F5]">
            {/* Left Brand Banner */}
            <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-[#FFF0F2] to-[#FFE4E8] flex-col justify-between p-12 border-r border-[#FFE4E8]">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="MeriJodi" className="h-10" />
                </div>
                <div className="my-auto max-w-md">
                    <span className="inline-block px-3 py-1 bg-[#ED5463]/10 text-[#ED5463] text-xs font-semibold rounded-full mb-4">
                        100% Verified Profiles
                    </span>
                    <h2 className="text-4xl font-extrabold text-[#842029] leading-tight mb-4 font-serif">
                        Begin Your Search for a Soulmate.
                    </h2>
                    <p className="text-[#6B7280] text-base leading-relaxed">
                        Create your profile with email and mobile verification to find compatible life partners across India.
                    </p>
                </div>
                <div className="text-xs text-[#9CA3AF]">
                    © {new Date().getFullYear()} MeriJodi. All rights reserved. • Support: +91 84463 60709
                </div>
            </div>

            {/* Right Registration Form */}
            <div className="w-full lg:w-7/12 flex flex-col justify-center items-center px-4 sm:px-8 md:px-16 py-8 sm:py-12">
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-6 text-center">
                        <img src={logo} alt="MeriJodi" className="h-9 mx-auto mb-2" />
                        <p className="text-xs text-[#6B7280]">Where Beautiful Stories Begin</p>
                    </div>

                    <div className="mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-serif">
                            Create Your Account
                        </h1>
                        <p className="text-sm text-[#6B7280]">
                            Join thousands of verified members on India's most trusted matrimony platform.
                        </p>
                    </div>

                    <div>
                        {error && (
                            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="e.g. Priya Sharma"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-[#ED5463] focus:ring-2 focus:ring-[#ED5463]/20 focus:outline-none transition-all"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                                    Email Address * (For Login & Security)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-[#ED5463] focus:ring-2 focus:ring-[#ED5463]/20 focus:outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                                    Mobile Phone Number * (Required)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 text-sm font-medium">
                                        +91
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="9876543210"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                                        maxLength={10}
                                        required
                                        className="w-full rounded-xl border border-gray-300 pl-12 pr-4 py-2.5 text-sm font-medium focus:border-[#ED5463] focus:ring-2 focus:ring-[#ED5463]/20 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                                        Gender *
                                    </label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-[#ED5463] focus:ring-2 focus:ring-[#ED5463]/20 focus:outline-none transition-all bg-white"
                                    >
                                        <option value="male">Bridegroom (Male)</option>
                                        <option value="female">Bride (Female)</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                                        City / Location
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <MapPin className="w-3.5 h-3.5" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="e.g. Mumbai, Pune"
                                            value={locationCity}
                                            onChange={(e) => setLocationCity(e.target.value)}
                                            className="w-full rounded-xl border border-gray-300 pl-8 pr-3 py-2.5 text-sm focus:border-[#ED5463] focus:ring-2 focus:ring-[#ED5463]/20 focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                                    Create Password * (Min 6 Characters)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Minimum 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 pl-10 pr-11 py-2.5 text-sm focus:border-[#ED5463] focus:ring-2 focus:ring-[#ED5463]/20 focus:outline-none transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-full bg-[#ED5463] py-3.5 text-white font-semibold text-sm shadow-md hover:bg-[#D4384B] hover:shadow-lg transition-all duration-200 disabled:opacity-60 mt-2 cursor-pointer flex items-center justify-center gap-2"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                {loading ? "Creating Account..." : "Create Account & Continue →"}
                            </button>
                        </form>

                        {/* Google Sign-Up */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400">
                                <span className="bg-[#FAF8F5] px-3">or</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleRegister}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 rounded-full border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-60 cursor-pointer"
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
                            Register with Google
                        </button>

                        <div className="mt-6 text-center text-sm text-[#6B7280]">
                            Already have an account?{" "}
                            <Link to="/login" className="text-[#ED5463] font-bold hover:underline">
                                Sign in here
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mandatory Google Mobile Phone Number Capture Modal */}
            <GooglePhoneModal
                isOpen={showPhoneModal}
                user={pendingGoogleData?.user}
                onSuccess={handleGooglePhoneSuccess}
                onCancel={() => setShowPhoneModal(false)}
            />
        </div>
    )
}

export default SignUpPage
