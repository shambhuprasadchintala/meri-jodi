import { Profile } from "../models/Profile.js"
import { User } from "../models/User.js"
import { deleteFromCloudinary } from "../config/cloudinary.js"

class PhotoService {
    /**
     * Upload a photo to Cloudinary and add to profile
     * @param {string} userId
     * @param {object} file - Multer file object
     * @param {object} options - { isPrimary, isVisibleToAll }
     * @returns {Promise<object>} Updated profile
     */
    async upload(userId, file, options = {}) {
        let profile = await Profile.findOne({ userId })
        if (!profile) {
            const user = await User.findById(userId)
            profile = await Profile.create({
                userId,
                name: user?.name,
                gender: user?.gender || "female",
                photos: [],
            })
        }

        // Limit to 6 photos
        if (profile.photos && profile.photos.length >= 6) {
            throw new Error("Maximum 6 photos allowed")
        }

        // If first photo, make it primary
        const isPrimary =
            (!profile.photos || profile.photos.length === 0) ? true : options.isPrimary || false

        if (!profile.photos) profile.photos = []

        // If setting as primary, unset other primary photos
        if (isPrimary) {
            profile.photos.forEach((p) => (p.isPrimary = false))
        }

        const photo = {
            url: file.secure_url || file.path,
            publicId: file.filename || file.public_id,
            isPrimary,
            isVisibleToAll: options.isVisibleToAll !== false,
            uploadedAt: new Date(),
        }

        profile.photos.push(photo)
        if (typeof profile.profileCompletionPct === "number") {
            profile.profileCompletionPct = Math.min(100, profile.profileCompletionPct + 10)
        }
        await profile.save()

        if (isPrimary) {
            await User.findByIdAndUpdate(userId, { avatar: photo.url })
        }

        return profile
    }

    /**
     * Delete a photo from profile
     * @param {string} userId
     * @param {string} photoId
     * @returns {Promise<object>} Updated profile
     */
    async delete(userId, photoId) {
        const profile = await Profile.findOne({ userId })
        if (!profile) throw new Error("Profile not found")

        const photoIndex = profile.photos.findIndex(
            (p) => p._id.toString() === photoId
        )
        if (photoIndex === -1) throw new Error("Photo not found")

        const photo = profile.photos[photoIndex]

        // Delete from Cloudinary
        if (photo.publicId) {
            await deleteFromCloudinary(photo.publicId).catch((err) =>
                console.error("Cloudinary deletion failed:", err.message)
            )
        }

        profile.photos.splice(photoIndex, 1)

        // If deleted photo was primary, set first remaining as primary
        if (photo.isPrimary && profile.photos.length > 0) {
            profile.photos[0].isPrimary = true
            await User.findByIdAndUpdate(userId, { avatar: profile.photos[0].url })
        } else if (profile.photos.length === 0) {
            await User.findByIdAndUpdate(userId, { avatar: null })
        }

        await profile.save()
        return profile
    }

    /**
     * Set a photo as primary
     * @param {string} userId
     * @param {string} photoId
     * @returns {Promise<object>} Updated profile
     */
    async setPrimary(userId, photoId) {
        const profile = await Profile.findOne({ userId })
        if (!profile) throw new Error("Profile not found")

        const photo = profile.photos.id(photoId)
        if (!photo) throw new Error("Photo not found")

        profile.photos.forEach((p) => (p.isPrimary = false))
        photo.isPrimary = true

        await profile.save()
        await User.findByIdAndUpdate(userId, { avatar: photo.url })
        return profile
    }
}

export default new PhotoService()
