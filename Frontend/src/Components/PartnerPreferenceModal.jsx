import { useState, useEffect } from "react"
import { X, Target, Save, Check, MapPin, Plus } from "lucide-react"
import {
    motherTongues,
    religions,
    getCastesForLanguage,
} from "../utils/casteData"

const MARITAL_STATUSES = [
    "never_married",
    "divorced",
    "widowed",
    "separated",
    "annulled",
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
]

const DIET_OPTIONS = ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Jain", "Vegan"]

export default function PartnerPreferenceModal({ isOpen, preferences, onClose, onSave }) {
    const [formData, setFormData] = useState({
        ageMin: 21,
        ageMax: 26,
        heightMinCm: 120,
        heightMaxCm: 190,
        religion: "",
        caste: "",
        location: "",
        locations: [],
        education: "",
        occupation: "",
        annualIncome: "",
        diet: "",
        hobbiesAndInterests: [],
        maritalStatus: [],
        willingToRelocate: false,
    })
    const [locationInput, setLocationInput] = useState("")
    const [customHobbyInput, setCustomHobbyInput] = useState("")
    const [showAllHobbies, setShowAllHobbies] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (preferences) {
            const rawLocs = Array.isArray(preferences.locations) && preferences.locations.length > 0
                ? preferences.locations
                : preferences.location
                ? preferences.location.split(",").map((l) => l.trim()).filter(Boolean)
                : []

            const minA = preferences.ageMin ? Number(preferences.ageMin) : 21
            let maxA = preferences.ageMax ? Number(preferences.ageMax) : 26
            if (maxA < minA + 2) maxA = minA + 2

            setFormData({
                ageMin: minA,
                ageMax: maxA,
                heightMinCm: preferences.heightMinCm || 120,
                heightMaxCm: preferences.heightMaxCm || 190,
                religion: preferences.religion || "",
                caste: preferences.caste || "",
                location: preferences.location || rawLocs.join(", "),
                locations: rawLocs,
                education: preferences.education || "",
                occupation: preferences.occupation || "",
                annualIncome: preferences.annualIncome || "",
                diet: preferences.diet || "",
                hobbiesAndInterests: Array.isArray(preferences.hobbiesAndInterests) ? preferences.hobbiesAndInterests : [],
                maritalStatus: Array.isArray(preferences.maritalStatus) ? preferences.maritalStatus : [],
                willingToRelocate: preferences.willingToRelocate || false,
            })
        }
    }, [preferences])

    if (!isOpen) return null

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }))
    }

    const handleMinAgeChange = (val) => {
        const minVal = Number(val) || 18
        setFormData((prev) => {
            let nextMax = prev.ageMax
            if (Number(nextMax) < minVal + 2) {
                nextMax = minVal + 2
            }
            return { ...prev, ageMin: minVal, ageMax: nextMax }
        })
    }

    const handleAddLocation = (e) => {
        if (e) e.preventDefault()
        const loc = locationInput.trim()
        if (!loc) return

        const current = formData.locations || []
        if (current.length >= 10) {
            setError("Maximum 10 preferred locations allowed.")
            return
        }

        if (current.some((l) => l.toLowerCase() === loc.toLowerCase())) {
            setLocationInput("")
            return
        }

        const updated = [...current, loc]
        setFormData((prev) => ({
            ...prev,
            locations: updated,
            location: updated.join(", "),
        }))
        setLocationInput("")
        setError("")
    }

    const handleRemoveLocation = (locToRemove) => {
        setFormData((prev) => {
            const updated = (prev.locations || []).filter((l) => l !== locToRemove)
            return {
                ...prev,
                locations: updated,
                location: updated.join(", "),
            }
        })
    }

    const handleMaritalToggle = (status) => {
        setFormData((prev) => {
            const current = prev.maritalStatus || []
            if (current.includes(status)) {
                return { ...prev, maritalStatus: current.filter((s) => s !== status) }
            }
            return { ...prev, maritalStatus: [...current, status] }
        })
    }

    const handleHobbyToggle = (hobby) => {
        setFormData((prev) => {
            const current = prev.hobbiesAndInterests || []
            if (current.includes(hobby)) {
                return { ...prev, hobbiesAndInterests: current.filter((h) => h !== hobby) }
            }
            return { ...prev, hobbiesAndInterests: [...current, hobby] }
        })
    }

    const handleAddCustomHobby = (e) => {
        if (e) e.preventDefault()
        const h = customHobbyInput.trim()
        if (!h) return
        const current = formData.hobbiesAndInterests || []
        if (!current.includes(h)) {
            setFormData((prev) => ({
                ...prev,
                hobbiesAndInterests: [...current, h],
            }))
        }
        setCustomHobbyInput("")
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        const minAge = Number(formData.ageMin) || 18
        const maxAge = Number(formData.ageMax) || 20

        if (minAge < 18) {
            setError("Minimum age must be at least 18.")
            return
        }

        if (maxAge < minAge + 2) {
            setError(`Maximum age must be at least 2 years greater than minimum age (min. ${minAge + 2}).`)
            return
        }

        const locs = formData.locations || []
        if (locs.length === 0 && !formData.location?.trim()) {
            setError("Please specify at least 1 preferred city or state.")
            return
        }

        setLoading(true)
        try {
            const payload = {
                ...formData,
                ageMin: minAge,
                ageMax: maxAge,
                heightMinCm: Number(formData.heightMinCm) || undefined,
                heightMaxCm: Number(formData.heightMaxCm) || undefined,
                locations: locs.length > 0 ? locs : [formData.location.trim()],
                location: locs.length > 0 ? locs.join(", ") : formData.location.trim(),
            }
            await onSave(payload)
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save partner preferences.")
        } finally {
            setLoading(false)
        }
    }

    const minA = Number(formData.ageMin) || 18
    const minAllowedMax = minA + 2

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#FFE4E8]">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#842029]">
                            <Target size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#842029] font-serif">
                                Ideal Partner Preferences
                            </h2>
                            <p className="text-xs text-gray-500">
                                Specify your criteria to get high-compatibility match recommendations
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                    {error && (
                        <div className="p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs sm:text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Age Range with Min 18 and +2 year constraint */}
                    <div>
                        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                            Age Range: {formData.ageMin} - {formData.ageMax} Years (Min. 18, Max $\ge$ Min + 2)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-gray-500">Min Age (18+)</span>
                                <input
                                    type="number"
                                    name="ageMin"
                                    min="18"
                                    max="78"
                                    value={formData.ageMin}
                                    onChange={(e) => handleMinAgeChange(e.target.value)}
                                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#842029] outline-none"
                                />
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">Max Age (Min: {minAllowedMax})</span>
                                <input
                                    type="number"
                                    name="ageMax"
                                    min={minAllowedMax}
                                    max="80"
                                    value={formData.ageMax}
                                    onChange={handleChange}
                                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#842029] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Height Range (Min 120cm / 4'0") */}
                    <div>
                        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                            Height Range (cm): {formData.heightMinCm}cm - {formData.heightMaxCm}cm (Min: 120cm / 4&apos;0&quot;)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-gray-500">Min Height (cm)</span>
                                <input
                                    type="number"
                                    name="heightMinCm"
                                    min="120"
                                    max="220"
                                    value={formData.heightMinCm}
                                    onChange={handleChange}
                                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#842029] outline-none"
                                />
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">Max Height (cm)</span>
                                <input
                                    type="number"
                                    name="heightMaxCm"
                                    min="120"
                                    max="220"
                                    value={formData.heightMaxCm}
                                    onChange={handleChange}
                                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#842029] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Multi-Location Tags (No single dropdown, Enter to add, Min 1, Max 10) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                            Preferred Locations / States (Add 1 to 10)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Type a city or state and hit Enter to add multiple location preferences.
                        </p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={locationInput}
                                    placeholder="e.g. Mumbai, Delhi, Maharashtra (Press Enter to add)"
                                    onChange={(e) => setLocationInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            handleAddLocation()
                                        }
                                    }}
                                    disabled={(formData.locations || []).length >= 10}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#842029] outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddLocation}
                                disabled={!locationInput.trim() || (formData.locations || []).length >= 10}
                                className="px-4 py-2.5 bg-[#842029] text-white rounded-xl text-xs font-semibold hover:bg-[#6b1b27] disabled:opacity-40 flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                                <Plus size={14} /> Add
                            </button>
                        </div>

                        {/* Location Tag Chips */}
                        {(formData.locations || []).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2.5 p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
                                {(formData.locations || []).map((loc, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FFF0F2] text-[#842029] border border-[#F1AEB4]/60 shadow-2xs"
                                    >
                                        <MapPin size={11} className="text-[#842029]" />
                                        {loc}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLocation(loc)}
                                            className="hover:text-red-800 transition-colors cursor-pointer"
                                            title={`Remove ${loc}`}
                                        >
                                            <X size={13} />
                                        </button>
                                    </span>
                                ))}
                                <span className="text-[10px] text-gray-400 self-center ml-auto">
                                    {(formData.locations || []).length}/10 selected
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Language, Religion & Caste */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                                Mother Tongue / Language
                            </label>
                            <select
                                name="motherTongue"
                                value={formData.motherTongue || ""}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-[#842029] outline-none"
                            >
                                <option value="">Any Language</option>
                                {motherTongues.map((lang) => (
                                    <option key={lang} value={lang}>
                                        {lang}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                                Religion
                            </label>
                            <select
                                name="religion"
                                value={formData.religion}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-[#842029] outline-none"
                            >
                                <option value="">Any Religion</option>
                                {religions.map((rel) => (
                                    <option key={rel} value={rel}>
                                        {rel}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                                Caste / Sub-Caste
                            </label>
                            <select
                                name="caste"
                                value={formData.caste || "No Preference"}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-[#842029] outline-none"
                            >
                                <option value="No Preference">No Preference (Open)</option>
                                {getCastesForLanguage(formData.motherTongue, false).map((caste) => (
                                    <option key={caste} value={caste}>
                                        {caste}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Education & Occupation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                                Minimum Education
                            </label>
                            <input
                                type="text"
                                name="education"
                                placeholder="e.g. Bachelor's, Master's, B.Tech"
                                value={formData.education}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-[#842029] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                                Preferred Occupation
                            </label>
                            <input
                                type="text"
                                name="occupation"
                                placeholder="e.g. Software Engineer, Doctor, CA"
                                value={formData.occupation}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-[#842029] outline-none"
                            />
                        </div>
                    </div>

                    {/* Annual Income & Diet */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                                Direct Annual Income Preference
                            </label>
                            <input
                                type="text"
                                name="annualIncome"
                                placeholder="e.g. 10 LPA+, ₹25,00,000, 15 Lakhs"
                                value={formData.annualIncome}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-[#842029] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                                Diet Preference
                            </label>
                            <select
                                name="diet"
                                value={formData.diet}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-[#842029] outline-none"
                            >
                                <option value="">Any Diet</option>
                                {DIET_OPTIONS.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Hobbies & Interests Tags (Figma Screenshot 2 style) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                            Hobbies &amp; Interests Preference
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2 max-h-36 overflow-y-auto p-1.5 border border-gray-100 rounded-2xl bg-gray-50/50">
                            {(showAllHobbies ? POPULAR_HOBBIES : POPULAR_HOBBIES.slice(0, 12)).map((h) => {
                                const isSelected = formData.hobbiesAndInterests?.includes(h)
                                return (
                                    <button
                                        key={h}
                                        type="button"
                                        onClick={() => handleHobbyToggle(h)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 border cursor-pointer ${
                                            isSelected
                                                ? "bg-[#842029] text-white border-[#842029] shadow-2xs"
                                                : "bg-white text-gray-700 border-gray-200 hover:border-[#842029]"
                                        }`}
                                    >
                                        {isSelected && <Check size={11} />}
                                        {h}
                                    </button>
                                )
                            })}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAllHobbies(!showAllHobbies)}
                            className="text-[11px] font-semibold text-[#842029] hover:underline cursor-pointer"
                        >
                            {showAllHobbies ? "Show Less" : "Show More Hobbies"}
                        </button>
                    </div>

                    {/* Marital Status Multi-Select */}
                    <div>
                        <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                            Acceptable Marital Status
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {MARITAL_STATUSES.map((status) => {
                                const active = formData.maritalStatus.includes(status)
                                const label = status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
                                return (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => handleMaritalToggle(status)}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                            active
                                                ? "bg-[#842029] text-white border-[#842029]"
                                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        {active && <Check size={12} />}
                                        {label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2.5 rounded-full bg-[#842029] text-white font-semibold text-xs sm:text-sm hover:bg-[#6b1b27] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save size={16} /> Save Preferences
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
