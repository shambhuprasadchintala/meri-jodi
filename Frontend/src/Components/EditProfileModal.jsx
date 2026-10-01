import { useState, useEffect } from "react"
import { X, Loader, Plus, Check } from "lucide-react"
import {
  updateProfile,
  buildPersonalDetailsPayload,
  buildFamilyPayload,
  buildCareerEducationPayload,
  buildReligionPayload,
  buildLifestylePayload,
} from "../api/profileApi"
import {
  motherTongues,
  religions,
  getCastesForLanguage,
} from "../utils/casteData"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const POPULAR_HOBBIES = [
  "Acting",
  "Adventure Sports",
  "Baking",
  "Alternative Healing/medicine",
  "Art/Handicraft",
  "Bike/car Enthusiast",
  "Book Clubs",
  "Cooking",
  "Dancing",
  "Fitness & Gym",
  "Gardening",
  "Gaming",
  "Movies & Cinema",
  "Music",
  "Pet Lover",
  "Photography",
  "Reading",
  "Swimming",
  "Technology",
  "Traveling",
  "Trekking",
  "Writing",
  "Yoga & Meditation",
  "Badminton",
  "Cricket",
  "Volunteering",
]

const SECTIONS = [
  { id: "personal", label: "Personal" },
  { id: "about", label: "About & Bio" },
  { id: "family", label: "Family" },
  { id: "career", label: "Career & Edu" },
  { id: "religion", label: "Religion" },
  { id: "lifestyle", label: "Lifestyle" },
]

const EditProfileModal = ({ isOpen, section: initialSection = "personal", profile, onClose, onSuccess }) => {
  const [activeSection, setActiveSection] = useState(initialSection || "personal")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [customHobby, setCustomHobby] = useState("")
  const [formData, setFormData] = useState({})

  useEffect(() => {
    if (initialSection) setActiveSection(initialSection)
  }, [initialSection, isOpen])

  useEffect(() => {
    if (profile && isOpen) {
      setFormData({
        // Personal
        name: profile.name || profile.userId?.name || "",
        day: profile.dateOfBirth ? new Date(profile.dateOfBirth).getDate().toString() : "",
        month: profile.dateOfBirth ? MONTHS[new Date(profile.dateOfBirth).getMonth()] : "",
        year: profile.dateOfBirth ? new Date(profile.dateOfBirth).getFullYear().toString() : "",
        placeOfBirth: profile.placeOfBirth || "",
        timeOfBirth: profile.timeOfBirth || profile.birthTime || profile.birthTiming || "",
        gender: profile.gender || "",
        heightCm: profile.heightCm ? convertCmToFeetInches(profile.heightCm) : "",
        location: profile.location?.city || "",
        state: profile.location?.state || "",
        pincode: profile.location?.pincode || "",
        willingToRelocate: profile.location?.willingToRelocate ? "true" : "false",
        maritalStatus: profile.maritalStatus || "",
        manglik: profile.manglik || "",
        complexion: profile.complexion || "",

        // About
        aboutMe: profile.aboutMe || "",

        // Family
        motherTongue: profile.motherTongue || "",
        familyType: profile.family?.familyType || "",
        fatherOccupation: profile.family?.fatherOccupation || "",
        motherOccupation: profile.family?.motherOccupation || "",
        familyValues: profile.family?.familyValues || "",
        familyAffluence: profile.family?.familyAffluence || "",
        numBrothers: profile.family?.numBrothers !== undefined ? String(profile.family.numBrothers) : "",
        numSisters: profile.family?.numSisters !== undefined ? String(profile.family.numSisters) : "",

        // Career
        education: profile.education?.highestDegree || "",
        fieldOfStudy: profile.education?.fieldOfStudy || "",
        institution: profile.education?.institution || "",
        graduationYear: profile.education?.graduationYear ? String(profile.education.graduationYear) : "",
        occupation: profile.career?.occupation || "",
        companyName: profile.career?.companyName || "",
        industry: profile.career?.industry || "",
        annualIncome: profile.career?.annualIncome || "",
        workLocation: profile.career?.workLocation || "",

        // Religion
        motherTongue: profile.motherTongue || "",
        religion: profile.religion || "",
        caste: profile.caste || "",
        gotham: profile.gotham || "",
        rashi: profile.rashi || "",
        nakshtra: profile.nakshtra || "",

        // Lifestyle
        diet: profile.lifestyle?.diet || "",
        smoking: profile.lifestyle?.smoking ? "true" : "false",
        drinking: profile.lifestyle?.drinking ? "true" : "false",
        hobbiesAndInterests: Array.isArray(profile.hobbiesAndInterests) ? profile.hobbiesAndInterests : [],
      })
    }
  }, [profile, isOpen])

  const convertCmToFeetInches = (cm) => {
    if (!cm) return ""
    const totalInches = cm / 2.54
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return `${feet}'${inches}"`
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const toggleHobby = (hobby) => {
    setFormData((prev) => {
      const current = prev.hobbiesAndInterests || []
      const exists = current.includes(hobby)
      return {
        ...prev,
        hobbiesAndInterests: exists
          ? current.filter((h) => h !== hobby)
          : [...current, hobby],
      }
    })
  }

  const handleAddCustomHobby = (e) => {
    e.preventDefault()
    if (!customHobby.trim()) return
    const h = customHobby.trim()
    if (!formData.hobbiesAndInterests?.includes(h)) {
      setFormData((prev) => ({
        ...prev,
        hobbiesAndInterests: [...(prev.hobbiesAndInterests || []), h],
      }))
    }
    setCustomHobby("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let payload = {}

      switch (activeSection) {
        case "personal":
          payload = buildPersonalDetailsPayload(formData)
          break
        case "about": {
          const bio = formData.aboutMe?.trim() || ""
          if (bio && (bio.length < 50 || bio.length > 250)) {
            setError(`Bio must be between 50 and 250 characters (currently ${bio.length} characters).`)
            setLoading(false)
            return
          }
          payload = { aboutMe: bio }
          break
        }
        case "family":
          payload = buildFamilyPayload(formData)
          break
        case "career":
          payload = buildCareerEducationPayload(formData)
          break
        case "religion":
          payload = buildReligionPayload(formData)
          break
        case "lifestyle":
          payload = buildLifestylePayload(formData)
          break
        default:
          payload = buildPersonalDetailsPayload(formData)
      }

      if (Object.keys(payload).length === 0) {
        setError("No changes to save")
        setLoading(false)
        return
      }

      await updateProfile(payload)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      console.error("Failed to update profile:", err)
      const serverMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.message
      setError(serverMessage || "Failed to update profile. Please check your inputs.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] shadow-2xl border border-[#FFE4E8] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Fixed Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-[#640515] font-serif">
              Edit Profile
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Update your matrimonial biodata &amp; preferences</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Fixed Section Tab Pills */}
        <div className="px-5 py-2.5 bg-gray-50/70 border-b border-gray-100 shrink-0 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setActiveSection(sec.id)
                  setError(null)
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#842029] text-white shadow-xs scale-[1.02]"
                    : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/70"
                }`}
              >
                {sec.label}
              </button>
            )
          })}
        </div>

        {/* Scrollable Form Body */}
        <form id="edit-profile-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-xs text-red-700 font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {/* 1. PERSONAL */}
          {activeSection === "personal" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Date of Birth</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    name="day"
                    placeholder="Day (DD)"
                    value={formData.day || ""}
                    onChange={handleChange}
                    maxLength="2"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                  <select
                    name="month"
                    value={formData.month || ""}
                    onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  >
                    <option value="">Month</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="year"
                    placeholder="Year (YYYY)"
                    value={formData.year || ""}
                    onChange={handleChange}
                    maxLength="4"
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Height (e.g. 5'11" or 180cm)</label>
                  <input
                    type="text"
                    name="heightCm"
                    placeholder="5'11&quot; or 180 cm"
                    value={formData.heightCm || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Place of Birth</label>
                  <input
                    type="text"
                    name="placeOfBirth"
                    placeholder="City / District"
                    value={formData.placeOfBirth || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Time of Birth</label>
                  <input
                    type="text"
                    name="timeOfBirth"
                    placeholder="e.g. 09:30 AM"
                    value={formData.timeOfBirth || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Current City / Location</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={formData.location || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Marital Status</label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  >
                    <option value="">-- Select Status --</option>
                    <option value="never_married">Never Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="awaiting_divorce">Awaiting Divorce</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Manglik Status</label>
                  <select
                    name="manglik"
                    value={formData.manglik || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  >
                    <option value="">-- Select Manglik --</option>
                    <option value="Non-Manglik">Non-Manglik</option>
                    <option value="Manglik">Manglik</option>
                    <option value="Anshik Manglik">Anshik Manglik</option>
                    <option value="Don't Know">Don't Know</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Complexion</label>
                  <select
                    name="complexion"
                    value={formData.complexion || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  >
                    <option value="">-- Select Complexion --</option>
                    <option value="Fair">Fair</option>
                    <option value="Very Fair">Very Fair</option>
                    <option value="Wheatish">Wheatish</option>
                    <option value="Dusky">Dusky</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Willing to Relocate?</label>
                  <select
                    name="willingToRelocate"
                    value={formData.willingToRelocate || "false"}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. ABOUT & BIO */}
          {activeSection === "about" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-800">
                    About Yourself &amp; Partner Expectations
                  </label>
                  <span className={`text-[11px] font-semibold ${
                    (formData.aboutMe || "").length === 0 ? "text-gray-400" :
                    (formData.aboutMe || "").length < 50 ? "text-amber-600" :
                    (formData.aboutMe || "").length > 250 ? "text-red-600" :
                    "text-emerald-600"
                  }`}>
                    {(formData.aboutMe || "").length}/250 chars {(formData.aboutMe || "").length < 50 ? `(${50 - (formData.aboutMe || "").length} more needed)` : ""}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  Share your values, background, personality, and life goals (50 - 250 characters).
                </p>
              </div>

              <textarea
                name="aboutMe"
                rows={7}
                placeholder="Write a warm, authentic summary about who you are, your passions, family background, and the kind of life partner you are looking for (50-250 chars)..."
                value={formData.aboutMe || ""}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-2xl p-4 text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-[#842029]"
              />
            </div>
          )}

          {/* 3. FAMILY */}
          {activeSection === "family" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Mother Tongue</label>
                  <input
                    type="text"
                    name="motherTongue"
                    placeholder="e.g. Hindi, Marathi, Telugu"
                    value={formData.motherTongue || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Family Type</label>
                  <select
                    name="familyType"
                    value={formData.familyType || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  >
                    <option value="">-- Select Family Type --</option>
                    <option value="nuclear">Nuclear</option>
                    <option value="joint">Joint</option>
                    <option value="extended">Extended / Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Father's Occupation</label>
                  <input
                    type="text"
                    name="fatherOccupation"
                    placeholder="e.g. Businessman, Retired"
                    value={formData.fatherOccupation || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Mother's Occupation</label>
                  <input
                    type="text"
                    name="motherOccupation"
                    placeholder="e.g. Homemaker, Teacher"
                    value={formData.motherOccupation || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Family Values</label>
                  <select
                    name="familyValues"
                    value={formData.familyValues || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  >
                    <option value="">-- Select Values --</option>
                    <option value="traditional">Traditional</option>
                    <option value="moderate">Moderate</option>
                    <option value="liberal">Liberal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Family Affluence</label>
                  <select
                    name="familyAffluence"
                    value={formData.familyAffluence || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  >
                    <option value="">-- Select Affluence --</option>
                    <option value="middle">Middle Class</option>
                    <option value="upper_middle">Upper Middle Class</option>
                    <option value="affluent">Rich / Affluent</option>
                    <option value="lower_middle">Lower Middle Class</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Brothers</label>
                  <input
                    type="number"
                    name="numBrothers"
                    placeholder="0"
                    min="0"
                    value={formData.numBrothers ?? ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Sisters</label>
                  <input
                    type="number"
                    name="numSisters"
                    placeholder="0"
                    min="0"
                    value={formData.numSisters ?? ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. CAREER & EDUCATION */}
          {activeSection === "career" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Highest Degree</label>
                  <input
                    type="text"
                    name="education"
                    placeholder="e.g. B.Tech, MBA, MBBS"
                    value={formData.education || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Field of Study</label>
                  <input
                    type="text"
                    name="fieldOfStudy"
                    placeholder="e.g. Computer Science, Finance"
                    value={formData.fieldOfStudy || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">College / University</label>
                <input
                  type="text"
                  name="institution"
                  placeholder="e.g. IIT Bombay, Mumbai University"
                  value={formData.institution || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    placeholder="e.g. Software Engineer, Doctor"
                    value={formData.occupation || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Company / Organization</label>
                  <input
                    type="text"
                    name="companyName"
                    placeholder="e.g. Google, TCS, Self-employed"
                    value={formData.companyName || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    placeholder="e.g. IT, Healthcare"
                    value={formData.industry || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Annual Income</label>
                  <input
                    type="text"
                    name="annualIncome"
                    placeholder="e.g. ₹15-20 Lakhs"
                    value={formData.annualIncome || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Work Location</label>
                  <input
                    type="text"
                    name="workLocation"
                    placeholder="e.g. Mumbai / Remote"
                    value={formData.workLocation || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. RELIGION & ASTROLOGY */}
          {activeSection === "religion" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Mother Tongue / Language</label>
                  <select
                    name="motherTongue"
                    value={formData.motherTongue || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029] bg-white"
                  >
                    <option value="">Select Language</option>
                    {motherTongues.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Religion</label>
                  <select
                    name="religion"
                    value={formData.religion || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029] bg-white"
                  >
                    <option value="">Select Religion</option>
                    {religions.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Caste / Sub-caste</label>
                  <input
                    type="text"
                    name="caste"
                    list="caste-options"
                    placeholder="e.g. Brahmin, Maratha, Reddy"
                    value={formData.caste || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                  <datalist id="caste-options">
                    {getCastesForLanguage(formData.motherTongue, false).map((caste) => (
                      <option key={caste} value={caste} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Gotra / Gotham</label>
                  <input
                    type="text"
                    name="gotham"
                    placeholder="e.g. Kashyap, Vashishta"
                    value={formData.gotham || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Rashi (Zodiac)</label>
                  <input
                    type="text"
                    name="rashi"
                    placeholder="e.g. Mesh, Vrishabh"
                    value={formData.rashi || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Nakshatra</label>
                  <input
                    type="text"
                    name="nakshtra"
                    placeholder="e.g. Rohini, Ashwini"
                    value={formData.nakshtra || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. LIFESTYLE & HOBBIES */}
          {activeSection === "lifestyle" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Diet Preference</label>
                  <select
                    name="diet"
                    value={formData.diet || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  >
                    <option value="">-- Select Diet --</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Eggetarian">Eggetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Jain">Jain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Smoking</label>
                  <select
                    name="smoking"
                    value={formData.smoking || "false"}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  >
                    <option value="false">Non-Smoker</option>
                    <option value="true">Smoker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Drinking</label>
                  <select
                    name="drinking"
                    value={formData.drinking || "false"}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#842029]"
                  >
                    <option value="false">Non-Drinker</option>
                    <option value="true">Drinker / Social</option>
                  </select>
                </div>
              </div>

              {/* Hobbies Chip Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Hobbies &amp; Interests
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                  Select tags that describe what you enjoy doing
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3 max-h-36 overflow-y-auto p-1 border border-gray-100 rounded-2xl bg-gray-50/50">
                  {POPULAR_HOBBIES.map((h) => {
                    const isSelected = formData.hobbiesAndInterests?.includes(h)
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => toggleHobby(h)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 border cursor-pointer ${
                          isSelected
                            ? "bg-[#842029] text-white border-[#842029] shadow-2xs"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                        {h}
                      </button>
                    )
                  })}
                </div>

                {/* Add Custom Hobby */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add other hobby..."
                    value={customHobby}
                    onChange={(e) => setCustomHobby(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddCustomHobby(e)
                      }
                    }}
                    className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#842029]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomHobby}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Fixed Footer with Action Buttons */}
        <div className="p-4 sm:p-5 bg-gray-50/80 border-t border-gray-100 shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-profile-form"
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-[#842029] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#6b1b27] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {loading && <Loader size={16} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditProfileModal
