import mongoose from "mongoose"
const { Schema, model } = mongoose

const subscriptionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        planName: {
            type: String,
            required: true,
            default: "Free Plan",
        },
        planId: {
            type: String,
            default: "free",
        },
        amount: {
            type: Number,
            default: 0,
        },
        currency: {
            type: String,
            default: "INR",
        },
        status: {
            type: String,
            enum: ["active", "expired", "cancelled", "pending"],
            default: "active",
            index: true,
        },
        billingCycle: {
            type: String,
            enum: ["monthly", "quarterly", "annual", "lifetime", "free"],
            default: "annual",
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        expiryDate: {
            type: Date,
        },
        nextBillingDate: {
            type: Date,
        },
        autoRenew: {
            type: Boolean,
            default: false,
        },
        paymentMethod: {
            type: String,
            default: "Razorpay",
        },
        transactionId: {
            type: String,
        },
        invoiceUrl: {
            type: String,
        },
        features: [{ type: String, trim: true }],
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
)

subscriptionSchema.index({ userId: 1, status: 1 })
subscriptionSchema.index({ expiryDate: 1 })

export const Subscription = model("Subscription", subscriptionSchema)
export default Subscription
