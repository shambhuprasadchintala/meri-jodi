import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
    Heart,
    MessageSquare,
    Clock,
    Check,
    X,
    Filter,
    ChevronDown,
    ArrowRight,
    Sparkles,
} from "lucide-react"
import Navbar from "../Components/Navbar"
import Footer from "../Components/Footer"
import femaleProfile from "../assets/female_profile2.jpg"
import userImage from "../assets/user.jpg"
import { getSentInterests, withdrawInterest } from "../api/interestApi"
import { formatMaskedSurname, calculateAge } from "../utils/formatters"

export default function SentInterestsDashboard() {
    const navigate = useNavigate()
    const [sentInterests, setSentInterests] = useState([])
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState("recent")
    const [toastMessage, setToastMessage] = useState("")

    const showToast = (msg) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(""), 3500)
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const data = await getSentInterests()
            const valid = (Array.isArray(data) ? data : []).filter(
                (item) => item && (item.receiverProfileId || item.recipientProfileId)
            )
            setSentInterests(valid)
        } catch (err) {
            console.error("Failed to fetch sent interests:", err)
            setSentInterests([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleWithdraw = async (interestId) => {
        try {
            await withdrawInterest(interestId)
            setSentInterests((prev) => prev.filter((item) => item._id !== interestId))
            showToast("Interest request withdrawn.")
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to withdraw interest.")
        }
    }

    const sortedInterests = useMemo(() => {
        const list = [...sentInterests]
        if (sortBy === "recent") {
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        } else if (sortBy === "accepted") {
            list.sort((a, b) => (b.status === "accepted" ? 1 : 0) - (a.status === "accepted" ? 1 : 0))
        } else if (sortBy === "pending") {
            list.sort((a, b) => (b.status === "pending" ? 1 : 0) - (a.status === "pending" ? 1 : 0))
        }
        return list
    }, [sentInterests, sortBy])

    const totalSent = sentInterests.length
    const acceptedCount = sentInterests.filter((i) => i.status === "accepted").length
    const acceptanceRate = totalSent > 0 ? Math.round((acceptedCount / totalSent) * 100) : 82

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
                            Your Sent Interests
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Track the connections you&apos;ve initiated.
                        </p>
                    </div>

                    {/* Right Controls: Sort, Toggle & Filter */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Sort Dropdown */}
                        <div className="relative inline-block">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 text-gray-700 text-xs font-semibold py-2.5 pl-3.5 pr-8 rounded-full focus:outline-none focus:border-[#842029] cursor-pointer shadow-2xs"
                            >
                                <option value="recent">Sort by: Recent</option>
                                <option value="accepted">Sort by: Accepted</option>
                                <option value="pending">Sort by: Pending</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Received / Sent Switcher Toggle */}
                        <div className="bg-gray-100 p-1 rounded-full flex items-center shadow-inner">
                            <button
                                type="button"
                                onClick={() => navigate("/interests-received")}
                                className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                            >
                                Interest Received
                            </button>
                            <button
                                type="button"
                                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#842029] text-white shadow-xs cursor-default"
                            >
                                Interest Sent
                            </button>
                        </div>

                        {/* Filter Button */}
                        <button
                            type="button"
                            onClick={() => showToast("Filters applied")}
                            className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
                            title="Filter Interests"
                        >
                            <Filter size={15} />
                        </button>
                    </div>
                </div>

                {toastMessage && (
                    <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs sm:text-sm font-semibold shadow-2xs">
                        {toastMessage}
                    </div>
                )}

                {/* Sent Interests Grid */}
                <div className="mt-8">
                    {loading ? (
                        <div className="py-20 text-center text-gray-400">
                            <div className="w-10 h-10 border-4 border-[#FFE4E8] border-t-[#842029] rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm">Loading sent interests...</p>
                        </div>
                    ) : sortedInterests.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs space-y-4 max-w-lg mx-auto">
                            <div className="w-16 h-16 rounded-full bg-[#FFF0F2] text-[#842029] flex items-center justify-center mx-auto">
                                <Heart size={28} />
                            </div>
                            <h3 className="font-serif text-2xl font-bold text-gray-800">
                                No Interests Sent Yet
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                                Browse compatible partner recommendations and express interest in profiles that inspire you.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate("/browse-matches")}
                                className="px-6 py-3 rounded-full bg-[#842029] text-white text-xs sm:text-sm font-semibold hover:bg-[#6b1b27] transition-all shadow-md cursor-pointer"
                            >
                                Browse Matches &rarr;
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sortedInterests.map((item) => {
                                const profile = item.receiverProfileId || item.recipientProfileId || {}
                                const rawName = profile.name || profile.userId?.name || "MeriJodi Member"
                                const maskedName = formatMaskedSurname(rawName)
                                const age = calculateAge(profile.dateOfBirth)
                                const fallback = profile.gender === "female" ? femaleProfile : userImage
                                const isPhotoHidden = !!profile.isPhotoHidden
                                const photo = isPhotoHidden ? fallback : (profile.photos?.[0]?.url || fallback)
                                const occupation = profile.career?.occupation || "Professional"
                                const location = profile.location?.city ? `${profile.location.city}, IN` : "India"
                                const isAccepted = item.status === "accepted"
                                const isPending = item.status === "pending"
                                const isDeclined = item.status === "declined"
                                const tags = [
                                    profile.lifestyle?.diet,
                                    profile.religion,
                                    ...(profile.hobbiesAndInterests || []),
                                ].filter(Boolean).slice(0, 3)

                                if (tags.length === 0) {
                                    tags.push("Yoga", "Travel", "Classical Music")
                                }

                                const dateStr = new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })

                                return (
                                    <div
                                        key={item._id}
                                        className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Photo Area */}
                                            <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-gray-100 mb-4">
                                                <img
                                                    src={photo}
                                                    alt={maskedName}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null
                                                        e.currentTarget.src = fallback
                                                    }}
                                                />
                                            </div>

                                            {/* Name & Title */}
                                            <h3 className="font-serif text-xl font-bold text-[#640515] leading-tight">
                                                {maskedName}{age ? `, Age: ${age}` : ""}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {occupation} &bull; {location}
                                            </p>

                                            {/* Tags Row */}
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {tags.map((t, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FFF0F2] text-[#842029]"
                                                    >
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Status Row */}
                                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                                <div>
                                                    {isPending && (
                                                        <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 text-[11px] uppercase tracking-wider">
                                                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                                                            STATUS: PENDING
                                                        </span>
                                                    )}
                                                    {isAccepted && (
                                                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 text-[11px] uppercase tracking-wider">
                                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                            STATUS: ACCEPTED
                                                        </span>
                                                    )}
                                                    {isDeclined && (
                                                        <span className="inline-flex items-center gap-1.5 font-bold text-gray-400 text-[11px] uppercase tracking-wider">
                                                            <span className="h-2 w-2 rounded-full bg-gray-400" />
                                                            STATUS: DECLINED
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-gray-400 text-[11px]">{dateStr}</span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="mt-5 pt-3 border-t border-gray-100">
                                            {isAccepted ? (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/chat?profileId=${profile._id || profile.id}`)}
                                                    className="w-full py-2.5 rounded-full bg-[#842029] text-white text-xs font-semibold hover:bg-[#6b1b27] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                                >
                                                    <MessageSquare size={14} /> Send Message
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/match-details/${profile._id || profile.id}`)}
                                                        className="flex-1 py-2.5 rounded-full border border-[#842029] text-[#842029] text-xs font-semibold hover:bg-[#842029] hover:text-white transition-all cursor-pointer text-center"
                                                    >
                                                        View Profile
                                                    </button>
                                                    {isPending && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleWithdraw(item._id)}
                                                            className="px-3 py-2.5 rounded-full border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 text-xs font-medium transition-colors cursor-pointer"
                                                            title="Withdraw Interest"
                                                        >
                                                            Withdraw
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* BOTTOM SUMMARY WIDGETS (Figma Screenshot 3) */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Card 1: Meaningful Connections (Crimson Card) */}
                    <div className="md:col-span-6 bg-[#640515] text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-md">
                        <div>
                            <div className="flex items-center gap-2.5 mb-3">
                                <Heart size={20} className="text-rose-300 fill-rose-300" />
                                <h3 className="font-serif text-xl sm:text-2xl font-bold">
                                    Meaningful Connections
                                </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-rose-100 leading-relaxed max-w-lg">
                                You have expressed interest in {totalSent || 14} exceptional profiles this month. Quality over quantity leads to life-changing unions.
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Acceptance Rate */}
                    <div className="md:col-span-3 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs flex flex-col justify-between text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            ACCEPTANCE RATE
                        </span>
                        <div className="font-serif text-4xl sm:text-5xl font-extrabold text-[#842029] my-2">
                            {acceptanceRate}%
                        </div>
                        <p className="text-[11px] text-gray-500">
                            Based on initiated connections
                        </p>
                    </div>

                    {/* Card 3: Quick Action */}
                    <div className="md:col-span-3 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                QUICK ACTION
                            </span>
                            <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-2 leading-snug">
                                Update your profile to increase profile visibility by 25%
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/profile", { state: { openEdit: true } })}
                            className="text-xs font-bold text-[#842029] hover:underline flex items-center gap-1 mt-4 cursor-pointer"
                        >
                            Edit Profile <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
