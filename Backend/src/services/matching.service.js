import mongoose from "mongoose"
import { Profile } from "../models/Profile.js"
import { PartnerPreference } from "../models/PartnerPreference.js"
import { Block } from "../models/Block.js"
import { Interest } from "../models/Interest.js"
import { PAGINATION_DEFAULTS } from "../constants/index.js"

/**
 * Calculate age from date of birth
 * @param {Date} dateOfBirth
 * @returns {number|null}
 */
const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    return Math.floor(
        (Date.now() - new Date(dateOfBirth).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25)
    )
}

class MatchingService {
    /**
     * Find matches for a profile based on partner preferences
     * @param {string} profileId
     * @param {object} options - Pagination
     * @returns {Promise<object>}
     */
    async findMatches(profileId, options = {}) {
        const page = options.page || PAGINATION_DEFAULTS.PAGE
        const limit = Math.min(
            options.limit || PAGINATION_DEFAULTS.LIMIT,
            PAGINATION_DEFAULTS.MAX_LIMIT
        )

        const profile = await Profile.findById(profileId)
        if (!profile) throw new Error("Profile not found")

        // Run independent queries in parallel
        const [preferences, blocked, interests] = await Promise.all([
            PartnerPreference.findOne({ profileId }),
            Block.find({
                $or: [
                    { blockerProfileId: profileId },
                    { blockedProfileId: profileId },
                ],
            }),
            Interest.find({
                $or: [
                    { senderProfileId: profileId },
                    { receiverProfileId: profileId },
                ],
            }).select("senderProfileId receiverProfileId -_id"),
        ])
        const blockedIds = blocked.map((b) =>
            b.blockerProfileId.toString() === profileId
                ? b.blockedProfileId
                : b.blockerProfileId
        )

        const interestedIds = interests.map((i) =>
            i.senderProfileId.toString() === profileId
                ? i.receiverProfileId
                : i.senderProfileId
        )

        // Build match query
        const query = {
            _id: { $ne: profileId, $nin: [...blockedIds, ...interestedIds] },
        }

        // Gender filter - prefer partner preference gender, fallback to opposite
        if (preferences?.gender) {
            query.gender = preferences.gender
        } else if (profile.gender === "male") {
            query.gender = "female"
        } else if (profile.gender === "female") {
            query.gender = "male"
        }

        // Apply preference filters
        if (preferences) {
            if (preferences.religion && preferences.religion !== "Any" && preferences.religion !== "No Preference") {
                query.religion = preferences.religion
            }
            if (preferences.caste && preferences.caste !== "No Preference" && preferences.caste !== "Any") {
                query.caste = preferences.caste
            }
            if (preferences.maritalStatus && preferences.maritalStatus.length > 0) {
                query.maritalStatus = { $in: preferences.maritalStatus }
            }
            if (preferences.locations && preferences.locations.length > 0) {
                const locRegexes = preferences.locations
                    .map((l) => (typeof l === "string" ? l.trim() : ""))
                    .filter(Boolean)
                    .map((l) => new RegExp(l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
                if (locRegexes.length > 0) {
                    query.$or = [
                        { "location.city": { $in: locRegexes } },
                        { "location.state": { $in: locRegexes } },
                    ]
                }
            } else if (preferences.location) {
                const locs = preferences.location.split(",").map((l) => l.trim()).filter(Boolean)
                if (locs.length > 0) {
                    const locRegexes = locs.map((l) => new RegExp(l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))
                    query.$or = [
                        { "location.city": { $in: locRegexes } },
                        { "location.state": { $in: locRegexes } },
                    ]
                }
            }

            // Age filter
            if (preferences.ageMin || preferences.ageMax) {
                const now = new Date()
                if (preferences.ageMax) {
                    query.dateOfBirth = {
                        $gte: new Date(
                            now.getFullYear() - preferences.ageMax,
                            now.getMonth(),
                            now.getDate()
                        ),
                    }
                }
                if (preferences.ageMin) {
                    query.dateOfBirth = {
                        ...query.dateOfBirth,
                        $lte: new Date(
                            now.getFullYear() - preferences.ageMin,
                            now.getMonth(),
                            now.getDate()
                        ),
                    }
                }
            }

            // Height filter
            if (preferences.heightMinCm || preferences.heightMaxCm) {
                query.heightCm = {}
                if (preferences.heightMinCm) query.heightCm.$gte = preferences.heightMinCm
                if (preferences.heightMaxCm) query.heightCm.$lte = preferences.heightMaxCm
            }
        }

        const skip = (page - 1) * limit
        const fetchLimit = Math.max(skip + limit * 3, 100)

        let [allCandidates, total] = await Promise.all([
            Profile.find(query)
                .sort({ createdAt: -1 })
                .limit(fetchLimit)
                .populate("userId", "name avatar")
                .lean(),
            Profile.countDocuments(query),
        ])

        // Fallback: If 0 candidates found because user interacted with all, relax interest exclusion
        if (allCandidates.length === 0) {
            const fallbackQuery = {
                _id: { $ne: profileId, $nin: blockedIds },
            }
            if (query.gender) fallbackQuery.gender = query.gender

            const [fallbackCandidates, fallbackTotal] = await Promise.all([
                Profile.find(fallbackQuery)
                    .sort({ createdAt: -1 })
                    .limit(fetchLimit)
                    .populate("userId", "name avatar")
                    .lean(),
                Profile.countDocuments(fallbackQuery),
            ])
            allCandidates = fallbackCandidates
            total = fallbackTotal
        }

        // Filter out invalid/orphan records and deduplicate candidates by unique user/profile ID
        const seenCandidateIds = new Set()
        const validCandidates = []
        for (const c of allCandidates) {
            if (!c) continue
            const cId = c._id?.toString()
            const uId = c.userId?._id?.toString() || c.userId?.toString() || cId
            if (!uId || seenCandidateIds.has(uId) || seenCandidateIds.has(cId)) continue
            seenCandidateIds.add(uId)
            seenCandidateIds.add(cId)
            validCandidates.push(c)
        }

        const candidatesWithScore = validCandidates.map((match) => ({
            ...match,
            name: match.name || match.userId?.name || "MeriJodi Member",
            age: calculateAge(match.dateOfBirth),
            isPhotoHidden: !!match.isPhotoHidden,
            photos: match.isPhotoHidden ? [] : match.photos,
            compatibilityScore: this._calculateCompatibility(
                profile,
                { ...match, age: calculateAge(match.dateOfBirth) },
                preferences
            ),
        }))

        // Sort by option or compatibility score (descending)
        if (options.sort === "recent" || options.sort === "newly_joined") {
            candidatesWithScore.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        } else if (options.sort === "age_asc") {
            candidatesWithScore.sort((a, b) => (a.age || 99) - (b.age || 99))
        } else if (options.sort === "age_desc") {
            candidatesWithScore.sort((a, b) => (b.age || 0) - (a.age || 0))
        } else {
            candidatesWithScore.sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        }

        // Paginate after sorting
        const matches = candidatesWithScore.slice(skip, skip + limit)

        return {
            matches,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    }

    /**
     * Calculate compatibility score between two profiles
     * @param {object} userProfile - Current user's profile
     * @param {object} matchProfile - Potential match's profile
     * @param {object} preferences - User's partner preferences
     * @returns {number} Score from 0-100
     */
    _calculateCompatibility(userProfile, matchProfile, preferences) {
        let score = 0
        let maxScore = 0

        // Religion match (20 points)
        maxScore += 20
        if (preferences?.religion === "Any" || preferences?.religion === "No Preference") {
            score += 20
        } else if (preferences?.religion && matchProfile.religion) {
            if (preferences.religion.toLowerCase() === matchProfile.religion.toLowerCase()) score += 20
        } else if (userProfile.religion && matchProfile.religion && userProfile.religion.toLowerCase() === matchProfile.religion.toLowerCase()) {
            score += 15
        } else {
            score += 10
        }

        // Caste match (15 points)
        maxScore += 15
        if (preferences?.caste === "No Preference" || preferences?.caste === "Any" || !preferences?.caste) {
            score += 15 // No preference means free matching without caste constraints or penalty
        } else if (preferences?.caste && matchProfile.caste) {
            if (preferences.caste.toLowerCase() === matchProfile.caste.toLowerCase()) score += 15
            else score += 5
        } else if (userProfile.caste && matchProfile.caste && userProfile.caste.toLowerCase() === matchProfile.caste.toLowerCase()) {
            score += 12
        } else {
            score += 7.5
        }

        // Location match (15 points)
        maxScore += 15
        const candidateCity = (matchProfile.location?.city || "").toLowerCase()
        const candidateState = (matchProfile.location?.state || "").toLowerCase()
        const prefLocations = [
            ...(preferences?.locations || []),
            ...(preferences?.location ? preferences.location.split(",") : []),
        ].map((l) => (typeof l === "string" ? l.trim().toLowerCase() : "")).filter(Boolean)

        if (prefLocations.length > 0) {
            const matchesLocation = prefLocations.some(
                (loc) => candidateCity.includes(loc) || loc.includes(candidateCity) || candidateState.includes(loc) || loc.includes(candidateState)
            )
            if (matchesLocation) {
                score += 15
            } else {
                score += 5
            }
        } else if (userProfile.location?.city && candidateCity && (userProfile.location.city.toLowerCase() === candidateCity || candidateCity.includes(userProfile.location.city.toLowerCase()))) {
            score += 12
        } else {
            score += 7.5
        }

        // Age preference (15 points)
        maxScore += 15
        if (preferences?.ageMin || preferences?.ageMax) {
            const matchAge = matchProfile.age
            if (matchAge) {
                const min = preferences.ageMin || 18
                const max = preferences.ageMax || 80
                if (matchAge >= min && matchAge <= max) score += 15
            }
        } else {
            score += 10
        }

        // Education match (10 points)
        maxScore += 10
        if (preferences?.education && matchProfile.education?.highestDegree) {
            if (preferences.education === matchProfile.education.highestDegree) {
                score += 10
            }
        } else {
            score += 5
        }

        // Lifestyle / Diet match (10 points)
        maxScore += 10
        if (preferences?.diet && matchProfile.lifestyle?.diet) {
            if (preferences.diet === matchProfile.lifestyle.diet) score += 10
        } else {
            score += 5
        }

        // Marital status match (10 points)
        maxScore += 10
        if (preferences?.maritalStatus?.length > 0 && matchProfile.maritalStatus) {
            if (preferences.maritalStatus.includes(matchProfile.maritalStatus)) {
                score += 10
            }
        } else {
            score += 8
        }

        return Math.round((score / maxScore) * 100)
    }
}

export default new MatchingService()
