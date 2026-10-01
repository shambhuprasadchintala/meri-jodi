import { useState } from "react"
import { Check, Plus } from "lucide-react"

const heights = [
  "4'0\"",
  "4'1\"",
  "4'2\"",
  "4'3\"",
  "4'4\"",
  "4'5\"",
  "4'6\"",
  "4'7\"",
  "4'8\"",
  "4'9\"",
  "4'10\"",
  "4'11\"",
  "5'0\"",
  "5'1\"",
  "5'2\"",
  "5'3\"",
  "5'4\"",
  "5'5\"",
  "5'6\"",
  "5'7\"",
  "5'8\"",
  "5'9\"",
  "5'10\"",
  "5'11\"",
  "6'0\"",
  "6'1\"",
  "6'2\"",
  "6'3\"",
  "6'4\"",
  "6'5\"",
  "6'6\"",
  "6'7\"",
  "6'8\"",
  "6'9\"",
  "6'10\"",
  "6'11\"",
  "7'0\"",
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

export default function PersonalDetails({
  formData,
  setFormData,
  errors,
  setErrors,
  nextStep,
}) {
  const [showAllHobbies, setShowAllHobbies] = useState(false)
  const [customHobbyInput, setCustomHobbyInput] = useState("")

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "location" ? { city: value } : {}),
      ...(field === "city" ? { location: value } : {}),
    }))

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const toggleHobby = (hobby) => {
    const current = formData.hobbies || []
    if (current.includes(hobby)) {
      updateField("hobbies", current.filter((h) => h !== hobby))
    } else {
      updateField("hobbies", [...current, hobby])
    }
  }

  const handleAddCustomHobby = (e) => {
    if (e) e.preventDefault()
    const h = customHobbyInput.trim()
    if (!h) return
    const current = formData.hobbies || []
    if (!current.includes(h)) {
      updateField("hobbies", [...current, h])
    }
    setCustomHobbyInput("")
  }

  const validate = () => {
    let newErrors = {}
    const bioText = (formData.about || "").trim()
    const bioLength = bioText.length

    if (!bioText) {
      newErrors.about = "Please write a brief summary about yourself (min. 50, max. 250 characters)."
    } else if (bioLength < 50) {
      newErrors.about = `Bio is too short. Please write at least 50 characters (currently ${bioLength} characters).`
    } else if (bioLength > 250) {
      newErrors.about = `Bio is too long. Please keep it under 250 characters (currently ${bioLength} characters).`
    }

    if (!formData.height) newErrors.height = "Select your height."

    if (!formData.location?.trim())
      newErrors.location = "Current location / city is required."

    if (!formData.education) newErrors.education = "Select your education."
    
    if (!formData.occupation) newErrors.occupation = "Select your occupation."

    if (!formData.income?.trim()) newErrors.income = "Please enter your annual income."

    if (!formData.acceptTerms)
      newErrors.acceptTerms = "You must accept the Terms and Conditions."

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validate()) {
      nextStep()
    }
  }

  const aboutChars = (formData.about || "").length
  const isBioLengthValid = aboutChars >= 50 && aboutChars <= 250

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 font-serif">Personal Details</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Tell us more about yourself to help us find meaningful and compatible matches.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6 sm:p-8">
        
        {/* About Yourself (Min 50, Max 250 characters) */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              About Yourself (Min 50 &amp; Max 250 Characters)
            </label>
            <span className={`text-xs font-semibold ${
              aboutChars === 0 ? "text-gray-400" :
              aboutChars < 50 ? "text-amber-600" :
              aboutChars > 250 ? "text-red-600" :
              "text-emerald-600"
            }`}>
              {aboutChars}/250 chars {aboutChars < 50 ? `(${50 - aboutChars} more needed)` : ""}
            </span>
          </div>
          <textarea
            rows={4}
            maxLength={300}
            value={formData.about || ""}
            onChange={(e) => updateField("about", e.target.value)}
            placeholder="Write a warm introduction about your personality, passions, upbringing, and what you value in life (50 to 250 characters)..."
            className={`w-full rounded-xl border-2 p-4 text-sm resize-y focus:outline-none transition-colors ${
              errors.about
                ? "border-red-400 bg-red-50/20"
                : isBioLengthValid
                ? "border-emerald-300 focus:border-emerald-500"
                : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
            }`}
          />
          {errors.about ? (
            <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.about}</p>
          ) : (
            <p className="text-gray-400 text-xs mt-1">
              Minimum 50 characters required. Maximum 250 characters.
            </p>
          )}
        </div>

        {/* Height & Location */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Height (Starting from 4'0") */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Height
            </label>
            <select
              value={formData.height || ""}
              onChange={(e) => updateField("height", e.target.value)}
              className={`w-full rounded-xl border-2 h-13 px-4 focus:outline-none transition-colors text-sm ${
                errors.height ? "border-red-400 bg-red-50/20" : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            >
              <option value="">Select Height (Min 4&apos;0&quot;)</option>
              {formData.height && !heights.includes(formData.height) && (
                <option value={formData.height}>{formData.height}</option>
              )}
              {heights.map((height) => (
                <option key={height} value={height}>
                  {height}
                </option>
              ))}
            </select>
            {errors.height && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.height}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Current Location / City
            </label>
            <input
              type="text"
              value={formData.location || ""}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="e.g. Mumbai, Bengaluru, Pune"
              className={`w-full rounded-xl border-2 h-13 px-4 focus:outline-none transition-colors text-sm ${
                errors.location ? "border-red-400 bg-red-50/20" : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            />
            {errors.location && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.location}</p>
            )}
          </div>
        </div>

        {/* Education & Occupation */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Education */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Highest Education
            </label>
            <select
              value={formData.education || ""}
              onChange={(e) => updateField("education", e.target.value)}
              className={`w-full h-13 rounded-xl border-2 px-4 focus:outline-none transition-colors text-sm ${
                errors.education ? "border-red-400 bg-red-50/20" : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            >
              <option value="">Select Education</option>
              {formData.education && !["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "MBA", "M.Tech", "PhD"].includes(formData.education) && (
                <option value={formData.education}>{formData.education}</option>
              )}
              <option value="High School">High School</option>
              <option value="Diploma">Diploma</option>
              <option value="Bachelor's Degree">Bachelor's Degree</option>
              <option value="Master's Degree">Master's Degree</option>
              <option value="MBA">MBA</option>
              <option value="M.Tech">M.Tech</option>
              <option value="PhD">PhD</option>
            </select>
            {errors.education && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.education}</p>
            )}
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Occupation / Profession
            </label>
            <select
              value={formData.occupation || ""}
              onChange={(e) => updateField("occupation", e.target.value)}
              className={`w-full h-13 rounded-xl border-2 px-4 focus:outline-none transition-colors text-sm ${
                errors.occupation ? "border-red-400 bg-red-50/20" : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            >
              <option value="">Select Occupation</option>
              {formData.occupation && !["Software Engineer", "Doctor", "Teacher", "Business", "Government Employee", "Lawyer", "Student", "Self Employed", "Other"].includes(formData.occupation) && (
                <option value={formData.occupation}>{formData.occupation}</option>
              )}
              <option value="Software Engineer">Software Engineer</option>
              <option value="Doctor">Doctor</option>
              <option value="Teacher">Teacher</option>
              <option value="Business">Business</option>
              <option value="Government Employee">Government Employee</option>
              <option value="Lawyer">Lawyer</option>
              <option value="Student">Student</option>
              <option value="Self Employed">Self Employed</option>
              <option value="Other">Other</option>
            </select>
            {errors.occupation && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.occupation}</p>
            )}
          </div>
        </div>

        {/* Company Name & Direct Annual Income */}
        <div className="grid md:grid-cols-2 gap-6 mb-7">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Company / Organization (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Google, Infosys, Self-employed"
              value={formData.company || formData.companyName || ""}
              onChange={(e) => {
                updateField("company", e.target.value)
                updateField("companyName", e.target.value)
              }}
              className="w-full h-13 rounded-xl border-2 border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539] px-4 focus:outline-none transition-colors text-sm"
            />
          </div>

          {/* Direct Annual Income (Direct Input instead of rigid dropdown) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Annual Income (Direct Input)
            </label>
            <input
              type="text"
              placeholder="e.g. ₹15 LPA, ₹25,00,000, 18 Lakhs"
              value={formData.income || ""}
              onChange={(e) => updateField("income", e.target.value)}
              className={`w-full h-13 rounded-xl border-2 px-4 focus:outline-none transition-colors text-sm ${
                errors.income ? "border-red-400 bg-red-50/20" : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            />
            {errors.income && (
              <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.income}</p>
            )}
          </div>
        </div>

        {/* Profile Hobbies & Interests Selection (Figma Screenshot 2 style) */}
        <div className="mb-8 pt-5 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Your Hobbies &amp; Interests
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Select hobbies that best represent your lifestyle and personality
          </p>

          <div className="flex flex-wrap gap-2">
            {(showAllHobbies ? POPULAR_HOBBIES : POPULAR_HOBBIES.slice(0, 12)).map((hobby) => {
              const isSelected = formData.hobbies?.includes(hobby)
              return (
                <button
                  key={hobby}
                  type="button"
                  onClick={() => toggleHobby(hobby)}
                  className={`px-4 py-2 rounded-full text-xs font-medium border-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-[#ED5463] text-white border-[#ED5463] shadow-xs"
                      : "border-[#DFDFDF] hover:border-[#AE2539] hover:text-[#AE2539] text-gray-600 bg-white"
                  }`}
                >
                  {hobby}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              onClick={() => setShowAllHobbies(!showAllHobbies)}
              className="text-[#ED5463] font-semibold text-xs sm:text-sm hover:text-[#AE2539] cursor-pointer"
            >
              {showAllHobbies ? "Show Less" : "Show More Hobbies"}
            </button>
          </div>

          {/* Add Custom Hobby */}
          <div className="mt-3 flex gap-2 max-w-sm">
            <input
              type="text"
              value={customHobbyInput}
              placeholder="Add other hobby..."
              onChange={(e) => setCustomHobbyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddCustomHobby()
                }
              }}
              className="flex-1 px-3.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-[#ED5463]"
            />
            <button
              type="button"
              onClick={handleAddCustomHobby}
              disabled={!customHobbyInput.trim()}
              className="px-3.5 py-1.5 rounded-full bg-gray-800 text-white text-xs font-semibold hover:bg-black disabled:opacity-40 cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* Terms and Conditions (Consolidated) */}
        <div className="mt-6 border-t pt-5 border-gray-100">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.acceptTerms || false}
              onChange={(e) => updateField("acceptTerms", e.target.checked)}
              className="mt-1 accent-[#AE2539] w-5 h-5 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-gray-700 text-xs sm:text-sm">
                I agree to the{" "}
                <a href="#" className="text-[#AE2539] font-semibold hover:underline">
                  Terms &amp; Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#AE2539] font-semibold hover:underline">
                  Privacy Policy
                </a>
              </span>
              <span className="text-gray-500 text-xs mt-0.5">
                Use of this platform is subject to the MeriJodi Terms of Service.
              </span>
            </div>
          </label>
          {errors.acceptTerms && (
            <p className="text-red-500 text-xs mt-2 ml-8 font-medium">{errors.acceptTerms}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-3.5 rounded-xl bg-[#ED5463] text-white hover:bg-[#AE2539] transition-all shadow-lg font-bold text-sm cursor-pointer"
          >
            Continue to Preferences &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}