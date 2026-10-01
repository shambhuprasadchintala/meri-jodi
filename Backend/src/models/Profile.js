import mongoose from "mongoose"
import { GENDER, MARITAL_STATUS, PROFILE_CREATED_BY, FAMILY_TYPE, FAMILY_VALUES, FAMILY_AFFLUENCE } from "../constants/index.js"
const { Schema, model } = mongoose

const educationSchema = new Schema(
    {
        highestDegree: String,
        fieldOfStudy: String,
        institution: String,
        graduationYear: Number,
    },
    { _id: false }
)

const careerSchema = new Schema(
    {
        occupation: String,
        companyName: String,
        industry: String,
        annualIncome: String,
        workLocation: String,
    },
    { _id: false }
)

const locationSchema = new Schema(
    {
        city: String,
        state: String,
        country: { type: String, default: "India" },
        pincode: String,
        willingToRelocate: { type: Boolean, default: false },
    },
    { _id: false }
)

const familySchema = new Schema(
    {
        fatherOccupation: String,
        motherOccupation: String,
        familyLocation: String,
        numBrothers: { type: Number, default: 0 },
        numSisters: { type: Number, default: 0 },
        familyType: { type: String, enum: Object.values(FAMILY_TYPE) },
        familyValues: {
            type: String,
            enum: Object.values(FAMILY_VALUES),
        },
        familyAffluence: {
            type: String,
            enum: Object.values(FAMILY_AFFLUENCE),
        },
    },
    { _id: false }
)

const lifestyleSchema = new Schema(
    {
        diet: String,
        smoking: { type: Boolean, default: false },
        drinking: { type: Boolean, default: false },
        habits: String,
        fitness: String,
    },
    { _id: false }
)

const profileSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        name: { type: String, trim: true },
        dateOfBirth: { type: Date },
        timeOfBirth: { type: String, trim: true },
        placeOfBirth: String,
        motherTongue: String,
        gender: {
            type: String,
            enum: Object.values(GENDER),
        },
        aboutMe: { type: String, trim: true },
        heightCm: Number,
        religion: String,
        caste: String,
        subCaste: String,
        gotham: String,
        rashi: String,
        nakshtra: String,
        manglik: String,
        complexion: String,
        maritalStatus: {
            type: String,
            enum: Object.values(MARITAL_STATUS),
            default: MARITAL_STATUS.NEVER_MARRIED,
        },
        location: locationSchema,
        education: educationSchema,
        career: careerSchema,
        family: familySchema,
        lifestyle: lifestyleSchema,
        hobbiesAndInterests: [{ type: String, trim: true }],
        photos: [
            {
                url: { type: String, required: true },
                publicId: { type: String },
                isPrimary: { type: Boolean, default: false },
                isVisibleToAll: { type: Boolean, default: true },
                uploadedAt: { type: Date, default: Date.now },
            },
        ],
        profileCompletionPct: { type: Number, default: 0 },
        isVerified: { type: Boolean, default: false },
        isPhotoHidden: { type: Boolean, default: false },
        createdBy: {
            type: String,
            enum: Object.values(PROFILE_CREATED_BY),
            default: PROFILE_CREATED_BY.SELF,
        },
        agreedToTerms: { type: Boolean, default: false },
        agreedToPrivacyPolicy: { type: Boolean, default: false },
        termsAgreedAt: Date,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
)

profileSchema.virtual("age").get(function () {
    if (!this.dateOfBirth) return null
    return Math.floor(
        (Date.now() - this.dateOfBirth.getTime()) /
            (1000 * 60 * 60 * 24 * 365.25)
    )
})

profileSchema.index({ religion: 1, caste: 1 })
profileSchema.index({ "location.city": 1, "location.state": 1 })
profileSchema.index({ gender: 1, "career.annualIncome": 1 })
profileSchema.index({ dateOfBirth: 1 })

export const Profile = model("Profile", profileSchema)
