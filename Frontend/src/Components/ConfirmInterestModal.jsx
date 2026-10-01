import { Heart } from "lucide-react"
import { formatMaskedSurname } from "../utils/formatters"
import femaleProfile from "../assets/female_profile2.jpg"
import userImage from "../assets/user.jpg"

export default function ConfirmInterestModal({
    isOpen,
    onClose,
    onConfirm,
    profile = null,
    profileName = "This profile",
    profileImage = null,
    gender = "female",
    loading = false,
}) {
    if (!isOpen) return null

    const fallbackPhoto = gender === "female" ? femaleProfile : userImage
    const rawName = profile?.name || profileName || "Member"
    const displayName = formatMaskedSurname(rawName)
    const displayImage = profileImage || profile?.image || profile?.photos?.[0]?.url || fallbackPhoto

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-md sm:max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#FFE4E8] text-center">
                {/* Heart Icon Circle */}
                <div className="flex justify-center -mt-2 sm:mt-0">
                    <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#842029] shadow-lg text-white">
                        <Heart className="h-8 w-8 sm:h-10 sm:w-10 fill-white" strokeWidth={1.5} />
                    </div>
                </div>

                <div className="mt-5 border-t border-rose-100/80" />

                {/* Profile Mini Row */}
                <div className="mt-5 flex items-center justify-center gap-3">
                    <img
                        src={displayImage}
                        alt={displayName}
                        className="h-12 w-12 rounded-full object-cover border border-rose-200 shadow-2xs"
                        onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = fallbackPhoto
                        }}
                    />
                    <div className="text-left">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 font-serif">
                            {displayName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-gray-500 text-[11px] sm:text-xs">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span>Profile shared successfully</span>
                        </div>
                    </div>
                </div>

                {/* Modal Headings & Description */}
                <div className="mt-5">
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#640515]">
                        Confirm Interest Request
                    </h2>
                    <p className="mx-auto mt-2.5 max-w-sm sm:max-w-md text-xs sm:text-sm leading-relaxed text-gray-600">
                        You're about to send an interest request to this profile. If they accept, you'll be able to connect and start a conversation.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-7 flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="w-full sm:flex-1 py-3 rounded-full border border-gray-300 bg-white text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="w-full sm:flex-1 py-3 rounded-full bg-[#842029] text-white text-xs sm:text-sm font-semibold hover:bg-[#6b1b27] transition-all shadow-md cursor-pointer disabled:opacity-60"
                    >
                        {loading ? "Sending..." : "Confirm & Send"}
                    </button>
                </div>
            </div>
        </div>
    )
}
