/**
 * Formats full names to mask the surname for privacy:
 * Example: "Aavya Sharma" -> "Aavya S...."
 * Example: "Ishani Patel" -> "Ishani P...."
 * Example: "Rahul" -> "Rahul"
 */
export const formatMaskedSurname = (fullName) => {
    if (!fullName || typeof fullName !== "string") return "MeriJodi Member"
    const trimmed = fullName.trim()
    if (!trimmed) return "MeriJodi Member"
    
    // Ignore generic placeholder strings
    if (["MeriJodi Member", "Google Member", "New Member", "Verified Member"].includes(trimmed)) {
        return trimmed
    }

    const parts = trimmed.split(/\s+/)
    if (parts.length <= 1) return parts[0]

    const firstName = parts[0]
    const lastWord = parts[parts.length - 1]
    const initial = lastWord.charAt(0).toUpperCase()
    
    return `${firstName} ${initial}....`
}

/**
 * Calculates age from Date of Birth string or Date object
 */
export const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const dob = new Date(dateOfBirth)
    if (Number.isNaN(dob.getTime())) return null
    return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

/**
 * Formats height from cm to feet & inches + cm string
 */
export const formatHeight = (heightCm) => {
    if (!heightCm) return null
    const totalInches = Number(heightCm) / 2.54
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return `${feet}ft ${inches}in (${heightCm}cm)`
}

/**
 * Formats location object
 */
export const formatLocation = (location) => {
    if (!location) return "India"
    if (typeof location === "string") return location
    const parts = [location.city, location.state, location.country].filter(Boolean)
    return parts.length ? parts.join(", ") : "India"
}
