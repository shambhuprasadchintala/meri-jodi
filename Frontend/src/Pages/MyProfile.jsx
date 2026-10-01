import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Navbar from "../Components/Navbar"
import Footer from "../Components/Footer"
import EditProfileModal from "../Components/EditProfileModal"
import PartnerPreferenceModal from "../Components/PartnerPreferenceModal"
import PhotoUploadModal from "../Components/PhotoUploadModal"
import userImage from "../assets/user.jpg"
import femaleProfile from "../assets/female_profile2.jpg"
import home1 from "../assets/home1.png"
import { getMyProfile } from "../api/profileApi"
import { getPartnerPreferences, updatePartnerPreferences } from "../api/partnerPreferenceApi"
import { getMyMatches } from "../api/matchingApi"
import {
    Briefcase,
    Calendar,
    CigaretteOff,
    Heart,
    MapPin,
    Phone,
    Sparkles,
    Utensils,
    WineOff,
    Users,
    GraduationCap,
    Flame,
    Target,
    ArrowRight,
    Camera,
    Eye,
    EyeOff,
} from "lucide-react"
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
    return parts.length ? parts.join(", ") : "No siblings"
}

const formatLocation = (location) => {
    if (!location) return null
    return [location.city, location.state, location.country].filter(Boolean).join(", ") || null
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

const DetailRow = ({ label, value, onAdd }) => (
    <div
        onClick={!value && onAdd ? onAdd : undefined}
        className={`flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-2.5 text-xs sm:text-sm border-b border-gray-100/70 last:border-0 gap-1 sm:gap-4 transition-colors ${
            !value && onAdd ? "cursor-pointer group hover:bg-rose-50/40 rounded-xl px-2 -mx-2" : ""
        }`}
    >
        <span className="text-gray-500 shrink-0 font-medium">{label}</span>
        {value ? (
            <span className="font-semibold text-gray-900 text-left sm:text-right break-words">{value}</span>
        ) : onAdd ? (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation()
                    onAdd()
                }}
                className="text-[#842029] text-xs font-semibold hover:underline cursor-pointer text-left sm:text-right group-hover:text-rose-700"
            >
                + Add {label}
            </button>
        ) : (
            <span className="text-gray-400 italic text-xs">Not specified</span>
        )}
    </div>
)

const PreferenceField = ({ label, value, onEdit }) => (
    <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-100 flex flex-col justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
            {label}
        </p>
        {value ? (
            <p className="text-xs sm:text-sm font-semibold text-gray-800 leading-snug">{value}</p>
        ) : (
            <button
                type="button"
                onClick={onEdit}
                className="text-left text-xs text-[#842029] font-medium hover:underline cursor-pointer"
            >
                + Specify {label}
            </button>
        )}
    </div>
)

function MyProfile() {
    const navigate = useNavigate()
    const { user, updateUser } = useAuth()
    const [profile, setProfile] = useState(null)
    const [preferences, setPreferences] = useState(null)
    const [recommendedMatches, setRecommendedMatches] = useState([])
    const [status, setStatus] = useState("loading")
    const [editingSection, setEditingSection] = useState(null)
    const [isPrefModalOpen, setIsPrefModalOpen] = useState(false)
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)

    const fetchProfileAndData = async () => {
        setStatus("loading")
        try {
            const [profileData, prefData, matchData] = await Promise.all([
                getMyProfile().catch((err) => {
                    console.warn("getMyProfile error:", err?.message)
                    return null
                }),
                getPartnerPreferences().catch((err) => {
                    console.warn("getPartnerPreferences error:", err?.message)
                    return null
                }),
                getMyMatches({ limit: 6 }).catch(() => ({ matches: [] })),
            ])

            if (profileData) {
                setProfile(profileData)
                setPreferences(prefData)
                setRecommendedMatches(matchData?.matches || [])
                if (profileData.name && user?.name !== profileData.name && updateUser) {
                    updateUser({ name: profileData.name })
                }
                setStatus("found")
            } else {
                setStatus("empty")
            }
        } catch (err) {
            console.error("Failed to load profile:", err)
            setStatus("error")
        }
    }

    useEffect(() => {
        fetchProfileAndData()
    }, [])

    const handleEditComplete = async () => {
        try {
            const data = await getMyProfile()
            if (data) {
                setProfile(data)
                if (data.name && updateUser) {
                    updateUser({ name: data.name })
                }
            }
        } catch (err) {
            console.error("Failed to refetch profile:", err)
        }
        setEditingSection(null)
    }

    const handleSavePreferences = async (newPrefs) => {
        const saved = await updatePartnerPreferences(newPrefs)
        setPreferences(saved)
    }

    const handlePhotosUpdated = (updatedProfile) => {
        setProfile(updatedProfile)
    }

    const isPlaceholder = (n) => !n || ["Google Member", "MeriJodi Member", "New Member"].includes(n)
    const fullName =
        (!isPlaceholder(profile?.name) ? profile.name : "") ||
        (!isPlaceholder(profile?.userId?.name) ? profile.userId.name : "") ||
        (!isPlaceholder(user?.name) ? user.name : "") ||
        profile?.name ||
        user?.name ||
        "MeriJodi Member"
    const email = user?.email || "—"
    const phone = user?.phone || "—"

    const fallbackPhoto = profile?.gender === "female" ? femaleProfile : userImage
    const primaryPhoto =
        profile?.photos?.find((p) => p.isPrimary)?.url ||
        profile?.photos?.[0]?.url ||
        fallbackPhoto

    const photosList = profile?.photos?.length ? profile.photos : []

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#FBF9F9] flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    Loading your profile...
                </div>
            </div>
        )
    }

    if (status === "empty") {
        return (
            <div className="min-h-screen bg-[#FBF9F9] flex flex-col">
                <Navbar />
                <div className="flex-1 max-w-xl mx-auto px-6 py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#FFF0F2] text-[#842029] flex items-center justify-center mx-auto mb-4">
                        <Heart size={28} />
                    </div>
                    <h2 className="text-2xl font-bold font-serif text-gray-900 mb-2">
                        Complete Your Profile
                    </h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Set up your biodata and lifestyle details to start getting personalized match suggestions.
                    </p>
                    <button
                        onClick={() => navigate("/add-details")}
                        className="px-8 py-3 rounded-full bg-[#842029] text-white font-semibold text-sm hover:bg-[#6b1b27] transition-all shadow-sm"
                    >
                        Fill Biodata Manually
                    </button>
                </div>
                <Footer />
            </div>
        )
    }

    if (status === "error") {
        return (
            <div className="min-h-screen bg-[#FBF9F9] flex flex-col">
                <Navbar />
                <div className="flex-1 max-w-md mx-auto px-6 py-20 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">
                        ⚠️
                    </div>
                    <h2 className="text-xl font-bold font-serif text-gray-900 mb-2">
                        Could Not Load Profile
                    </h2>
                    <p className="text-gray-500 text-sm mb-6">
                        There was a temporary problem retrieving your profile. Please check your connection and try again.
                    </p>
                    <button
                        onClick={fetchProfileAndData}
                        className="px-6 py-2.5 rounded-full bg-[#842029] text-white font-semibold text-sm hover:bg-[#6b1b27] transition-all shadow-sm cursor-pointer"
                    >
                        Try Again
                    </button>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FBF9F9] font-sans flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
                {/* Hero Profile Overview */}
                <div className="bg-white rounded-3xl p-5 sm:p-8 border border-[#FFE4E8] shadow-xs flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Left: Photos */}
                    <div className="flex flex-col gap-3 w-full lg:w-96 shrink-0">
                        <div className="relative aspect-4/5 w-full rounded-2xl overflow-hidden shadow-sm bg-gray-100">
                            <img
                                src={primaryPhoto}
                                alt={fullName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src = fallbackPhoto
                                }}
                            />
                            <button
                                onClick={() => setIsPhotoModalOpen(true)}
                                className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-semibold hover:bg-black/80 transition-colors flex items-center gap-1.5 shadow"
                            >
                                <Camera size={14} /> Manage Photos ({photosList.length}/6)
                            </button>
                            {profile.isPhotoHidden && (
                                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-600/90 backdrop-blur-xs text-white text-[11px] font-bold shadow-md flex items-center gap-1">
                                    <EyeOff size={12} /> Photo Hidden from Members
                                </span>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {photosList.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {photosList.map((p, idx) => (
                                    <img
                                        key={idx}
                                        src={p.url}
                                        alt=""
                                        onClick={() => setIsPhotoModalOpen(true)}
                                        className="h-16 w-16 rounded-xl object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Key Info & Bio */}
                    <div className="flex-1 flex flex-col justify-between space-y-6">
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#842029]">
                                    My Profile
                                </span>
                                <button
                                    onClick={() => setEditingSection("personal")}
                                    className="px-4 py-1.5 rounded-full border border-[#842029] text-[#842029] text-xs font-semibold hover:bg-[#842029] hover:text-white transition-colors"
                                >
                                    ✎ Edit Profile
                                </button>
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#640515] leading-tight">
                                {fullName}
                            </h1>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs sm:text-sm text-gray-600">
                                <div className="flex items-center gap-1 font-medium">
                                    <Calendar size={15} className="text-[#842029]" />
                                    <span>Age: {calculateAge(profile.dateOfBirth) ?? "—"}</span>
                                </div>
                                <span>&bull;</span>
                                <div className="flex items-center gap-1 font-medium">
                                    <MapPin size={15} className="text-[#842029]" />
                                    <span>{formatLocation(profile.location) || "Location not set"}</span>
                                </div>
                                <span>&bull;</span>
                                <div className="flex items-center gap-1 font-medium">
                                    <Briefcase size={15} className="text-[#842029]" />
                                    <span>{profile.career?.occupation || "Occupation not set"}</span>
                                </div>
                                <span>&bull;</span>
                                <div className="flex items-center gap-1 font-medium">
                                    <Phone size={15} className="text-[#842029]" />
                                    <span>{phone}</span>
                                </div>
                            </div>
                        </div>

                        {/* About Me Section */}
                        <div className="bg-[#FFF4F6] border border-[#F1AEB4]/40 rounded-3xl p-5 sm:p-6 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="flex items-center gap-2 text-base font-bold text-[#842029] font-serif">
                                    <Sparkles size={18} /> About {fullName.split(" ")[0]}
                                </h2>
                                <button
                                    onClick={() => setEditingSection("about")}
                                    className="text-xs font-semibold text-[#842029] hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    ✎ Edit Bio
                                </button>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                {profile.aboutMe || "You haven't added an about summary yet. Share your passions, family values, and what you're looking for in a partner."}
                            </p>

                            {/* Lifestyle & Habits */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#842029]">
                                        Lifestyle &amp; Habits
                                    </h3>
                                    <button
                                        onClick={() => setEditingSection("lifestyle")}
                                        className="text-xs text-[#842029] font-semibold hover:underline"
                                    >
                                        ✎ Edit
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {profile.lifestyle?.diet && (
                                        <div className="bg-white rounded-full px-3.5 py-1.5 border border-rose-100 flex items-center gap-2 text-xs font-semibold text-gray-800 shadow-2xs">
                                            <Utensils size={12} className="text-[#842029]" />
                                            {profile.lifestyle.diet}
                                        </div>
                                    )}
                                    {profile.lifestyle?.smoking === false && (
                                        <div className="bg-white rounded-full px-3.5 py-1.5 border border-rose-100 flex items-center gap-2 text-xs font-semibold text-gray-800 shadow-2xs">
                                            <CigaretteOff size={12} className="text-[#842029]" />
                                            Non-Smoker
                                        </div>
                                    )}
                                    {profile.lifestyle?.drinking === false && (
                                        <div className="bg-white rounded-full px-3.5 py-1.5 border border-rose-100 flex items-center gap-2 text-xs font-semibold text-gray-800 shadow-2xs">
                                            <WineOff size={12} className="text-[#842029]" />
                                            Non-Drinker
                                        </div>
                                    )}
                                    {!profile.lifestyle && (
                                        <button
                                            onClick={() => setEditingSection("lifestyle")}
                                            className="text-xs text-[#842029] font-medium hover:underline"
                                        >
                                            + Add Lifestyle Preferences
                                        </button>
                                    )}
                                </div>

                                {/* Hobbies & Interests Pills */}
                                {Array.isArray(profile.hobbiesAndInterests) && profile.hobbiesAndInterests.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-rose-100/60">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#842029] mb-1.5">
                                            Hobbies &amp; Interests
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {profile.hobbiesAndInterests.map((h) => (
                                                <span
                                                    key={h}
                                                    className="bg-white text-gray-800 px-3 py-1 rounded-full text-xs font-medium border border-rose-100 shadow-2xs"
                                                >
                                                    {h}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4 Detail Grid Cards */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. Personal Details */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#FFF0F2] text-[#842029] flex items-center justify-center">
                                    <Heart size={16} />
                                </div>
                                <h2 className="text-base font-bold text-gray-900 font-serif">
                                    Personal Details
                                </h2>
                            </div>
                            <button
                                onClick={() => setEditingSection("personal")}
                                className="text-xs font-semibold text-[#842029] hover:underline cursor-pointer"
                            >
                                ✎ Edit
                            </button>
                        </div>
                        <div className="space-y-1">
                            <DetailRow label="Age" value={calculateAge(profile.dateOfBirth) ? `${calculateAge(profile.dateOfBirth)} Years` : null} onAdd={() => setEditingSection("personal")} />
                            <DetailRow label="Height" value={formatHeight(profile.heightCm)} onAdd={() => setEditingSection("personal")} />
                            <DetailRow label="Current City / Location" value={profile.location?.city || formatLocation(profile.location)} onAdd={() => setEditingSection("personal")} />
                            <DetailRow label="Date of Birth" value={formatDate(profile.dateOfBirth)} onAdd={() => setEditingSection("personal")} />
                            <DetailRow label="Place of Birth" value={profile.placeOfBirth} onAdd={() => setEditingSection("personal")} />
                            <DetailRow label="Time of Birth" value={profile.timeOfBirth || profile.birthTime || profile.birthTiming} onAdd={() => setEditingSection("personal")} />
                            <DetailRow label="Gender" value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : null} onAdd={() => setEditingSection("personal")} />
                            <DetailRow label="Marital Status" value={profile.maritalStatus?.replace("_", " ")} onAdd={() => setEditingSection("personal")} />
                            <DetailRow label="Manglik Status" value={profile.manglik} onAdd={() => setEditingSection("personal")} />
                            <DetailRow label="Complexion" value={profile.complexion} onAdd={() => setEditingSection("personal")} />
                            <DetailRow label="Willing to Relocate" value={profile.location?.willingToRelocate ? "Yes" : "No"} onAdd={() => setEditingSection("personal")} />
                            <DetailRow label="Email" value={email} />
                        </div>
                    </div>

                    {/* 2. Family Background */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#FFF0F2] text-[#842029] flex items-center justify-center">
                                    <Users size={16} />
                                </div>
                                <h2 className="text-base font-bold text-gray-900 font-serif">
                                    Family Background
                                </h2>
                            </div>
                            <button
                                onClick={() => setEditingSection("family")}
                                className="text-xs font-semibold text-[#842029] hover:underline cursor-pointer"
                            >
                                ✎ Edit
                            </button>
                        </div>
                        <div className="space-y-1">
                            <DetailRow label="Mother Tongue" value={profile.motherTongue} onAdd={() => setEditingSection("family")} />
                            <DetailRow label="Family Type" value={formatFamilyType(profile.family?.familyType)} onAdd={() => setEditingSection("family")} />
                            <DetailRow label="Father's Occupation" value={profile.family?.fatherOccupation} onAdd={() => setEditingSection("family")} />
                            <DetailRow label="Mother's Occupation" value={profile.family?.motherOccupation} onAdd={() => setEditingSection("family")} />
                            <DetailRow label="Family Values" value={formatFamilyValues(profile.family?.familyValues)} onAdd={() => setEditingSection("family")} />
                            <DetailRow label="Family Affluence" value={formatAffluence(profile.family?.familyAffluence)} onAdd={() => setEditingSection("family")} />
                            <DetailRow label="Siblings" value={formatSiblings(profile.family?.numBrothers, profile.family?.numSisters)} onAdd={() => setEditingSection("family")} />
                        </div>
                    </div>

                    {/* 3. Career & Education */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#FFF0F2] text-[#842029] flex items-center justify-center">
                                    <GraduationCap size={16} />
                                </div>
                                <h2 className="text-base font-bold text-gray-900 font-serif">
                                    Career &amp; Education
                                </h2>
                            </div>
                            <button
                                onClick={() => setEditingSection("career")}
                                className="text-xs font-semibold text-[#842029] hover:underline cursor-pointer"
                            >
                                ✎ Edit
                            </button>
                        </div>
                        <div className="space-y-1">
                            <DetailRow label="Highest Degree" value={profile.education?.highestDegree} onAdd={() => setEditingSection("career")} />
                            <DetailRow label="Field of Study" value={profile.education?.fieldOfStudy} onAdd={() => setEditingSection("career")} />
                            <DetailRow label="College / University" value={profile.education?.institution} onAdd={() => setEditingSection("career")} />
                            <DetailRow label="Occupation" value={profile.career?.occupation} onAdd={() => setEditingSection("career")} />
                            <DetailRow label="Company Name" value={profile.career?.companyName} onAdd={() => setEditingSection("career")} />
                            <DetailRow label="Industry" value={profile.career?.industry} onAdd={() => setEditingSection("career")} />
                            <DetailRow label="Annual Income" value={profile.career?.annualIncome} onAdd={() => setEditingSection("career")} />
                            <DetailRow label="Work Location" value={profile.career?.workLocation} onAdd={() => setEditingSection("career")} />
                        </div>
                    </div>

                    {/* 4. Religion & Astrological Details */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#FFF0F2] text-[#842029] flex items-center justify-center">
                                    <Flame size={16} />
                                </div>
                                <h2 className="text-base font-bold text-gray-900 font-serif">
                                    Religion &amp; Astrology
                                </h2>
                            </div>
                            <button
                                onClick={() => setEditingSection("religion")}
                                className="text-xs font-semibold text-[#842029] hover:underline cursor-pointer"
                            >
                                ✎ Edit
                            </button>
                        </div>
                        <div className="space-y-1">
                            <DetailRow label="Religion" value={profile.religion} onAdd={() => setEditingSection("religion")} />
                            <DetailRow label="Caste / Sub-caste" value={profile.caste} onAdd={() => setEditingSection("religion")} />
                            <DetailRow label="Gotra" value={profile.gotham} onAdd={() => setEditingSection("religion")} />
                            <DetailRow label="Rashi" value={profile.rashi} onAdd={() => setEditingSection("religion")} />
                            <DetailRow label="Nakshatra" value={profile.nakshtra} onAdd={() => setEditingSection("religion")} />
                        </div>
                    </div>
                </div>

                {/* Ideal Partner Preferences Section */}
                <div className="mt-10 bg-white rounded-3xl p-6 sm:p-8 border-2 border-dashed border-[#E0BEBF] shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#FFF0F2] text-[#842029] flex items-center justify-center">
                                <Target size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#640515]">
                                    Ideal Partner Preferences
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Compatibility scores in Browse Matches are tailored to these criteria
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsPrefModalOpen(true)}
                            className="px-6 py-2 rounded-full bg-[#842029] text-white text-xs font-semibold hover:bg-[#6b1b27] transition-all shadow-xs"
                        >
                            ✎ Edit Preferences
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <PreferenceField
                            label="Age Range"
                            value={preferences?.ageMin ? `${preferences.ageMin} - ${preferences.ageMax || 40} Years` : null}
                            onEdit={() => setIsPrefModalOpen(true)}
                        />
                        <PreferenceField
                            label="Height Range"
                            value={preferences?.heightMinCm ? `${preferences.heightMinCm}cm - ${preferences.heightMaxCm || 200}cm` : null}
                            onEdit={() => setIsPrefModalOpen(true)}
                        />
                        <PreferenceField
                            label="Preferred Religion"
                            value={preferences?.religion || null}
                            onEdit={() => setIsPrefModalOpen(true)}
                        />
                        <PreferenceField
                            label="Preferred Caste"
                            value={preferences?.caste || null}
                            onEdit={() => setIsPrefModalOpen(true)}
                        />
                        <PreferenceField
                            label="Preferred Location"
                            value={preferences?.location || null}
                            onEdit={() => setIsPrefModalOpen(true)}
                        />
                        <PreferenceField
                            label="Education Level"
                            value={preferences?.education || null}
                            onEdit={() => setIsPrefModalOpen(true)}
                        />
                        <PreferenceField
                            label="Occupation"
                            value={preferences?.occupation || null}
                            onEdit={() => setIsPrefModalOpen(true)}
                        />
                        <PreferenceField
                            label="Annual Income"
                            value={preferences?.annualIncome || null}
                            onEdit={() => setIsPrefModalOpen(true)}
                        />
                    </div>
                </div>

                {/* Recommended Matches Carousel */}
                {recommendedMatches.length > 0 && (
                    <div className="mt-12">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#640515]">
                                    Recommended Matches for You
                                </h2>
                                <p className="text-xs text-gray-500">Based on your shared lifestyle and preferences</p>
                            </div>
                            <button
                                onClick={() => navigate("/browse-matches")}
                                className="text-xs sm:text-sm font-semibold text-[#842029] hover:underline flex items-center gap-1"
                            >
                                View All <ArrowRight size={14} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendedMatches.slice(0, 3).map((match) => {
                                const mId = match._id || match.id
                                const mPhoto = match.photos?.find((p) => p.isPrimary)?.url || match.photos?.[0]?.url || home1
                                const mName = match.name || match.userId?.name || "Member"
                                const maskedName = formatMaskedSurname(mName)
                                const mAge = calculateAge(match.dateOfBirth)
                                return (
                                    <div
                                        key={mId}
                                        onClick={() => navigate(`/match-details/${mId}`)}
                                        className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
                                            <img src={mPhoto} alt={mName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            {typeof match.compatibilityScore === "number" && (
                                                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 text-[#842029] text-[11px] font-bold shadow-xs">
                                                    ★ {match.compatibilityScore}% Match
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 text-base font-serif">
                                                {maskedName}{mAge ? `, ${mAge}` : ""}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {match.career?.occupation || "Professional"} &bull; {match.location?.city || "India"}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </main>

            <Footer />

            {/* Edit Modals */}
            <EditProfileModal
                isOpen={editingSection !== null}
                section={editingSection}
                profile={profile}
                onClose={() => setEditingSection(null)}
                onSuccess={handleEditComplete}
            />

            <PartnerPreferenceModal
                isOpen={isPrefModalOpen}
                preferences={preferences}
                onClose={() => setIsPrefModalOpen(false)}
                onSave={handleSavePreferences}
            />

            <PhotoUploadModal
                isOpen={isPhotoModalOpen}
                photos={photosList}
                isPhotoHidden={profile?.isPhotoHidden}
                onClose={() => setIsPhotoModalOpen(false)}
                onPhotosUpdated={handlePhotosUpdated}
            />
        </div>
    )
}

export default MyProfile
