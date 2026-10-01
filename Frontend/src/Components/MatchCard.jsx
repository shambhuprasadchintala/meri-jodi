import { MapPin, GraduationCap, Briefcase, X, EyeOff, MessageSquare, Clock, Heart, Star } from "lucide-react"
import { formatMaskedSurname } from "../utils/formatters"
import femaleProfile from "../assets/female_profile2.jpg"
import userImage from "../assets/user.jpg"

export default function MatchCard({
    id,
    image,
    fallbackPhoto,
    name,
    age,
    match = 84,
    location,
    education,
    occupation,
    tags = [],
    quote,
    isPhotoHidden = false,
    interestStatus,
    onDismiss,
    onSendInterest,
    onViewProfile,
    onNavigateChat,
}) {
    const rawFallback = fallbackPhoto || userImage
    const displayName = formatMaskedSurname(name)
    const titleText = age ? `${displayName}, Age: ${age}` : displayName

    return (
        <div className="relative bg-white rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row gap-5 lg:gap-6">
            {/* Profile Photo Area */}
            <div className="relative w-full md:w-52 lg:w-64 h-64 md:h-auto self-stretch shrink-0 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {isPhotoHidden ? (
                    <div className="w-full h-full bg-gradient-to-br from-rose-50 to-pink-100 flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center text-[#842029] mb-2 shadow-2xs">
                            <EyeOff size={24} />
                        </div>
                        <span className="text-xs font-bold text-[#842029]">Photo Hidden</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">by member privacy</span>
                    </div>
                ) : (
                    <img
                        src={image || rawFallback}
                        alt={displayName}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = rawFallback
                        }}
                    />
                )}

                {/* Match % Badge Pill at Bottom */}
                {typeof match === "number" && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-[#ED5463] text-white px-3.5 py-1.5 rounded-full font-bold text-xs shadow-md">
                        <Star size={12} fill="#fff" color="#fff" />
                        <span>{match}% Match</span>
                    </div>
                )}
            </div>

            {/* Profile Details Content */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                    {/* Top Row: Name & Dismiss Button */}
                    <div className="flex items-start justify-between gap-3">
                        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#640515] leading-tight">
                            {titleText}
                        </h2>
                        {onDismiss && (
                            <button
                                type="button"
                                onClick={() => onDismiss(id)}
                                className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                                title="Dismiss card"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Meta Row: Location, Education, Profession */}
                    <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1.5 mt-3 text-xs sm:text-sm text-gray-700">
                        {location && (
                            <div className="flex items-center gap-1.5">
                                <MapPin size={15} className="text-[#842029] shrink-0" />
                                <span className="truncate">{location}</span>
                            </div>
                        )}
                        {education && (
                            <div className="flex items-center gap-1.5">
                                <GraduationCap size={15} className="text-[#842029] shrink-0" />
                                <span className="truncate">{education}</span>
                            </div>
                        )}
                        {occupation && (
                            <div className="flex items-center gap-1.5">
                                <Briefcase size={15} className="text-[#842029] shrink-0" />
                                <span className="truncate">{occupation}</span>
                            </div>
                        )}
                    </div>

                    {/* Tags Row */}
                    {tags && tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {tags.map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="bg-[#FFDAD9] text-[#640515] text-xs font-semibold px-3 py-1 rounded-full"
                                >
                                    + {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Bio Quote Snippet */}
                    {quote && (
                        <div className="mt-4 border-l-4 border-rose-300 bg-[#FAF8F8] p-3 rounded-r-2xl">
                            <p className="italic text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2">
                                &ldquo;{quote}&rdquo;
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-100">
                    {interestStatus === "accepted" ? (
                        <button
                            type="button"
                            onClick={() => onNavigateChat ? onNavigateChat(id) : onViewProfile(id)}
                            className="flex-1 py-3 rounded-full bg-emerald-600 text-white font-semibold text-xs sm:text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                        >
                            <MessageSquare size={16} /> Send Message
                        </button>
                    ) : interestStatus === "pending" ? (
                        <button
                            type="button"
                            disabled
                            className="flex-1 py-3 rounded-full bg-amber-500 text-white font-semibold text-xs sm:text-sm opacity-90 flex items-center justify-center gap-2 shadow-xs cursor-default"
                        >
                            <Clock size={16} /> Interest Sent (Pending)
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onSendInterest(id)}
                            className="flex-1 py-3 rounded-full bg-[#842029] text-white font-semibold text-xs sm:text-sm hover:bg-[#6b1b27] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                        >
                            <Heart size={16} fill="currentColor" /> Send Interest
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => onViewProfile(id)}
                        className="flex-1 py-3 rounded-full border-2 border-[#842029] text-[#842029] bg-white font-semibold text-xs sm:text-sm hover:bg-[#842029] hover:text-white transition-all flex items-center justify-center cursor-pointer"
                    >
                        View Profile
                    </button>
                </div>
            </div>
        </div>
    )
}