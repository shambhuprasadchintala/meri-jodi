import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
    Heart,
    MessageSquare,
    Check,
    X,
    ChevronDown,
    Sparkles,
    Eye,
    SlidersHorizontal,
    Star,
} from "lucide-react"
import Navbar from "../Components/Navbar"
import Footer from "../Components/Footer"
import femaleProfile from "../assets/female_profile2.jpg"
import userImage from "../assets/user.jpg"
import { getReceivedInterests, acceptInterest, declineInterest } from "../api/interestApi"
import { formatMaskedSurname, calculateAge } from "../utils/formatters"

export default function InterestsReceivedDashboard() {
    const navigate = useNavigate()
    const [receivedInterests, setReceivedInterests] = useState([])
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState("recent")
    const [dismissedIds, setDismissedIds] = useState(new Set())
    const [toastMessage, setToastMessage] = useState("")
    const [actionLoading, setActionLoading] = useState({})

    const showToast = (msg) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(""), 3500)
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const data = await getReceivedInterests()
            const valid = (Array.isArray(data) ? data : []).filter(
                (item) => item && item.senderProfileId && (item.senderProfileId.name || item.senderProfileId.userId)
            )
            setReceivedInterests(valid)
        } catch (err) {
            console.error("Failed to fetch received interests:", err)
            setReceivedInterests([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleAccept = async (interestId, senderId) => {
        setActionLoading((prev) => ({ ...prev, [interestId]: true }))
        try {
            await acceptInterest(interestId)
            setReceivedInterests((prev) =>
                prev.map((item) =>
                    item._id === interestId ? { ...item, status: "accepted" } : item
                )
            )
            showToast("Interest accepted! You can now start chatting.")
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to accept interest.")
        } finally {
            setActionLoading((prev) => ({ ...prev, [interestId]: false }))
        }
    }

    const handleDecline = async (interestId) => {
        setActionLoading((prev) => ({ ...prev, [interestId]: true }))
        try {
            await declineInterest(interestId)
            setReceivedInterests((prev) =>
                prev.map((item) =>
                    item._id === interestId ? { ...item, status: "declined" } : item
                )
            )
            showToast("Interest request declined.")
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to decline interest.")
        } finally {
            setActionLoading((prev) => ({ ...prev, [interestId]: false }))
        }
    }

    const handleDismiss = (interestId) => {
        setDismissedIds((prev) => new Set([...prev, String(interestId)]))
        showToast("Card dismissed.")
    }

    const sortedInterests = useMemo(() => {
        let list = receivedInterests.filter((i) => !dismissedIds.has(String(i._id)))
        if (sortBy === "recent") {
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        } else if (sortBy === "pending") {
            list.sort((a, b) => (b.status === "pending" ? 1 : 0) - (a.status === "pending" ? 1 : 0))
        }
        return list
    }, [receivedInterests, dismissedIds, sortBy])

    const pendingCount = receivedInterests.filter((i) => i.status === "pending").length
    const weeklyCount = receivedInterests.length

    return (
        <div className="min-h-screen bg-[#FBF9F9] font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
                {/* Breadcrumbs */}
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#842029] mb-1">
                    MATCHES / INTERESTS
                </div>

                {/* Top Header & Toggle Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
                    <div>
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#640515] leading-tight">
                            Your Interests Received
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Track the connections received from prospective matches.
                        </p>
                    </div>

                    {/* Right Controls: Sort & Received/Sent Switcher */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Sort Dropdown */}
                        <div className="relative inline-block">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 text-gray-700 text-xs font-semibold py-2.5 pl-3.5 pr-8 rounded-full focus:outline-none focus:border-[#842029] cursor-pointer shadow-2xs"
                            >
                                <option value="recent">Sort by: Recent</option>
                                <option value="pending">Sort by: Pending</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Received / Sent Switcher Toggle */}
                        <div className="bg-gray-100 p-1 rounded-full flex items-center shadow-inner">
                            <button
                                type="button"
                                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#842029] text-white shadow-xs cursor-default"
                            >
                                View Received Interest
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/sent-interests")}
                                className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                            >
                                Sent Interest
                            </button>
                        </div>
                    </div>
                </div>

                {toastMessage && (
                    <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs sm:text-sm font-semibold shadow-2xs">
                        {toastMessage}
                    </div>
                )}

                {/* Main Content Layout: Grid with Cards on Left, Stats Panel on Right (Figma Screenshot 4) */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: RECEIVED INTERESTS LIST (8 Cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        {loading ? (
                            <div className="py-20 text-center text-gray-400">
                                <div className="w-10 h-10 border-4 border-[#FFE4E8] border-t-[#842029] rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-sm">Loading received interests...</p>
                            </div>
                        ) : sortedInterests.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs space-y-4">
                                <div className="w-16 h-16 rounded-full bg-[#FFF0F2] text-[#842029] flex items-center justify-center mx-auto">
                                    <Heart size={28} />
                                </div>
                                <h3 className="font-serif text-2xl font-bold text-gray-800">
                                    No Received Interests Right Now
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                                    Complete your profile details and upload high quality photos to start receiving interests from verified members.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate("/profile", { state: { openEdit: true } })}
                                    className="px-6 py-3 rounded-full bg-[#842029] text-white text-xs sm:text-sm font-semibold hover:bg-[#6b1b27] transition-all shadow-md cursor-pointer"
                                >
                                    Enhance Profile &rarr;
                                </button>
                            </div>
                        ) : (
                            sortedInterests.map((item) => {
                                const profile = item.senderProfileId || {}
                                const rawName = profile.name || profile.userId?.name || "MeriJodi Member"
                                const maskedName = formatMaskedSurname(rawName)
                                const age = calculateAge(profile.dateOfBirth)
                                const fallback = profile.gender === "female" ? femaleProfile : userImage
                                const isPhotoHidden = !!profile.isPhotoHidden
                                const photo = isPhotoHidden ? fallback : (profile.photos?.[0]?.url || fallback)
                                const occupation = (profile.career?.occupation || "PROFESSIONAL").toUpperCase()
                                const location = (profile.location?.city || "MUMBAI").toUpperCase()
                                const quote = profile.aboutMe
                                    ? profile.aboutMe.slice(0, 160)
                                    : "I was really impressed by your thoughts on balancing modern career goals with traditional values. I'd love to connect and learn more about your journey."
                                const isAccepted = item.status === "accepted"
                                const isPending = item.status === "pending"
                                const matchScore = 84

                                return (
                                    <div
                                        key={item._id}
                                        className="relative bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row gap-5"
                                    >
                                        {/* Photo Thumbnail */}
                                        <div className="relative w-full sm:w-44 md:w-48 h-56 sm:h-auto self-stretch shrink-0 rounded-2xl overflow-hidden bg-gray-100">
                                            <img
                                                src={photo}
                                                alt={maskedName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null
                                                    e.currentTarget.src = fallback
                                                }}
                                            />
                                            {/* Match Badge Pill */}
                                            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-[#ED5463] text-white px-2.5 py-1 rounded-full font-bold text-[10px] shadow-sm">
                                                <Star size={10} fill="#fff" color="#fff" />
                                                <span>{matchScore}% Match</span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                {/* Header Row */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-serif text-2xl font-bold text-[#640515]">
                                                            {maskedName}{age ? `, Age: ${age}` : ""}
                                                        </h3>
                                                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1">
                                                            {occupation} &bull; {location}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDismiss(item._id)}
                                                        className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                                                        title="Dismiss card"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>

                                                {/* Bio Quote Snippet */}
                                                <div className="mt-3.5 border-l-4 border-rose-300 bg-[#FAF8F8] p-3 rounded-r-2xl">
                                                    <p className="italic text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2">
                                                        &ldquo;{quote}&rdquo;
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Buttons Row */}
                                            <div className="mt-5 pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                                                {isPending ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAccept(item._id, profile._id || profile.id)}
                                                            disabled={actionLoading[item._id]}
                                                            className="flex-1 py-2.5 rounded-full bg-[#842029] text-white text-xs font-semibold hover:bg-[#6b1b27] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
                                                        >
                                                            <Check size={14} /> Accept Interest
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDecline(item._id)}
                                                            disabled={actionLoading[item._id]}
                                                            className="px-4 py-2.5 rounded-full border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer"
                                                        >
                                                            Decline
                                                        </button>
                                                    </>
                                                ) : isAccepted ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/chat?profileId=${profile._id || profile.id}`)}
                                                        className="flex-1 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                                    >
                                                        <MessageSquare size={14} /> Send Message
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic py-2">
                                                        Declined
                                                    </span>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/match-details/${profile._id || profile.id}`)}
                                                    className="flex-1 py-2.5 rounded-full border-2 border-[#842029] text-[#842029] bg-white text-xs font-semibold hover:bg-[#842029] hover:text-white transition-all cursor-pointer text-center"
                                                >
                                                    View Profile
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* RIGHT COLUMN: STATS & INSIGHTS SIDE PANEL (4 Cols - Figma Screenshot 4) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* 1. Interests Summary Card */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
                            <h3 className="font-serif text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                                Interests Summary
                            </h3>
                            <div className="space-y-3 text-xs sm:text-sm">
                                <div className="flex items-center justify-between text-gray-600">
                                    <span>Pending Responses</span>
                                    <span className="font-bold text-gray-900">{pendingCount || 24}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-600">
                                    <span>Weekly Received</span>
                                    <span className="font-bold text-gray-900">{weeklyCount || 24}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-600">
                                    <span>Premium Visibility</span>
                                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                                        Active <span className="text-xs">💎</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Match Insights Card (Crimson Banner) */}
                        <div className="bg-[#640515] text-white rounded-3xl p-6 shadow-md text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto text-rose-200">
                                <Sparkles size={20} />
                            </div>
                            <h4 className="font-serif text-lg font-bold text-white">
                                Compatibility Insights
                            </h4>
                            <p className="text-xs text-rose-100 leading-relaxed max-w-xs mx-auto">
                                Our matchmaking algorithm suggests that your profile strongly aligns with members who value family harmony, education, and balanced lifestyle goals.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate("/browse-matches")}
                                className="w-full py-2.5 rounded-full bg-white text-[#640515] font-bold text-xs hover:bg-rose-50 transition-colors shadow-xs cursor-pointer mt-2"
                            >
                                Explore Matches
                            </button>
                        </div>

                        {/* 3. Also Interested Avatars */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                ALSO INTERESTED
                            </span>
                            <div className="flex items-center justify-around mt-4">
                                {[
                                    { name: "Kavya", img: femaleProfile },
                                    { name: "Ishani", img: femaleProfile },
                                    { name: "Saanvi", img: femaleProfile },
                                    { name: "Zoya", img: femaleProfile },
                                ].map((person, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-1.5">
                                        <img
                                            src={person.img}
                                            alt={person.name}
                                            className="w-11 h-11 rounded-full object-cover border-2 border-rose-200 shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                                            onClick={() => navigate("/browse-matches")}
                                        />
                                        <span className="text-[11px] font-medium text-gray-600">
                                            {person.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
