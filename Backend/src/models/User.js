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
            default: USER_STATUS.PENDING_APPROVAL,
        },
        gender: { type: String, enum: ["male", "female", "other"] },
        location: { type: String, trim: true },
        isEmailVerified: { type: Boolean, default: false },
        isPhoneVerified: { type: Boolean, default: true },
        isApproved: { type: Boolean, default: false },
        approvalStatus: {
            type: String,
            enum: ["pending", "approved", "declined"],
            default: "pending",
        },
        approvedAt: Date,
        declinedAt: Date,
        approvalNotes: String,
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
    const idStr = this._id ? this._id.toString() : ""
    return {
        _id: idStr,
        id: idStr,
        name: this.name,
        email: this.email,
        phone: this.phone,
        avatar: this.avatar,
        gender: this.gender,
        location: this.location,
        role: this.role,
        status: this.status,
        isApproved: this.isApproved,
        approvalStatus: this.approvalStatus,
        approvedAt: this.approvedAt,
        declinedAt: this.declinedAt,
        isEmailVerified: this.isEmailVerified,
        isPhoneVerified: this.isPhoneVerified,
        googleId: this.googleId,
    }
}

export const User = model("User", userSchema)
