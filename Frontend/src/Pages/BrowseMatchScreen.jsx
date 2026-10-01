import { useState, useEffect, useMemo } from "react"
import {
    SlidersHorizontal,
    ChevronRight,
    Search,
    ChevronDown,
    Filter,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import Navbar from "../Components/Navbar"
import Footer from "../Components/Footer"
import MatchCard from "../Components/MatchCard"
import ConfirmInterestModal from "../Components/ConfirmInterestModal"
import femaleProfile from "../assets/female_profile2.jpg"
import userImage from "../assets/user.jpg"
import { getMyMatches } from "../api/matchingApi"
import { getMyProfile } from "../api/profileApi"
import { sendInterest, getSentInterests, getReceivedInterests } from "../api/interestApi"
import { getShortlistedProfiles } from "../api/shortlistApi"
import { getWhoViewedYou } from "../api/dashboardApi"
import { calculateAge } from "../utils/formatters"

const mapProfileToCard = (profile) => {
    const fallbackPhoto = profile.gender === "female" ? femaleProfile : userImage
    const tags = [
        profile.lifestyle?.diet ? `${profile.lifestyle.diet}` : null,
        profile.religion,
        profile.caste,
        profile.family?.familyValues ? `${profile.family.familyValues} Values` : null,
        ...(profile.hobbiesAndInterests || []),
    ].filter(Boolean).slice(0, 2)

    if (tags.length === 0) {
        tags.push("Traditional Values", "Passionate Traveler")
    }

    return {
        id: profile._id || profile.id,
        name: profile.name || profile.userId?.name || "MeriJodi Member",
        gender: profile.gender,
        age: calculateAge(profile.dateOfBirth),
        match: typeof profile.compatibilityScore === "number" ? profile.compatibilityScore : 84,
        location: profile.location?.city || "Mumbai",
        state: profile.location?.state || "",
        education: profile.education?.highestDegree || "Graduate",
        occupation: profile.career?.occupation || (profile.career?.companyName ? `Professional at ${profile.career.companyName}` : "Working Professional"),
        tags,
        quote: profile.aboutMe
            ? profile.aboutMe.slice(0, 160)
            : "Looking for a compatible, understanding life partner with shared values and family orientation.",
        isPhotoHidden: !!profile.isPhotoHidden,
        hasPhoto: !!(profile.photos && profile.photos.length > 0 && !profile.isPhotoHidden),
        createdAt: profile.createdAt ? new Date(profile.createdAt) : new Date(),
        fallbackPhoto,
        image: profile.photos?.find((p) => p.isPrimary)?.url || profile.photos?.[0]?.url || fallbackPhoto,
    }
}

export default function BrowseMatchScreen() {
    const navigate = useNavigate()
    const [matches, setMatches] = useState([])
    const [myProfile, setMyProfile] = useState(null)
    const [whoViewedYouList, setWhoViewedYouList] = useState([])
    const [shortlistedProfilesList, setShortlistedProfilesList] = useState([])
    const [interestStatuses, setInterestStatuses] = useState({})
    const [dismissedIds, setDismissedIds] = useState(new Set())
    const [loading, setLoading] = useState(true)
    const [activeSidebar, setActiveSidebar] = useState("Your Matches")
    const [activeFilter, setActiveFilter] = useState("All")
    const [sortBy, setSortBy] = useState("compatibility")
    const [searchQuery, setSearchQuery] = useState("")
    const [toastMessage, setToastMessage] = useState("")

    // Confirm Interest Modal State
    const [selectedMatchForInterest, setSelectedMatchForInterest] = useState(null)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [sendingInterest, setSendingInterest] = useState(false)

    const showToast = (msg) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(""), 3500)
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const [matchResult, shortlists, viewed, myProf, sentInterests, receivedInterests] = await Promise.all([
                getMyMatches({ limit: 50 }).catch(() => ({ matches: [] })),
                getShortlistedProfiles().catch(() => []),
                getWhoViewedYou(30).catch(() => []),
                getMyProfile().catch(() => null),
                getSentInterests().catch(() => []),
                getReceivedInterests().catch(() => []),
            ])

            setMatches(
                (matchResult?.matches ?? [])
                    .filter((m) => m && (m._id || m.id))
                    .map(mapProfileToCard)
            )
            setMyProfile(myProf)
            setWhoViewedYouList(
                (viewed || [])
                    .map((v) => v.profile || v)
                    .filter((p) => p && (p._id || p.id))
                    .map(mapProfileToCard)
            )
            setShortlistedProfilesList(
                (shortlists || [])
                    .map((s) => s.shortlistedProfileId || s)
                    .filter((p) => p && (p._id || p.id))
                    .map(mapProfileToCard)
            )

            // Build interest map
            const intMap = {}
            for (const item of (sentInterests || [])) {
                const rId = typeof item.receiverProfileId === "object" ? item.receiverProfileId?._id : item.receiverProfileId
                if (rId) {
                    intMap[String(rId)] = item.status === "accepted" ? "accepted" : "pending"
                }
            }
            for (const item of (receivedInterests || [])) {
                const sId = typeof item.senderProfileId === "object" ? item.senderProfileId?._id : item.senderProfileId
                if (sId) {
                    if (item.status === "accepted") {
                        intMap[String(sId)] = "accepted"
                    } else if (item.status === "pending" && !intMap[String(sId)]) {
                        intMap[String(sId)] = "received_pending"
                    }
                }
            }
            setInterestStatuses(intMap)
        } catch (err) {
            console.error("Failed to fetch matches:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleOpenInterestModal = (profileId) => {
        const target = matches.find((m) => String(m.id) === String(profileId))
            || whoViewedYouList.find((m) => String(m.id) === String(profileId))
            || shortlistedProfilesList.find((m) => String(m.id) === String(profileId))

        if (target) {
            setSelectedMatchForInterest(target)
            setIsConfirmModalOpen(true)
        } else {
            handleSendInterestDirect(profileId)
        }
    }

    const handleConfirmSendInterest = async () => {
        if (!selectedMatchForInterest) return
        setSendingInterest(true)
        try {
            await sendInterest(selectedMatchForInterest.id)
            setInterestStatuses((prev) => ({
                ...prev,
                [String(selectedMatchForInterest.id)]: "pending",
            }))
            showToast("Interest request sent successfully!")
            setIsConfirmModalOpen(false)
            setSelectedMatchForInterest(null)
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to send interest."
            showToast(msg)
        } finally {
            setSendingInterest(false)
        }
    }

    const handleSendInterestDirect = async (profileId) => {
        try {
            await sendInterest(profileId)
            setInterestStatuses((prev) => ({ ...prev, [String(profileId)]: "pending" }))
            showToast("Interest request sent successfully!")
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to send interest.")
        }
    }

    const handleDismissCard = (profileId) => {
        setDismissedIds((prev) => new Set([...prev, String(profileId)]))
        showToast("Profile dismissed.")
    }

    // Dynamic filtering pipeline
    const filteredMatches = useMemo(() => {
        let list = [...matches]

        // Sidebar Categories
        if (activeSidebar === "Short Listed By You") {
            list = shortlistedProfilesList
        } else if (activeSidebar === "Viewed you") {
            list = whoViewedYouList
        } else if (activeSidebar === "Newly Joined") {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            list = list.filter((m) => !m.createdAt || m.createdAt >= thirtyDaysAgo)
        } else if (activeSidebar === "Nearby Matches") {
            const myCity = (myProfile?.location?.city || "").toLowerCase().trim()
            const myState = (myProfile?.location?.state || "").toLowerCase().trim()
            if (myCity || myState) {
                list = list.filter((m) => {
                    const loc = (m.location || "").toLowerCase()
                    const st = (m.state || "").toLowerCase()
                    return (myCity && loc.includes(myCity)) || (myState && (loc.includes(myState) || st.includes(myState)))
                })
            }
        }

        // Top Filter Chips
        if (activeFilter === "Profiles with photo") {
            list = list.filter((m) => m.hasPhoto && !m.isPhotoHidden)
        } else if (activeFilter === "Newly Joined") {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            list = list.filter((m) => !m.createdAt || m.createdAt >= thirtyDaysAgo)
        } else if (activeFilter === "Mutual Matches") {
            list = list.filter((m) => interestStatuses[String(m.id)] === "accepted")
        } else if (activeFilter === "Locations") {
            const myCity = (myProfile?.location?.city || "").toLowerCase().trim()
            if (myCity) {
                list = list.filter((m) => (m.location || "").toLowerCase().includes(myCity))
            }
        }

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim()
            list = list.filter((m) => (
                m.name.toLowerCase().includes(q) ||
                m.location.toLowerCase().includes(q) ||
                m.occupation.toLowerCase().includes(q) ||
                m.education.toLowerCase().includes(q)
            ))
        }

        // Exclude dismissed cards
        list = list.filter((m) => !dismissedIds.has(String(m.id)))

        // Sorting
        if (sortBy === "compatibility") {
            list.sort((a, b) => b.match - a.match)
        } else if (sortBy === "recent") {
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        } else if (sortBy === "age_asc") {
            list.sort((a, b) => (a.age || 99) - (b.age || 99))
        } else if (sortBy === "age_desc") {
            list.sort((a, b) => (b.age || 0) - (a.age || 0))
        }

        return list
    }, [
        matches,
        activeSidebar,
        activeFilter,
        sortBy,
        searchQuery,
        dismissedIds,
        shortlistedProfilesList,
        whoViewedYouList,
        interestStatuses,
        myProfile,
    ])

    return (
        <div className="min-h-screen bg-[#FBF9F9] font-sans flex flex-col">
            <Navbar />

            {/* Confirm Interest Pop-up Modal */}
            <ConfirmInterestModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSendInterest}
                profile={selectedMatchForInterest}
                loading={sendingInterest}
            />

            <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
                {toastMessage && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs sm:text-sm font-semibold shadow-xs">
                        {toastMessage}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    {/* LEFT SIDEBAR NAVIGATION */}
                    <aside className="w-full lg:w-80 shrink-0 space-y-6">
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-6">
                            {/* Group 1: All Matches */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">
                                    All Matches
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setActiveSidebar("Your Matches")}
                                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-colors cursor-pointer ${
                                        activeSidebar === "Your Matches"
                                            ? "bg-[#FFF0F2] text-[#842029]"
                                            : "hover:bg-gray-50 text-gray-700"
                                    }`}
                                >
                                    <div>
                                        <p className="text-sm font-bold">Your Matches</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            View All the profiles that match your preferences
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className={activeSidebar === "Your Matches" ? "text-[#842029]" : "text-gray-400"} />
                                </button>
                            </div>

                            {/* Group 2: Based on activity */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">
                                    Based on activity
                                </h3>
                                <div className="space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSidebar("Short Listed By You")}
                                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-colors cursor-pointer ${
                                            activeSidebar === "Short Listed By You"
                                                ? "bg-[#FFF0F2] text-[#842029]"
                                                : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                    >
                                        <div>
                                            <p className="text-sm font-bold">Short Listed By You</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                Matches you have shortlisted
                                            </p>
                                        </div>
                                        <ChevronRight size={16} className={activeSidebar === "Short Listed By You" ? "text-[#842029]" : "text-gray-400"} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveSidebar("Viewed you")}
                                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-colors cursor-pointer ${
                                            activeSidebar === "Viewed you"
                                                ? "bg-[#FFF0F2] text-[#842029]"
                                                : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                    >
                                        <div>
                                            <p className="text-sm font-bold">Viewed you</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                Matches who have viewed your profile
                                            </p>
                                        </div>
                                        <ChevronRight size={16} className={activeSidebar === "Viewed you" ? "text-[#842029]" : "text-gray-400"} />
                                    </button>
                                </div>
                            </div>

                            {/* Group 3: Recently Joined & Nearby Matches */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 mb-2">
                                    Recently Joined &amp; Nearby Matches
                                </h3>
                                <div className="space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSidebar("Newly Joined")}
                                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-colors cursor-pointer ${
                                            activeSidebar === "Newly Joined"
                                                ? "bg-[#FFF0F2] text-[#842029]"
                                                : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                    >
                                        <div>
                                            <p className="text-sm font-bold">Newly Joined</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                Matches who joined within the last 30 days
                                            </p>
                                        </div>
                                        <ChevronRight size={16} className={activeSidebar === "Newly Joined" ? "text-[#842029]" : "text-gray-400"} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveSidebar("Nearby Matches")}
                                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-colors cursor-pointer ${
                                            activeSidebar === "Nearby Matches"
                                                ? "bg-[#FFF0F2] text-[#842029]"
                                                : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                    >
                                        <div>
                                            <p className="text-sm font-bold">Nearby Matches</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                Matches near your location
                                            </p>
                                        </div>
                                        <ChevronRight size={16} className={activeSidebar === "Nearby Matches" ? "text-[#842029]" : "text-gray-400"} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 min-w-0 space-y-6">
                        {/* Page Header */}
                        <div>
                            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#640515] leading-tight">
                                Recommended Matches for You
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                Discover {filteredMatches.length} high-compatibility profiles based on your preferences.
                            </p>
                        </div>

                        {/* Top Filter Chips & Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-3xl border border-gray-100 shadow-xs">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={() => setActiveFilter("All")}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                        activeFilter === "All"
                                            ? "bg-[#842029] text-white shadow-xs"
                                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                    }`}
                                >
                                    <Filter size={13} /> Filters
                                </button>

                                {/* Sort Dropdown */}
                                <div className="relative inline-block">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold py-2 pl-3 pr-8 rounded-full focus:outline-none focus:border-[#842029] cursor-pointer"
                                    >
                                        <option value="compatibility">Sort by: High Match</option>
                                        <option value="recent">Sort by: Recent</option>
                                        <option value="age_asc">Sort by: Age (Low to High)</option>
                                        <option value="age_desc">Sort by: Age (High to Low)</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>

                                {/* Filter Chips */}
                                {[
                                    "Newly Joined",
                                    "Profiles with photo",
                                    "Mutual Matches",
                                    "Locations",
                                ].map((chip) => (
                                    <button
                                        key={chip}
                                        type="button"
                                        onClick={() => setActiveFilter(activeFilter === chip ? "All" : chip)}
                                        className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                            activeFilter === chip
                                                ? "bg-[#842029] text-white shadow-xs"
                                                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                        }`}
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>

                            {/* Live Search */}
                            <div className="relative w-full sm:w-56">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by city, role..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-full pl-8 pr-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-[#842029]"
                                />
                            </div>
                        </div>

                        {/* Match Cards List */}
                        {loading ? (
                            <div className="space-y-4 py-12 text-center text-gray-400">
                                <div className="w-10 h-10 border-4 border-[#FFE4E8] border-t-[#842029] rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-sm">Finding compatible partner matches...</p>
                            </div>
                        ) : filteredMatches.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs space-y-3">
                                <div className="w-14 h-14 rounded-full bg-rose-50 text-[#842029] flex items-center justify-center mx-auto">
                                    <SlidersHorizontal size={24} />
                                </div>
                                <h3 className="font-serif text-xl font-bold text-gray-800">
                                    No matches found for current filter
                                </h3>
                                <p className="text-xs text-gray-500 max-w-md mx-auto">
                                    Try selecting a different filter tab, expanding your partner preferences, or clearing your search.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveFilter("All")
                                        setActiveSidebar("Your Matches")
                                        setSearchQuery("")
                                        setDismissedIds(new Set())
                                    }}
                                    className="px-5 py-2.5 rounded-full bg-[#842029] text-white text-xs font-semibold hover:bg-[#6b1b27] transition-all cursor-pointer"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {filteredMatches.map((m) => (
                                    <MatchCard
                                        key={m.id}
                                        {...m}
                                        interestStatus={interestStatuses[String(m.id)]}
                                        onDismiss={handleDismissCard}
                                        onSendInterest={handleOpenInterestModal}
                                        onViewProfile={(pId) => navigate(`/match-details/${pId}`)}
                                        onNavigateChat={(pId) => navigate(`/chat?profileId=${pId}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
