import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, MapPin } from "lucide-react";
import {
  motherTongues,
  religions,
  getCastesForLanguage,
} from "../utils/casteData";

/* ---------------------------- */
/* Dropdown Data */
/* ---------------------------- */

const educations = [
  "High School",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "MBA",
  "M.Tech",
  "PhD",
];

const occupations = [
  "Software Engineer",
  "Doctor",
  "Teacher",
  "Business",
  "Government Employee",
  "Lawyer",
  "Student",
  "Self Employed",
  "Other",
];

const incomeRanges = [
  "Below ₹2 LPA",
  "₹2 - ₹5 LPA",
  "₹5 - ₹10 LPA",
  "₹10 - ₹20 LPA",
  "₹20 - ₹35 LPA",
  "₹35 - ₹50 LPA",
  "Above ₹50 LPA",
];

const hobbiesList = [
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
];

export default function Interest({
  formData,
  setFormData,
  errors,
  setErrors,
  submitForm,
}) {
  const [showAllHobbies, setShowAllHobbies] = useState(false);
  const [customHobbyInput, setCustomHobbyInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const navigate = useNavigate();

  const locationsList = Array.isArray(formData.locations)
    ? formData.locations
    : formData.city
    ? formData.city.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleAddLocation = (e) => {
    if (e) e.preventDefault();
    const loc = locationInput.trim();
    if (!loc) return;

    if (locationsList.length >= 10) {
      setErrors((prev) => ({ ...prev, city: "Maximum 10 locations allowed." }));
      return;
    }

    if (locationsList.some((l) => l.toLowerCase() === loc.toLowerCase())) {
      setLocationInput("");
      return;
    }

    const updated = [...locationsList, loc];
    setFormData((prev) => ({
      ...prev,
      locations: updated,
      city: updated.join(", "),
    }));
    setLocationInput("");

    if (errors.city) {
      setErrors((prev) => ({ ...prev, city: "" }));
    }
  };

  const handleRemoveLocation = (locToRemove) => {
    const updated = locationsList.filter((l) => l !== locToRemove);
    setFormData((prev) => ({
      ...prev,
      locations: updated,
      city: updated.join(", "),
    }));
  };

  const toggleSelection = (field, value) => {
    const current = formData[field] || [];

    if (current.includes(value)) {
      updateField(
        field,
        current.filter((item) => item !== value)
      );
    } else {
      updateField(field, [...current, value]);
    }
  };

  const handleAddCustomHobby = (e) => {
    if (e) e.preventDefault();
    const h = customHobbyInput.trim();
    if (!h) return;

    const current = formData.hobbies || [];
    if (!current.includes(h)) {
      updateField("hobbies", [...current, h]);
    }
    setCustomHobbyInput("");
  };

  const handleMinAgeChange = (val) => {
    const minVal = val ? Number(val) : "";
    updateField("minAge", val);
    // If current maxAge is less than minAge + 2, auto-adjust or clear
    if (formData.maxAge && minVal && Number(formData.maxAge) < minVal + 2) {
      updateField("maxAge", String(minVal + 2));
    }
  };

  const validate = () => {
    let err = {};

    const minA = Number(formData.minAge);
    const maxA = Number(formData.maxAge);

    if (!formData.minAge) {
      err.minAge = "Select minimum age (min. 18)";
    } else if (minA < 18) {
      err.minAge = "Minimum age must be at least 18";
    }

    if (!formData.maxAge) {
      err.maxAge = "Select maximum age";
    } else if (maxA < (minA || 18) + 2) {
      err.maxAge = `Maximum age must be at least 2 years greater than minimum age (min. ${(minA || 18) + 2})`;
    }

    if (!formData.religion) err.religion = "Select religion";
    if (!formData.motherTongue) err.motherTongue = "Select mother tongue";
    if (!formData.partnereducation) err.partnereducation = "Select education";
    if (!formData.partneroccupation) err.partneroccupation = "Select occupation";
    if (!formData.partnerincome) err.partnerincome = "Select income";

    if (locationsList.length === 0) {
      err.city = "Please add at least 1 preferred city or state (min 1, max 10).";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await submitForm();
      navigate("/home");
    } catch (err) {
      console.error("Profile submission failed", err);
    }
  };

  const minAgeNum = Number(formData.minAge) || 18;
  const maxAgeStart = Math.max(20, minAgeNum + 2);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header aligned with Personal Details */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 font-serif">
          Select Your Preferences
        </h2>
        <p className="text-gray-500 mt-1 text-sm">
          Set your partner preferences to help us find suitable matches for you.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-5 sm:p-7">
        {/* AGE RANGE: Min Age & Max Age with +2 years constraint */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Age Preference Range (Min 18, Max must be at least 2 years more)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <select
                value={formData.minAge || ""}
                onChange={(e) => handleMinAgeChange(e.target.value)}
                className={`w-full h-13 rounded-xl border-2 px-4 focus:outline-none transition-all text-sm ${
                  errors.minAge
                    ? "border-red-400 bg-red-50/20"
                    : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
                }`}
              >
                <option value="">Minimum Age (18+)</option>
                {Array.from({ length: 43 }, (_, i) => 18 + i).map((age) => (
                  <option key={age} value={age}>
                    {age} Years
                  </option>
                ))}
              </select>
              {errors.minAge && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.minAge}</p>
              )}
            </div>

            <div>
              <select
                value={formData.maxAge || ""}
                onChange={(e) => updateField("maxAge", e.target.value)}
                className={`w-full h-13 rounded-xl border-2 px-4 focus:outline-none transition-all text-sm ${
                  errors.maxAge
                    ? "border-red-400 bg-red-50/20"
                    : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
                }`}
              >
                <option value="">
                  Maximum Age (Min: {maxAgeStart} Years)
                </option>
                {Array.from({ length: 80 - maxAgeStart + 1 }, (_, i) => maxAgeStart + i).map((age) => (
                  <option key={age} value={age}>
                    {age} Years
                  </option>
                ))}
              </select>
              {errors.maxAge && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.maxAge}</p>
              )}
            </div>
          </div>
        </div>

        {/* Religion & Mother Tongue */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Religion
            </label>
            <select
              value={formData.religion || ""}
              onChange={(e) => updateField("religion", e.target.value)}
              className={`w-full h-13 rounded-xl border-2 px-4 focus:outline-none transition-all text-sm ${
                errors.religion
                  ? "border-red-400"
                  : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            >
              <option value="">Select Religion</option>
              <option value="Any">Any Religion / No Preference</option>
              {formData.religion && formData.religion !== "Any" && !religions.includes(formData.religion) && (
                <option value={formData.religion}>{formData.religion}</option>
              )}
              {religions.map((religion) => (
                <option key={religion} value={religion}>
                  {religion}
                </option>
              ))}
            </select>
            {errors.religion && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.religion}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Mother Tongue / Language
            </label>
            <select
              value={formData.motherTongue || ""}
              onChange={(e) => updateField("motherTongue", e.target.value)}
              className={`w-full h-13 rounded-xl border-2 px-4 focus:outline-none transition-all text-sm ${
                errors.motherTongue
                  ? "border-red-400"
                  : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            >
              <option value="">Select Mother Tongue / Language</option>
              {formData.motherTongue && !motherTongues.includes(formData.motherTongue) && (
                <option value={formData.motherTongue}>{formData.motherTongue}</option>
              )}
              {motherTongues.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            {errors.motherTongue && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.motherTongue}</p>
            )}
          </div>
        </div>

        {/* Caste & Education */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Caste / Community Preference
            </label>
            <select
              value={formData.caste || "No Preference"}
              onChange={(e) => updateField("caste", e.target.value)}
              className={`w-full h-13 rounded-xl border-2 px-4 focus:outline-none transition-all text-sm ${
                errors.caste
                  ? "border-red-400"
                  : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            >
              <option value="No Preference">No Preference (Open to All Castes)</option>
              {formData.caste && formData.caste !== "No Preference" && !getCastesForLanguage(formData.motherTongue, false).includes(formData.caste) && (
                <option value={formData.caste}>{formData.caste}</option>
              )}
              {getCastesForLanguage(formData.motherTongue, false).map((caste) => (
                <option key={caste} value={caste}>{caste}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              {formData.motherTongue
                ? `Showing castes for ${formData.motherTongue} (or select No Preference)`
                : "Select No Preference or choose mother tongue for specific castes"}
            </p>
            {errors.caste && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.caste}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Minimum Education
            </label>
            <select
              value={formData.partnereducation || ""}
              onChange={(e) => updateField("partnereducation", e.target.value)}
              className={`w-full h-13 rounded-xl border-2 px-4 focus:outline-none transition-all text-sm ${
                errors.partnereducation
                  ? "border-red-400"
                  : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            >
              <option value="">Select Education</option>
              {formData.partnereducation && !educations.includes(formData.partnereducation) && (
                <option value={formData.partnereducation}>{formData.partnereducation}</option>
              )}
              {educations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.partnereducation && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.partnereducation}</p>
            )}
          </div>
        </div>

        {/* Occupation & Annual Income */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Preferred Occupation
            </label>
            <select
              value={formData.partneroccupation || ""}
              onChange={(e) => updateField("partneroccupation", e.target.value)}
              className={`w-full h-13 rounded-xl border-2 px-4 focus:outline-none transition-all text-sm ${
                errors.partneroccupation
                  ? "border-red-400"
                  : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            >
              <option value="">Select Occupation</option>
              {formData.partneroccupation && !occupations.includes(formData.partneroccupation) && (
                <option value={formData.partneroccupation}>{formData.partneroccupation}</option>
              )}
              {occupations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.partneroccupation && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.partneroccupation}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Annual Income Preference
            </label>
            <select
              value={formData.partnerincome || ""}
              onChange={(e) => updateField("partnerincome", e.target.value)}
              className={`w-full h-13 rounded-xl border-2 px-4 focus:outline-none transition-all text-sm ${
                errors.partnerincome
                  ? "border-red-400"
                  : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            >
              <option value="">Select Income Range</option>
              {formData.partnerincome && !incomeRanges.includes(formData.partnerincome) && (
                <option value={formData.partnerincome}>{formData.partnerincome}</option>
              )}
              {incomeRanges.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.partnerincome && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.partnerincome}</p>
            )}
          </div>
        </div>

        {/* Multi-Location Tags (No single dropdown, Enter to add, Min 1, Max 10) */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Preferred Cities &amp; States (Add 1 to 10 Locations)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Type a city or state name and press <strong>Enter</strong> to add it to your preferences.
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={locationInput}
                placeholder="e.g. Mumbai, Pune, Delhi, Karnataka (Press Enter to add)"
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLocation();
                  }
                }}
                disabled={locationsList.length >= 10}
                className={`w-full h-13 pl-10 pr-4 rounded-xl border-2 focus:outline-none transition-all text-sm ${
                  errors.city
                    ? "border-red-400 bg-red-50/20"
                    : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
                }`}
              />
            </div>
            <button
              type="button"
              onClick={handleAddLocation}
              disabled={!locationInput.trim() || locationsList.length >= 10}
              className="px-5 h-13 rounded-xl bg-[#842029] text-white font-semibold text-xs sm:text-sm hover:bg-[#6b1b27] transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus size={16} /> Add
            </button>
          </div>

          {errors.city && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.city}</p>
          )}

          {/* Location Tag Chips */}
          {locationsList.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
              {locationsList.map((loc, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#FFF0F2] text-[#842029] border border-[#F1AEB4]/60 shadow-2xs"
                >
                  <MapPin size={12} className="text-[#842029]" />
                  {loc}
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(loc)}
                    className="hover:text-red-800 transition-colors cursor-pointer ml-0.5"
                    title={`Remove ${loc}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <span className="text-[11px] text-gray-400 self-center ml-auto">
                {locationsList.length}/10 selected
              </span>
            </div>
          )}
        </div>

        {/* Hobbies & Interests Selection (Figma Screenshot 2 style) */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Choose Hobbies &amp; Interests
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Select hobbies you would love in your ideal partner
          </p>

          <div className="flex flex-wrap gap-2">
            {(showAllHobbies ? hobbiesList : hobbiesList.slice(0, 12)).map((hobby) => (
              <button
                key={hobby}
                type="button"
                onClick={() => toggleSelection("hobbies", hobby)}
                className={`px-4 py-2 rounded-full text-xs font-medium border-2 transition-all duration-200 cursor-pointer ${
                  formData.hobbies?.includes(hobby)
                    ? "bg-[#ED5463] text-white border-[#ED5463] shadow-xs"
                    : "border-[#DFDFDF] hover:border-[#AE2539] hover:text-[#AE2539] text-gray-600 bg-white"
                }`}
              >
                {hobby}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              type="button"
              onClick={() => setShowAllHobbies(!showAllHobbies)}
              className="text-[#ED5463] font-semibold text-xs sm:text-sm hover:text-[#AE2539] cursor-pointer"
            >
              {showAllHobbies ? "Show Less" : "Show More"}
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
                  e.preventDefault();
                  handleAddCustomHobby();
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

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl bg-[#ED5463] text-white hover:bg-[#AE2539] transition-all shadow-lg font-bold text-sm cursor-pointer"
          >
            Submit Preferences &amp; Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
}