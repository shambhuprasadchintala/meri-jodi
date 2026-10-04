import { useMemo } from "react";

const motherTongues = [
  "Hindi",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Bengali",
  "Urdu",
  "Odia",
  "English",
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function BasicInfo({
  formData,
  setFormData,
  errors,
  setErrors,
  nextStep,
}) {
  const years = useMemo(() => {
    const arr = [];
    const current = new Date().getFullYear();

    for (let i = current - 18; i >= current - 80; i--) {
      arr.push(i);
    }

    return arr;
  }, []);

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

  const validate = () => {
    let err = {};

    if (formData.name !== undefined && !formData.name?.trim()) {
      err.name = "Full Name is required";
    }

    if (!formData.day) err.day = "Select day";
    if (!formData.month) err.month = "Select month";
    if (!formData.year) err.year = "Select year";

    if (!formData.birthPlace?.trim()) err.birthPlace = "Birth place is required";
    else if (formData.birthPlace.length < 2) err.birthPlace = "Minimum 2 characters";

    if (!formData.motherTongue) err.motherTongue = "Select mother tongue";

    if (!formData.gender) err.gender = "Select gender";

    const cleanPhone = (formData.phone || "").trim().replace(/\D/g, "");
    if (!cleanPhone) {
      err.phone = "Mobile number is required";
    } else if (cleanPhone.length !== 10) {
      err.phone = "Please enter a valid 10-digit mobile number";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      nextStep();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-10 border border-[#FFE4E8]">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#842029] font-serif">Basic Information</h1>
      <p className="text-gray-500 mt-2 mb-8 text-sm sm:text-base">
        Let's begin by knowing a little about you.
      </p>

      {/* Full Name */}
      <div className="mb-6">
        <label className="font-medium mb-2 block text-gray-700 text-sm">Full Name</label>
        <input
          type="text"
          value={formData.name || ""}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="e.g. Rahul Sharma"
          className={`w-full py-[10px] px-3 rounded-[10px] border-2 outline-none transition-colors text-sm ${
            errors.name ? "border-red-500" : "border-[#DFDFDF] hover:border-[#842029] focus:border-[#842029]"
          }`}
        />
        {errors.name && (
          <p className="text-red-500 mt-1 text-xs">{errors.name}</p>
        )}
      </div>

      {/* Mobile Number */}
      <div className="mb-6">
        <label className="font-medium mb-2 block text-gray-700 text-sm">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
            +91
          </span>
          <input
            type="tel"
            maxLength={10}
            value={formData.phone || ""}
            onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, ""))}
            placeholder="9876543210"
            className={`w-full py-[10px] pl-12 pr-3 rounded-[10px] border-2 outline-none transition-colors text-sm ${
              errors.phone ? "border-red-500" : "border-[#DFDFDF] hover:border-[#842029] focus:border-[#842029]"
            }`}
          />
        </div>
        {errors.phone ? (
          <p className="text-red-500 mt-1 text-xs">{errors.phone}</p>
        ) : (
          <p className="text-gray-400 text-[11px] mt-1">
            Required for match notifications, SMS alerts, and verified badge.
          </p>
        )}
      </div>

      {/* DOB */}
      <label className="font-medium mb-2 block text-gray-700 text-sm">Date of Birth</label>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div>
          <select
            value={formData.day}
            onChange={(e) => updateField("day", e.target.value)}
            className={`w-full pl-2 sm:pl-3 py-[10px] rounded-[10px] border-2 focus:ring-1 outline-none transition-colors text-xs sm:text-sm ${
              errors.day ? "border-red-500" : "border-[#DFDFDF] hover:border-[#842029] focus:border-[#842029]"
            }`}
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          {errors.day && <p className="text-red-500 text-xs mt-1">{errors.day}</p>}
        </div>

        <div>
          <select
            value={formData.month}
            onChange={(e) => updateField("month", e.target.value)}
            className={`w-full pl-2 sm:pl-3 pr-2 sm:pr-4 py-[10px] rounded-[10px] border-2 focus:ring-1 outline-none transition-colors text-xs sm:text-sm ${
              errors.month ? "border-red-500" : "border-[#DFDFDF] hover:border-[#842029] focus:border-[#842029]"
            }`}
          >
            <option value="">Month</option>
            {months.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          {errors.month && <p className="text-red-500 text-xs mt-1">{errors.month}</p>}
        </div>

        <div>
          <select
            value={formData.year || ""}
            onChange={(e) => updateField("year", e.target.value)}
            className={`w-full pl-2 sm:pl-3 pr-2 sm:pr-4 py-[10px] rounded-[10px] border-2 focus:ring-1 outline-none transition-colors text-xs sm:text-sm ${
              errors.year ? "border-red-500" : "border-[#DFDFDF] hover:border-[#842029] focus:border-[#842029]"
            }`}
          >
            <option value="">Year</option>
            {formData.year && !years.includes(Number(formData.year)) && (
              <option value={formData.year}>{formData.year}</option>
            )}
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
        </div>
      </div>

      {/* Birth Place & Birth Timing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div>
          <label className="font-medium mb-2 block text-gray-700 text-sm">Place of Birth</label>
          <input
            type="text"
            value={formData.birthPlace || ""}
            onChange={(e) => updateField("birthPlace", e.target.value)}
            placeholder="e.g. Mumbai, Maharashtra"
            className={`w-full py-[10px] px-3 rounded-[10px] border-2 outline-none transition-colors text-sm ${
              errors.birthPlace ? "border-red-500" : "border-[#DFDFDF] hover:border-[#842029] focus:border-[#842029]"
            }`}
          />
          {errors.birthPlace && (
            <p className="text-red-500 mt-1 text-xs">{errors.birthPlace}</p>
          )}
        </div>

        <div>
          <label className="font-medium mb-2 block text-gray-700 text-sm">
            Time of Birth / Birth Timing <span className="text-xs text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.timeOfBirth || formData.birthTiming || ""}
            onChange={(e) => {
              updateField("timeOfBirth", e.target.value)
              updateField("birthTiming", e.target.value)
            }}
            placeholder="e.g. 09:30 AM or 14:15"
            className="w-full py-[10px] px-3 rounded-[10px] border-2 border-[#DFDFDF] hover:border-[#842029] focus:border-[#842029] outline-none transition-colors text-sm"
          />
        </div>
      </div>

      {/* Mother Tongue */}
      <div className="mt-6">
        <label className="font-medium mb-2 block text-gray-700 text-sm">Mother Tongue</label>
        <select
          value={formData.motherTongue || ""}
          onChange={(e) => updateField("motherTongue", e.target.value)}
          className={`w-full pl-3 pr-4 py-[10px] rounded-[10px] border-2 outline-none transition-colors text-sm ${
            errors.motherTongue ? "border-red-500" : "border-[#DFDFDF] hover:border-[#842029] focus:border-[#842029]"
          }`}
        >
          <option value="" disabled hidden>Select Mother Tongue</option>
          {formData.motherTongue && !motherTongues.includes(formData.motherTongue) && (
            <option value={formData.motherTongue}>{formData.motherTongue}</option>
          )}
          {motherTongues.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        {errors.motherTongue && (
          <p className="text-red-500 mt-1 text-xs">{errors.motherTongue}</p>
        )}
      </div>

      {/* Gender */}
      <div className="mt-6">
        <label className="font-medium block mb-2 text-gray-700 text-sm">Gender</label>
        <div className="grid grid-cols-2 gap-4">
          {["Male", "Female"].map((genderLabel) => {
            const genderValue = genderLabel.toLowerCase();
            return (
              <button
                key={genderLabel}
                type="button"
                onClick={() => updateField("gender", genderValue)}
                className={`border-2 rounded-xl py-3 transition-all font-medium text-sm ${
                  formData.gender === genderValue
                    ? "bg-[#ED5463] text-white border-[#ED5463] shadow-xs"
                    : "border-[#DFDFDF] text-gray-700 hover:border-[#ED5463]"
                }`}
              >
                {genderLabel}
              </button>
            );
          })}
        </div>
        {errors.gender && (
          <p className="text-red-500 mt-1 text-xs">{errors.gender}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleNext}
        className="mt-10 w-full bg-[#842029] hover:bg-[#6b1b27] transition-all text-white py-3.5 rounded-xl font-bold text-base shadow-sm"
      >
        Continue to Personal Details →
      </button>
    </div>
  );
}