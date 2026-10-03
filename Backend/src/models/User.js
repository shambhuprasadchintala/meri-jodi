import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import { ROLES, USER_STATUS } from "../constants/index.js"
const { Schema, model } = mongoose

const userSchema = new Schema(
    {
        name: { type: String, trim: true },
        email: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            required: [
                function () {
                    return !this.googleId
                },
                "Phone number is required",
            ],
        },
        passwordHash: { type: String },
        googleId: { type: String, unique: true, sparse: true },
        avatar: { type: String },
        role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
        status: {
            type: String,
            enum: Object.values(USER_STATUS),
            default: USER_STATUS.ACTIVE,
        },
        gender: { type: String, enum: ["male", "female", "other"] },
        location: { type: String, trim: true },
        isEmailVerified: { type: Boolean, default: false },
        isPhoneVerified: { type: Boolean, default: false },
        otp: { type: String, select: false },
        otpExpiresAt: { type: Date, select: false },
        lastLogin: Date,
    },
    { timestamps: true }
)

userSchema.methods.setPassword = async function (password) {
    this.passwordHash = await bcrypt.hash(password, 10)
}

userSchema.methods.validatePassword = async function (password) {
    if (!this.passwordHash) return false
    return bcrypt.compare(password, this.passwordHash)
}

userSchema.methods.toAuthJSON = function () {
    return {
        _id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        avatar: this.avatar,
        gender: this.gender,
        location: this.location,
        role: this.role,
        status: this.status,
        isEmailVerified: this.isEmailVerified,
        isPhoneVerified: this.isPhoneVerified,
    }
}

export const User = model("User", userSchema)
