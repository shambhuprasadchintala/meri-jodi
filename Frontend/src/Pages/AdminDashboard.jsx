import { useState, useEffect, useCallback } from "react"
import {
    ShieldCheck,
    AlertTriangle,
    Users,
    CheckCircle,
    XCircle,
    FileText,
    Eye,
    RefreshCw,
    Search,
    Filter,
    UserCheck,
    UserX,
    Trash2,
    Activity,
    Heart,
    MessageCircle,
    X,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Award,
    MapPin,
    Briefcase,
    GraduationCap,
    Calendar,
    Clock,
    Sparkles,
    Check,
    Lock,
    Unlock,
    ShieldAlert,
    Image as ImageIcon,
    Settings as SettingsIcon,
    CreditCard,
    Plus,
    Edit3,
    Key,
    User,
    Server,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import Navbar from "../Components/Navbar"
import Footer from "../Components/Footer"
import {
    getAdminStats,
    getAdminUsers,
    getAdminUserById,
    updateAdminUserStatus,
    updateAdminUserRole,
    toggleAdminUserVerification,
    deleteAdminUser,
    getAdminVerifications,
    reviewAdminVerification,
    getAdminReports,
    updateAdminReportStatus,
    updateAdminUserProfile,
    addAdminUserSubscription,
    getAdminProfileSettings,
    updateAdminProfileSettings,
    updateAdminPasswordSettings,
} from "../api/adminApi"
import { useToast } from "../context/ToastContext"
import ConfirmModal from "../Components/ConfirmModal"

export default function AdminDashboard() {
    const navigate = useNavigate()
    const { addToast } = useToast?.() || { addToast: () => {} }

    // Navigation & Tabs
    const [activeTab, setActiveTab] = useState("overview") // 'overview' | 'verifications' | 'reports' | 'users'
    const [deleteConfirm, setDeleteConfirm] = useState(null) // { userId, userName }
    const [roleConfirm, setRoleConfirm] = useState(null) // { userId, userName, nextRole }

    // Data States
    const [stats, setStats] = useState(null)
    const [verifications, setVerifications] = useState([])
    const [reports, setReports] = useState([])
    const [users, setUsers] = useState([])
    const [userPagination, setUserPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)

    // Filters & Search
    const [verificationFilter, setVerificationFilter] = useState("all")
    const [reportFilter, setReportFilter] = useState("all")
    const [userSearch, setUserSearch] = useState("")
    const [userStatusFilter, setUserStatusFilter] = useState("all")
    const [userRoleFilter, setUserRoleFilter] = useState("all")
    const [userGenderFilter, setUserGenderFilter] = useState("all")
    const [userVerifiedFilter, setUserVerifiedFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)

    // Modals
    const [selectedVerification, setSelectedVerification] = useState(null)
    const [verificationNote, setVerificationNote] = useState("")
    const [selectedReport, setSelectedReport] = useState(null)
    const [reportActionNote, setReportActionNote] = useState("")
    const [selectedUserDetail, setSelectedUserDetail] = useState(null)
    const [loadingUserDetail, setLoadingUserDetail] = useState(false)

    // Edit Profile Modal State
    const [editProfileModalOpen, setEditProfileModalOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({})
    const [editSaving, setEditSaving] = useState(false)

    // Assign Subscription Plan State
    const [assignPlanModalOpen, setAssignPlanModalOpen] = useState(false)
    const [planFormData, setPlanFormData] = useState({
        planName: "Premium Plan",
        planId: "premium",
        amount: 1999,
        billingCycle: "annual",
        durationDays: 365,
        paymentMethod: "Admin Assigned",
        autoRenew: false,
        notes: "Assigned via Admin Console",
    })
    const [planSaving, setPlanSaving] = useState(false)

    // Settings State
    const [settingsActiveTab, setSettingsActiveTab] = useState("personal")
    const [settingsPersonalForm, setSettingsPersonalForm] = useState({
        name: "",
        email: "",
        phone: "",
        avatar: "",
    })
    const [settingsPersonalSaving, setSettingsPersonalSaving] = useState(false)
    const [settingsPasswordForm, setSettingsPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [settingsPasswordSaving, setSettingsPasswordSaving] = useState(false)

    // Fetch All Primary Data
    const fetchAllData = useCallback(async () => {
        setLoading(true)
        try {
            const [statsRes, vRes, rRes, uRes] = await Promise.all([
                getAdminStats().catch(() => null),
                getAdminVerifications({ limit: 100 }).catch(() => ({ verifications: [] })),
                getAdminReports({ limit: 100 }).catch(() => ({ reports: [] })),
                getAdminUsers({
                    page: currentPage,
                    limit: 20,
                    search: userSearch || undefined,
                    status: userStatusFilter !== "all" ? userStatusFilter : undefined,
                    role: userRoleFilter !== "all" ? userRoleFilter : undefined,
                    gender: userGenderFilter !== "all" ? userGenderFilter : undefined,
                    isVerified: userVerifiedFilter !== "all" ? userVerifiedFilter : undefined,
                }).catch(() => ({ users: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } })),
            ])

            if (statsRes) setStats(statsRes)
            setVerifications(vRes.verifications || (Array.isArray(vRes) ? vRes : []))
            setReports(rRes.reports || (Array.isArray(rRes) ? rRes : []))
            setUsers(uRes.users || (Array.isArray(uRes) ? uRes : []))
            if (uRes.pagination) {
                setUserPagination(uRes.pagination)
            }
        } catch (err) {
            console.error("Failed to load admin dashboard data:", err)
            addToast("Failed to fetch fresh dashboard data", "error")
        } finally {
            setLoading(false)
        }
    }, [currentPage, userSearch, userStatusFilter, userRoleFilter, userGenderFilter, userVerifiedFilter, addToast])

    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

    // KYC Review Handler
    const handleReviewVerification = async (id, status) => {
        setActionLoading(id)
        try {
            await reviewAdminVerification(id, status, verificationNote)
            const isApproved = status === "verified" || status === "approved"
            addToast(`Verification marked as ${isApproved ? "Approved & Verified" : "Rejected"}.`, "success")
            setSelectedVerification(null)
            setVerificationNote("")
            fetchAllData()
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update verification status"
            addToast(msg, "error")
        } finally {
            setActionLoading(null)
        }
    }

    // Report Status Handler
    const handleUpdateReport = async (id, status, banReportedUser = false, reportedUserId = null) => {
        setActionLoading(id)
        try {
            await updateAdminReportStatus(id, status, reportActionNote)
            if (banReportedUser && reportedUserId) {
                await updateAdminUserStatus(reportedUserId, "banned")
                addToast(`Report marked as ${status} and reported user banned.`, "success")
            } else {
                addToast(`Report marked as ${status}.`, "success")
            }
            setSelectedReport(null)
            setReportActionNote("")
            fetchAllData()
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update report status"
            addToast(msg, "error")
        } finally {
            setActionLoading(null)
        }
    }

    // User Status Update Handler (Active / Inactive / Banned)
    const handleUpdateUserStatus = async (userId, newStatus) => {
        setActionLoading(userId)
        try {
            await updateAdminUserStatus(userId, newStatus)
            addToast(`User account status updated to ${newStatus}.`, "success")
            if (selectedUserDetail?.user?._id === userId) {
                setSelectedUserDetail((prev) => ({
                    ...prev,
                    user: { ...prev.user, status: newStatus },
                }))
            }
            fetchAllData()
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to change user status"
            addToast(msg, "error")
        } finally {
            setActionLoading(null)
        }
    }

    // User Role Update Handler
    const handleUpdateUserRole = async (userId, newRole) => {
        setActionLoading(userId)
        try {
            await updateAdminUserRole(userId, newRole)
            addToast(`User role successfully changed to ${newRole.toUpperCase()}.`, "success")
            if (selectedUserDetail?.user?._id === userId) {
                setSelectedUserDetail((prev) => ({
                    ...prev,
                    user: { ...prev.user, role: newRole },
                }))
            }
            setRoleConfirm(null)
            fetchAllData()
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to change user role"
            addToast(msg, "error")
        } finally {
            setActionLoading(null)
        }
    }

    // Toggle Verification Badge
    const handleToggleVerification = async (userId, currentVerified) => {
        setActionLoading(userId)
        try {
            const updated = await toggleAdminUserVerification(userId, !currentVerified)
            addToast(`User profile is now ${!currentVerified ? "verified" : "unverified"}.`, "success")
            if (selectedUserDetail?.user?._id === userId) {
                setSelectedUserDetail((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, isVerified: !currentVerified },
                }))
            }
            fetchAllData()
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to toggle verification badge"
            addToast(msg, "error")
        } finally {
            setActionLoading(null)
        }
    }

    // View User Details Dossier
    const handleViewUserDetails = async (userId) => {
        setLoadingUserDetail(true)
        try {
            const data = await getAdminUserById(userId)
            setSelectedUserDetail(data)
        } catch (err) {
            addToast("Failed to fetch full user dossier", "error")
        } finally {
            setLoadingUserDetail(false)
        }
    }

    // Fetch Admin Settings Profile
    const fetchAdminSettingsProfile = useCallback(async () => {
        try {
            const data = await getAdminProfileSettings()
            if (data) {
                setSettingsPersonalForm({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    avatar: data.avatar || "",
                })
            }
        } catch (err) {
            console.error("Failed to fetch admin profile settings:", err)
        }
    }, [])

    useEffect(() => {
        if (activeTab === "settings") {
            fetchAdminSettingsProfile()
        }
    }, [activeTab, fetchAdminSettingsProfile])

    // Save Admin Personal Info Settings
    const handleSavePersonalSettings = async (e) => {
        e.preventDefault()
        setSettingsPersonalSaving(true)
        try {
            await updateAdminProfileSettings(settingsPersonalForm)
            addToast("Personal information updated successfully", "success")
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to update personal settings", "error")
        } finally {
            setSettingsPersonalSaving(false)
        }
    }

    // Save Admin Password Settings
    const handleSavePasswordSettings = async (e) => {
        e.preventDefault()
        if (settingsPasswordForm.newPassword !== settingsPasswordForm.confirmPassword) {
            addToast("New passwords do not match", "error")
            return
        }
        setSettingsPasswordSaving(true)
        try {
            await updateAdminPasswordSettings({
                currentPassword: settingsPasswordForm.currentPassword,
                newPassword: settingsPasswordForm.newPassword,
            })
            addToast("Password updated successfully!", "success")
            setSettingsPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to update password", "error")
        } finally {
            setSettingsPasswordSaving(false)
        }
    }

    // Open Edit Profile Modal
    const handleOpenEditModal = () => {
        if (!selectedUserDetail) return
        const { user, profile } = selectedUserDetail
        setEditFormData({
            name: profile?.name || user?.name || "",
            phone: user?.phone || "",
            gender: profile?.gender || user?.gender || "male",
            aboutMe: profile?.aboutMe || "",
            dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split("T")[0] : "",
            timeOfBirth: profile?.timeOfBirth || "",
            placeOfBirth: profile?.placeOfBirth || "",
            motherTongue: profile?.motherTongue || "",
            religion: profile?.religion || "",
            caste: profile?.caste || "",
            subCaste: profile?.subCaste || "",
            gotham: profile?.gotham || "",
            rashi: profile?.rashi || "",
            nakshtra: profile?.nakshtra || "",
            manglik: profile?.manglik || "no",
            maritalStatus: profile?.maritalStatus || "never_married",
            city: profile?.location?.city || "",
            state: profile?.location?.state || "",
            highestDegree: profile?.education?.highestDegree || "",
            institution: profile?.education?.institution || "",
            occupation: profile?.career?.occupation || "",
            companyName: profile?.career?.companyName || "",
            annualIncome: profile?.career?.annualIncome || "",
            fatherOccupation: profile?.family?.fatherOccupation || "",
            motherOccupation: profile?.family?.motherOccupation || "",
            familyLocation: profile?.family?.familyLocation || "",
            familyValues: profile?.family?.familyValues || "moderate",
            numBrothers: profile?.family?.numBrothers || 0,
            numSisters: profile?.family?.numSisters || 0,
            diet: profile?.lifestyle?.diet || "Vegetarian",
            smoking: profile?.lifestyle?.smoking ? "yes" : "no",
            drinking: profile?.lifestyle?.drinking ? "yes" : "no",
            fitness: profile?.lifestyle?.fitness || "",
        })
        setEditProfileModalOpen(true)
    }

    // Save Edited User Profile
    const handleSaveUserProfile = async (e) => {
        e.preventDefault()
        if (!selectedUserDetail?.user?._id) return
        setEditSaving(true)
        try {
            const payload = {
                name: editFormData.name,
                phone: editFormData.phone,
                gender: editFormData.gender,
                aboutMe: editFormData.aboutMe,
                dateOfBirth: editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth) : undefined,
                timeOfBirth: editFormData.timeOfBirth,
                placeOfBirth: editFormData.placeOfBirth,
                motherTongue: editFormData.motherTongue,
                religion: editFormData.religion,
                caste: editFormData.caste,
                subCaste: editFormData.subCaste,
                gotham: editFormData.gotham,
                rashi: editFormData.rashi,
                nakshtra: editFormData.nakshtra,
                manglik: editFormData.manglik,
                maritalStatus: editFormData.maritalStatus,
                location: { city: editFormData.city, state: editFormData.state },
                education: { highestDegree: editFormData.highestDegree, institution: editFormData.institution },
                career: { occupation: editFormData.occupation, companyName: editFormData.companyName, annualIncome: editFormData.annualIncome },
                family: { fatherOccupation: editFormData.fatherOccupation, motherOccupation: editFormData.motherOccupation, familyLocation: editFormData.familyLocation, familyValues: editFormData.familyValues, numBrothers: Number(editFormData.numBrothers) || 0, numSisters: Number(editFormData.numSisters) || 0 },
                lifestyle: { diet: editFormData.diet, smoking: editFormData.smoking === "yes", drinking: editFormData.drinking === "yes", fitness: editFormData.fitness },
            }
            await updateAdminUserProfile(selectedUserDetail.user._id, payload)
            addToast("User profile updated successfully!", "success")
            setEditProfileModalOpen(false)
            handleViewUserDetails(selectedUserDetail.user._id)
            fetchAllData()
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to update profile", "error")
        } finally {
            setEditSaving(false)
        }
    }

    // Assign Subscription Plan
    const handleAssignSubscriptionPlan = async (e) => {
        e.preventDefault()
        if (!selectedUserDetail?.user?._id) return
        setPlanSaving(true)
        try {
            await addAdminUserSubscription(selectedUserDetail.user._id, planFormData)
            addToast(`Assigned ${planFormData.planName} to user successfully!`, "success")
            setAssignPlanModalOpen(false)
            handleViewUserDetails(selectedUserDetail.user._id)
        } catch (err) {
            addToast(err.response?.data?.message || "Failed to assign plan", "error")
        } finally {
            setPlanSaving(false)
        }
    }

    // Delete User Handler
    const handleDeleteUser = (userId, userName) => {
        setDeleteConfirm({ userId, userName })
    }

    const performDeleteUser = async () => {
        if (!deleteConfirm) return
        const { userId, userName } = deleteConfirm
        setActionLoading(userId)
        try {
            await deleteAdminUser(userId)
            addToast(`User account "${userName}" permanently deleted.`, "success")
            if (selectedUserDetail?.user?._id === userId) {
                setSelectedUserDetail(null)
            }
            setDeleteConfirm(null)
            fetchAllData()
        } catch (err) {
            addToast("Failed to delete user account", "error")
        } finally {
            setActionLoading(null)
        }
    }

    // Counts computation
    const pendingVerificationsCount = verifications.filter((v) =>
        ["submitted", "under_review", "pending"].includes(v.status)
    ).length
    const pendingReportsCount = reports.filter((r) => r.status === "pending").length
    const totalVerifiedProfiles = users.filter((u) => u.isVerified).length

    // Filtered lists
    const filteredVerifications = verifications.filter((v) => {
        if (verificationFilter === "all") return true
        if (verificationFilter === "pending") return ["submitted", "under_review", "pending"].includes(v.status)
        if (verificationFilter === "verified") return ["verified", "approved"].includes(v.status)
        if (verificationFilter === "rejected") return v.status === "rejected"
        return true
    })

    const filteredReports = reports.filter((r) => {
        if (reportFilter === "all") return true
        return r.status === reportFilter
    })

    return (
        <div className="min-h-screen bg-[#FBF9F9] flex flex-col font-sans text-gray-800">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="px-3 py-1 rounded-full bg-rose-100 text-[#842029] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
                                <ShieldCheck size={14} /> Administration Console
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                                Live Database &amp; Cache
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#640515]">
                            MeriJodi Admin Portal
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Supervise member directories, review KYC verification documents, resolve abuse reports, and monitor platform KPIs.
                        </p>
                    </div>
                    <button
                        onClick={fetchAllData}
                        className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 flex items-center gap-2 shadow-2xs cursor-pointer transition-all active:scale-95"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin text-[#842029]" : ""} /> Refresh Data
                    </button>
                </div>

                {/* Metrics Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Users size={22} />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Total Users</p>
                            <h3 className="text-xl sm:text-2xl font-bold font-serif text-gray-900">
                                {stats?.counts?.totalUsers ?? users.length}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <UserCheck size={22} />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Verified Profiles</p>
                            <h3 className="text-xl sm:text-2xl font-bold font-serif text-gray-900">
                                {stats?.counts?.verifiedProfiles ?? totalVerifiedProfiles}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#FFF0F2] text-[#842029] flex items-center justify-center shrink-0">
                            <FileText size={22} />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Pending KYC</p>
                            <h3 className="text-xl sm:text-2xl font-bold font-serif text-gray-900">
                                {pendingVerificationsCount}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <AlertTriangle size={22} />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Safety Reports</p>
                            <h3 className="text-xl sm:text-2xl font-bold font-serif text-gray-900">
                                {pendingReportsCount}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Main Navigation Tabs */}
                <div className="flex border-b border-gray-200 mb-6 gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                            activeTab === "overview"
                                ? "border-[#842029] text-[#842029]"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <Activity size={16} /> Overview &amp; KPIs
                    </button>
                    <button
                        onClick={() => setActiveTab("verifications")}
                        className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                            activeTab === "verifications"
                                ? "border-[#842029] text-[#842029]"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <ShieldCheck size={16} /> KYC Verifications
                        {pendingVerificationsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[#842029] text-[10px] font-bold">
                                {pendingVerificationsCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("reports")}
                        className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                            activeTab === "reports"
                                ? "border-[#842029] text-[#842029]"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <AlertTriangle size={16} /> Abuse Reports
                        {pendingReportsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                {pendingReportsCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                            activeTab === "users"
                                ? "border-[#842029] text-[#842029]"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <Users size={16} /> User Directory ({userPagination.total || users.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                            activeTab === "settings"
                                ? "border-[#842029] text-[#842029]"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <SettingsIcon size={16} /> Settings
                    </button>
                </div>

                {/* TAB 1: OVERVIEW & KPIS */}
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        {/* Demographic & Match Engagement Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Heart size={16} className="text-[#842029]" /> Matchmaking Engagement
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">Total Interests Expressed</span>
                                        <span className="font-bold text-gray-800">{stats?.counts?.totalInterests || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">Accepted Matches</span>
                                        <span className="font-bold text-emerald-600">{stats?.counts?.acceptedInterests || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">Total Chat Messages</span>
                                        <span className="font-bold text-gray-800">{stats?.counts?.totalMessages || 0}</span>
                                    </div>
                                    <div className="pt-2">
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-[#842029] h-2 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${
                                                        stats?.counts?.totalInterests
                                                            ? Math.min(100, Math.round(((stats.counts.acceptedInterests || 0) / stats.counts.totalInterests) * 100))
                                                            : 0
                                                    }%`,
                                                }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-1.5 text-right font-medium">
                                            {stats?.counts?.totalInterests
                                                ? Math.round(((stats.counts.acceptedInterests || 0) / stats.counts.totalInterests) * 100)
                                                : 0}
                                            % Match Acceptance Rate
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users size={16} className="text-blue-600" /> Gender Demographics
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Male Profiles
                                        </span>
                                        <span className="font-bold text-gray-800">{stats?.demographics?.male || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Female Profiles
                                        </span>
                                        <span className="font-bold text-gray-800">{stats?.demographics?.female || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Verified Badge Ratio
                                        </span>
                                        <span className="font-bold text-emerald-600">
                                            {stats?.counts?.totalProfiles
                                                ? Math.round(((stats.counts.verifiedProfiles || 0) / stats.counts.totalProfiles) * 100)
                                                : 100}
                                            %
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Activity size={16} className="text-emerald-600" /> System &amp; Services
                                </h3>
                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Database Engine</span>
                                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> MongoDB Atlas
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Cache / TTL Store</span>
                                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Redis Connected
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">AI Biodata Engine</span>
                                        <span className="font-bold text-emerald-700">Gemini &amp; Groq Active</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Real-Time Messaging</span>
                                        <span className="font-bold text-emerald-700">Socket.io Operational</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fast Action Preview Queues */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Pending Verifications Quick List */}
                            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-[#640515] flex items-center gap-2">
                                        <ShieldCheck size={18} /> Pending KYC Documents ({pendingVerificationsCount})
                                    </h3>
                                    <button
                                        onClick={() => setActiveTab("verifications")}
                                        className="text-xs font-semibold text-[#842029] hover:underline cursor-pointer"
                                    >
                                        View All →
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {verifications
                                        .filter((v) => ["submitted", "under_review", "pending"].includes(v.status))
                                        .slice(0, 4)
                                        .map((v) => (
                                            <div
                                                key={v._id}
                                                className="p-3.5 rounded-2xl bg-rose-50/30 border border-rose-100 flex items-center justify-between gap-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-xs text-gray-900 truncate">
                                                        {v.profileId?.name || "Applicant"}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 capitalize truncate">
                                                        {v.documentType?.replace(/_/g, " ") || "Government ID"} • {v.profileId?.location?.city || "India"}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedVerification(v)}
                                                    className="px-3.5 py-1.5 rounded-lg bg-[#842029] hover:bg-[#640515] text-white text-xs font-semibold cursor-pointer shadow-2xs shrink-0"
                                                >
                                                    Inspect
                                                </button>
                                            </div>
                                        ))}
                                    {pendingVerificationsCount === 0 && (
                                        <p className="text-center text-xs text-gray-400 py-6">
                                            All verification requests have been reviewed.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Pending Reports Quick List */}
                            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-[#640515] flex items-center gap-2">
                                        <AlertTriangle size={18} /> Pending Safety Reports ({pendingReportsCount})
                                    </h3>
                                    <button
                                        onClick={() => setActiveTab("reports")}
                                        className="text-xs font-semibold text-[#842029] hover:underline cursor-pointer"
                                    >
                                        View All →
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {reports
                                        .filter((r) => r.status === "pending")
                                        .slice(0, 4)
                                        .map((r) => (
                                            <div
                                                key={r._id}
                                                className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-100 flex items-center justify-between gap-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-xs text-gray-900 truncate">
                                                        {r.reportedProfileId?.name || "Reported Member"}
                                                    </p>
                                                    <p className="text-[11px] text-amber-800 capitalize font-medium truncate">
                                                        Reason: {r.reason?.replace(/_/g, " ")}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedReport(r)}
                                                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shadow-2xs shrink-0"
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        ))}
                                    {pendingReportsCount === 0 && (
                                        <p className="text-center text-xs text-gray-400 py-6">
                                            No outstanding safety reports filed.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: KYC VERIFICATIONS */}
                {activeTab === "verifications" && (
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-gray-400" />
                                <select
                                    value={verificationFilter}
                                    onChange={(e) => setVerificationFilter(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 outline-none bg-white cursor-pointer"
                                >
                                    <option value="all">All Verification Statuses</option>
                                    <option value="pending">Pending Review Only</option>
                                    <option value="verified">Verified / Approved</option>
                                    <option value="rejected">Rejected Only</option>
                                </select>
                            </div>
                            <span className="text-xs text-gray-400">
                                Showing {filteredVerifications.length} submissions
                            </span>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-xs text-gray-400">Loading verifications...</div>
                        ) : filteredVerifications.length === 0 ? (
                            <div className="p-12 text-center text-xs text-gray-400">No verification requests found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[650px]">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                                            <th className="pb-3 px-3">Applicant</th>
                                            <th className="pb-3 px-3">Document Type</th>
                                            <th className="pb-3 px-3">Submitted</th>
                                            <th className="pb-3 px-3">Status</th>
                                            <th className="pb-3 px-3">Review Notes</th>
                                            <th className="pb-3 px-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredVerifications.map((v) => {
                                            const isPending = ["submitted", "under_review", "pending"].includes(v.status)
                                            return (
                                                <tr key={v._id} className="hover:bg-rose-50/20 transition-colors">
                                                    <td className="py-3 px-3 font-bold text-gray-900">
                                                        {v.profileId?.name || "MeriJodi Member"}
                                                        <div className="text-[11px] text-gray-400 font-normal">
                                                            {v.profileId?.location?.city || "India"}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 capitalize font-medium">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <FileText size={14} className="text-gray-400" />
                                                            {v.documentType?.replace(/_/g, " ") || "Govt ID"}
                                                        </span>
                                                        {v.documentUrl && (
                                                            <a
                                                                href={v.documentUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="block text-[11px] text-[#842029] hover:underline mt-0.5"
                                                            >
                                                                View Doc ↗
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-gray-500 text-xs">
                                                        {new Date(v.createdAt).toLocaleDateString([], {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                                v.status === "verified" || v.status === "approved"
                                                                    ? "bg-emerald-100 text-emerald-800"
                                                                    : v.status === "rejected"
                                                                    ? "bg-rose-100 text-rose-800"
                                                                    : "bg-amber-100 text-amber-800"
                                                            }`}
                                                        >
                                                            {v.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-xs text-gray-500 max-w-xs truncate">
                                                        {v.reviewNote || "—"}
                                                    </td>
                                                    <td className="py-3 px-3 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedVerification(v)
                                                                setVerificationNote(v.reviewNote || "")
                                                            }}
                                                            className="px-3.5 py-1.5 rounded-lg bg-[#842029] hover:bg-[#640515] text-white text-xs font-semibold cursor-pointer shadow-2xs inline-flex items-center gap-1"
                                                        >
                                                            <Eye size={13} /> {isPending ? "Review" : "Inspect"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: SAFETY & ABUSE REPORTS */}
                {activeTab === "reports" && (
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-gray-400" />
                                <select
                                    value={reportFilter}
                                    onChange={(e) => setReportFilter(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 outline-none bg-white cursor-pointer"
                                >
                                    <option value="all">All Report Statuses</option>
                                    <option value="pending">Pending Review Only</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="dismissed">Dismissed</option>
                                </select>
                            </div>
                            <span className="text-xs text-gray-400">
                                Showing {filteredReports.length} reports
                            </span>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-xs text-gray-400">Loading abuse reports...</div>
                        ) : filteredReports.length === 0 ? (
                            <div className="p-12 text-center text-xs text-gray-400">No safety reports in this category.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[650px]">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                                            <th className="pb-3 px-3">Reported Member</th>
                                            <th className="pb-3 px-3">Reporter</th>
                                            <th className="pb-3 px-3">Violation Reason</th>
                                            <th className="pb-3 px-3">Reported On</th>
                                            <th className="pb-3 px-3">Status</th>
                                            <th className="pb-3 px-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredReports.map((r) => (
                                            <tr key={r._id} className="hover:bg-amber-50/20 transition-colors">
                                                <td className="py-3 px-3 font-bold text-gray-900">
                                                    {r.reportedProfileId?.name || "Reported Member"}
                                                </td>
                                                <td className="py-3 px-3 text-gray-600">
                                                    {r.reporterProfileId?.name || "Member"}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 capitalize">
                                                        {r.reason?.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-gray-500 text-xs">
                                                    {new Date(r.createdAt).toLocaleDateString([], {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                            r.status === "resolved"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : r.status === "dismissed"
                                                                ? "bg-gray-100 text-gray-800"
                                                                : "bg-amber-100 text-amber-800"
                                                        }`}
                                                    >
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReport(r)
                                                            setReportActionNote(r.actionTaken || "")
                                                        }}
                                                        className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer shadow-2xs"
                                                    >
                                                        Inspect Report
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: USER DIRECTORY & MANAGEMENT */}
                {activeTab === "users" && (
                    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                            <div className="relative flex-1 max-w-md">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, phone, city, occupation..."
                                    value={userSearch}
                                    onChange={(e) => {
                                        setUserSearch(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm outline-none focus:border-[#842029] bg-gray-50/50"
                                />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <select
                                    value={userStatusFilter}
                                    onChange={(e) => {
                                        setUserStatusFilter(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 outline-none bg-white cursor-pointer"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="banned">Banned</option>
                                </select>

                                <select
                                    value={userRoleFilter}
                                    onChange={(e) => {
                                        setUserRoleFilter(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 outline-none bg-white cursor-pointer"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="user">Member (User)</option>
                                    <option value="admin">Administrator</option>
                                </select>

                                <select
                                    value={userGenderFilter}
                                    onChange={(e) => {
                                        setUserGenderFilter(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 outline-none bg-white cursor-pointer"
                                >
                                    <option value="all">All Genders</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>

                                <select
                                    value={userVerifiedFilter}
                                    onChange={(e) => {
                                        setUserVerifiedFilter(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 outline-none bg-white cursor-pointer"
                                >
                                    <option value="all">Verification Badge</option>
                                    <option value="true">Verified Only</option>
                                    <option value="false">Unverified Only</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-xs text-gray-400">Loading users...</div>
                        ) : users.length === 0 ? (
                            <div className="p-12 text-center text-xs text-gray-400">No users match the search and filter criteria.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[750px]">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                                            <th className="pb-3 px-3">Member</th>
                                            <th className="pb-3 px-3">Contact</th>
                                            <th className="pb-3 px-3">Location &amp; Career</th>
                                            <th className="pb-3 px-3">Role</th>
                                            <th className="pb-3 px-3">Status</th>
                                            <th className="pb-3 px-3">Verification</th>
                                            <th className="pb-3 px-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {users.map((u) => {
                                            const isBanned = u.status === "banned"
                                            const isAdmin = u.role === "admin"
                                            return (
                                                <tr key={u._id} className="hover:bg-rose-50/20 transition-colors">
                                                    <td className="py-3.5 px-3">
                                                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                                            {u.name}
                                                            {isAdmin && (
                                                                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[9px] font-extrabold uppercase tracking-wider">
                                                                    Admin
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-gray-400 capitalize">
                                                            {u.gender || "Not specified"} • Profile {u.profileCompletionPct || 50}%
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-xs text-gray-600">
                                                        <div>{u.email}</div>
                                                        <div className="text-[11px] text-gray-400">{u.phone || "No phone"}</div>
                                                    </td>
                                                    <td className="py-3.5 px-3 text-xs text-gray-600">
                                                        <div className="font-medium text-gray-800">{u.location?.city || "India"}</div>
                                                        <div className="text-[11px] text-gray-400">{u.career?.occupation || "Professional"}</div>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <button
                                                            onClick={() =>
                                                                setRoleConfirm({
                                                                    userId: u._id,
                                                                    userName: u.name,
                                                                    nextRole: isAdmin ? "user" : "admin",
                                                                })
                                                            }
                                                            title={isAdmin ? "Demote to standard Member" : "Promote to Admin"}
                                                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase cursor-pointer transition-all ${
                                                                isAdmin
                                                                    ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                            }`}
                                                        >
                                                            {u.role} ⇅
                                                        </button>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                                u.status === "active"
                                                                    ? "bg-emerald-100 text-emerald-800"
                                                                    : u.status === "banned"
                                                                    ? "bg-red-100 text-red-800"
                                                                    : "bg-gray-100 text-gray-700"
                                                            }`}
                                                        >
                                                            {u.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        {u.isVerified ? (
                                                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                                                                <CheckCircle size={14} /> Verified
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs font-medium">Unverified</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleViewUserDetails(u._id)}
                                                                title="Inspect Full Profile Dossier"
                                                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer shadow-2xs"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggleVerification(u._id, u.isVerified)}
                                                                title={u.isVerified ? "Remove Verification Badge" : "Grant Verified Badge"}
                                                                disabled={actionLoading === u._id}
                                                                className={`p-1.5 rounded-lg cursor-pointer shadow-2xs transition-all ${
                                                                    u.isVerified
                                                                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                                }`}
                                                            >
                                                                <UserCheck size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateUserStatus(u._id, isBanned ? "active" : "banned")}
                                                                title={isBanned ? "Unban Account" : "Ban User Account"}
                                                                disabled={actionLoading === u._id}
                                                                className={`p-1.5 rounded-lg cursor-pointer shadow-2xs transition-all ${
                                                                    isBanned
                                                                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                                        : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                                                }`}
                                                            >
                                                                <UserX size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u._id, u.name)}
                                                                title="Delete User Permanently"
                                                                disabled={actionLoading === u._id}
                                                                className="p-1.5 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer shadow-2xs"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {userPagination.totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4 text-xs text-gray-500">
                                <div>
                                    Page {userPagination.page} of {userPagination.totalPages} ({userPagination.total} Total Users)
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={userPagination.page <= 1}
                                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(userPagination.totalPages, p + 1))}
                                        disabled={userPagination.page >= userPagination.totalPages}
                                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 5: SETTINGS */}
                {activeTab === "settings" && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-2xs max-w-3xl mx-auto">
                        <div className="flex gap-2 border-b border-gray-100 pb-3 mb-6">
                            <button
                                onClick={() => setSettingsActiveTab("personal")}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                                    settingsActiveTab === "personal"
                                        ? "bg-rose-50 text-[#842029] font-bold"
                                        : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                                <User size={15} /> Personal Information
                            </button>
                            <button
                                onClick={() => setSettingsActiveTab("password")}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                                    settingsActiveTab === "password"
                                        ? "bg-rose-50 text-[#842029] font-bold"
                                        : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                                <Key size={15} /> Password &amp; Security
                            </button>
                            <button
                                onClick={() => setSettingsActiveTab("system")}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                                    settingsActiveTab === "system"
                                        ? "bg-rose-50 text-[#842029] font-bold"
                                        : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                                <Server size={15} /> System Health
                            </button>
                        </div>

                        {/* Personal Information */}
                        {settingsActiveTab === "personal" && (
                            <form onSubmit={handleSavePersonalSettings} className="space-y-4">
                                <h3 className="font-bold text-gray-900 text-sm mb-1">Personal Details</h3>
                                <p className="text-xs text-gray-400 mb-4">Update administrator name, email, and contact details.</p>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={settingsPersonalForm.name}
                                        onChange={(e) => setSettingsPersonalForm({ ...settingsPersonalForm, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:border-[#842029] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={settingsPersonalForm.email}
                                        onChange={(e) => setSettingsPersonalForm({ ...settingsPersonalForm, email: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:border-[#842029] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={settingsPersonalForm.phone}
                                        onChange={(e) => setSettingsPersonalForm({ ...settingsPersonalForm, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:border-[#842029] outline-none"
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={settingsPersonalSaving}
                                        className="px-6 py-2.5 rounded-xl bg-[#842029] text-white text-xs sm:text-sm font-semibold hover:bg-[#6b1b27] transition-all cursor-pointer shadow-md"
                                    >
                                        {settingsPersonalSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Password & Security */}
                        {settingsActiveTab === "password" && (
                            <form onSubmit={handleSavePasswordSettings} className="space-y-4">
                                <h3 className="font-bold text-gray-900 text-sm mb-1">Change Admin Password</h3>
                                <p className="text-xs text-gray-400 mb-4">Ensure your account uses a secure password with at least 6 characters.</p>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Current Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={settingsPasswordForm.currentPassword}
                                        onChange={(e) => setSettingsPasswordForm({ ...settingsPasswordForm, currentPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:border-[#842029] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={settingsPasswordForm.newPassword}
                                        onChange={(e) => setSettingsPasswordForm({ ...settingsPasswordForm, newPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:border-[#842029] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={settingsPasswordForm.confirmPassword}
                                        onChange={(e) => setSettingsPasswordForm({ ...settingsPasswordForm, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:border-[#842029] outline-none"
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={settingsPasswordSaving}
                                        className="px-6 py-2.5 rounded-xl bg-[#842029] text-white text-xs sm:text-sm font-semibold hover:bg-[#6b1b27] transition-all cursor-pointer shadow-md"
                                    >
                                        {settingsPasswordSaving ? "Updating..." : "Update Password"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* System Health */}
                        {settingsActiveTab === "system" && (
                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-900 text-sm mb-1">System Health &amp; Infrastructure</h3>
                                <p className="text-xs text-gray-400 mb-4">Live health status of database and cache services.</p>

                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-xs text-gray-900">MongoDB Atlas Database</p>
                                        <p className="text-[11px] text-gray-400">Connected &amp; Synced</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">200 OK</span>
                                </div>

                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-xs text-gray-900">Redis Cache &amp; Session Store</p>
                                        <p className="text-[11px] text-gray-400">Upstash / TTL Store Fallback</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Active</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* MODAL 1: VERIFICATION REVIEW */}
            {selectedVerification && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-[#640515] text-base flex items-center gap-2">
                                <ShieldCheck size={20} /> Review KYC Submission
                            </h3>
                            <button
                                onClick={() => setSelectedVerification(null)}
                                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Applicant Name</p>
                                <p className="font-bold text-gray-900 text-sm">
                                    {selectedVerification.profileId?.name || "MeriJodi Member"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase mb-1.5">
                                    Document Proof ({selectedVerification.documentType?.replace(/_/g, " ")})
                                </p>
                                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center max-h-64 p-2 relative group">
                                    {selectedVerification.documentUrl ? (
                                        selectedVerification.documentUrl.match(/\.(jpeg|jpg|png|webp|gif)/i) || !selectedVerification.documentUrl.includes(".pdf") ? (
                                            <img
                                                src={selectedVerification.documentUrl}
                                                alt="KYC Document"
                                                className="w-full h-auto object-contain max-h-60 rounded-xl"
                                            />
                                        ) : (
                                            <div className="p-8 text-center">
                                                <FileText size={36} className="mx-auto text-[#842029] mb-2" />
                                                <p className="text-xs font-semibold text-gray-700">PDF Document Uploaded</p>
                                                <a
                                                    href={selectedVerification.documentUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[#842029] hover:underline"
                                                >
                                                    Open Document in New Tab <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        )
                                    ) : (
                                        <p className="p-8 text-xs text-gray-400">No document image preview available.</p>
                                    )}
                                </div>
                                {selectedVerification.documentUrl && (
                                    <div className="mt-1 text-right">
                                        <a
                                            href={selectedVerification.documentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[11px] font-semibold text-[#842029] hover:underline inline-flex items-center gap-1"
                                        >
                                            Open Full Document in New Tab <ExternalLink size={12} />
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Admin Review Note (optional feedback)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Verified valid government photo identification"
                                    value={verificationNote}
                                    onChange={(e) => setVerificationNote(e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                />
                            </div>

                            <div className="flex gap-2.5 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => handleReviewVerification(selectedVerification._id, "rejected")}
                                    disabled={actionLoading === selectedVerification._id}
                                    className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                                >
                                    <XCircle size={14} /> Reject Document
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleReviewVerification(selectedVerification._id, "verified")}
                                    disabled={actionLoading === selectedVerification._id}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5"
                                >
                                    <CheckCircle size={14} /> Approve &amp; Verify Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: ABUSE REPORT INSPECTION */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-amber-800 text-base flex items-center gap-2">
                                <AlertTriangle size={20} /> Inspect Safety Report
                            </h3>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase">Reported Member</p>
                                    <p className="font-bold text-gray-900 text-sm">
                                        {selectedReport.reportedProfileId?.name || "Reported Member"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase">Violation Reason</p>
                                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-bold capitalize">
                                        {selectedReport.reason?.replace(/_/g, " ")}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200">
                                <p className="text-[11px] font-bold text-amber-900 mb-1">Reporter Description:</p>
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    {selectedReport.description || "No additional commentary provided by reporter."}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Resolution / Action Taken Note
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Warning issued to user, inappropriate content removed"
                                    value={reportActionNote}
                                    onChange={(e) => setReportActionNote(e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-amber-600"
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-2 flex-wrap">
                                <button
                                    type="button"
                                    onClick={() => handleUpdateReport(selectedReport._id, "dismissed")}
                                    disabled={actionLoading === selectedReport._id}
                                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                                >
                                    Dismiss Report
                                </button>
                                {selectedReport.reportedProfileId?.userId && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleUpdateReport(
                                                selectedReport._id,
                                                "resolved",
                                                true,
                                                selectedReport.reportedProfileId?.userId?._id || selectedReport.reportedProfileId?.userId
                                            )
                                        }
                                        disabled={actionLoading === selectedReport._id}
                                        className="px-3.5 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold cursor-pointer"
                                    >
                                        Ban Reported User
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleUpdateReport(selectedReport._id, "resolved")}
                                    disabled={actionLoading === selectedReport._id}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                                >
                                    Mark as Resolved
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: FULL USER DOSSIER INSPECTOR (FIGMA DESIGN MATCH) */}
            {selectedUserDetail && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 p-6 sm:p-8">
                        {/* Header Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-5 mb-6 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-50 border border-rose-100 overflow-hidden flex items-center justify-center font-bold text-xl text-[#842029] shrink-0">
                                    {selectedUserDetail.profile?.photos?.[0]?.url ? (
                                        <img
                                            src={selectedUserDetail.profile.photos[0].url}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        selectedUserDetail.profile?.name ? selectedUserDetail.profile.name.charAt(0).toUpperCase() : "U"
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 font-serif">
                                            {selectedUserDetail.profile?.name || selectedUserDetail.user?.name || "Member Profile"}
                                        </h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                            selectedUserDetail.user?.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                                        }`}>
                                            {selectedUserDetail.user?.status || "active"}
                                        </span>
                                        {selectedUserDetail.profile?.isVerified && (
                                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                                                <CheckCircle size={12} /> Verified
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                                        <span className="flex items-center gap-1"><MapPin size={13} className="text-[#842029]" /> {selectedUserDetail.profile?.location?.city || "India"}, {selectedUserDetail.profile?.location?.state || ""}</span>
                                        <span className="flex items-center gap-1"><Briefcase size={13} className="text-[#842029]" /> {selectedUserDetail.profile?.career?.occupation || "Professional"}</span>
                                        <span className="flex items-center gap-1"><Calendar size={13} className="text-[#842029]" /> Joined {new Date(selectedUserDetail.user?.createdAt || Date.now()).toLocaleDateString([], { month: "short", year: "numeric" })}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                                <button
                                    onClick={handleOpenEditModal}
                                    className="px-3.5 py-2 rounded-xl bg-[#842029] hover:bg-[#640515] text-white text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5"
                                >
                                    <Edit3 size={14} /> Edit Profile
                                </button>
                                <button
                                    onClick={() => setAssignPlanModalOpen(true)}
                                    className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5"
                                >
                                    <CreditCard size={14} /> Assign Plan
                                </button>
                                <button
                                    onClick={() => setSelectedUserDetail(null)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer bg-gray-100"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Photo Gallery */}
                        {selectedUserDetail.profile?.photos?.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-bold text-[#842029] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <ImageIcon size={14} /> Profile Photos ({selectedUserDetail.profile.photos.length})
                                </h4>
                                <div className="flex gap-2.5 overflow-x-auto pb-2">
                                    {selectedUserDetail.profile.photos.map((p, idx) => {
                                        const url = typeof p === "string" ? p : p.url
                                        return (
                                            <a
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-20 h-24 rounded-xl border border-gray-200 overflow-hidden shrink-0 bg-gray-100 relative group"
                                            >
                                                <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Profile Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Card 1: Profile Info & Bio */}
                            <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100">
                                <h4 className="font-bold text-[#842029] text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <User size={14} /> Profile Info &amp; Bio
                                </h4>
                                <div className="space-y-2.5 text-xs text-gray-700">
                                    <div>
                                        <span className="text-gray-400 block text-[11px]">About Me</span>
                                        <p className="font-medium text-gray-800 leading-relaxed mt-0.5">
                                            {selectedUserDetail.profile?.aboutMe || "No bio description written yet."}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60">
                                        <div><span className="text-gray-400 block text-[11px]">Location</span><span className="font-bold">{selectedUserDetail.profile?.location?.city || "—"}, {selectedUserDetail.profile?.location?.state || "India"}</span></div>
                                        <div><span className="text-gray-400 block text-[11px]">Occupation</span><span className="font-bold">{selectedUserDetail.profile?.career?.occupation || "—"}</span></div>
                                        <div><span className="text-gray-400 block text-[11px]">Education</span><span className="font-bold">{selectedUserDetail.profile?.education?.highestDegree || "—"}</span></div>
                                        <div><span className="text-gray-400 block text-[11px]">Created By</span><span className="font-bold capitalize">{selectedUserDetail.profile?.createdBy || "Self"}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Lifestyle Chips */}
                            <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100">
                                <h4 className="font-bold text-[#842029] text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Sparkles size={14} /> Lifestyle &amp; Habits
                                </h4>
                                <div className="space-y-3 text-xs">
                                    <div>
                                        <span className="text-gray-400 block text-[11px] mb-1.5">Diet Preference</span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                                            🥗 {selectedUserDetail.profile?.lifestyle?.diet || "Vegetarian"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[11px] mb-1.5">Habits &amp; Routine</span>
                                        <div className="flex gap-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                                                🚭 Smoking: {selectedUserDetail.profile?.lifestyle?.smoking ? "Yes" : "No"}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                                                🍷 Drinking: {selectedUserDetail.profile?.lifestyle?.drinking ? "Yes" : "No"}
                                            </span>
                                            {selectedUserDetail.profile?.lifestyle?.fitness && (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-[#842029] font-semibold border border-rose-200">
                                                    🏃 Fitness: {selectedUserDetail.profile.lifestyle.fitness}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Personal Details */}
                            <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100">
                                <h4 className="font-bold text-[#842029] text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <User size={14} /> Personal Details
                                </h4>
                                <div className="grid grid-cols-2 gap-2.5 text-xs">
                                    <div><span className="text-gray-400 block text-[11px]">Age:</span> <p className="font-bold">{selectedUserDetail.profile?.dateOfBirth ? `${Math.floor((Date.now() - new Date(selectedUserDetail.profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} Years` : "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Height:</span> <p className="font-bold">{selectedUserDetail.profile?.heightCm ? `${selectedUserDetail.profile.heightCm} cm` : "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Date of Birth:</span> <p className="font-bold">{selectedUserDetail.profile?.dateOfBirth ? new Date(selectedUserDetail.profile.dateOfBirth).toLocaleDateString() : "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Place of Birth:</span> <p className="font-bold">{selectedUserDetail.profile?.placeOfBirth || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Gender:</span> <p className="font-bold capitalize">{selectedUserDetail.profile?.gender || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Marital Status:</span> <p className="font-bold capitalize">{selectedUserDetail.profile?.maritalStatus?.replace(/_/g, " ") || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Email:</span> <p className="font-bold truncate">{selectedUserDetail.user?.email}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Phone:</span> <p className="font-bold">{selectedUserDetail.user?.phone || "—"}</p></div>
                                </div>
                            </div>

                            {/* Card 4: Family Background */}
                            <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100">
                                <h4 className="font-bold text-[#842029] text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Users size={14} /> Family Background
                                </h4>
                                <div className="grid grid-cols-2 gap-2.5 text-xs">
                                    <div><span className="text-gray-400 block text-[11px]">Mother Tongue:</span> <p className="font-bold">{selectedUserDetail.profile?.motherTongue || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Father's Occupation:</span> <p className="font-bold">{selectedUserDetail.profile?.family?.fatherOccupation || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Mother's Occupation:</span> <p className="font-bold">{selectedUserDetail.profile?.family?.motherOccupation || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Family Location:</span> <p className="font-bold">{selectedUserDetail.profile?.family?.familyLocation || selectedUserDetail.profile?.location?.city || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Family Values:</span> <p className="font-bold capitalize">{selectedUserDetail.profile?.family?.familyValues || "Moderate"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Siblings:</span> <p className="font-bold">{selectedUserDetail.profile?.family?.numBrothers || 0} Brother(s), {selectedUserDetail.profile?.family?.numSisters || 0} Sister(s)</p></div>
                                </div>
                            </div>

                            {/* Card 5: Career & Education */}
                            <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100">
                                <h4 className="font-bold text-[#842029] text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Briefcase size={14} /> Career &amp; Education
                                </h4>
                                <div className="grid grid-cols-2 gap-2.5 text-xs">
                                    <div><span className="text-gray-400 block text-[11px]">Highest Degree:</span> <p className="font-bold">{selectedUserDetail.profile?.education?.highestDegree || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Institution:</span> <p className="font-bold">{selectedUserDetail.profile?.education?.institution || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Occupation:</span> <p className="font-bold">{selectedUserDetail.profile?.career?.occupation || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Company Name:</span> <p className="font-bold">{selectedUserDetail.profile?.career?.companyName || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Annual Income:</span> <p className="font-bold">{selectedUserDetail.profile?.career?.annualIncome || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Work Location:</span> <p className="font-bold">{selectedUserDetail.profile?.career?.workLocation || selectedUserDetail.profile?.location?.city || "—"}</p></div>
                                </div>
                            </div>

                            {/* Card 6: Religious & Astrological Details */}
                            <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100">
                                <h4 className="font-bold text-[#842029] text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <Award size={14} /> Religious Details
                                </h4>
                                <div className="grid grid-cols-2 gap-2.5 text-xs">
                                    <div><span className="text-gray-400 block text-[11px]">Religion:</span> <p className="font-bold">{selectedUserDetail.profile?.religion || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Caste:</span> <p className="font-bold">{selectedUserDetail.profile?.caste || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Sub-Caste:</span> <p className="font-bold">{selectedUserDetail.profile?.subCaste || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Gotra:</span> <p className="font-bold">{selectedUserDetail.profile?.gotham || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Rashi:</span> <p className="font-bold">{selectedUserDetail.profile?.rashi || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Nakshatra:</span> <p className="font-bold">{selectedUserDetail.profile?.nakshtra || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Manglik:</span> <p className="font-bold capitalize">{selectedUserDetail.profile?.manglik || "—"}</p></div>
                                    <div><span className="text-gray-400 block text-[11px]">Birth Time:</span> <p className="font-bold">{selectedUserDetail.profile?.timeOfBirth || "—"}</p></div>
                                </div>
                            </div>
                        </div>

                        {/* Billing & Subscriptions Card */}
                        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-2xs mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <h4 className="font-bold text-[#640515] text-sm flex items-center gap-2">
                                    <CreditCard size={18} /> Billing &amp; Subscriptions
                                </h4>
                                <button
                                    onClick={() => setAssignPlanModalOpen(true)}
                                    className="px-3.5 py-1.5 rounded-lg bg-[#842029] hover:bg-[#640515] text-white text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1 self-start sm:self-auto"
                                >
                                    <Plus size={14} /> Assign Plan
                                </button>
                            </div>

                            {/* Active Plan Banner */}
                            <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50/50 to-amber-50/30 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Plan Status</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                            selectedUserDetail.activeSubscription ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
                                        }`}>
                                            {selectedUserDetail.activeSubscription ? "ACTIVE" : "FREE TIER"}
                                        </span>
                                        <span className="font-bold text-gray-900 text-sm">
                                            {selectedUserDetail.activeSubscription?.planName || "Standard Free Tier"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-xs text-gray-600">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-gray-400 block">Billing Cycle</span>
                                        <span className="font-bold capitalize">{selectedUserDetail.activeSubscription?.billingCycle || "Standard"}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-gray-400 block">Valid Until</span>
                                        <span className="font-bold">
                                            {selectedUserDetail.activeSubscription?.expiryDate ? new Date(selectedUserDetail.activeSubscription.expiryDate).toLocaleDateString() : "Permanent"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Subscription History Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                                            <th className="pb-2 px-2">Plan Name</th>
                                            <th className="pb-2 px-2">Amount Paid</th>
                                            <th className="pb-2 px-2">Sub. Date</th>
                                            <th className="pb-2 px-2">Next Billing Date</th>
                                            <th className="pb-2 px-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {selectedUserDetail.subscriptions?.map((sub) => (
                                            <tr key={sub._id}>
                                                <td className="py-2.5 px-2 font-bold text-gray-900">{sub.planName}</td>
                                                <td className="py-2.5 px-2">₹{sub.amount?.toLocaleString("en-IN") || 0}</td>
                                                <td className="py-2.5 px-2">{new Date(sub.startDate || sub.createdAt).toLocaleDateString()}</td>
                                                <td className="py-2.5 px-2">{sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : "—"}</td>
                                                <td className="py-2.5 px-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        sub.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
                                                    }`}>
                                                        {sub.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!selectedUserDetail.subscriptions || selectedUserDetail.subscriptions.length === 0) && (
                                            <tr>
                                                <td colSpan="5" className="py-4 text-center text-gray-400">
                                                    No subscription history records found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Dossier Action Bar */}
                        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() =>
                                        handleToggleVerification(selectedUserDetail.user._id, selectedUserDetail.profile?.isVerified)
                                    }
                                    disabled={actionLoading === selectedUserDetail.user._id}
                                    className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <UserCheck size={14} />
                                    {selectedUserDetail.profile?.isVerified ? "Revoke Verified Badge" : "Grant Verified Badge"}
                                </button>
                                <button
                                    onClick={() =>
                                        handleUpdateUserStatus(
                                            selectedUserDetail.user._id,
                                            selectedUserDetail.user.status === "banned" ? "active" : "banned"
                                        )
                                    }
                                    disabled={actionLoading === selectedUserDetail.user._id}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                                        selectedUserDetail.user.status === "banned"
                                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                    }`}
                                >
                                    <UserX size={14} />
                                    {selectedUserDetail.user.status === "banned" ? "Unban Account" : "Ban Account"}
                                </button>
                                <button
                                    onClick={() =>
                                        handleDeleteUser(selectedUserDetail.user._id, selectedUserDetail.user.name)
                                    }
                                    className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 hover:bg-rose-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Trash2 size={14} /> Delete User
                                </button>
                            </div>

                            <button
                                onClick={() => setSelectedUserDetail(null)}
                                className="px-5 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold cursor-pointer"
                            >
                                Close Dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: EDIT USER PROFILE */}
            {editProfileModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 p-6 sm:p-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                            <h3 className="font-bold text-[#640515] text-base sm:text-lg flex items-center gap-2">
                                <Edit3 size={18} /> Edit Member Profile Dossier
                            </h3>
                            <button
                                onClick={() => setEditProfileModalOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUserProfile} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={editFormData.phone}
                                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">About Me (Bio)</label>
                                <textarea
                                    rows={3}
                                    value={editFormData.aboutMe}
                                    onChange={(e) => setEditFormData({ ...editFormData, aboutMe: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Gender</label>
                                    <select
                                        value={editFormData.gender}
                                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029] bg-white"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={editFormData.dateOfBirth}
                                        onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Marital Status</label>
                                    <select
                                        value={editFormData.maritalStatus}
                                        onChange={(e) => setEditFormData({ ...editFormData, maritalStatus: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029] bg-white"
                                    >
                                        <option value="never_married">Never Married</option>
                                        <option value="divorced">Divorced</option>
                                        <option value="widowed">Widowed</option>
                                        <option value="separated">Separated</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={editFormData.city}
                                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">State</label>
                                    <input
                                        type="text"
                                        value={editFormData.state}
                                        onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Highest Degree</label>
                                    <input
                                        type="text"
                                        value={editFormData.highestDegree}
                                        onChange={(e) => setEditFormData({ ...editFormData, highestDegree: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Occupation</label>
                                    <input
                                        type="text"
                                        value={editFormData.occupation}
                                        onChange={(e) => setEditFormData({ ...editFormData, occupation: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Annual Income</label>
                                    <input
                                        type="text"
                                        value={editFormData.annualIncome}
                                        onChange={(e) => setEditFormData({ ...editFormData, annualIncome: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Religion</label>
                                    <input
                                        type="text"
                                        value={editFormData.religion}
                                        onChange={(e) => setEditFormData({ ...editFormData, religion: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Caste</label>
                                    <input
                                        type="text"
                                        value={editFormData.caste}
                                        onChange={(e) => setEditFormData({ ...editFormData, caste: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Sub-Caste</label>
                                    <input
                                        type="text"
                                        value={editFormData.subCaste}
                                        onChange={(e) => setEditFormData({ ...editFormData, subCaste: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2.5 justify-end pt-3">
                                <button
                                    type="button"
                                    onClick={() => setEditProfileModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSaving}
                                    className="px-5 py-2 rounded-xl bg-[#842029] hover:bg-[#640515] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                                >
                                    {editSaving ? "Saving..." : "Save Profile Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: ASSIGN MEMBERSHIP PLAN */}
            {assignPlanModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 p-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                            <h3 className="font-bold text-[#640515] text-base flex items-center gap-2">
                                <CreditCard size={18} /> Assign Membership Plan
                            </h3>
                            <button
                                onClick={() => setAssignPlanModalOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAssignSubscriptionPlan} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Plan Tier</label>
                                <select
                                    value={planFormData.planName}
                                    onChange={(e) => {
                                        const name = e.target.value
                                        let amount = 1999
                                        let id = "premium"
                                        if (name === "Gold Plan") { amount = 999; id = "gold" }
                                        if (name === "Diamond Plan") { amount = 3499; id = "diamond" }
                                        if (name === "Free Plan") { amount = 0; id = "free" }
                                        setPlanFormData({ ...planFormData, planName: name, planId: id, amount })
                                    }}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029] bg-white"
                                >
                                    <option value="Premium Plan">Premium Plan (₹1,999 / yr)</option>
                                    <option value="Gold Plan">Gold Plan (₹999 / 6 mo)</option>
                                    <option value="Diamond Plan">Diamond Plan (₹3,499 / yr)</option>
                                    <option value="Free Plan">Free Plan (₹0)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Amount (INR)</label>
                                    <input
                                        type="number"
                                        value={planFormData.amount}
                                        onChange={(e) => setPlanFormData({ ...planFormData, amount: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Duration (Days)</label>
                                    <input
                                        type="number"
                                        value={planFormData.durationDays}
                                        onChange={(e) => setPlanFormData({ ...planFormData, durationDays: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Admin Note</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Approved promotional extension"
                                    value={planFormData.notes}
                                    onChange={(e) => setPlanFormData({ ...planFormData, notes: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#842029]"
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAssignPlanModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={planSaving}
                                    className="px-5 py-2 rounded-xl bg-[#842029] hover:bg-[#640515] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                                >
                                    {planSaving ? "Assigning..." : "Assign & Activate"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRM DELETE MODAL */}
            <ConfirmModal
                isOpen={Boolean(deleteConfirm)}
                title="Permanently Delete Account"
                message={`Are you sure you want to permanently delete user "${deleteConfirm?.userName || "this member"}"? All associated biodata, photos, messages, and preferences will be permanently wiped.`}
                confirmText="Delete Account"
                cancelText="Cancel"
                type="danger"
                loading={actionLoading === deleteConfirm?.userId}
                onConfirm={performDeleteUser}
                onCancel={() => setDeleteConfirm(null)}
            />

            {/* CONFIRM ROLE CHANGE MODAL */}
            <ConfirmModal
                isOpen={Boolean(roleConfirm)}
                title="Change User Access Role"
                message={`Are you sure you want to change role for "${roleConfirm?.userName}" to ${roleConfirm?.nextRole?.toUpperCase()}?`}
                confirmText={`Promote to ${roleConfirm?.nextRole?.toUpperCase()}`}
                cancelText="Cancel"
                type="info"
                loading={actionLoading === roleConfirm?.userId}
                onConfirm={() => handleUpdateUserRole(roleConfirm.userId, roleConfirm.nextRole)}
                onCancel={() => setRoleConfirm(null)}
            />

            <Footer />
        </div>
    )
}
