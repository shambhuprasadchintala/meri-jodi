import { useState } from "react"
import { ShieldCheck, Phone, AlertCircle, HelpCircle } from "lucide-react"
import { updateUserPhone } from "../api/authApi"

/**
 * GooglePhoneModal
 * Displays when a user authenticates via Google for the first time and needs to provide their mandatory mobile number.
 */
const GooglePhoneModal = ({ isOpen, user, onSuccess, onCancel }) => {
    const [phone, setPhone] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        if (e?.preventDefault) e.preventDefault()
        setError("")

        const cleanPhone = phone.trim().replace(/\D/g, "")
        if (cleanPhone.length !== 10) {
            setError("Please enter a valid 10-digit Indian mobile number.")
            return
        }

        const formattedPhone = `+91${cleanPhone}`
        setLoading(true)

        try {
            const data = await updateUserPhone(formattedPhone)
            if (onSuccess) {
                onSuccess(data.user || { ...user, phone: formattedPhone, isPhoneVerified: true })
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save mobile number. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative border border-rose-100">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-rose-50 text-[#ED5463] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-200">
                        <Phone className="w-7 h-7" />
                    </div>
                    <span className="inline-block px-3 py-1 bg-[#ED5463]/10 text-[#ED5463] text-xs font-semibold rounded-full mb-2">
                        Verification Required
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900 font-serif">
                        Enter Mobile Number
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
                        To maintain trust and safety across MeriJodi, a verified 10-digit mobile phone number is required for all Google-authenticated members.
                    </p>
                    {user?.name && (
                        <div className="mt-3 py-1.5 px-3 bg-gray-50 rounded-xl text-xs text-gray-600 inline-flex items-center gap-2 border border-gray-100">
                            <span>Signing up as:</span>
                            <span className="font-semibold text-gray-800">{user.name}</span>
                            {user.email && <span className="text-gray-400">({user.email})</span>}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                            Mobile Phone Number *
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
                                autoFocus
                                className="w-full rounded-xl border border-gray-300 pl-12 pr-4 py-3 text-sm font-medium focus:border-[#ED5463] focus:ring-2 focus:ring-[#ED5463]/20 focus:outline-none transition-all"
                            />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                            Your phone number will only be visible to accepted matches.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || phone.trim().length !== 10}
                        className="w-full rounded-full bg-[#ED5463] py-3.5 text-white font-semibold text-sm shadow-md hover:bg-[#D4384B] hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        {loading ? "Saving Phone Number..." : "Save & Continue →"}
                    </button>

                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1 font-medium transition-colors"
                        >
                            Cancel and return
                        </button>
                    )}
                </form>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                    <HelpCircle className="w-3.5 h-3.5 text-[#ED5463]" />
                    <span>Need help? Contact support:</span>
                    <a href="tel:+918446360709" className="text-[#ED5463] font-semibold hover:underline">
                        +91 84463 60709
                    </a>
                </div>
            </div>
        </div>
    )
}

export default GooglePhoneModal
