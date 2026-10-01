import { PartnerPreference } from "../models/PartnerPreference.js"
import { Profile } from "../models/Profile.js"

const PREFERENCE_UPDATE_FIELDS = [
    "gender",
    "ageMin",
    "ageMax",
    "religion",
    "caste",
    "location",
    "locations",
    "education",
    "occupation",
    "annualIncome",
    "diet",
    "hobbiesAndInterests",
    "heightMinCm",
    "heightMaxCm",
    "maritalStatus",
    "willingToRelocate",
]

class PartnerPreferenceService {
    /**
     * Create or update partner preferences (whitelisted fields only)
     * @param {string} profileId - Profile ID
     * @param {object} data - Preference data
     * @returns {Promise<object>} Saved preferences
     */
    async createOrUpdate(profileId, data) {
        const sanitized = {}
        for (const field of PREFERENCE_UPDATE_FIELDS) {
            if (data[field] !== undefined) {
                if (Array.isArray(data[field]) && !["maritalStatus", "hobbiesAndInterests", "locations"].includes(field)) {
                    sanitized[field] = data[field].join(", ")
                } else {
                    sanitized[field] = data[field]
                }
            }
        }

        // Normalize locations array & location string
        if (data.locations !== undefined) {
            if (Array.isArray(data.locations)) {
                sanitized.locations = data.locations
                    .map((l) => (typeof l === "string" ? l.trim() : String(l || "")))
                    .filter(Boolean)
                    .slice(0, 10)
            } else if (typeof data.locations === "string") {
                sanitized.locations = data.locations
                    .split(",")
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .slice(0, 10)
            }
            if (sanitized.locations?.length > 0 && !sanitized.location) {
                sanitized.location = sanitized.locations.join(", ")
            }
        } else if (data.location && typeof data.location === "string") {
            const locs = data.location.split(",").map((l) => l.trim()).filter(Boolean).slice(0, 10)
            if (locs.length > 0 && (!sanitized.locations || sanitized.locations.length === 0)) {
                sanitized.locations = locs
            }
        }

        if (data.ageRange && typeof data.ageRange === "object") {
            if (data.ageRange.min !== undefined) sanitized.ageMin = Number(data.ageRange.min)
            if (data.ageRange.max !== undefined) sanitized.ageMax = Number(data.ageRange.max)
        }
        if (data.heightRange && typeof data.heightRange === "object") {
            if (data.heightRange.min !== undefined) sanitized.heightMinCm = Number(data.heightRange.min)
            if (data.heightRange.max !== undefined) sanitized.heightMaxCm = Number(data.heightRange.max)
        }

        // Normalize maritalStatus
        if (sanitized.maritalStatus) {
            if (typeof sanitized.maritalStatus === "string") {
                sanitized.maritalStatus = [sanitized.maritalStatus]
            }
            if (Array.isArray(sanitized.maritalStatus)) {
                sanitized.maritalStatus = sanitized.maritalStatus.map((s) =>
                    s === "never" ? "never_married" : s
                )
            }
        }

        // Normalize willingToRelocate
        if (sanitized.willingToRelocate !== undefined) {
            sanitized.willingToRelocate = sanitized.willingToRelocate === true || sanitized.willingToRelocate === "true"
        }

        // Ensure gender is present for upserts (required field not enforced by $set)
        if (!sanitized.gender) {
            const existing = await PartnerPreference.findOne({ profileId })
            if (existing && existing.gender) {
                sanitized.gender = existing.gender
            } else {
                const profile = await Profile.findById(profileId)
                if (profile && profile.gender) {
                    sanitized.gender = profile.gender.toLowerCase() === "male" ? "female" : "male"
                } else {
                    sanitized.gender = "female"
                }
            }
        }

        // Cross-validation: ageMin <= ageMax
        if (sanitized.ageMin !== undefined && sanitized.ageMax !== undefined) {
            if (Number(sanitized.ageMin) > Number(sanitized.ageMax)) {
                throw new Error("Minimum age must be less than or equal to maximum age")
            }
        }

        // Cross-validation: heightMinCm <= heightMaxCm
        if (sanitized.heightMinCm !== undefined && sanitized.heightMaxCm !== undefined) {
            if (Number(sanitized.heightMinCm) > Number(sanitized.heightMaxCm)) {
                throw new Error("Minimum height must be less than or equal to maximum height")
            }
        }

        const preferences = await PartnerPreference.findOneAndUpdate(
            { profileId },
            { $set: sanitized },
            { returnDocument: "after", runValidators: true, upsert: true }
        )
        return preferences
    }

    /**
     * Get preferences by profile ID
     * @param {string} profileId - Profile ID
     * @returns {Promise<object|null>} Preferences or null
     */
    async getByProfileId(profileId) {
        return PartnerPreference.findOne({ profileId })
    }

    /**
     * Delete preferences by profile ID
     * @param {string} profileId - Profile ID
     * @returns {Promise<object|null>} Deleted preferences
     */
    async delete(profileId) {
        return PartnerPreference.findOneAndDelete({ profileId })
    }
}

export default new PartnerPreferenceService()
