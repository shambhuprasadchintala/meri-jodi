import { Camera, Heart, Users, Star, Plus, EyeOff } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../Components/Navbar"
import Footer from "../Components/Footer"
import PhotoUploadModal from "../Components/PhotoUploadModal"
import home1 from "../assets/home1.png"
import home4 from "../assets/home4.png"
import femaleProfile from "../assets/female_profile2.jpg"
import userImage from "../assets/user.jpg"
import { useAuth } from "../context/AuthContext"
import { getMyProfile, getRecommendedMatches, getWhoViewedYou } from "../api/dashboardApi"
import { formatMaskedSurname, calculateAge } from "../utils/formatters"

const COLORS = {
  pageBg: "#FBF9F9",
  maroon: "#640515",
  accentRed: "#B2283C",
  bannerBg: "#FFF4F6",
  pillBg: "#FFDAD9",
  trackBg: "#F7DDDF",
  trackFill: "#252525",
  successBg: "#EFEDED",
  bodyGray: "#6B6F72",
}

const mapProfileToCard = (profile) => {
  const fallback = profile.gender === "female" ? femaleProfile : userImage
  const isPhotoHidden = !!profile.isPhotoHidden
  return {
    id: profile._id || profile.id,
    name: profile.name || profile.userId?.name || "MeriJodi Member",
    age: calculateAge(profile.dateOfBirth),
    match: typeof profile.compatibilityScore === "number" ? profile.compatibilityScore : 84,
    role: profile.career?.occupation || "Occupation not specified",
    location: profile.location?.city || "Location not specified",
    tags: [profile.religion, profile.caste, profile.lifestyle?.diet].filter(Boolean).slice(0, 2),
    isPhotoHidden,
    image: isPhotoHidden ? fallback : (
      profile.photos?.find((p) => p.isPrimary)?.url ||
      profile.photos?.[0]?.url ||
      fallback
    ),
  }
}

const MatchCard = ({ image, name, age, match, role, location, tags = [], isPhotoHidden, onClick }) => {
  const displayName = formatMaskedSurname(name)
  return (
    <div
      className="bg-white w-full rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow cursor-pointer flex flex-col justify-between"
      onClick={onClick}
    >
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          {isPhotoHidden ? (
            <div className="w-full h-full bg-rose-50 flex flex-col items-center justify-center text-center p-4">
              <EyeOff size={24} className="text-[#842029] mb-1" />
              <span className="text-xs font-bold text-[#842029]">Photo Hidden</span>
            </div>
          ) : (
            <img src={image} alt={displayName} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          )}
          {typeof match === "number" && (
            <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold shadow-sm" style={{ color: "#2b2b2b" }}>
              <Star className="w-3 h-3" fill={COLORS.maroon} color={COLORS.maroon} />
              {match}% Match
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-display font-bold text-lg sm:text-xl md:text-2xl leading-tight" style={{ color: COLORS.maroon }}>
            {displayName}{age ? `, Age: ${age}` : ""}
          </h3>
          <p className="text-xs sm:text-sm mt-1" style={{ color: COLORS.bodyGray }}>
            {role} &bull; {location}
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: COLORS.pillBg, color: COLORS.maroon }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SectionHeading = ({ children, action }) => (
  <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
    <h2 className="font-display font-bold text-lg sm:text-xl md:text-2xl" style={{ color: COLORS.maroon }}>
      {children}
    </h2>
    {action}
  </div>
)

const EmptyState = ({ children }) => (
  <p className="text-sm rounded-2xl border border-dashed p-6 text-center" style={{ color: COLORS.bodyGray, borderColor: COLORS.trackBg }}>
    {children}
  </p>
)

const HomePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [status, setStatus] = useState("loading")
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [whoViewedYou, setWhoViewedYou] = useState([])
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)

  const fetchDashboard = async () => {
    setStatus("loading")
    try {
      const [profileData, matchData, viewedData] = await Promise.all([
        getMyProfile(),
        getRecommendedMatches(3),
        getWhoViewedYou(),
      ])
      if (!profileData) { setStatus("empty"); return }
      setProfile(profileData)
      setMatches(
        (matchData || [])
          .filter((m) => m && (m._id || m.id))
          .map(mapProfileToCard)
      )
      setWhoViewedYou(
        (viewedData || [])
          .map((v) => v.profile || v)
          .filter((p) => p && (p._id || p.id))
          .map(mapProfileToCard)
      )
      setStatus("ready")
    } catch (err) {
      console.error("Failed to load dashboard:", err)
      setStatus("error")
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const handlePhotosUpdated = (updatedProfile) => {
    if (updatedProfile) {
      setProfile(updatedProfile)
    } else {
      fetchDashboard()
    }
  }

  const userName = user?.name ? formatMaskedSurname(user.name).split(" ")[0] : ""

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.pageBg }}>
        <p style={{ color: COLORS.bodyGray }}>Loading your dashboard...</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: COLORS.pageBg }}>
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p style={{ color: COLORS.bodyGray }}>Something went wrong loading your dashboard. Please refresh the page.</p>
        </div>
      </div>
    )
  }

  if (status === "empty") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: COLORS.pageBg }}>
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="mb-3" style={{ color: COLORS.bodyGray }}>
            You haven&apos;t completed your profile yet.
          </p>
          <button
            type="button"
            onClick={() => navigate("/profile", { state: { openEdit: true } })}
            className="font-semibold hover:underline cursor-pointer"
            style={{ color: COLORS.accentRed }}
          >
            Complete Your Profile &rarr;
          </button>
        </div>
      </div>
    )
  }

  const profileCompletion = profile?.profileCompletionPct ?? 0

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: COLORS.pageBg }}>
      <Navbar />

      {/* Direct Add Photo Pop-up Modal */}
      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        photos={profile?.photos || []}
        onClose={() => setIsPhotoModalOpen(false)}
        onPhotosUpdated={handlePhotosUpdated}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      `}</style>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-8 sm:py-10 md:py-14">
        <header>
          <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl" style={{ color: COLORS.maroon }}>
            Welcome back{userName ? `, ${userName}` : ""}
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: COLORS.bodyGray }}>
            Your journey to a lifetime of love continues here.
          </p>
        </header>

        {/* Profile Completion Bar */}
        <div className="mt-6 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 border border-[#f2858e] shadow-xs" style={{ backgroundColor: COLORS.bannerBg }}>
          <div>
            <p className="font-semibold text-lg sm:text-xl" style={{ color: COLORS.maroon }}>Profile Completion</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs sm:text-sm" style={{ color: COLORS.bodyGray }}>
              Profile completeness score:
              <span className="font-bold" style={{ color: COLORS.maroon }}>{profileCompletion}%</span>
              <div className="w-32 sm:w-40 h-[7px] rounded-full overflow-hidden" style={{ backgroundColor: COLORS.trackBg }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${profileCompletion}%`, backgroundColor: COLORS.maroon }} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            {/* Direct Profile Edit Redirection */}
            <button
              type="button"
              onClick={() => navigate("/profile", { state: { openEdit: true, editSection: "personal" } })}
              className="flex items-center gap-1.5 bg-[#842029] text-white rounded-full px-4 py-2 text-xs sm:text-sm font-semibold shadow-xs hover:bg-[#6b1b27] transition-all cursor-pointer"
            >
              <span>✎</span> Complete Personal Info
            </button>

            {/* Direct Add Photo Pop-up */}
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(true)}
              className="flex items-center gap-2 bg-white rounded-full pl-2.5 pr-4 py-2 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-shadow cursor-pointer"
              style={{ color: "#2b2b2b" }}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.pillBg, color: COLORS.maroon }}>
                <Camera className="w-3.5 h-3.5" />
              </span>
              Add Photo
            </button>

            {/* Add Hobbies / Lifestyle */}
            <button
              type="button"
              onClick={() => navigate("/profile", { state: { openEdit: true, editSection: "lifestyle" } })}
              className="flex items-center gap-2 bg-white rounded-full pl-2.5 pr-4 py-2 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-shadow cursor-pointer"
              style={{ color: "#2b2b2b" }}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.pillBg, color: COLORS.maroon }}>
                <Heart className="w-3.5 h-3.5" />
              </span>
              Add Hobbies
            </button>

            {/* Add Family Details */}
            <button
              type="button"
              onClick={() => navigate("/profile", { state: { openEdit: true, editSection: "family" } })}
              className="flex items-center gap-2 bg-white rounded-full pl-2.5 pr-4 py-2 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-shadow cursor-pointer"
              style={{ color: "#2b2b2b" }}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: COLORS.pillBg, color: COLORS.maroon }}>
                <Users className="w-3.5 h-3.5" />
              </span>
              Add Family Details
            </button>
          </div>
        </div>

        {/* Matches For You */}
        <section className="mt-10">
          <SectionHeading
            action={
              <button
                onClick={() => navigate("/browse-matches")}
                className="text-xs sm:text-sm font-semibold hover:underline cursor-pointer"
                style={{ color: COLORS.accentRed }}
              >
                View All Matches &rarr;
              </button>
            }
          >
            Matches for You
          </SectionHeading>
          {matches.length === 0 ? (
            <EmptyState>No matches yet &mdash; check back soon as more members join.</EmptyState>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {matches.map((m) => (
                <MatchCard key={m.id} {...m} onClick={() => navigate(`/match-details/${m.id}`)} />
              ))}
            </div>
          )}
        </section>

        {/* Success Stories Banner */}
        <section className="mt-10 rounded-3xl overflow-hidden grid md:grid-cols-2 shadow-xs" style={{ backgroundColor: COLORS.successBg }}>
          <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center">
            <span className="text-xs font-bold tracking-[0.12em]" style={{ color: COLORS.accentRed }}>SUCCESS STORIES</span>
            <p className="font-display font-bold text-2xl sm:text-3xl md:text-4xl leading-snug mt-3" style={{ color: COLORS.maroon }}>
              &ldquo;We found our forever on MeriJodi.&rdquo;
            </p>
            <p className="text-xs sm:text-sm leading-relaxed mt-3" style={{ color: COLORS.bodyGray }}>
              Priya and Sameer met through our curated recommendations in late 2022. Today, they are happily married and building a life of shared dreams.
            </p>
            <button
              onClick={() => navigate("/browse-matches")}
              className="text-left text-xs sm:text-sm font-semibold mt-4 hover:underline cursor-pointer"
              style={{ color: COLORS.accentRed }}
            >
              Explore Compatible Profiles &rarr;
            </button>
          </div>
          <img src={home4} alt="Married couple success story" className="w-full h-56 sm:h-64 md:h-full object-cover" />
        </section>

        {/* Who Viewed You */}
        <section className="mt-10">
          <SectionHeading>Who Viewed You ({whoViewedYou.length})</SectionHeading>
          {whoViewedYou.length === 0 ? (
            <EmptyState>No one has viewed your profile yet.</EmptyState>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {whoViewedYou.map((m) => (
                <MatchCard key={m.id} {...m} onClick={() => navigate(`/match-details/${m.id}`)} />
              ))}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  )
}

export default HomePage
