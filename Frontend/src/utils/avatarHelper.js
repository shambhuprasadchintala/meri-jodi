import defaultAvatar from "../assets/default-avatar.svg"

/**
 * Returns the default Instagram-style avatar SVG
 */
export const getDefaultAvatar = () => defaultAvatar

/**
 * Safely resolves a profile's display image, falling back to the Instagram-style avatar
 * if no custom photo has been uploaded or if photos are hidden.
 */
export const getProfileImageUrl = (profile) => {
  if (!profile) return defaultAvatar
  if (profile.isPhotoHidden) return defaultAvatar

  // If photos array exists and has at least one valid photo
  if (Array.isArray(profile.photos) && profile.photos.length > 0) {
    const primary = profile.photos.find((p) => p && p.isPrimary && p.url)
    if (primary?.url) return primary.url
    const first = profile.photos.find((p) => p && p.url)
    if (first?.url) return first.url
  }

  // If user object avatar is present
  if (profile.userId && typeof profile.userId === "object" && profile.userId.avatar) {
    return profile.userId.avatar
  }

  if (profile.avatar) {
    return profile.avatar
  }

  return defaultAvatar
}

/**
 * Safely resolves a user's avatar image
 */
export const getUserAvatarUrl = (user) => {
  if (!user) return defaultAvatar
  if (user.avatar) return user.avatar
  if (user.photos && Array.isArray(user.photos) && user.photos.length > 0) {
    return user.photos[0]?.url || defaultAvatar
  }
  return defaultAvatar
}

export default defaultAvatar
