
import { useState } from "react"
import { Sparkles, Loader } from "lucide-react"
import { generateAIBio } from "../api/profileApi"

const heights = [
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
]

export default function PersonalDetails({
  formData,
  setFormData,
  errors,
  setErrors,
  nextStep,
}) {
  const [isGeneratingBio, setIsGeneratingBio] = useState(false)

  const handleAiBio = async () => {
    setIsGeneratingBio(true)
    try {
      const bio = await generateAIBio({
        name: formData.name,
        gender: formData.gender,
        occupation: formData.occupation,
        education: formData.education,
        city: formData.location,
        religion: formData.religion,
        diet: formData.diet,
      })
      if (bio) {
        updateField("about", bio)
      }
    } catch {
      // Ignore
    } finally {
      setIsGeneratingBio(false)
    }
  }
  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "location" ? { city: value } : {}),
      ...(field === "city" ? { location: value } : {}),
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.about?.trim()) {
      newErrors.about = "Please tell us a little about yourself.";
    }

    if (!formData.height) newErrors.height = "Select your height.";

    if (!formData.location?.trim())
      newErrors.location = "Current location is required.";

    if (!formData.education) newErrors.education = "Select your education.";
    
    if (!formData.occupation) newErrors.occupation = "Select your occupation.";

    if (!formData.income) newErrors.income = "Select your income.";

    if (!formData.acceptTerms)
      newErrors.acceptTerms = "You must accept the Terms and Conditions.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      nextStep();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800">Personal Details</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Tell us more about yourself to help us find meaningful and compatible matches.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-8">
        
        {/* About Yourself */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">About Yourself</label>
            <button
              type="button"
              onClick={handleAiBio}
              disabled={isGeneratingBio}
              className="px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-[#842029] text-white text-xs font-semibold hover:opacity-95 transition-opacity flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isGeneratingBio ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {isGeneratingBio ? "Generating..." : "✨ Generate with AI"}
            </button>
          </div>
          <textarea
            rows={3}
            value={formData.about || ""}
            onChange={(e) => updateField("about", e.target.value)}
            placeholder="Few words about yourself (min. 50 characters)"
            className={`w-full rounded-xl border-2 p-4 resize-y focus:outline-none transition-colors [&::-webkit-scrollbar]:hidden ${
              errors.about ? "border-red-400" : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
            }`}
          />
          {errors.about && (
            <p className="text-red-500 text-sm mt-1">{errors.about}</p>
          )}
        </div>

        {/* Height & Location */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Height */}
          <div>
            <select
              value={formData.height || ""}
              onChange={(e) => updateField("height", e.target.value)}
              className={`w-full rounded-xl border-2 h-14 px-4 focus:outline-none transition-colors ${
                errors.height ? "border-red-400" : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            >
              <option value="">Select Height</option>
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
              <p className="text-red-500 text-sm mt-1">{errors.height}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <input
              type="text"
              value={formData.location || ""}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder=" Current Location / City"
              className={`w-full rounded-xl border-2 h-14 px-4 focus:outline-none transition-colors ${
                errors.location ? "border-red-400" : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location}</p>
            )}
          </div>
        </div>

        {/* Education & Occupation */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Education */}
          <div>
            <select
              value={formData.education || ""}
              onChange={(e) => updateField("education", e.target.value)}
              className={`w-full h-14 rounded-xl border-2 px-4 focus:outline-none transition-colors ${
                errors.education ? "border-red-400" : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
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
              <p className="text-red-500 text-sm mt-1">{errors.education}</p>
            )}
          </div>

          {/* Occupation */}
          <div>
            <select
              value={formData.occupation || ""}
              onChange={(e) => updateField("occupation", e.target.value)}
              className={`w-full h-14 rounded-xl border-2 px-4 focus:outline-none transition-colors ${
                errors.occupation ? "border-red-400" : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
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
              <p className="text-sm text-red-500 mt-1">{errors.occupation}</p>
            )}
          </div>
        </div>

        {/* Conditional Company Name & Annual Income */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Company Name */}
          <div className={`${formData.occupation && formData.occupation !== "Student" ? "block" : "invisible"}`}>
            <input
              type="text"
              placeholder="Company / Organization (Optional)"
              value={formData.company || formData.companyName || ""}
              onChange={(e) => {
                updateField("company", e.target.value)
                updateField("companyName", e.target.value)
              }}
              className={`w-full h-14 rounded-xl border-2 px-4 focus:outline-none transition-colors ${
                errors.company ? "border-red-400" : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            />
            {errors.company && (
              <p className="text-red-500 text-sm mt-1">{errors.company}</p>
            )}
          </div>

          {/* Annual Income */}
          <div>
            <select
              value={formData.income || ""}
              onChange={(e) => updateField("income", e.target.value)}
              className={`w-full h-14 rounded-xl border-2 px-4 focus:outline-none transition-colors ${
                errors.income ? "border-red-400" : "border-[#DFDFDF] hover:border-[#AE2539] focus:border-[#AE2539]"
              }`}
            >
              <option value="">Select Income</option>
              {formData.income && !["Below ₹2 LPA", "₹2 - ₹5 LPA", "₹5 - ₹10 LPA", "₹10 - ₹20 LPA", "₹20 - ₹35 LPA", "₹35 - ₹50 LPA", "Above ₹50 LPA"].includes(formData.income) && (
                <option value={formData.income}>{formData.income}</option>
              )}
              <option value="Below ₹2 LPA">Below ₹2 LPA</option>
              <option value="₹2 - ₹5 LPA">₹2 - ₹5 LPA</option>
              <option value="₹5 - ₹10 LPA">₹5 - ₹10 LPA</option>
              <option value="₹10 - ₹20 LPA">₹10 - ₹20 LPA</option>
              <option value="₹20 - ₹35 LPA">₹20 - ₹35 LPA</option>
              <option value="₹35 - ₹50 LPA">₹35 - ₹50 LPA</option>
              <option value="Above ₹50 LPA">Above ₹50 LPA</option>
            </select>
            {errors.income && (
              <p className="text-red-500 text-sm mt-1">{errors.income}</p>
            )}
          </div>
        </div>

        {/* Terms and Conditions (Consolidated) */}
        <div className="mt-8 border-t pt-6 border-gray-100">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.acceptTerms || false}
              onChange={(e) => updateField("acceptTerms", e.target.checked)}
              className="mt-1 accent-[#AE2539] w-5 h-5 cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-gray-700">
                I agree to the{" "}
                <a href="#" className="text-[#AE2539] font-semibold hover:underline">
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#AE2539] font-semibold hover:underline">
                  Privacy Policy
                </a>
              </span>
              <span className="text-gray-500 text-sm mt-1">
                Use of this form is subject to the MeriJodi.com Terms of Service.
              </span>
            </div>
          </label>
          {errors.acceptTerms && (
            <p className="text-red-500 text-sm mt-2 ml-8">{errors.acceptTerms}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="  mt-12">
          {/* <button
            type="button"
            onClick={prevStep}
            className="flex items-center gap-2 px-8 py-3 rounded-xl border-2 border-[#AE2539] text-[#ED5463] hover:bg-[#EE7985] hover:border-[#EE7985] hover:text-white transition-all font-medium"
          >
            Previous
          </button> */}

          <button
            type="button"
            onClick={handleContinue}
            className="  w-full py-3 rounded-xl bg-[#ED5463] text-white hover:bg-[#EE7985] transition-all shadow-lg font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}