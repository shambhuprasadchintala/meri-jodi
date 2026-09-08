import axiosInstance from "./axiosInstance"

const PROFILE_BASE = "/profiles"

const unwrap = (response) => response.data?.data ?? response.data

const MONTHS = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
}

const getDateOfBirth = (formData) => {
  const day = String(formData.day || "").padStart(2, "0")
  const monthRaw = formData.month || ""
  const month = MONTHS[monthRaw] || String(monthRaw).padStart(2, "0")
  const year = formData.year
  if (!day || !month || !year) return undefined
  return `${year}-${month}-${day}`
}

export const parseHeightCm = (height) => {
  if (!height && height !== 0) return undefined
  const value = String(height).trim()
  if (!value) return undefined

  // Match 5'11", 5'11, 5,11, 5.11, 5 11, 5ft 11
  const feetInchesMatch = value.match(/^(\d+)(?:'|\.|,|\s+|ft|feet)?\s*(\d+)?(?:"|in|inches)?$/i)
  if (feetInchesMatch && feetInchesMatch[2] !== undefined) {
    const feet = Number(feetInchesMatch[1])
    const inches = Number(feetInchesMatch[2])
    if (feet >= 3 && feet <= 8 && inches >= 0 && inches < 12) {
      return Math.round((feet * 12 + inches) * 2.54)
    }
  }

  // Pure cm number (e.g. 175 or 175 cm)
  const cmMatch = value.match(/^(\d{3})(?:\s*cm)?$/i)
  if (cmMatch) {
    const cm = Number(cmMatch[1])
    if (cm >= 100 && cm <= 250) return cm
  }

  return undefined
}

export const getMyProfile = async () => {
  try {
    const response = await axiosInstance.get(`${PROFILE_BASE}/me`)
    return unwrap(response)
  } catch (err) {
    if (err.response?.status === 404) return null
    throw err
  }
}

export const generateAIBio = async (profileDetails) => {
  const response = await axiosInstance.post("/extraction/generate-bio", profileDetails)
  const data = unwrap(response)
  return data?.bio || data
}

export const getChatSuggestions = async (partnerDetails, lastMessage = "", category = "icebreaker") => {
  const response = await axiosInstance.post("/extraction/chat-suggestions", {
    partnerDetails,
    lastMessage,
    category,
  })
  const data = unwrap(response)
  return data?.suggestions || data || []
}

export const buildProfilePayload = (formData) => {
  const dateOfBirth = getDateOfBirth(formData)
  const maritalStatus = formData.maritalStatus
    ? formData.maritalStatus === "never"
      ? "never_married"
      : formData.maritalStatus
    : undefined

  const payload = {
    name: formData.name?.trim() || undefined,
    dateOfBirth,
    timeOfBirth: (formData.timeOfBirth || formData.birthTiming || formData.birthTime)?.trim() || undefined,
    placeOfBirth: formData.birthPlace || formData.placeOfBirth || undefined,
    gender: formData.gender ? String(formData.gender).toLowerCase() : undefined,
    motherTongue: formData.motherTongue || undefined,
    aboutMe: formData.about || formData.aboutMe || undefined,
    heightCm: parseHeightCm(formData.height || formData.heightCm),
    religion: formData.religion || undefined,
    caste: formData.caste || undefined,
    gotham: formData.gotham || formData.gotra || undefined,
    rashi: formData.rashi || undefined,
    nakshtra: formData.nakshtra || formData.nakshatra || undefined,
    manglik: formData.manglik || undefined,
    complexion: formData.complexion || undefined,
    maritalStatus,
    hobbiesAndInterests: Array.isArray(formData.hobbies)
      ? formData.hobbies
      : Array.isArray(formData.hobbiesAndInterests)
      ? formData.hobbiesAndInterests
      : undefined,
    location: {
      city: formData.location || formData.city || undefined,
      state: formData.state || undefined,
      country: formData.country || "India",
      pincode: formData.pincode || undefined,
      willingToRelocate: formData.willingToRelocate === true || formData.willingToRelocate === "true",
    },
    education: {
      highestDegree: formData.education || formData.highestDegree || undefined,
      institution: formData.institution || undefined,
      fieldOfStudy: formData.fieldOfStudy || undefined,
      graduationYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
    },
    career: {
      occupation: formData.occupation || undefined,
      companyName: formData.company || formData.companyName || undefined,
      annualIncome: formData.income || formData.annualIncome || undefined,
      industry: formData.industry || undefined,
      workLocation: formData.workLocation || undefined,
    },
    family: {
      fatherOccupation: formData.fatherOccupation || undefined,
      motherOccupation: formData.motherOccupation || undefined,
      familyType: formData.familyType || undefined,
      familyValues: formData.familyValues || undefined,
      familyAffluence: formData.familyAffluence || undefined,
      numBrothers: formData.numBrothers !== undefined && formData.numBrothers !== "" ? Number(formData.numBrothers) : undefined,
      numSisters: formData.numSisters !== undefined && formData.numSisters !== "" ? Number(formData.numSisters) : undefined,
    },
    lifestyle: {
      diet: formData.diet || undefined,
      smoking: formData.smoking === true || formData.smoking === "true",
      drinking: formData.drinking === true || formData.drinking === "true",
    },
    agreedToTerms: formData.acceptTerms || formData.agreedToTerms || undefined,
  }

  return payload
}

export const createProfile = async (formData) => {
  try {
    const response = await axiosInstance.post(PROFILE_BASE, formData)
    return unwrap(response)
  } catch (err) {
    if (err.response?.status === 409) {
      // Profile already exists from signup skeleton, update it instead
      const updateRes = await axiosInstance.put(`${PROFILE_BASE}/me`, formData)
      return unwrap(updateRes)
    }
    throw err
  }
}

export const updateProfile = async (partialData) => {
  const response = await axiosInstance.put(`${PROFILE_BASE}/me`, partialData)
  return unwrap(response)
}

export const buildPersonalDetailsPayload = (formData) => {
  const payload = {}
  if (formData.name?.trim()) payload.name = formData.name.trim()
  if (formData.day && formData.month && formData.year) {
    const dob = getDateOfBirth(formData)
    if (dob) payload.dateOfBirth = dob
  }
  if (formData.placeOfBirth?.trim()) payload.placeOfBirth = formData.placeOfBirth.trim()
  if (formData.timeOfBirth?.trim() || formData.birthTiming?.trim() || formData.birthTime?.trim()) {
    payload.timeOfBirth = (formData.timeOfBirth || formData.birthTiming || formData.birthTime).trim()
  }
  if (formData.gender?.trim()) payload.gender = String(formData.gender).toLowerCase().trim()
  if (formData.heightCm) {
    const h = parseHeightCm(formData.heightCm)
    if (h) payload.heightCm = h
  }
  if (formData.location?.trim() || formData.city?.trim() || formData.state?.trim() || formData.pincode?.trim()) {
    payload.location = {
      city: (formData.location || formData.city || "").trim() || undefined,
      state: formData.state?.trim() || undefined,
      country: formData.country?.trim() || "India",
      pincode: formData.pincode?.trim() || undefined,
      willingToRelocate: formData.willingToRelocate === true || formData.willingToRelocate === "true",
    }
  }
  if (formData.maritalStatus?.trim()) {
    const ms = formData.maritalStatus.trim()
    payload.maritalStatus = ms === "never" ? "never_married" : ms
  }
  if (formData.aboutMe?.trim()) payload.aboutMe = formData.aboutMe.trim()
  if (formData.manglik?.trim()) payload.manglik = formData.manglik.trim()
  if (formData.complexion?.trim()) payload.complexion = formData.complexion.trim()
  return payload
}

export const buildFamilyPayload = (formData) => {
  const payload = {}
  const family = {}
  if (formData.motherTongue?.trim()) payload.motherTongue = formData.motherTongue.trim()
  if (formData.familyType?.trim()) family.familyType = formData.familyType.trim()
  if (formData.fatherOccupation?.trim()) family.fatherOccupation = formData.fatherOccupation.trim()
  if (formData.motherOccupation?.trim()) family.motherOccupation = formData.motherOccupation.trim()
  if (formData.familyValues?.trim()) family.familyValues = formData.familyValues.trim()
  if (formData.familyAffluence?.trim()) family.familyAffluence = formData.familyAffluence.trim()
  if (formData.numBrothers !== undefined && formData.numBrothers !== "") {
    const b = Number(formData.numBrothers)
    if (!isNaN(b)) family.numBrothers = b
  }
  if (formData.numSisters !== undefined && formData.numSisters !== "") {
    const s = Number(formData.numSisters)
    if (!isNaN(s)) family.numSisters = s
  }
  if (Object.keys(family).length) payload.family = family
  return payload
}

export const buildCareerEducationPayload = (formData) => {
  const payload = {}
  const education = {}
  const career = {}
  if (formData.education?.trim()) education.highestDegree = formData.education.trim()
  if (formData.fieldOfStudy?.trim()) education.fieldOfStudy = formData.fieldOfStudy.trim()
  if (formData.institution?.trim()) education.institution = formData.institution.trim()
  if (formData.graduationYear !== undefined && formData.graduationYear !== "") {
    const yr = Number(formData.graduationYear)
    if (!isNaN(yr)) education.graduationYear = yr
  }
  if (formData.occupation?.trim()) career.occupation = formData.occupation.trim()
  if (formData.companyName?.trim()) career.companyName = formData.companyName.trim()
  if (formData.industry?.trim()) career.industry = formData.industry.trim()
  if (formData.annualIncome?.trim()) career.annualIncome = formData.annualIncome.trim()
  if (formData.workLocation?.trim()) career.workLocation = formData.workLocation.trim()
  if (Object.keys(education).length) payload.education = education
  if (Object.keys(career).length) payload.career = career
  return payload
}

export const buildReligionPayload = (formData) => {
  const payload = {}
  if (formData.motherTongue?.trim()) payload.motherTongue = formData.motherTongue.trim()
  if (formData.religion?.trim()) payload.religion = formData.religion.trim()
  if (formData.caste?.trim()) payload.caste = formData.caste.trim()
  if (formData.gotham?.trim()) payload.gotham = formData.gotham.trim()
  if (formData.rashi?.trim()) payload.rashi = formData.rashi.trim()
  if (formData.nakshtra?.trim()) payload.nakshtra = formData.nakshtra.trim()
  if (formData.manglik?.trim()) payload.manglik = formData.manglik.trim()
  return payload
}

export const buildLifestylePayload = (formData) => {
  const payload = {}
  const lifestyle = {}
  if (formData.diet?.trim()) lifestyle.diet = formData.diet.trim()
  if (formData.smoking !== undefined && formData.smoking !== "") lifestyle.smoking = formData.smoking === "true" || formData.smoking === true
  if (formData.drinking !== undefined && formData.drinking !== "") lifestyle.drinking = formData.drinking === "true" || formData.drinking === true
  if (Object.keys(lifestyle).length) payload.lifestyle = lifestyle
  if (formData.aboutMe?.trim()) payload.aboutMe = formData.aboutMe.trim()
  if (Array.isArray(formData.hobbiesAndInterests)) payload.hobbiesAndInterests = formData.hobbiesAndInterests
  return payload
}
