import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import logo2 from "../assets/logo2.png"
import { Clock, ShieldAlert, CheckCircle2, RefreshCw, User, FileText, Phone, Mail, MapPin, LogOut } from "lucide-react"
import { useToast } from "../context/ToastContext"

export default function PendingApprovalScreen() {
    const { user, refreshUser, signOut } = useAuth()
    const { addToast } = useToast()
    const navigate = useNavigate()
    const [isChecking, setIsChecking] = useState(false)

    const handleCheckStatus = async () => {
        setIsChecking(true)
        try {
            const updated = await refreshUser()
            if (updated?.isApproved || updated?.status === "active") {
                addToast("Congratulations! Your account has been approved by Admin.", "success")
                navigate("/home", { replace: true })
            } else if (updated?.status === "declined" || updated?.approvalStatus === "declined") {
                addToast("Your account registration was not approved by the moderation team.", "error")
            } else {
                addToast("Your account is still pending administrator review. Please check back shortly.", "info")
            }
        } catch (error) {
            addToast("Unable to check status. Please try again.", "error")
        } finally {
            setIsChecking(false)
        }
    }

    const handleLogout = async () => {
        try {
            await signOut()
            navigate("/login", { replace: true })
        } catch (e) {
            navigate("/login", { replace: true })
        }
    }

    const isDeclined = user?.status === "declined" || user?.approvalStatus === "declined"

    return (
        <div className="min-h-screen bg-linear-to-b from-[#FFF5F6] via-[#FFF9FA] to-[#FFF0F2] flex flex-col font-sans">
            {/* Top Bar */}
            <header className="w-full bg-white border-b border-[#FFE4E8] shadow-xs sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 h-18 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logo2} alt="MeriJodi Logo" className="h-9 sm:h-10 w-auto" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">
                            Signed in as <strong className="text-gray-800">{user?.phone || user?.email || user?.name || "Member"}</strong>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 text-xs sm:text-sm font-semibold text-gray-600 hover:text-red-600 hover:border-red-200 bg-white transition-all shadow-2xs cursor-pointer"
                        >
                            <LogOut size={14} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
                <div className="w-full bg-white rounded-3xl border border-[#FFE2E6] shadow-xl shadow-rose-950/5 p-6 sm:p-10 relative overflow-hidden">
                    {/* Top Decorative Ribbon */}
                    <div className={`h-2 w-full absolute top-0 left-0 ${isDeclined ? "bg-red-500" : "bg-gradient-to-r from-[#D97706] via-[#ED5463] to-[#842029]"}`} />

                    {/* Status Icon & Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto mb-4 flex items-center justify-center">
                            {isDeclined ? (
                                <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-inner">
                                    <ShieldAlert size={42} />
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner animate-pulse">
                                    <Clock size={42} />
                                </div>
                            )}
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
                            {isDeclined ? (
                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full border border-red-200">
                                    Registration Declined
                                </span>
                            ) : (
                                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                                    Pending Admin Approval
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#371B20] mb-2 tracking-tight">
                            {isDeclined ? "Application Not Approved" : "Your Account is Under Review"}
                        </h1>

                        <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
                            {isDeclined
                                ? "We regret to inform you that your profile registration could not be approved at this time. Please review your submitted details or reach out to support."
                                : "Thank you for joining MeriJodi! To maintain a safe and verified community, all new accounts are reviewed and approved by our admin team before accessing matches and messaging."}
                        </p>
                    </div>

                    {/* Submitted User Info Summary */}
                    <div className="bg-[#FFF9FA] rounded-2xl border border-[#FFE4E8] p-5 sm:p-6 mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#842029] mb-4 flex items-center gap-1.5">
                            <User size={15} /> Your Submitted Details
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                            <div className="flex items-center gap-2.5 text-gray-700 bg-white p-3 rounded-xl border border-[#FFE8EC]">
                                <User size={16} className="text-[#842029] shrink-0" />
                                <div>
                                    <p className="text-[11px] text-gray-400 font-medium">Full Name</p>
                                    <p className="font-semibold text-gray-900">{user?.name || "Member"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 text-gray-700 bg-white p-3 rounded-xl border border-[#FFE8EC]">
                                <Phone size={16} className="text-[#842029] shrink-0" />
                                <div>
                                    <p className="text-[11px] text-gray-400 font-medium">Phone Number</p>
                                    <p className="font-semibold text-gray-900">{user?.phone || "Not provided"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 text-gray-700 bg-white p-3 rounded-xl border border-[#FFE8EC]">
                                <Mail size={16} className="text-[#842029] shrink-0" />
                                <div>
                                    <p className="text-[11px] text-gray-400 font-medium">Email Address</p>
                                    <p className="font-semibold text-gray-900 truncate max-w-[200px]">{user?.email || "Not provided"}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 text-gray-700 bg-white p-3 rounded-xl border border-[#FFE8EC]">
                                <MapPin size={16} className="text-[#842029] shrink-0" />
                                <div>
                                    <p className="text-[11px] text-gray-400 font-medium">Gender & Age</p>
                                    <p className="font-semibold text-gray-900 capitalize">
                                        {user?.gender || "Not specified"} {user?.age ? `(${user.age} yrs)` : ""}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
                        <button
                            onClick={handleCheckStatus}
                            disabled={isChecking}
                            className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#842029] hover:bg-[#6b1a21] active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-950/20 transition-all disabled:opacity-75 cursor-pointer"
                        >
                            <RefreshCw size={17} className={isChecking ? "animate-spin" : ""} />
                            {isChecking ? "Checking Approval..." : "Check Status"}
                        </button>

                        <Link
                            to="/add-details"
                            className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-white hover:bg-rose-50/50 border border-[#FFE4E8] text-[#842029] font-bold text-sm flex items-center justify-center gap-2 shadow-2xs transition-all text-center"
                        >
                            <FileText size={17} />
                            Complete Profile Details
                        </Link>
                    </div>

                    {/* Support Contact Helpline Banner */}
                    <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 bg-rose-50/40 p-4 rounded-2xl border border-rose-100">
                        <div className="flex items-center gap-2">
                            <Phone size={16} className="text-[#842029]" />
                            <span>Direct Support Helpline:</span>
                            <a href="tel:+918446360709" className="font-bold text-[#842029] text-sm hover:underline">
                                +91 84463 60709
                            </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <Mail size={14} className="text-[#842029]" />
                            <a href="mailto:support@merijodi.com" className="hover:underline">
                                support@merijodi.com
                            </a>
                        </div>
                    </div>
                </div>

                {/* Support Footnote */}
                <p className="text-xs text-gray-400 text-center mt-6">
                    Our team reviews submissions continuously. For urgent verification or inquiries, call our helpline at{" "}
                    <a href="tel:+918446360709" className="text-[#842029] font-bold underline">
                        +91 84463 60709
                    </a>
                </p>
            </main>
        </div>
    )
}
