export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE: 422,
    TOO_LARGE: 413,
    INTERNAL: 500,
}

export const ROLES = {
    USER: "user",
    ADMIN: "admin",
}

export const USER_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    BANNED: "banned",
    PENDING_APPROVAL: "pending_approval",
    PENDING_VERIFICATION: "pending_verification",
    DECLINED: "declined",
}

export const GENDER = {
    MALE: "male",
    FEMALE: "female",
    OTHER: "other",
}

export const MARITAL_STATUS = {
    NEVER_MARRIED: "never_married",
    DIVORCED: "divorced",
    WIDOWED: "widowed",
    AWAITING_DIVORCE: "awaiting_divorce",
}

export const FAMILY_TYPE = {
    JOINT: "joint",
    NUCLEAR: "nuclear",
    EXTENDED: "extended",
}

export const FAMILY_VALUES = {
    TRADITIONAL: "traditional",
    MODERATE: "moderate",
    LIBERAL: "liberal",
}

export const FAMILY_AFFLUENCE = {
    AFFLUENT: "affluent",
    UPPER_MIDDLE: "upper_middle",
    MIDDLE: "middle",
    LOWER_MIDDLE: "lower_middle",
}

export const PROFILE_CREATED_BY = {
    SELF: "self",
    PARENT: "parent",
    SIBLING: "sibling",
    FRIEND: "friend",
}

export const INTEREST_STATUS = {
    PENDING: "pending",
    ACCEPTED: "accepted",
    DECLINED: "declined",
    WITHDRAWN: "withdrawn",
}

export const NOTIFICATION_TYPE = {
    NEW_INTEREST: "new_interest",
    INTEREST_ACCEPTED: "interest_accepted",
    NEW_MESSAGE: "new_message",
    PROFILE_VIEW: "profile_view",
    SHORTLISTED: "shortlisted",
    SYSTEM: "system",
}

export const REPORT_REASON = {
    FAKE_PROFILE: "fake_profile",
    INAPPROPRIATE_CONTENT: "inappropriate_content",
    HARASSMENT: "harassment",
    SPAM: "spam",
    OTHER: "other",
}

export const REPORT_STATUS = {
    PENDING: "pending",
    REVIEWED: "reviewed",
    RESOLVED: "resolved",
    DISMISSED: "dismissed",
}

export const VERIFICATION_DOC_TYPE = {
    AADHAAR: "aadhaar",
    PAN: "pan",
    PASSPORT: "passport",
    DRIVING_LICENSE: "driving_license",
    VOTER_ID: "voter_id",
}

export const VERIFICATION_STATUS = {
    SUBMITTED: "submitted",
    UNDER_REVIEW: "under_review",
    VERIFIED: "verified",
    APPROVED: "approved",
    REJECTED: "rejected",
}

export const HOBBIES_LIST = [
    "acting",
    "adventure_sports",
    "art_handicraft",
    "astrology",
    "baking",
    "bike_car_enthusiast",
    "blogging",
    "board_games",
    "book_clubs",
    "cooking",
    "cricket",
    "cycling",
    "dancing",
    "diy_crafts",
    "fitness_gym",
    "gardening",
    "gaming",
    "hiking_trekking",
    "movies_cinema",
    "music_listening",
    "music_instruments",
    "painting",
    "pets_animals",
    "photography",
    "podcasts",
    "reading",
    "running",
    "singing",
    "swimming",
    "theater",
    "traveling",
    "volunteering_social_work",
    "writing",
    "yoga_meditation",
]

export const PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 50,
}
