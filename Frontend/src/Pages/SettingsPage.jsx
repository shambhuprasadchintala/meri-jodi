import { useState, useEffect } from "react"
import { Shield, Key, Ban, ChevronRight, LogOut, CheckCircle, FileText, Upload, AlertCircle, Eye, EyeOff, Phone, Smartphone, Check, Send } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Navbar from "../Components/Navbar"
import Footer from "../Components/Footer"
import { useAuth } from "../context/AuthContext"
import { changePassword, sendPhoneOtp, verifyPhoneOtp, updateUserPhone } from "../api/authApi"
import { getBlockedProfiles, unblockProfile } from "../api/blockApi"
import { getMyVerification, submitVerification } from "../api/verificationApi"
import { getMyProfile } from "../api/profileApi"
import { useToast } from "../context/ToastContext"

export default function SettingsPage() {
    const { user, updateUser, logOut } = useAuth()
    const navigate = useNavigate()
    const addToast = useToast()
    const [activeTab, setActiveTab] = useState("account")
    
    // Change Password State
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)

    // Mobile Phone State
    const [phoneNumber, setPhoneNumber] = useState(
        user?.phone ? String(user.phone).replace(/^\+91/, "").replace(/\D/g, "") : ""
    )
    const [phoneOtp, setPhoneOtp] = useState("")
    const [isOtpSent, setIsOtpSent] = useState(false)
    const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false)
    const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false)
    const [isUpdatingPhone, setIsUpdatingPhone] = useState(false)

    useEffect(() => {
        if (user?.phone) {
            setPhoneNumber(String(user.phone).replace(/^\+91/, "").replace(/\D/g, ""))
        }
    }, [user?.phone])
    
    // Blocked Users State
    const [blockedUsers, setBlockedUsers] = useState([])
    const [isLoadingBlocked, setIsLoadingBlocked] = useState(false)

    // Verification State
    const [myProfile, setMyProfile] = useState(null)
    const [verificationData, setVerificationData] = useState(null)
    const [docType, setDocType] = useState("aadhaar")
    const [docUrl, setDocUrl] = useState("")
    const [isSubmittingDoc, setIsSubmittingDoc] = useState(false)

    useEffect(() => {
        if (activeTab === "blocked") {
            fetchBlockedUsers()
        } else if (activeTab === "verification") {
            fetchVerificationInfo()
        }
    }, [activeTab])

    const fetchBlockedUsers = async () => {
        setIsLoadingBlocked(true)
        try {
            const data = await getBlockedProfiles()
            setBlockedUsers(data)
        } catch (err) {
            addToast("Failed to load blocked users", "error")
        } finally {
            setIsLoadingBlocked(false)
        }
    }

    const fetchVerificationInfo = async () => {
        try {
            const [prof, verif] = await Promise.all([
                getMyProfile(),
                getMyVerification(),
            ])
            setMyProfile(prof)
            setVerificationData(verif)
        } catch {
            // Ignore
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            return addToast("New passwords do not match", "error")
        }
        if (newPassword.length < 6) {
            return addToast("Password must be at least 6 characters", "error")
        }

        setIsSubmittingPassword(true)
        try {
            await changePassword(currentPassword, newPassword)
            addToast("Password updated successfully", "success")
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to update password", "error")
        } finally {
            setIsSubmittingPassword(false)
        }
    }

    const handleSendPhoneVerification = async () => {
        const clean = phoneNumber.trim().replace(/\D/g, "")
        if (clean.length !== 10) {
            return addToast("Please enter a valid 10-digit mobile number", "error")
        }
        setIsSendingPhoneOtp(true)
        try {
            const formatted = `+91${clean}`
            const res = await sendPhoneOtp(formatted)
            setIsOtpSent(true)
            addToast(res.message || "SMS verification code sent to your phone!", "success")
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to send SMS code", "error")
        } finally {
            setIsSendingPhoneOtp(false)
        }
    }

    const handleVerifyPhoneOtp = async () => {
        const clean = phoneNumber.trim().replace(/\D/g, "")
        if (!phoneOtp.trim()) {
            return addToast("Please enter the 6-digit SMS code", "error")
        }
        setIsVerifyingPhoneOtp(true)
        try {
            const formatted = `+91${clean}`
            await verifyPhoneOtp(formatted, phoneOtp.trim())
            if (updateUser) {
                updateUser({ phone: formatted, isPhoneVerified: true })
            }
            setIsOtpSent(false)
            setPhoneOtp("")
            addToast("Mobile number verified successfully!", "success")
        } catch (err) {
            addToast(err.response?.data?.message || "Invalid or expired SMS code", "error")
        } finally {
            setIsVerifyingPhoneOtp(false)
        }
    }

    const handleSavePhoneDirectly = async (e) => {
        if (e) e.preventDefault()
        const clean = phoneNumber.trim().replace(/\D/g, "")
        if (clean.length !== 10) {
            return addToast("Please enter a valid 10-digit mobile number", "error")
        }
        setIsUpdatingPhone(true)
        try {
            const formatted = `+91${clean}`
            await updateUserPhone(formatted)
            if (updateUser) {
                updateUser({ phone: formatted })
            }
            addToast("Mobile number saved successfully!", "success")
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to update phone number", "error")
        } finally {
            setIsUpdatingPhone(false)
        }
    }

    const handleUnblock = async (profileId) => {
        try {
            await unblockProfile(profileId)
            addToast("User unblocked successfully", "success")
            setBlockedUsers(blockedUsers.filter(u => u.blockedProfileId?._id !== profileId))
        } catch (err) {
            addToast("Failed to unblock user", "error")
        }
    }

    const handleSubmitVerification = async (e) => {
        e.preventDefault()
        if (!docUrl.trim()) {
            return addToast("Please provide your document link or number.", "error")
        }
        setIsSubmittingDoc(true)
        try {
            const res = await submitVerification(docType, docUrl.trim())
            setVerificationData(res)
            addToast("Verification document submitted successfully! Our team will review it.", "success")
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to submit verification", "error")
        } finally {
            setIsSubmittingDoc(false)
        }
    }

    const handleLogout = async () => {
        try {
            await logOut()
            navigate("/login")
        } catch (err) {
            addToast("Failed to logout", "error")
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 font-serif mb-6">Settings</h1>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="w-full md:w-64 shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <button
                                onClick={() => setActiveTab("account")}
                                className={`w-full flex items-center justify-between p-4 text-sm font-medium transition-colors ${
                                    activeTab === "account" ? "bg-red-50 text-red-700 border-l-4 border-red-600" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Shield size={18} /> Account &amp; Privacy
                                </div>
                                <ChevronRight size={16} className={activeTab === "account" ? "text-red-400" : "text-gray-400"} />
                            </button>

                            <button
                                onClick={() => setActiveTab("verification")}
                                className={`w-full flex items-center justify-between p-4 text-sm font-medium transition-colors ${
                                    activeTab === "verification" ? "bg-red-50 text-red-700 border-l-4 border-red-600" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={18} /> ID Verification
                                </div>
                                <ChevronRight size={16} className={activeTab === "verification" ? "text-red-400" : "text-gray-400"} />
                            </button>

                            <button
                                onClick={() => setActiveTab("blocked")}
                                className={`w-full flex items-center justify-between p-4 text-sm font-medium transition-colors ${
                                    activeTab === "blocked" ? "bg-red-50 text-red-700 border-l-4 border-red-600" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Ban size={18} /> Blocked Members
                                </div>
                                <ChevronRight size={16} className={activeTab === "blocked" ? "text-red-400" : "text-gray-400"} />
                            </button>
                            
                            <div className="p-4 border-t border-gray-100">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 text-sm font-medium text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <LogOut size={18} /> Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                            
                            {/* Account Tab */}
                            {activeTab === "account" && (
                                <div className="space-y-10 animate-in fade-in">
                                    
                                    {/* Mobile Number & Twilio Verification Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <h2 className="text-lg font-bold text-gray-900 font-serif flex items-center gap-2">
                                                <Phone size={20} className="text-rose-600" /> Mobile Phone Number
                                            </h2>
                                            {user?.isPhoneVerified ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                                                    <Check size={12} /> Verified
                                                </span>
                                            ) : user?.phone ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
                                                    Unverified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                    Not Added
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mb-6">
                                            Keep your contact number up-to-date to receive match alerts and verify your profile.
                                        </p>

                                        <div className="max-w-md space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                    10-Digit Mobile Number
                                                </label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                                                            +91
                                                        </span>
                                                        <input
                                                            type="tel"
                                                            maxLength={10}
                                                            placeholder="9876543210"
                                                            value={phoneNumber}
                                                            onChange={(e) => {
                                                                setPhoneNumber(e.target.value.replace(/\D/g, ""))
                                                                setIsOtpSent(false)
                                                            }}
                                                            className="w-full border border-gray-200 rounded-xl pl-12 pr-3 py-2 text-sm focus:outline-none focus:border-[#842029]"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleSavePhoneDirectly}
                                                        disabled={isUpdatingPhone || phoneNumber.length !== 10}
                                                        className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
                                                    >
                                                        {isUpdatingPhone ? "Saving..." : "Save"}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Send SMS Verification Code via Twilio */}
                                            {!user?.isPhoneVerified && (
                                                <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-gray-800">
                                                            SMS Verification (Twilio)
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={handleSendPhoneVerification}
                                                            disabled={isSendingPhoneOtp || phoneNumber.length !== 10}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#842029] text-white rounded-lg text-xs font-semibold hover:bg-[#6b1b27] disabled:opacity-50 transition-all cursor-pointer"
                                                        >
                                                            <Send size={12} />
                                                            {isSendingPhoneOtp ? "Sending SMS..." : isOtpSent ? "Resend Code" : "Verify via SMS"}
                                                        </button>
                                                    </div>

                                                    {isOtpSent && (
                                                        <div className="pt-2 border-t border-rose-100 flex gap-2">
                                                            <input
                                                                type="text"
                                                                maxLength={6}
                                                                placeholder="Enter 6-digit code"
                                                                value={phoneOtp}
                                                                onChange={(e) => setPhoneOtp(e.target.value.trim())}
                                                                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-center font-bold tracking-widest focus:outline-none focus:border-[#842029]"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={handleVerifyPhoneOtp}
                                                                disabled={isVerifyingPhoneOtp || phoneOtp.length < 4}
                                                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                                            >
                                                                {isVerifyingPhoneOtp ? "Checking..." : "Confirm"}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-gray-100 pt-8">
                                        <h2 className="text-lg font-bold text-gray-900 font-serif mb-1 flex items-center gap-2">
                                            <Key size={20} className="text-gray-400" /> Change Password
                                        </h2>
                                        <p className="text-sm text-gray-500 mb-6">Update your password to keep your account secure.</p>
                                        
                                        {!user?.passwordHash && user?.googleId ? (
                                            <div className="p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 text-sm">
                                                You signed in using Google. Password changes are managed through your Google account.
                                            </div>
                                        ) : (
                                            <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showCurrentPassword ? "text" : "password"}
                                                            value={currentPassword}
                                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2 pr-10 text-sm focus:outline-none focus:border-[#842029]"
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
                                                            aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                                                        >
                                                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showNewPassword ? "text" : "password"}
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2 pr-10 text-sm focus:outline-none focus:border-[#842029]"
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
                                                            aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                                                        >
                                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2 pr-10 text-sm focus:outline-none focus:border-[#842029]"
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
                                                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                                        >
                                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                 <button
                                                    type="submit"
                                                    disabled={isSubmittingPassword}
                                                    className="px-6 py-2.5 bg-[#842029] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#6b1b27] transition-all disabled:opacity-50 cursor-pointer"
                                                >
                                                    {isSubmittingPassword ? "Updating..." : "Update Password"}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ID Verification Tab */}
                            {activeTab === "verification" && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 font-serif mb-1 flex items-center gap-2">
                                            <CheckCircle size={20} className="text-emerald-600" /> Government ID Verification
                                        </h2>
                                        <p className="text-sm text-gray-500 mb-6">
                                            Verify your identity to get the verified profile badge and boost trust with prospective matches.
                                        </p>

                                        {myProfile?.isVerified ? (
                                            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                                    <CheckCircle size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-emerald-900">Your Profile is Verified</h3>
                                                    <p className="text-xs text-emerald-700 mt-0.5">
                                                        Your government ID has been verified. The green verified badge is displayed on your cards.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : verificationData?.status === "submitted" || verificationData?.status === "under_review" ? (
                                            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-amber-900">Verification Under Review</h3>
                                                    <p className="text-xs text-amber-700 mt-0.5">
                                                        Your {verificationData.documentType} document has been submitted and is currently being verified by our team.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmitVerification} className="max-w-md space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Document Type</label>
                                                    <select
                                                        value={docType}
                                                        onChange={(e) => setDocType(e.target.value)}
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#842029]"
                                                    >
                                                        <option value="aadhaar">Aadhaar Card</option>
                                                        <option value="passport">Passport</option>
                                                        <option value="driving_license">Driving License</option>
                                                        <option value="voter_id">Voter ID / PAN Card</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                        Document URL / Identification Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Document image link or ID reference"
                                                        value={docUrl}
                                                        onChange={(e) => setDocUrl(e.target.value)}
                                                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#842029]"
                                                        required
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={isSubmittingDoc}
                                                    className="px-6 py-2.5 bg-[#842029] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#6b1b27] transition-all disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    <Upload size={14} />
                                                    {isSubmittingDoc ? "Submitting..." : "Submit for Verification"}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Blocked Tab */}
                            {activeTab === "blocked" && (
                                <div className="space-y-6 animate-in fade-in">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 font-serif mb-1 flex items-center gap-2">
                                            <Ban size={20} className="text-gray-400" /> Blocked Members
                                        </h2>
                                        <p className="text-sm text-gray-500 mb-6">Manage profiles you have blocked from contacting or viewing you.</p>

                                        {isLoadingBlocked ? (
                                            <div className="py-12 text-center text-gray-400 text-sm">Loading blocked members...</div>
                                        ) : blockedUsers.length === 0 ? (
                                            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500 text-sm">
                                                You haven't blocked any members.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {blockedUsers.map((item) => {
                                                    const profile = item.blockedProfileId
                                                    if (!profile) return null
                                                    return (
                                                        <div key={item._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                            <div>
                                                                <h3 className="font-semibold text-gray-900 text-sm">{profile.name || "Member"}</h3>
                                                                <p className="text-xs text-gray-500">{profile.location?.city || "India"}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleUnblock(profile._id)}
                                                                className="px-4 py-1.5 rounded-full border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-white transition-colors"
                                                            >
                                                                Unblock
                                                            </button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
