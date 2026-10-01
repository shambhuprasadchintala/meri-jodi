import mongoose from "mongoose"
import { GENDER, HOBBIES_LIST, MARITAL_STATUS } from "../constants/index.js"
const { Schema, model } = mongoose

const partnerPreferenceSchema = new Schema(
    {
        profileId: {
            type: Schema.Types.ObjectId,
            ref: "Profile",
            required: true,
            unique: true,
        },
        gender: {
            type: String,
            enum: Object.values(GENDER),
            required: true,
        },
        ageMin: { type: Number, min: 18, max: 80 },
        ageMax: { type: Number, min: 18, max: 80 },
        religion: String,
        caste: String,
        location: String,
        locations: {
            type: [String],
            default: [],
        },
        education: String,
        occupation: String,
        annualIncome: String,
        diet: String,
        hobbiesAndInterests: {
            type: [String],
            default: [],
        },
        heightMinCm: Number,
        heightMaxCm: Number,
        maritalStatus: {
            type: [String],
            default: [],
        },
        willingToRelocate: Boolean,
    },
    { timestamps: true }
)

export const PartnerPreference = model(
    "PartnerPreference",
    partnerPreferenceSchema
)
