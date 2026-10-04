import { z } from "zod"

export const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long").trim(),
    phone: z
        .string({ required_error: "Phone number is required" })
        .trim()
        .min(10, "Phone number must be at least 10 digits")
        .max(16, "Phone number is too long"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    email: z.string().email("Invalid email format").toLowerCase().trim().optional().or(z.literal("")),
    gender: z.string().optional(),
    location: z.string().optional(),
})

export const loginSchema = z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    identifier: z.string().optional(),
    password: z.string().min(1, "Password is required"),
}).refine((data) => data.phone || data.email || data.identifier, {
    message: "Phone number or email is required",
})

export const verifyOtpSchema = z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    otp: z.string().min(4, "OTP must be at least 4 digits").max(8, "OTP is too long").trim(),
})

export const resendOtpSchema = z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
})

export const googleAuthSchema = z.object({
    idToken: z.string().optional(),
    credential: z.string().optional(),
    accessToken: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    googleId: z.string().optional(),
    avatar: z.string().optional(),
})
