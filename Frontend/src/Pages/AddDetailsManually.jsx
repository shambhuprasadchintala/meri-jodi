import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Check } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { getMyProfile, createProfile, buildProfilePayload } from "../api/profileApi"
import { updatePartnerPreferences } from "../api/partnerPreferenceApi"
import weddingImage from "../assets/login-image.png"
import Logo from "../assets/logo_1.svg"
import BasicInfo from "../Components/BasicInfo"
import PersonalDetails from "../Components/PersonalDetails"
import Interest from "../Components/Interest"
import { useToast } from "../context/ToastContext"

const STORAGE_KEY_FORM = "merijodi_draft_profile"
const STORAGE_KEY_STEP = "merijodi_draft_step"
const STORAGE_KEY_USER = "merijodi_draft_userId"

const MAROON = "#640515"
const ACCENT = "#AE2539"
const STEP_ACTIVE = "#252525"
const STEP_INACTIVE = "#AFAFAF"
const PAGE_BG = "#FBF9F9"

const initialFormData = {
  name: "",
  day: "",
  month: "",
  year: "",
  birthPlace: "",
  timeOfBirth: "",
  birthTiming: "",
  motherTongue: "",
  gender: "",
  about: "",
  height: "",
  location: "",
  education: "",
  occupation: "",
  company: "",
  income: "",
  acceptTerms: false,
  minAge: "",
  maxAge: "",
  religion: "",
  caste: "",
  partnereducation: "",
  partneroccupation: "",
  partnerincome: "",
  city: "",
  hobbies: [],
  additionalPreference: "",
}

const steps = [
  { number: 1, label: "Basic info" },
  { number: 2, label: "Personal Details" },
  { number: 3, label: "Interest" },
]

const parseSafeDob = (dobStr) => {
  if (!dobStr) return { day: "", month: "", year: "" }
  const clean = String(dobStr).trim()
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/)
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10).toString()
    const monthIdx = parseInt(dmyMatch[2], 10) - 1
    const year = dmyMatch[3]
    if (monthIdx >= 0 && monthIdx < 12) {
      return { day, month: months[monthIdx], year }
    }
  }

  // YYYY-MM-DD
  const ymdMatch = clean.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/)
  if (ymdMatch) {
    const year = ymdMatch[1]
    const monthIdx = parseInt(ymdMatch[2], 10) - 1
    const day = parseInt(ymdMatch[3], 10).toString()
    if (monthIdx >= 0 && monthIdx < 12) {
      return { day, month: months[monthIdx], year }
    }
  }

  // DD Month YYYY (e.g. 15 August 1996)
  const textMatch = clean.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/)
  if (textMatch) {
    const day = parseInt(textMatch[1], 10).toString()
    const monthStr = textMatch[2].toLowerCase()
    const year = textMatch[3]
    const monthIdx = months.findIndex((m) => m.toLowerCase().startsWith(monthStr.slice(0, 3)))
    if (monthIdx >= 0) {
      return { day, month: months[monthIdx], year }
    }
  }

  try {
    const d = new Date(clean)
    if (!isNaN(d.getTime())) {
      return {
        year: d.getFullYear().toString(),
        month: d.toLocaleString("default", { month: "long" }),
        day: d.getDate().toString(),
      }
    }
  } catch {
    // ignore
  }

  return { day: "", month: "", year: "" }
}

const AddDetailsManually = () => {
  const { user, updateUser, refreshUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { addToast } = useToast?.() || { addToast: () => {} }
  const extractedData = location.state?.initialData || {}
  const fromUpload = Boolean(
    location.state?.fromUpload ||
    (location.state?.initialData && Object.keys(location.state.initialData).length > 0)
  )

  const [step, setStep] = useState(() => {
    if (fromUpload) return 1
    try {
      const savedStep = localStorage.getItem(STORAGE_KEY_STEP)
      const num = Number(savedStep)
      return num >= 1 && num <= 3 ? num : 1
    } catch {
      return 1
    }
  })

  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState(() => {
    let savedData = {}
    if (!fromUpload) {
      try {
        const savedUserId = localStorage.getItem(STORAGE_KEY_USER)
        if (savedUserId && user?._id && savedUserId !== user._id) {
          localStorage.removeItem(STORAGE_KEY_FORM)
          localStorage.removeItem(STORAGE_KEY_STEP)
          localStorage.removeItem(STORAGE_KEY_USER)
        } else {
          const item = localStorage.getItem(STORAGE_KEY_FORM)
          if (item) savedData = JSON.parse(item)
        }
      } catch (e) {
        console.warn("Could not read draft from localStorage", e)
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY_FORM)
        localStorage.removeItem(STORAGE_KEY_STEP)
        localStorage.removeItem(STORAGE_KEY_USER)
      } catch (e) {
        // ignore
      }
    }

    const rawDob =
      extractedData.personal_details?.date_of_birth ||
      extractedData.dateOfBirth ||
      extractedData.date_of_birth ||
      ""
    const dobParts = parseSafeDob(rawDob)

    return {
      ...initialFormData,
      ...savedData,
      ...extractedData,
      name:
        extractedData.name ||
        extractedData.personal_details?.name ||
        savedData.name ||
        (user?.name && !["Google Member", "MeriJodi Member", "New Member"].includes(user.name) ? user.name : "") ||
        "",
      birthPlace:
        extractedData.birthPlace ||
        extractedData.personal_details?.place_of_birth ||
        savedData.birthPlace ||
        "",
      timeOfBirth:
        extractedData.timeOfBirth ||
        extractedData.birthTiming ||
        extractedData.personal_details?.time_of_birth ||
        savedData.timeOfBirth ||
        savedData.birthTiming ||
        "",
      birthTiming:
        extractedData.birthTiming ||
        extractedData.timeOfBirth ||
        extractedData.personal_details?.time_of_birth ||
        savedData.birthTiming ||
        savedData.timeOfBirth ||
        "",
      motherTongue:
        extractedData.motherTongue ||
        extractedData.personal_details?.mother_tongue ||
        savedData.motherTongue ||
        "",
      gender: (
        extractedData.gender ||
        extractedData.personal_details?.gender ||
        savedData.gender ||
        user?.gender ||
        ""
      ).toLowerCase(),
      year:
        extractedData.year ||
        dobParts.year ||
        savedData.year ||
        "",
      month:
        extractedData.month ||
        dobParts.month ||
        savedData.month ||
        "",
      day:
        extractedData.day ||
        dobParts.day ||
        savedData.day ||
        "",
      about:
        extractedData.about ||
        extractedData.personal_details?.about_me ||
        savedData.about ||
        "",
      height:
        extractedData.height ||
        extractedData.personal_details?.height ||
        savedData.height ||
        "",
      location:
        extractedData.location ||
        extractedData.contact_details?.city ||
        extractedData.city ||
        savedData.location ||
        user?.location ||
        "",
      education:
        extractedData.education ||
        extractedData.personal_details?.highest_education ||
        savedData.education ||
        "",
      occupation:
        extractedData.occupation ||
        extractedData.personal_details?.occupation ||
        savedData.occupation ||
        "",
      company:
        extractedData.company ||
        extractedData.personal_details?.organization_name ||
        savedData.company ||
        "",
      income:
        extractedData.income ||
        extractedData.personal_details?.annual_income ||
        savedData.income ||
        "",
      city:
        extractedData.city ||
        extractedData.location ||
        extractedData.contact_details?.city ||
        savedData.city ||
        savedData.location ||
        user?.location ||
        "",
      religion:
        extractedData.religion ||
        extractedData.personal_details?.religion ||
        savedData.religion ||
        "",
      caste:
        extractedData.caste ||
        extractedData.personal_details?.caste ||
        savedData.caste ||
        "No Preference",
      gotham:
        extractedData.gotham ||
        extractedData.personal_details?.gotra ||
        savedData.gotham ||
        "",
      rashi:
        extractedData.rashi ||
        extractedData.personal_details?.rashi ||
        savedData.rashi ||
        "",
      nakshtra:
        extractedData.nakshtra ||
        extractedData.personal_details?.nakshatra ||
        savedData.nakshtra ||
        "",
      manglik:
        extractedData.manglik ||
        extractedData.personal_details?.manglik ||
        savedData.manglik ||
        "no",
      complexion:
        extractedData.complexion ||
        extractedData.personal_details?.complexion ||
        savedData.complexion ||
        "",
      maritalStatus:
        extractedData.maritalStatus ||
        extractedData.personal_details?.marital_status ||
        savedData.maritalStatus ||
        "never_married",
      hobbies:
        Array.isArray(extractedData.hobbies) && extractedData.hobbies.length > 0
          ? extractedData.hobbies
          : Array.isArray(extractedData.personal_details?.hobbies) && extractedData.personal_details.hobbies.length > 0
          ? extractedData.personal_details.hobbies
          : Array.isArray(savedData.hobbies) && savedData.hobbies.length > 0
          ? savedData.hobbies
          : [],
      acceptTerms: Boolean(extractedData.acceptTerms || savedData.acceptTerms || fromUpload),
      minAge:
        extractedData.minAge ||
        savedData.minAge ||
        "",
      maxAge:
        extractedData.maxAge ||
        savedData.maxAge ||
        "",
      partnereducation:
        extractedData.partnereducation ||
        savedData.partnereducation ||
        "",
      partneroccupation:
        extractedData.partneroccupation ||
        savedData.partneroccupation ||
        "",
      partnerincome:
        extractedData.partnerincome ||
        savedData.partnerincome ||
        "",
      additionalPreference:
        extractedData.additionalPreference ||
        savedData.additionalPreference ||
        "",
    }
  })

  const [errors, setErrors] = useState({})

  // Re-sync form data if user arrives with extracted biodata from upload page
  useEffect(() => {
    if (location.state?.initialData && Object.keys(location.state.initialData).length > 0) {
      const ext = location.state.initialData
      const rawDob = ext.personal_details?.date_of_birth || ext.dateOfBirth || ext.date_of_birth || ""
      const dobParts = parseSafeDob(rawDob)

      setFormData((prev) => ({
        ...prev,
        ...ext,
        name:
          ext.name ||
          ext.personal_details?.name ||
          (prev.name && !["Google Member", "MeriJodi Member", "New Member"].includes(prev.name) ? prev.name : "") ||
          (user?.name && !["Google Member", "MeriJodi Member", "New Member"].includes(user.name) ? user.name : "") ||
          "",
        birthPlace: ext.birthPlace || ext.personal_details?.place_of_birth || prev.birthPlace || "",
        timeOfBirth: ext.timeOfBirth || ext.birthTiming || ext.personal_details?.time_of_birth || prev.timeOfBirth || "",
        birthTiming: ext.birthTiming || ext.timeOfBirth || ext.personal_details?.time_of_birth || prev.birthTiming || "",
        motherTongue: ext.motherTongue || ext.personal_details?.mother_tongue || prev.motherTongue || "",
        gender: (ext.gender || ext.personal_details?.gender || prev.gender || user?.gender || "").toLowerCase(),
        year: ext.year || dobParts.year || prev.year || "",
        month: ext.month || dobParts.month || prev.month || "",
        day: ext.day || dobParts.day || prev.day || "",
        about: ext.about || ext.personal_details?.about_me || prev.about || "",
        height: ext.height || ext.personal_details?.height || prev.height || "",
        location: ext.location || ext.contact_details?.city || ext.city || prev.location || user?.location || "",
        education: ext.education || ext.personal_details?.highest_education || prev.education || "",
        occupation: ext.occupation || ext.personal_details?.occupation || prev.occupation || "",
        company: ext.company || ext.personal_details?.organization_name || prev.company || "",
        income: ext.income || ext.personal_details?.annual_income || prev.income || "",
        city: ext.city || ext.location || ext.contact_details?.city || prev.city || user?.location || "",
        religion: ext.religion || ext.personal_details?.religion || prev.religion || "",
        caste: ext.caste || ext.personal_details?.caste || prev.caste || "No Preference",
        hobbies: Array.isArray(ext.hobbies) && ext.hobbies.length > 0 ? ext.hobbies : (Array.isArray(ext.personal_details?.hobbies) ? ext.personal_details.hobbies : prev.hobbies),
        acceptTerms: true,
      }))
      setStep(1)
    }
  }, [location.state, user])

  // If user navigated directly (not from upload), prefill from database profile
  useEffect(() => {
    if (fromUpload) return
    let isMounted = true
    getMyProfile()
      .then((existing) => {
        if (!isMounted || !existing) return
        setFormData((prev) => {
          const dobParts = parseSafeDob(existing.dateOfBirth)
          return {
            ...prev,
            name:
              prev.name ||
              existing.name ||
              (user?.name && !["Google Member", "MeriJodi Member", "New Member"].includes(user.name) ? user.name : "") ||
              "",
            gender:
              prev.gender ||
              (existing.gender ? String(existing.gender).toLowerCase() : "") ||
              (user?.gender ? String(user.gender).toLowerCase() : "") ||
              "",
            location: prev.location || existing.location?.city || user?.location || "",
            city: prev.city || existing.location?.city || user?.location || "",
            birthPlace: prev.birthPlace || existing.placeOfBirth || "",
            timeOfBirth: prev.timeOfBirth || existing.timeOfBirth || "",
            birthTiming: prev.birthTiming || existing.timeOfBirth || "",
            day: prev.day || dobParts.day || "",
            month: prev.month || dobParts.month || "",
            year: prev.year || dobParts.year || "",
            motherTongue: prev.motherTongue || existing.motherTongue || "",
            about: prev.about || existing.aboutMe || "",
            height: prev.height || (existing.heightCm ? String(existing.heightCm) : ""),
            education: prev.education || existing.education?.highestDegree || "",
            occupation: prev.occupation || existing.career?.occupation || "",
            company: prev.company || existing.career?.companyName || "",
            income: prev.income || existing.career?.annualIncome || "",
            religion: prev.religion || existing.religion || "",
            caste: prev.caste || existing.caste || "No Preference",
            gotham: prev.gotham || existing.gotham || "",
            rashi: prev.rashi || existing.rashi || "",
            nakshtra: prev.nakshtra || existing.nakshtra || "",
            hobbies:
              Array.isArray(prev.hobbies) && prev.hobbies.length > 0
                ? prev.hobbies
                : Array.isArray(existing.hobbiesAndInterests)
                ? existing.hobbiesAndInterests
                : [],
          }
        })
      })
      .catch((err) => {
        console.warn("Could not prefill profile in AddDetailsManually", err)
      })
    return () => {
      isMounted = false
    }
  }, [fromUpload, user])

  // Auto-save form data to localStorage whenever user types
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(formData))
      if (user?._id) {
        localStorage.setItem(STORAGE_KEY_USER, user._id)
      }
    } catch (e) {
      console.warn("Failed to persist draft to localStorage", e)
    }
  }, [formData, user])

  // Auto-save current step to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STEP, String(step))
    } catch (e) {
      console.warn("Failed to persist step to localStorage", e)
    }
  }, [step])

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 3))
  }

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const submitForm = async () => {
    if (loading) return
    try {
      setLoading(true)
      const payload = buildProfilePayload(formData)
      await createProfile(payload)

      // Instantly update user in AuthContext and refresh session
      if (formData.name && updateUser) {
        updateUser({ name: formData.name.trim() })
      }
      if (refreshUser) {
        await refreshUser()
      }

      if (
        formData.minAge ||
        formData.maxAge ||
        formData.religion ||
        formData.caste ||
        formData.partnereducation ||
        formData.city
      ) {
        try {
          await updatePartnerPreferences({
            ageMin: formData.minAge ? Number(formData.minAge) : undefined,
            ageMax: formData.maxAge ? Number(formData.maxAge) : undefined,
            religion: formData.religion || undefined,
            caste: formData.caste || undefined,
            education: formData.partnereducation || undefined,
            occupation: formData.partneroccupation || undefined,
            annualIncome: formData.partnerincome || undefined,
            location: formData.city || undefined,
            hobbiesAndInterests:
              Array.isArray(formData.hobbies) && formData.hobbies.length > 0
                ? formData.hobbies
                : undefined,
          })
        } catch (prefErr) {
          console.warn("Could not save initial preferences:", prefErr.message)
        }
      }

      // Clear draft storage on successful creation
      try {
        localStorage.removeItem(STORAGE_KEY_FORM)
        localStorage.removeItem(STORAGE_KEY_STEP)
        localStorage.removeItem(STORAGE_KEY_USER)
      } catch (e) {
        console.warn("Failed to clear localStorage draft", e)
      }

      navigate("/home")
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong."
      addToast(message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-10" style={{ backgroundColor: PAGE_BG }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 font-sans">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="hidden lg:block sticky top-10">
            <img
              src={weddingImage}
              alt="Wedding"
              className="rounded-3xl w-full object-cover h-[calc(100vh-5rem)] max-h-[850px]"
            />
          </div>
          <div>
            <img src={Logo} alt="MeriJodi logo" className="w-[206px] h-16 object-contain" />
            <h1 className="font-display font-bold text-2xl sm:text-3xl mt-8" style={{ color: MAROON }}>
              Complete Your Profile
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Just a few details to help you find your perfect match.
            </p>
            <div className="w-full mt-6">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                aria-disabled={step === 1}
                className="flex items-center font-medium mb-4 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:underline disabled:hover:no-underline"
                style={{ color: ACCENT }}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </button>
              <div className="flex items-start justify-between w-full max-w-3xl mx-auto px-4 relative">
                {steps.map((s, i) => (
                  <div key={s.number} className="contents">
                    <div className="flex flex-col items-center relative z-10 w-16 sm:w-24 md:w-32">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm transition-colors shrink-0"
                        style={{ backgroundColor: step >= s.number ? STEP_ACTIVE : STEP_INACTIVE }}
                      >
                        {step > s.number ? <Check className="w-3.5 h-3.5" /> : s.number}
                      </div>
                      <span
                        className="mt-4 text-xs sm:text-sm md:text-base text-center leading-snug transition-colors"
                        style={{ color: step >= s.number ? STEP_ACTIVE : STEP_INACTIVE }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className="flex-1 h-[1px] mt-3 relative z-0 mx-[-20px] transition-colors"
                        style={{ backgroundColor: step > s.number ? STEP_ACTIVE : "#C4C4C4" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div
              className={`mt-10 overflow-x-hidden transition-opacity ${
                loading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  layout
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                >
                  {step === 1 && (
                    <BasicInfo
                      formData={formData}
                      setFormData={setFormData}
                      errors={errors}
                      setErrors={setErrors}
                      nextStep={nextStep}
                    />
                  )}
                  {step === 2 && (
                    <PersonalDetails
                      formData={formData}
                      setFormData={setFormData}
                      errors={errors}
                      setErrors={setErrors}
                      nextStep={nextStep}
                      prevStep={prevStep}
                    />
                  )}
                  {step === 3 && (
                    <Interest
                      formData={formData}
                      setFormData={setFormData}
                      errors={errors}
                      setErrors={setErrors}
                      prevStep={prevStep}
                      submitForm={submitForm}
                      loading={loading}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            {loading && (
              <div className="mt-6 flex items-center gap-3" style={{ color: ACCENT }}>
                <div
                  className="w-5 h-5 rounded-full border-4 border-t-transparent animate-spin"
                  style={{ borderColor: ACCENT, borderTopColor: "transparent" }}
                />
                <span className="font-medium">Creating Profile...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddDetailsManually
