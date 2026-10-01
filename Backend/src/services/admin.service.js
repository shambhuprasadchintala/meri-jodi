import mongoose from "mongoose"
import { User } from "../models/User.js"
import { Profile } from "../models/Profile.js"
import { Verification } from "../models/Verification.js"
import { Report } from "../models/Report.js"
import { Interest } from "../models/Interest.js"
import { Message } from "../models/Message.js"
import { PartnerPreference } from "../models/PartnerPreference.js"
import { Notification } from "../models/Notification.js"
import { Shortlist } from "../models/Shortlist.js"
import { Block } from "../models/Block.js"
import { Subscription } from "../models/Subscription.js"
import { USER_STATUS, ROLES, NOTIFICATION_TYPE, PAGINATION_DEFAULTS } from "../constants/index.js"
import { redisClient } from "../config/redis.js"
import { revokeRefreshToken } from "../config/generateToken.js"

class AdminService {
    /**
     * Get platform overview KPIs and dynamic statistics
     */
    async getDashboardStats() {
        const [
            totalUsers,
            activeUsers,
            bannedUsers,
            totalProfiles,
            verifiedProfiles,
            pendingVerifications,
            totalVerifications,
            pendingReports,
            totalReports,
            totalInterests,
            acceptedInterests,
            totalMessages,
            maleProfiles,
            femaleProfiles,
            recentUsers,
            recentVerifications,
            recentReports,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ status: USER_STATUS.ACTIVE }),
            User.countDocuments({ status: USER_STATUS.BANNED }),
            Profile.countDocuments(),
            Profile.countDocuments({ isVerified: true }),
            Verification.countDocuments({ status: { $in: ["submitted", "under_review"] } }),
            Verification.countDocuments(),
            Report.countDocuments({ status: "pending" }),
            Report.countDocuments(),
            Interest.countDocuments(),
            Interest.countDocuments({ status: "accepted" }),
            Message.countDocuments(),
            Profile.countDocuments({ gender: "male" }),
            Profile.countDocuments({ gender: "female" }),
            User.find()
                .sort({ createdAt: -1 })
                .limit(6)
                .select("name email phone role status isEmailVerified isPhoneVerified createdAt lastLogin"),
            Verification.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("profileId", "name gender location photos"),
            Report.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("reporterProfileId", "name")
                .populate("reportedProfileId", "name"),
        ])

        // Attach profile data to recent users
        const recentUsersWithProfiles = await Promise.all(
            recentUsers.map(async (u) => {
                const profile = await Profile.findOne({ userId: u._id }).select(
                    "gender location profileCompletionPct isVerified photos"
                )
                return {
                    ...u.toObject(),
                    profile: profile || null,
                }
            })
        )

        return {
            counts: {
                totalUsers,
                activeUsers,
                bannedUsers,
                totalProfiles,
                verifiedProfiles,
                pendingVerifications,
                totalVerifications,
                pendingReports,
                totalReports,
                totalInterests,
                acceptedInterests,
                totalMessages,
            },
            demographics: {
                male: maleProfiles,
                female: femaleProfiles,
                other: Math.max(0, totalProfiles - maleProfiles - femaleProfiles),
            },
            recentActivity: {
                users: recentUsersWithProfiles,
                verifications: recentVerifications,
                reports: recentReports,
            },
            systemHealth: {
                status: "operational",
                database: "connected",
                timestamp: new Date(),
            },
        }
    }

    /**
     * Get paginated users directory with advanced cross-model filtering and search
     */
    async getUsers(options = {}) {
        const page = Math.max(1, parseInt(options.page, 10) || PAGINATION_DEFAULTS.PAGE)
        const limit = Math.min(
            Math.max(1, parseInt(options.limit, 10) || PAGINATION_DEFAULTS.LIMIT),
            100
        )
        const skip = (page - 1) * limit
        const { search, status, role, isVerified, gender, sortBy = "createdAt", sortOrder = "desc" } = options

        const matchConditions = []

        if (status && Object.values(USER_STATUS).includes(status)) {
            matchConditions.push({ status })
        }
        if (role && Object.values(ROLES).includes(role)) {
            matchConditions.push({ role })
        }

        if (isVerified !== undefined && isVerified !== "" && isVerified !== "all") {
            const verifiedBool = isVerified === "true" || isVerified === true
            matchConditions.push({ "profile.isVerified": verifiedBool })
        }
        if (gender && gender !== "all") {
            matchConditions.push({ "profile.gender": gender.toLowerCase() })
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i")
            matchConditions.push({
                $or: [
                    { name: regex },
                    { email: regex },
                    { phone: regex },
                    { "profile.name": regex },
                    { "profile.location.city": regex },
                    { "profile.location.state": regex },
                    { "profile.career.occupation": regex },
                    { "profile.religion": regex },
                    { "profile.caste": regex },
                ],
            })
        }

        const matchStage = matchConditions.length > 0 ? { $match: { $and: matchConditions } } : { $match: {} }

        const sortDirection = sortOrder === "asc" ? 1 : -1
        const sortField = sortBy === "name" ? "name" : sortBy === "lastLogin" ? "lastLogin" : "createdAt"

        const pipeline = [
            {
                $lookup: {
                    from: "profiles",
                    localField: "_id",
                    foreignField: "userId",
                    as: "profile",
                },
            },
            {
                $unwind: {
                    path: "$profile",
                    preserveNullAndEmptyArrays: true,
                },
            },
            matchStage,
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $sort: { [sortField]: sortDirection } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $project: {
                                _id: 1,
                                name: { $ifNull: ["$name", "$profile.name", "MeriJodi Member"] },
                                email: 1,
                                phone: 1,
                                avatar: 1,
                                role: 1,
                                status: 1,
                                isEmailVerified: 1,
                                isPhoneVerified: 1,
                                lastLogin: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                profile: 1,
                                isVerified: { $ifNull: ["$profile.isVerified", false] },
                                profileCompletionPct: { $ifNull: ["$profile.profileCompletionPct", 0] },
                                gender: { $ifNull: ["$profile.gender", "—"] },
                                location: "$profile.location",
                                career: "$profile.career",
                            },
                        },
                    ],
                },
            },
        ]

        const [aggregationResult] = await User.aggregate(pipeline)
        const total = aggregationResult?.metadata?.[0]?.total || 0
        const users = aggregationResult?.data || []

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        }
    }

    /**
     * Get single user's detailed dossier
     */
    async getUserById(userId) {
        const user = await User.findById(userId)
        if (!user) {
            const error = new Error("User not found")
            error.statusCode = 404
            throw error
        }

        const profile = await Profile.findOne({ userId })
        const profileId = profile?._id
        const preferences = profileId ? await PartnerPreference.findOne({ profileId }) : null

        const [verifications, reportsAgainst, reportsBy, subscriptions] = await Promise.all([
            profileId ? Verification.find({ profileId }).sort({ createdAt: -1 }) : [],
            profileId ? Report.find({ reportedProfileId: profileId }).sort({ createdAt: -1 }) : [],
            profileId ? Report.find({ reporterProfileId: profileId }).sort({ createdAt: -1 }) : [],
            Subscription.find({ userId }).sort({ createdAt: -1 }),
        ])

        const now = new Date()
        const activeSubscription = subscriptions.find(
            (s) => s.status === "active" && (!s.expiryDate || new Date(s.expiryDate) > now)
        ) || null

        return {
            user: {
                ...user.toAuthJSON(),
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLogin: user.lastLogin,
            },
            profile,
            preferences,
            verifications,
            reportsAgainst,
            reportsBy,
            subscriptions,
            subscriptionHistory: subscriptions,
            activeSubscription,
        }
    }

    /**
     * Update user status (active, inactive, banned)
     */
    async updateUserStatus(userId, status) {
        if (!Object.values(USER_STATUS).includes(status)) {
            const error = new Error(`Invalid status: ${status}`)
            error.statusCode = 400
            throw error
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { status, updatedAt: new Date() },
            { returnDocument: "after" }
        )

        if (!user) {
            const error = new Error("User not found")
            error.statusCode = 404
            throw error
        }

        // Invalidate Redis user cache
        await redisClient.del(`user:${userId}`)

        // If banned, revoke refresh token sessions
        if (status === USER_STATUS.BANNED) {
            await revokeRefreshToken(userId).catch(() => {})
        }

        return {
            ...user.toAuthJSON(),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLogin: user.lastLogin,
        }
    }

    /**
     * Update user role (user, admin)
     */
    async updateUserRole(userId, role) {
        if (!Object.values(ROLES).includes(role)) {
            const error = new Error(`Invalid role: ${role}`)
            error.statusCode = 400
            throw error
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role, updatedAt: new Date() },
            { returnDocument: "after" }
        )

        if (!user) {
            const error = new Error("User not found")
            error.statusCode = 404
            throw error
        }

        await redisClient.del(`user:${userId}`)
        return {
            ...user.toAuthJSON(),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLogin: user.lastLogin,
        }
    }

    /**
     * Toggle or set user profile verification badge
     */
    async toggleUserVerification(userId, isVerified) {
        const verifiedVal = Boolean(isVerified)

        const user = await User.findById(userId)
        if (!user) {
            const error = new Error("User not found")
            error.statusCode = 404
            throw error
        }

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { 
                userId,
                name: user.name,
                gender: user.gender || "male",
                isVerified: verifiedVal, 
                updatedAt: new Date() 
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        )

        // Send a real-time system notification
        await Notification.create({
            userId,
            type: NOTIFICATION_TYPE.SYSTEM,
            message: verifiedVal
                ? "Congratulations! Your profile has been granted the Verified Member badge."
                : "Your profile verification status has been updated by administration.",
        }).catch(() => {})

        return profile
    }

    /**
     * Permanently delete user and all associated documents
     */
    async deleteUser(userId) {
        const user = await User.findById(userId)
        if (!user) {
            const error = new Error("User not found")
            error.statusCode = 404
            throw error
        }

        const profile = await Profile.findOne({ userId })
        const profileId = profile?._id

        await Promise.all([
            User.findByIdAndDelete(userId),
            Profile.findOneAndDelete({ userId }),
            profileId ? PartnerPreference.findOneAndDelete({ profileId }) : Promise.resolve(),
            Notification.deleteMany({ userId }),
            profileId ? Verification.deleteMany({ profileId }) : Promise.resolve(),
            profileId ? Report.deleteMany({ $or: [{ reporterProfileId: profileId }, { reportedProfileId: profileId }] }) : Promise.resolve(),
            profileId ? Interest.deleteMany({ $or: [{ senderProfileId: profileId }, { receiverProfileId: profileId }] }) : Promise.resolve(),
            profileId ? Message.deleteMany({ $or: [{ senderProfileId: profileId }, { receiverProfileId: profileId }] }) : Promise.resolve(),
            profileId ? Shortlist.deleteMany({ $or: [{ profileId }, { shortlistedProfileId: profileId }] }) : Promise.resolve(),
            profileId ? Block.deleteMany({ $or: [{ blockerProfileId: profileId }, { blockedProfileId: profileId }] }) : Promise.resolve(),
            redisClient.del(`user:${userId}`),
            revokeRefreshToken(userId).catch(() => {}),
        ])

        return { message: "User and associated data permanently removed." }
    }

    /**
     * Admin direct update of a user and their profile dossier
     */
    async updateUserProfile(userId, data = {}) {
        const user = await User.findById(userId)
        if (!user) {
            const error = new Error("User not found")
            error.statusCode = 404
            throw error
        }

        // 1. Update core user fields if provided
        if (data.name !== undefined) user.name = data.name.trim()
        if (data.phone !== undefined) user.phone = data.phone.trim()
        if (data.status && Object.values(USER_STATUS).includes(data.status)) user.status = data.status
        if (data.role && Object.values(ROLES).includes(data.role)) user.role = data.role
        user.updatedAt = new Date()
        await user.save()

        // 2. Update profile fields
        let profile = await Profile.findOne({ userId })
        if (!profile) {
            profile = new Profile({ userId, name: user.name, gender: user.gender || "male" })
        }

        const allowedDirect = [
            "name", "dateOfBirth", "timeOfBirth", "placeOfBirth", "motherTongue",
            "gender", "aboutMe", "heightCm", "religion", "caste", "subCaste",
            "gotham", "rashi", "nakshtra", "manglik", "complexion", "maritalStatus",
            "isVerified"
        ]

        allowedDirect.forEach((field) => {
            if (data[field] !== undefined) {
                profile[field] = data[field]
            }
        })

        // Nested objects
        if (data.location) {
            profile.location = { ...(profile.location?.toObject?.() || profile.location || {}), ...data.location }
        }
        if (data.education) {
            profile.education = { ...(profile.education?.toObject?.() || profile.education || {}), ...data.education }
        }
        if (data.career) {
            profile.career = { ...(profile.career?.toObject?.() || profile.career || {}), ...data.career }
        }
        if (data.family) {
            const fam = { ...data.family }
            if (fam.familyValues && typeof fam.familyValues === "string") {
                fam.familyValues = fam.familyValues.toLowerCase()
            }
            if (fam.familyType && typeof fam.familyType === "string") {
                fam.familyType = fam.familyType.toLowerCase()
            }
            if (fam.familyAffluence && typeof fam.familyAffluence === "string") {
                fam.familyAffluence = fam.familyAffluence.toLowerCase()
            }
            profile.family = { ...(profile.family?.toObject?.() || profile.family || {}), ...fam }
        }
        if (data.lifestyle) {
            profile.lifestyle = { ...(profile.lifestyle?.toObject?.() || profile.lifestyle || {}), ...data.lifestyle }
        }

        // Calculate profile completion percentage
        let score = 0
        if (profile.name) score += 10
        if (profile.dateOfBirth) score += 10
        if (profile.gender) score += 5
        if (profile.religion && profile.caste) score += 15
        if (profile.location?.city) score += 10
        if (profile.education?.highestDegree) score += 10
        if (profile.career?.occupation) score += 10
        if (profile.aboutMe && profile.aboutMe.length > 20) score += 10
        if (profile.family?.familyType || profile.family?.fatherOccupation) score += 10
        if (profile.photos && profile.photos.length > 0) score += 10
        profile.profileCompletionPct = Math.min(100, score)

        profile.updatedAt = new Date()
        await profile.save()

        // Invalidate Redis user cache
        await redisClient.del(`user:${userId}`)

        return {
            user: {
                ...user.toAuthJSON(),
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLogin: user.lastLogin,
            },
            profile,
        }
    }

    /**
     * Get user's subscription records
     */
    async getUserSubscriptions(userId) {
        const user = await User.findById(userId)
        if (!user) {
            const error = new Error("User not found")
            error.statusCode = 404
            throw error
        }

        const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 })
        const now = new Date()
        const activeSubscription = subscriptions.find(
            (s) => s.status === "active" && (!s.expiryDate || new Date(s.expiryDate) > now)
        ) || null

        return {
            subscriptions,
            activeSubscription,
        }
    }

    /**
     * Assign or create a subscription plan for a user
     */
    async addUserSubscription(userId, data = {}) {
        const user = await User.findById(userId)
        if (!user) {
            const error = new Error("User not found")
            error.statusCode = 404
            throw error
        }

        const planId = data.planId || data.plan || "premium"
        const planName = data.planName || (typeof planId === "string" ? planId.charAt(0).toUpperCase() + planId.slice(1) + " Plan" : "Premium Plan")
        const amount = data.amount || 1999
        const currency = data.currency || "INR"
        const billingCycle = data.billingCycle || "annual"
        const paymentMethod = data.paymentMethod || "Admin Assigned"
        const transactionId = data.transactionId || `ADMIN-MANUAL-${Date.now()}`
        const autoRenew = data.autoRenew || false
        const notes = data.notes || "Plan assigned via Admin Console"
        const durationDays = data.durationDays || (data.durationMonths ? Number(data.durationMonths) * 30 : 365)

        const startDate = data.startDate ? new Date(data.startDate) : new Date()
        let expiryDate = data.expiryDate ? new Date(data.expiryDate) : null
        if (!expiryDate && durationDays) {
            expiryDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
        }

        // If newly created plan is active, mark all previous active subscriptions as expired
        await Subscription.updateMany(
            { userId, status: "active" },
            { $set: { status: "expired" } }
        )

        const subscription = await Subscription.create({
            userId,
            planName,
            planId,
            amount,
            currency,
            status: "active",
            billingCycle,
            startDate,
            expiryDate,
            nextBillingDate: autoRenew ? expiryDate : null,
            autoRenew,
            paymentMethod,
            transactionId,
            notes,
        })

        // Send a notification to the user
        await Notification.create({
            userId,
            type: NOTIFICATION_TYPE.SYSTEM,
            message: `Your membership has been updated to ${planName}. Valid until ${expiryDate ? expiryDate.toLocaleDateString("en-IN") : "Lifetime"}.`,
        }).catch(() => {})

        return subscription
    }

    /**
     * Update an existing subscription status
     */
    async updateSubscriptionStatus(subId, status) {
        const sub = await Subscription.findByIdAndUpdate(
            subId,
            { status, updatedAt: new Date() },
            { returnDocument: "after" }
        )
        if (!sub) {
            const error = new Error("Subscription record not found")
            error.statusCode = 404
            throw error
        }
        return sub
    }

    /**
     * Get Admin Profile Details
     */
    async getAdminProfile(adminId) {
        const admin = await User.findById(adminId)
        if (!admin) {
            const error = new Error("Administrator account not found")
            error.statusCode = 404
            throw error
        }

        return {
            ...admin.toAuthJSON(),
            createdAt: admin.createdAt,
            lastLogin: admin.lastLogin,
        }
    }

    /**
     * Update Admin Personal Information
     */
    async updateAdminProfile(adminId, { name, email, phone, avatar }) {
        const admin = await User.findById(adminId)
        if (!admin) {
            const error = new Error("Administrator account not found")
            error.statusCode = 404
            throw error
        }

        if (name) admin.name = name.trim()
        if (email) admin.email = email.toLowerCase().trim()
        if (phone) admin.phone = phone.trim()
        if (avatar !== undefined) admin.avatar = avatar
        admin.updatedAt = new Date()

        await admin.save()
        await redisClient.del(`user:${adminId}`)

        return {
            ...admin.toAuthJSON(),
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
        }
    }

    /**
     * Update Admin Password
     */
    async updateAdminPassword(adminId, { currentPassword, newPassword }) {
        if (!currentPassword || !newPassword) {
            const error = new Error("Current and new passwords are both required")
            error.statusCode = 400
            throw error
        }

        if (newPassword.length < 6) {
            const error = new Error("New password must be at least 6 characters long")
            error.statusCode = 400
            throw error
        }

        const admin = await User.findById(adminId)
        if (!admin) {
            const error = new Error("Administrator account not found")
            error.statusCode = 404
            throw error
        }

        const isMatch = await admin.validatePassword(currentPassword)
        if (!isMatch) {
            const error = new Error("Current password is incorrect")
            error.statusCode = 400
            throw error
        }

        await admin.setPassword(newPassword)
        admin.updatedAt = new Date()
        await admin.save()

        await redisClient.del(`user:${adminId}`)

        return { message: "Administrator password updated successfully" }
    }

    /**
     * Get System Health & Diagnostics
     */
    async getHealth() {
        const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected"
        let redisStatus = "connected"
        try {
            await redisClient.ping()
        } catch {
            redisStatus = "in-memory / fallback"
        }

        return {
            status: "healthy",
            uptime: process.uptime(),
            database: { status: dbStatus, host: mongoose.connection.host, name: mongoose.connection.name },
            redis: { status: redisStatus },
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            timestamp: new Date(),
        }
    }

    /**
     * Get Platform Activity Logs
     */
    async getActivityLogs(options = {}) {
        const page = parseInt(options.page) || 1
        const limit = parseInt(options.limit) || 20
        const skip = (page - 1) * limit

        const [recentUsers, recentVerifs, recentReports, recentSubs] = await Promise.all([
            User.find().sort({ createdAt: -1 }).limit(10).lean(),
            Verification.find().sort({ updatedAt: -1 }).limit(10).populate("profileId", "name").lean(),
            Report.find().sort({ updatedAt: -1 }).limit(10).populate("reporterProfileId reportedProfileId", "name").lean(),
            Subscription.find().sort({ createdAt: -1 }).limit(10).populate("userId", "name email").lean(),
        ])

        const logs = []
        for (const u of recentUsers) {
            logs.push({
                id: `user-${u._id}`,
                action: "USER_REGISTRATION",
                description: `New user registered: ${u.name || u.email}`,
                timestamp: u.createdAt,
                user: { id: u._id, name: u.name, email: u.email },
            })
        }
        for (const v of recentVerifs) {
            logs.push({
                id: `verif-${v._id}`,
                action: "VERIFICATION_STATUS",
                description: `Verification status updated to ${v.status} for ${v.profileId?.name || "User"}`,
                timestamp: v.updatedAt || v.createdAt,
                status: v.status,
            })
        }
        for (const r of recentReports) {
            logs.push({
                id: `rep-${r._id}`,
                action: "REPORT_FILED",
                description: `Report filed by ${r.reporterProfileId?.name || "Anonymous"}: ${r.reason}`,
                timestamp: r.createdAt,
                status: r.status,
            })
        }
        for (const s of recentSubs) {
            logs.push({
                id: `sub-${s._id}`,
                action: "SUBSCRIPTION_ASSIGNED",
                description: `Plan '${s.plan}' assigned to ${s.userId?.name || s.userId?.email || "User"}`,
                timestamp: s.createdAt,
                plan: s.plan,
            })
        }

        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        const pagedLogs = logs.slice(skip, skip + limit)

        return {
            logs: pagedLogs,
            pagination: {
                page,
                limit,
                total: logs.length,
                totalPages: Math.ceil(logs.length / limit),
            },
        }
    }

    /**
     * Get Platform Settings
     */
    async getSettings() {
        const cached = await redisClient.get("platform:settings")
        if (cached) {
            try {
                return JSON.parse(cached)
            } catch (_) {}
        }
        return {
            platformName: "MeriJodi Matrimonial Portal",
            supportEmail: "support@merijodi.com",
            contactPhone: "+91 98765 43210",
            maintenanceMode: false,
            allowRegistrations: true,
            requireEmailVerification: true,
            autoApproveProfiles: false,
            maxPhotosPerProfile: 6,
            freeDailyMatchesLimit: 20,
        }
    }

    /**
     * Update Platform Settings
     */
    async updateSettings(data) {
        const current = await this.getSettings()
        const updated = { ...current, ...data, updatedAt: new Date() }
        await redisClient.set("platform:settings", JSON.stringify(updated))
        return updated
    }
}

const adminService = new AdminService()
export { adminService }
export default adminService
