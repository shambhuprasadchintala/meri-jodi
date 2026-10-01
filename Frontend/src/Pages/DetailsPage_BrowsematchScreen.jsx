import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
    Heart,
    MessageSquare,
    Share2,
    Ban,
    MapPin,
    GraduationCap,
    BriefcaseBusiness,
    ArrowLeft,
    Star,
    CheckCircle,
    Copy,
    Check,
    Users,
    Clock,
} from "lucide-react"
import Navbar from "../Components/Navbar.jsx"
import Footer from "../Components/Footer.jsx"
import ConfirmInterestModal from "../Components/ConfirmInterestModal.jsx"
import BlockReportModal from "../Components/BlockReportModal.jsx"
import ProfileImage from "../assets/female_profile2.jpg"
import userImage from "../assets/user.jpg"
import { getProfileById } from "../api/matchingApi"
import { sendInterest, getSentInterests, getReceivedInterests } from "../api/interestApi"
import { toggleShortlist, getShortlistedProfiles } from "../api/shortlistApi"

import { formatMaskedSurname } from "../utils/formatters"

const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const dob = new Date(dateOfBirth)
    if (Number.isNaN(dob.getTime())) return null
    return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

const formatDate = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const dob = new Date(dateOfBirth)
    if (Number.isNaN(dob.getTime())) return null
    return dob.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const formatHeight = (heightCm) => {
    if (!heightCm) return null
    const totalInches = heightCm / 2.54
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return `${feet}ft ${inches}in (${heightCm}cm)`
}

const formatSiblings = (numBrothers, numSisters) => {
    if (numBrothers == null && numSisters == null) return null
    const parts = []
    if (numBrothers) parts.push(`${numBrothers} Brother${numBrothers > 1 ? "s" : ""}`)
    if (numSisters) parts.push(`${numSisters} Sister${numSisters > 1 ? "s" : ""}`)
    return parts.length ? parts.join(", ") : "None"
}

const formatAffluence = (val) => {
    if (!val) return null
    const map = {
        affluent: "Rich / Affluent",
        upper_middle: "Upper Middle Class",
        middle: "Middle Class",
        lower_middle: "Lower Middle Class",
    }
    return map[val] || val.replace(/_/g, " ")
}

const formatFamilyValues = (val) => {
    if (!val) return null
    const map = {
        traditional: "Traditional",
        moderate: "Moderate",
        liberal: "Liberal",
    }
    return map[val] || val.charAt(0).toUpperCase() + val.slice(1)
}

const formatFamilyType = (val) => {
    if (!val) return null
    const map = {
        nuclear: "Nuclear",
        joint: "Joint",
        extended: "Extended / Other",
    }
    return map[val] || val.charAt(0).toUpperCase() + val.slice(1)
}

const DetailItem = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100/80 last:border-0 text-xs sm:text-sm">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="font-semibold text-gray-800 text-right">{value || "—"}</span>
    </div>
)

export default function DetailsPage_BrowsematchScreen() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isShortlisted, setIsShortlisted] = useState(false)
    const [interestStatus, setInterestStatus] = useState(null)
    const [showInterestModal, setShowInterestModal] = useState(false)
    const [showBlockReportModal, setShowBlockReportModal] = useState(false)
    const [toastMessage, setToastMessage] = useState("")

    useEffect(() => {
        if (!id) {
            setLoading(false)
            return
        }

        const fetchDetails = async () => {
            try {
                const [pData, shortlists, sentInterests, receivedInterests] = await Promise.all([
                    getProfileById(id),
                    getShortlistedProfiles().catch(() => []),
                    getSentInterests().catch(() => []),
                    getReceivedInterests().catch(() => []),
                ])
                setProfile(pData)

                // Check if this profile is already shortlisted
                const isShort = (shortlists || []).some((item) => {
                    const sId = typeof item?.shortlistedProfileId === "object"
                        ? item?.shortlistedProfileId?._id
                        : item?.shortlistedProfileId
                    return String(sId) === String(id)
                })
                setIsShortlisted(isShort)

                // Check interest status
                let intStatus = null
                for (const item of (sentInterests || [])) {
                    const rId = typeof item.receiverProfileId === "object" ? item.receiverProfileId?._id : item.receiverProfileId
                    if (String(rId) === String(id)) {
                        intStatus = item.status === "accepted" ? "accepted" : "pending"
                        break
                    }
                }
                if (!intStatus || intStatus !== "accepted") {
                    for (const item of (receivedInterests || [])) {
                        const sId = typeof item.senderProfileId === "object" ? item.senderProfileId?._id : item.senderProfileId
                        if (String(sId) === String(id)) {
                            intStatus = item.status === "accepted" ? "accepted" : "received_pending"
                            break
                        }
                    }
                }
                setInterestStatus(intStatus)
            } catch (err) {
                console.error("Failed to fetch profile details:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [id])

    const showToast = (msg) => {
        setToastMessage(msg)
        setTimeout(() => setToastMessage(""), 3500)
    }

    const handleSendInterest = async () => {
        try {
            await sendInterest(id)
            setInterestStatus("pending")
            setShowInterestModal(false)
            showToast("Interest expressed successfully!")
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to send interest"
            showToast(msg)
            setShowInterestModal(false)
        }
    }

    const handleToggleShortlist = async () => {
        try {
            const res = await toggleShortlist(id)
            const added = res?.action === "added"
            setIsShortlisted(added)
            showToast(added ? "Profile saved to your shortlist!" : "Removed from shortlist.")
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update shortlist.")
        }
    }

    const handleShare = async () => {
        const shareUrl = window.location.href
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${profile?.name ? formatMaskedSurname(profile.name) : "Member"} on MeriJodi`,
                    text: `Check out this verified matrimonial profile on MeriJodi`,
                    url: shareUrl,
                })
            } catch {
                /* ignore cancel */
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl)
                showToast("Profile link copied to clipboard!")
            } catch {
                showToast("Share URL: " + shareUrl)
            }
        }
    }

    const handleBlockReportSuccess = (action) => {
        if (action === "blocked") {
            navigate("/browse-matches")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FBF9F9] flex flex-col font-sans">
                <Navbar />
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    Loading profile details...
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-[#FBF9F9] flex flex-col font-sans">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <div>
                        <h2 className="text-2xl font-bold font-serif text-gray-800 mb-2">
                            Profile Not Found
                        </h2>
                        <p className="text-gray-500 text-sm mb-4">
                            This profile may have been removed or is no longer accessible.
                        </p>
                        <button
                            onClick={() => navigate("/browse-matches")}
                            className="px-6 py-2.5 rounded-full bg-[#842029] text-white text-xs font-semibold hover:bg-[#6b1b27]"
                        >
                            &larr; Back to Browse Matches
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const rawName = profile.name || profile.userId?.name || "MeriJodi Member"
    const maskedName = formatMaskedSurname(rawName)
    const age = calculateAge(profile.dateOfBirth)
    const displayName = age ? `${maskedName}, Age: ${age}` : maskedName
    const isPhotoHidden = !!profile.isPhotoHidden
    const getPhotoUrl = (p) => (typeof p === "string" ? p : p?.url)
    const primaryPhoto = profile.photos?.find((p) => typeof p === "object" && p?.isPrimary)
    const fallbackPhoto = profile.gender === "female" ? ProfileImage : userImage
    const photoUrl =
        getPhotoUrl(primaryPhoto) ||
        getPhotoUrl(profile.photos?.[0]) ||
        profile.avatar ||
        fallbackPhoto
    const values = [profile.religion, profile.motherTongue, profile.lifestyle?.diet].filter(Boolean)

    return (
        <div className="min-h-screen bg-[#FBF9F9] flex flex-col font-sans">
            <Navbar />

            {/* Confirm Interest Modal */}
            <ConfirmInterestModal
                isOpen={showInterestModal}
                onClose={() => setShowInterestModal(false)}
                onConfirm={handleSendInterest}
                profile={profile}
                profileName={maskedName}
                profileImage={isPhotoHidden ? fallbackPhoto : photoUrl}
                gender={profile.gender}
            />

            {/* Block / Report Modal */}
            <BlockReportModal
                isOpen={showBlockReportModal}
                onClose={() => setShowBlockReportModal(false)}
                targetProfile={profile}
                onActionSuccess={handleBlockReportSuccess}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
                {/* Back Button */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate("/browse-matches")}
                        className="text-xs sm:text-sm font-semibold text-[#842029] hover:underline flex items-center gap-1.5"
                    >
                        <ArrowLeft size={16} /> Back to Matches
                    </button>
                </div>

                {toastMessage && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm font-medium animate-in fade-in">
                        {toastMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Left Column (5 Cols) - Hero Photo & Compatibility */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="relative aspect-4/5 w-full rounded-3xl overflow-hidden shadow-md bg-gray-100">
                            {isPhotoHidden ? (
                                <div className="w-full h-full bg-gradient-to-br from-rose-50 to-pink-100 flex flex-col items-center justify-center p-6 text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center text-[#842029] mb-3 shadow-sm">
                                        <Heart size={28} />
                                    </div>
                                    <span className="text-base font-bold text-[#842029]">Photo Hidden by Member</span>
                                    <span className="text-xs text-gray-500 mt-1">This member has enabled photo privacy</span>
                                </div>
                            ) : (
                                <img
                                    src={photoUrl}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null
                                        e.currentTarget.src = fallbackPhoto
                                    }}
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                                <h1 className="text-3xl sm:text-4xl font-bold font-serif leading-tight">
                                    {displayName}
                                </h1>
                                <p className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-200 mt-1">
                                    <MapPin size={15} className="text-rose-400" />
                                    {profile.location?.city ? `${profile.location.city}, ${profile.location.country || "India"}` : "India"}
                                </p>
                            </div>
                        </div>

                        {/* Extra Photos Thumbnails */}
                        {!isPhotoHidden && profile.photos?.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {profile.photos.map((p, i) => (
                                    <img
                                        key={i}
                                        src={typeof p === "string" ? p : p.url}
                                        alt=""
                                        className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-xs"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Compatibility Score Widget */}
                        {typeof profile.compatibilityScore === "number" && (
                            <div className="bg-white rounded-3xl p-5 border border-[#FFE4E8] shadow-xs flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                        Match Score
                                    </span>
                                    <h3 className="text-3xl font-extrabold text-[#842029] font-serif">
                                        {profile.compatibilityScore}%
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Based on mutual lifestyle &amp; partner preferences
                                    </p>
                                </div>
                                <button
                                    onClick={handleToggleShortlist}
                                    title={isShortlisted ? "Shortlisted" : "Add to Shortlist"}
                                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                                        isShortlisted
                                            ? "bg-[#842029] border-[#842029] text-white shadow"
                                            : "border-gray-200 text-gray-400 hover:border-[#842029] hover:text-[#842029]"
                                    }`}
                                >
                                    <Star size={20} fill={isShortlisted ? "currentColor" : "none"} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Column (7 Cols) - Actions, Bio & Details */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Top Action Bar */}
                        <div className="flex flex-wrap items-center gap-3">
                            {interestStatus === "accepted" ? (
                                <button
                                    onClick={() => navigate(`/chat?profileId=${id}`)}
                                    className="flex-1 min-w-[160px] py-3 px-6 rounded-full bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                                >
                                    <MessageSquare size={16} /> Connected - Send Message
                                </button>
                            ) : interestStatus === "pending" ? (
                                <button
                                    disabled
                                    className="flex-1 min-w-[160px] py-3 px-6 rounded-full bg-amber-500 text-white text-xs sm:text-sm font-semibold opacity-90 flex items-center justify-center gap-2 shadow-xs cursor-default"
                                >
                                    <Clock size={16} /> Interest Sent (Pending)
                                </button>
                            ) : interestStatus === "received_pending" ? (
                                <button
                                    onClick={() => navigate("/interests-received")}
                                    className="flex-1 min-w-[160px] py-3 px-6 rounded-full bg-rose-700 text-white text-xs sm:text-sm font-semibold hover:bg-rose-800 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                                >
                                    <Heart size={16} fill="currentColor" /> Respond to Interest
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowInterestModal(true)}
                                    className="flex-1 min-w-[160px] py-3 px-6 rounded-full bg-[#842029] text-white text-xs sm:text-sm font-semibold hover:bg-[#6b1b27] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                                >
                                    <Heart size={16} fill="currentColor" /> Express Interest
                                </button>
                            )}
                            <button
                                onClick={() => navigate(`/chat?profileId=${id}`)}
                                className="flex-1 min-w-[140px] py-3 px-6 rounded-full bg-[#FFF0F2] text-[#842029] border border-[#FFE4E8] text-xs sm:text-sm font-semibold hover:bg-[#FFE4E8] transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <MessageSquare size={16} /> Direct Message
                            </button>
                            <button
                                onClick={handleToggleShortlist}
                                title={isShortlisted ? "Remove from Shortlist" : "Save Profile"}
                                className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all ${
                                    isShortlisted
                                        ? "bg-amber-50 text-amber-600 border-amber-300"
                                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                }`}
                            >
                                <Star size={18} fill={isShortlisted ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={handleShare}
                                title="Share Profile"
                                className="w-11 h-11 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center transition-all"
                            >
                                <Share2 size={18} />
                            </button>
                            <button
                                onClick={() => setShowBlockReportModal(true)}
                                title="Block or Report Member"
                                className="w-11 h-11 rounded-full border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center"
                            >
                                <Ban size={18} />
                            </button>
                        </div>

                        {/* About Section */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
                            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#640515]">
                                About {name.split(" ")[0]}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                {profile.aboutMe || "No detailed description provided by this member."}
                            </p>

                            {/* Lifestyle & Habits Pills */}
                            <div className="pt-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#842029] mb-2">
                                    Lifestyle &amp; Habits
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.lifestyle?.diet && (
                                        <span className="px-3.5 py-1.5 rounded-full bg-[#FFF0F2] text-[#842029] text-xs font-semibold border border-rose-100">
                                            🥗 {profile.lifestyle.diet}
                                        </span>
                                    )}
                                    {profile.lifestyle?.smoking !== undefined && (
                                        <span className="px-3.5 py-1.5 rounded-full bg-[#FFF0F2] text-[#842029] text-xs font-semibold border border-rose-100">
                                            🚬 {profile.lifestyle.smoking ? "Smoker" : "Non-Smoker"}
                                        </span>
                                    )}
                                    {profile.lifestyle?.drinking !== undefined && (
                                        <span className="px-3.5 py-1.5 rounded-full bg-[#FFF0F2] text-[#842029] text-xs font-semibold border border-rose-100">
                                            🍷 {profile.lifestyle.drinking ? "Drinks Alcohol" : "Non-Drinker"}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Hobbies & Interests */}
                            {Array.isArray(profile.hobbiesAndInterests) && profile.hobbiesAndInterests.length > 0 && (
                                <div className="pt-3 border-t border-gray-100">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#842029] mb-2">
                                        Hobbies &amp; Interests
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.hobbiesAndInterests.map((h) => (
                                            <span
                                                key={h}
                                                className="bg-gray-50 text-gray-800 px-3 py-1 rounded-full text-xs font-medium border border-gray-200"
                                            >
                                                {h}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4 Detail Grid Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 1. Personal Details */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 text-[#842029]">
                                    <Heart size={18} />
                                    <h2 className="text-base font-bold text-gray-900 font-serif">
                                        Personal Details
                                    </h2>
                                </div>
                                <div className="space-y-1">
                                    <DetailItem label="Age" value={calculateAge(profile.dateOfBirth) ? `${calculateAge(profile.dateOfBirth)} Years` : null} />
                                    <DetailItem label="Height" value={formatHeight(profile.heightCm)} />
                                    <DetailItem label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
                                    <DetailItem label="Place of Birth" value={profile.placeOfBirth} />
                                    <DetailItem label="Time of Birth" value={profile.timeOfBirth || profile.birthTime || profile.birthTiming} />
                                    <DetailItem label="Gender" value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null} />
                                    <DetailItem label="Marital Status" value={profile.maritalStatus?.replace(/_/g, " ")} />
                                    <DetailItem label="Manglik Status" value={profile.manglik} />
                                    <DetailItem label="Complexion" value={profile.complexion} />
                                    <DetailItem label="Willing to Relocate" value={profile.location?.willingToRelocate ? "Yes" : "No"} />
                                </div>
                            </div>

                            {/* 2. Family Background */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 text-[#842029]">
                                    <Users size={18} />
                                    <h2 className="text-base font-bold text-gray-900 font-serif">
                                        Family Background
                                    </h2>
                                </div>
                                <div className="space-y-1">
                                    <DetailItem label="Mother Tongue" value={profile.motherTongue} />
                                    <DetailItem label="Family Type" value={formatFamilyType(profile.family?.familyType)} />
                                    <DetailItem label="Father's Occupation" value={profile.family?.fatherOccupation} />
                                    <DetailItem label="Mother's Occupation" value={profile.family?.motherOccupation} />
                                    <DetailItem label="Family Values" value={formatFamilyValues(profile.family?.familyValues)} />
                                    <DetailItem label="Family Affluence" value={formatAffluence(profile.family?.familyAffluence)} />
                                    <DetailItem label="Siblings" value={formatSiblings(profile.family?.numBrothers, profile.family?.numSisters)} />
                                </div>
                            </div>

                            {/* 3. Career & Education */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 text-[#842029]">
                                    <GraduationCap size={18} />
                                    <h2 className="text-base font-bold text-gray-900 font-serif">
                                        Career &amp; Education
                                    </h2>
                                </div>
                                <div className="space-y-1">
                                    <DetailItem label="Highest Degree" value={profile.education?.highestDegree} />
                                    <DetailItem label="Field of Study" value={profile.education?.fieldOfStudy} />
                                    <DetailItem label="Institution" value={profile.education?.institution} />
                                    <DetailItem label="Graduation Year" value={profile.education?.graduationYear} />
                                    <DetailItem label="Occupation" value={profile.career?.occupation} />
                                    <DetailItem label="Company Name" value={profile.career?.companyName} />
                                    <DetailItem label="Industry" value={profile.career?.industry} />
                                    <DetailItem label="Annual Income" value={profile.career?.annualIncome} />
                                    <DetailItem label="Work Location" value={profile.career?.workLocation} />
                                </div>
                            </div>

                            {/* 4. Religion & Astrological Details */}
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 text-[#842029]">
                                    <Star size={18} />
                                    <h2 className="text-base font-bold text-gray-900 font-serif">
                                        Religion &amp; Astrology
                                    </h2>
                                </div>
                                <div className="space-y-1">
                                    <DetailItem label="Religion" value={profile.religion} />
                                    <DetailItem label="Caste / Sub-caste" value={profile.caste} />
                                    <DetailItem label="Gotra" value={profile.gotham} />
                                    <DetailItem label="Rashi" value={profile.rashi} />
                                    <DetailItem label="Nakshatra" value={profile.nakshtra} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Modals */}
            <ConfirmInterestModal
                isOpen={showInterestModal}
                profileName={name}
                profileImage={photoUrl}
                onClose={() => setShowInterestModal(false)}
                onConfirm={handleSendInterest}
            />

            <BlockReportModal
                isOpen={showBlockReportModal}
                targetProfile={profile}
                onClose={() => setShowBlockReportModal(false)}
                onSuccess={handleBlockReportSuccess}
            />
        </div>
    )
}
