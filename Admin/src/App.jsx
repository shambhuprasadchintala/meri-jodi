import { useState, useEffect, useCallback, useRef } from "react"
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  LogOut,
  Search,
  Menu,
  X,
  FileText,
  Activity,
  UserCheck,
  UserX,
  Trash2,
  ExternalLink,
  Filter,
  RefreshCw,
  Heart,
  MessageCircle,
  Clock,
  Shield,
  Check,
  Settings as SettingsIcon,
  CreditCard,
  Edit3,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  Key,
  User,
  Phone,
  Mail,
  Lock,
  Server,
  DollarSign,
  Award,
  Plus
} from "lucide-react"

const API_BASE = "http://localhost:5000/api"

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "")
  const [adminUser, setAdminUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin_user") || "null")
    } catch {
      return null
    }
  })

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showAdminLoginPassword, setShowAdminLoginPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  // Navigation state
  // Tabs: 'overview' | 'users' | 'user-profile' | 'verifications' | 'reports' | 'settings'
  const [currentTab, setCurrentTab] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Data states
  const [stats, setStats] = useState(null)
  const [verifications, setVerifications] = useState([])
  const [reports, setReports] = useState([])
  const [usersList, setUsersList] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  // Active user detail dossier state (for 'user-profile' view)
  const [selectedUserDetail, setSelectedUserDetail] = useState(null)
  const [loadingUserDetail, setLoadingUserDetail] = useState(false)

  // Filters
  const [verificationFilter, setVerificationFilter] = useState("all")
  const [reportFilter, setReportFilter] = useState("all")
  const [userStatusFilter, setUserStatusFilter] = useState("all")
  const [userRoleFilter, setUserRoleFilter] = useState("all")
  const [userGenderFilter, setUserGenderFilter] = useState("all")
  const [userVerifiedFilter, setUserVerifiedFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const searchTimerRef = useRef(null)

  // Action Modals State
  const [selectedVerification, setSelectedVerification] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [actionNote, setActionNote] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  // Edit User Profile Modal State
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [editSaving, setEditSaving] = useState(false)

  // Assign Subscription Plan Modal State
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
  const [settingsActiveTab, setSettingsActiveTab] = useState("personal") // 'personal' | 'password' | 'system'
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
  const [showAdminCurrentPassword, setShowAdminCurrentPassword] = useState(false)
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false)
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false)
  const [settingsPasswordSaving, setSettingsPasswordSaving] = useState(false)

  // In-UI Toast Notification
  const [toast, setToast] = useState({ message: "", type: "success" })
  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type })
    setTimeout(() => setToast({ message: "", type: "success" }), 3500)
  }

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "danger",
    onConfirm: null,
  })

  const openConfirmModal = ({
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger",
    onConfirm,
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm,
    })
  }

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }))
  }

  // Handle Admin Sign In
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError("")
    setLoginLoading(true)
    try {
      let res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      })
      let data = await res.json()

      if (!res.ok && res.status !== 401 && res.status !== 403) {
        res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
        })
        data = await res.json()
      }

      if (!res.ok) throw new Error(data.message || "Login failed")

      const adm = data.data?.user || data.user || { name: "Admin", email: loginEmail, role: "admin" }
      const t = data.data?.accessToken || data.data?.token || data.token || "admin_session_token"
      setToken(t)
      setAdminUser(adm)
      localStorage.setItem("admin_token", t)
      localStorage.setItem("admin_user", JSON.stringify(adm))
      showToast(`Welcome back, ${adm.name || "Administrator"}!`, "success")
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_user")
    setToken("")
    setAdminUser(null)
    setStats(null)
    setUsersList([])
    setVerifications([])
    setReports([])
    showToast("Signed out successfully", "info")
  }

  // Centralized authenticated fetch handler with automatic session expiration detection
  const authFetch = useCallback(async (url, options = {}) => {
    const currentToken = token || localStorage.getItem("admin_token")
    if (!currentToken) return null
    try {
      const headers = {
        Authorization: `Bearer ${currentToken}`,
        ...(options.headers || {}),
      }
      if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json"
      }
      const res = await fetch(url, { ...options, headers })
      const json = await res.json().catch(() => ({}))

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("admin_token")
        localStorage.removeItem("admin_user")
        setToken("")
        setAdminUser(null)
        setStats(null)
        setUsersList([])
        setVerifications([])
        setReports([])
        setLoginError("Your admin session has expired. Please sign in again.")
        showToast("Session expired. Please sign in again.", "danger")
        return null
      }

      return { res, json, ok: res.ok && json.success, data: json.data }
    } catch (err) {
      console.error("API error for " + url, err)
      return null
    }
  }, [token])

  // Fetch Dashboard Stats & Overview
  const fetchStats = useCallback(async () => {
    const result = await authFetch(`${API_BASE}/v1/admin/stats`)
    if (result && result.ok) {
      setStats(result.data)
    }
  }, [authFetch])

  // Fetch Verifications
  const fetchVerifications = useCallback(async () => {
    setLoadingData(true)
    try {
      const result = await authFetch(`${API_BASE}/v1/admin/verifications?limit=100`)
      if (result && result.ok) {
        setVerifications(result.data?.verifications || (Array.isArray(result.data) ? result.data : []))
      }
    } finally {
      setLoadingData(false)
    }
  }, [authFetch])

  // Fetch Reports
  const fetchReports = useCallback(async () => {
    setLoadingData(true)
    try {
      const result = await authFetch(`${API_BASE}/v1/admin/reports?limit=100`)
      if (result && result.ok) {
        setReports(result.data?.reports || (Array.isArray(result.data) ? result.data : []))
      }
    } finally {
      setLoadingData(false)
    }
  }, [authFetch])

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoadingData(true)
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (userStatusFilter !== "all") params.append("status", userStatusFilter)
      if (userRoleFilter !== "all") params.append("role", userRoleFilter)
      if (userGenderFilter !== "all") params.append("gender", userGenderFilter)
      if (userVerifiedFilter !== "all") params.append("isVerified", userVerifiedFilter)
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim())

      const result = await authFetch(`${API_BASE}/v1/admin/users?${params.toString()}`)
      if (result && result.ok) {
        setUsersList(result.data?.users || (Array.isArray(result.data) ? result.data : []))
      }
    } finally {
      setLoadingData(false)
    }
  }, [authFetch, userStatusFilter, userRoleFilter, userGenderFilter, userVerifiedFilter, debouncedSearch])

  // Debounced search query
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [searchQuery])

  // Fetch Single User Detailed Dossier
  const fetchUserDetail = useCallback(async (userId) => {
    setLoadingUserDetail(true)
    try {
      const result = await authFetch(`${API_BASE}/v1/admin/users/${userId}`)
      if (result && result.ok) {
        setSelectedUserDetail(result.data)
      } else if (result) {
        showToast(result.json?.message || "Failed to load user details", "error")
      }
    } catch (err) {
      showToast("Error loading user details: " + err.message, "error")
    } finally {
      setLoadingUserDetail(false)
    }
  }, [authFetch])

  // View User Profile Tab
  const handleViewUserProfile = (userId) => {
    fetchUserDetail(userId)
    setCurrentTab("user-profile")
  }

  // Fetch Admin Settings Profile
  const fetchAdminProfile = useCallback(async () => {
    const result = await authFetch(`${API_BASE}/v1/admin/settings/profile`)
    if (result && result.ok) {
      const u = result.data
      setSettingsPersonalForm({
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        avatar: u.avatar || "",
      })
    }
  }, [authFetch])

  // Reload all data
  const refreshAll = () => {
    showToast("Refreshing data from database...", "info")
    fetchStats()
    fetchVerifications()
    fetchReports()
    fetchUsers()
    if (currentTab === "settings") fetchAdminProfile()
    if (currentTab === "user-profile" && selectedUserDetail?.user?._id) {
      fetchUserDetail(selectedUserDetail.user._id)
    }
  }

  useEffect(() => {
    if (!token) return
    fetchStats()
    if (currentTab === "overview") {
      fetchVerifications()
      fetchReports()
      fetchUsers()
    } else if (currentTab === "verifications") {
      fetchVerifications()
    } else if (currentTab === "reports") {
      fetchReports()
    } else if (currentTab === "users") {
      fetchUsers()
    } else if (currentTab === "settings") {
      fetchAdminProfile()
    }
  }, [token, currentTab, fetchStats, fetchVerifications, fetchReports, fetchUsers, fetchAdminProfile])

  // Handle KYC Document Review
  const handleReviewVerification = async (status) => {
    if (!selectedVerification) return
    setActionLoading(true)
    try {
      const result = await authFetch(`${API_BASE}/v1/admin/verifications/${selectedVerification._id}/review`, {
        method: "PUT",
        body: JSON.stringify({ status, reviewNote: actionNote.trim() || undefined }),
      })
      if (!result?.ok) throw new Error(result?.json?.message || "Failed to update verification")
      showToast(`Document ${status} successfully.`, "success")
      setSelectedVerification(null)
      setActionNote("")
      fetchVerifications()
      fetchStats()
    } catch (err) {
      showToast(err.message, "error")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Abuse Report Update
  const handleUpdateReport = async (status) => {
    if (!selectedReport) return
    setActionLoading(true)
    try {
      const result = await authFetch(`${API_BASE}/v1/admin/reports/${selectedReport._id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          actionTaken: actionNote.trim() || undefined,
          resolutionNotes: actionNote.trim() || undefined,
        }),
      })
      if (!result?.ok) throw new Error(result?.json?.message || "Failed to update report")
      showToast(`Report marked as ${status}.`, "success")
      setSelectedReport(null)
      setActionNote("")
      fetchReports()
      fetchStats()
    } catch (err) {
      showToast(err.message, "error")
    } finally {
      setActionLoading(false)
    }
  }

  // Handle User Status Change (Ban / Unban)
  const handleUpdateUserStatus = (userId, newStatus, userName = "this user") => {
    openConfirmModal({
      title: newStatus === "banned" ? "Ban User Account" : "Activate User Account",
      message: newStatus === "banned"
        ? `Are you sure you want to ban ${userName}? They will be immediately blocked from logging in.`
        : `Are you sure you want to restore access for ${userName}?`,
      confirmText: newStatus === "banned" ? "Ban Account" : "Activate Account",
      cancelText: "Cancel",
      type: newStatus === "banned" ? "danger" : "warning",
      onConfirm: async () => {
        try {
          const result = await authFetch(`${API_BASE}/v1/admin/users/${userId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus }),
          })
          if (!result?.ok) throw new Error(result?.json?.message || "Failed to update status")
          showToast(`User status updated to ${newStatus}`, "success")
          closeConfirmModal()
          fetchUsers()
          fetchStats()
          if (selectedUserDetail && selectedUserDetail.user?._id === userId) {
            fetchUserDetail(userId)
          }
        } catch (err) {
          showToast(err.message, "error")
        }
      },
    })
  }

  // Handle User Role Change
  const handleUpdateUserRole = (userId, newRole, userName = "this user") => {
    openConfirmModal({
      title: "Change Account Role",
      message: `Are you sure you want to set the role of ${userName} to "${newRole}"?`,
      confirmText: `Set as ${newRole}`,
      cancelText: "Cancel",
      type: newRole === "admin" ? "warning" : "info",
      onConfirm: async () => {
        try {
          const result = await authFetch(`${API_BASE}/v1/admin/users/${userId}/role`, {
            method: "PUT",
            body: JSON.stringify({ role: newRole }),
          })
          if (!result?.ok) throw new Error(result?.json?.message || "Failed to update role")
          showToast(`User role updated to ${newRole}`, "success")
          closeConfirmModal()
          fetchUsers()
          if (selectedUserDetail && selectedUserDetail.user?._id === userId) {
            fetchUserDetail(userId)
          }
        } catch (err) {
          showToast(err.message, "error")
        }
      },
    })
  }

  // Toggle User Profile Verification Badge
  const handleToggleVerification = async (userId, currentVerified) => {
    try {
      const result = await authFetch(`${API_BASE}/v1/admin/users/${userId}/verify`, {
        method: "PUT",
        body: JSON.stringify({ isVerified: !currentVerified }),
      })
      if (!result?.ok) throw new Error(result?.json?.message || "Failed to toggle verification")
      showToast(`User verification set to ${!currentVerified}`, "success")
      fetchUsers()
      fetchStats()
      if (selectedUserDetail && selectedUserDetail.user?._id === userId) {
        fetchUserDetail(userId)
      }
    } catch (err) {
      showToast(err.message, "error")
    }
  }

  // Delete User Permanently
  const handleDeleteUser = (userId, userName = "this user") => {
    openConfirmModal({
      title: "Permanently Delete Account",
      message: `Are you sure you want to delete ${userName} and their entire matrimonial profile? This cannot be undone.`,
      confirmText: "Delete Permanently",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          const result = await authFetch(`${API_BASE}/v1/admin/users/${userId}`, {
            method: "DELETE",
          })
          if (!result?.ok) throw new Error(result?.json?.message || "Failed to delete user")
          showToast("User deleted permanently", "success")
          closeConfirmModal()
          if (currentTab === "user-profile") setCurrentTab("users")
          setSelectedUserDetail(null)
          fetchUsers()
          fetchStats()
        } catch (err) {
          showToast(err.message, "error")
        }
      },
    })
  }

  // Open Edit Profile Modal with prepopulated data
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
        location: {
          city: editFormData.city,
          state: editFormData.state,
        },
        education: {
          highestDegree: editFormData.highestDegree,
          institution: editFormData.institution,
        },
        career: {
          occupation: editFormData.occupation,
          companyName: editFormData.companyName,
          annualIncome: editFormData.annualIncome,
        },
        family: {
          fatherOccupation: editFormData.fatherOccupation,
          motherOccupation: editFormData.motherOccupation,
          familyLocation: editFormData.familyLocation,
          familyValues: editFormData.familyValues,
          numBrothers: Number(editFormData.numBrothers) || 0,
          numSisters: Number(editFormData.numSisters) || 0,
        },
        lifestyle: {
          diet: editFormData.diet,
          smoking: editFormData.smoking === "yes",
          drinking: editFormData.drinking === "yes",
          fitness: editFormData.fitness,
        },
      }

      const result = await authFetch(`${API_BASE}/v1/admin/users/${selectedUserDetail.user._id}/profile`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      if (!result?.ok) throw new Error(result?.json?.message || "Failed to update profile")
      showToast("User profile details updated successfully", "success")
      setEditProfileModalOpen(false)
      fetchUserDetail(selectedUserDetail.user._id)
      fetchUsers()
    } catch (err) {
      showToast(err.message, "error")
    } finally {
      setEditSaving(false)
    }
  }

  // Handle Assign Subscription Plan
  const handleAssignSubscriptionPlan = async (e) => {
    e.preventDefault()
    if (!selectedUserDetail?.user?._id) return
    setPlanSaving(true)
    try {
      const result = await authFetch(`${API_BASE}/v1/admin/users/${selectedUserDetail.user._id}/subscriptions`, {
        method: "POST",
        body: JSON.stringify(planFormData),
      })
      if (!result?.ok) throw new Error(result?.json?.message || "Failed to assign subscription")
      showToast(`Assigned ${planFormData.planName} to user successfully!`, "success")
      setAssignPlanModalOpen(false)
      fetchUserDetail(selectedUserDetail.user._id)
    } catch (err) {
      showToast(err.message, "error")
    } finally {
      setPlanSaving(false)
    }
  }

  // Save Admin Personal Info Settings
  const handleSavePersonalSettings = async (e) => {
    e.preventDefault()
    setSettingsPersonalSaving(true)
    try {
      const result = await authFetch(`${API_BASE}/v1/admin/settings/profile`, {
        method: "PUT",
        body: JSON.stringify(settingsPersonalForm),
      })
      if (!result?.ok) throw new Error(result?.json?.message || "Failed to update personal settings")
      const updatedUser = result.data
      setAdminUser(updatedUser)
      localStorage.setItem("admin_user", JSON.stringify(updatedUser))
      showToast("Personal information updated successfully", "success")
    } catch (err) {
      showToast(err.message, "error")
    } finally {
      setSettingsPersonalSaving(false)
    }
  }

  // Save Admin Password Settings
  const handleSavePasswordSettings = async (e) => {
    e.preventDefault()
    if (settingsPasswordForm.newPassword !== settingsPasswordForm.confirmPassword) {
      showToast("New passwords do not match", "error")
      return
    }
    setSettingsPasswordSaving(true)
    try {
      const result = await authFetch(`${API_BASE}/v1/admin/settings/password`, {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: settingsPasswordForm.currentPassword,
          newPassword: settingsPasswordForm.newPassword,
        }),
      })
      if (!result?.ok) throw new Error(result?.json?.message || "Failed to update password")
      showToast("Password updated successfully!", "success")
      setSettingsPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      showToast(err.message, "error")
    } finally {
      setSettingsPasswordSaving(false)
    }
  }

  // Render Sign In Screen if not authenticated
  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8F5", padding: "1.5rem" }}>
        <div style={{ background: "#ffffff", maxWidth: "420px", width: "100%", borderRadius: "24px", padding: "2.5rem", border: "1px solid #FFE4E8", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#FFF0F2", color: "#842029", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <ShieldCheck size={28} />
            </div>
            <h1 className="font-serif" style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#640515" }}>
              MeriJodi Admin
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem" }}>
              Trust &amp; Safety Portal Access
            </p>
          </div>

          {loginError && (
            <div style={{ padding: "0.75rem 1rem", background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", borderRadius: "12px", fontSize: "0.8125rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertTriangle size={16} /> {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="form-label">Admin Email</label>
              <input
                type="email"
                required
                placeholder="admin@merijodi.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showAdminLoginPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminLoginPassword(!showAdminLoginPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#9CA3AF",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                  aria-label={showAdminLoginPassword ? "Hide password" : "Show password"}
                >
                  {showAdminLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn btn-primary"
              style={{ padding: "0.875rem", fontSize: "0.9375rem", marginTop: "0.5rem", width: "100%" }}
            >
              {loginLoading ? "Authenticating..." : "Sign In to Admin Console"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Derived counts
  const totalUsersCount = stats?.counts?.totalUsers ?? usersList.length
  const verifiedProfilesCount = stats?.counts?.verifiedProfiles ?? usersList.filter((u) => u.isVerified).length
  const pendingVerificationsCount = stats?.counts?.pendingVerifications ?? verifications.filter((v) => v.status === "pending" || v.status === "submitted" || v.status === "under_review").length
  const pendingReportsCount = stats?.counts?.pendingReports ?? reports.filter((r) => r.status === "pending").length

  return (
    <div className="admin-container">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 25 }}
        />
      )}

      {/* Sidebar Navigation matching Figma */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--primary-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 className="font-serif" style={{ fontSize: "1.35rem", color: "var(--primary)", fontWeight: "bold" }}>
              MeriJodi
            </h2>
            <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", fontWeight: "bold" }}>
              Admin Portal
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            className="mobile-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <button
            onClick={() => { setCurrentTab("overview"); setSidebarOpen(false) }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "none",
              background: currentTab === "overview" ? "var(--primary-light)" : "transparent",
              color: currentTab === "overview" ? "var(--primary)" : "var(--text-dark)",
              fontWeight: currentTab === "overview" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.875rem",
            }}
          >
            <Activity size={18} /> Dashboard
          </button>

          <button
            onClick={() => { setCurrentTab("users"); setSidebarOpen(false) }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "none",
              background: (currentTab === "users" || currentTab === "user-profile") ? "var(--primary-light)" : "transparent",
              color: (currentTab === "users" || currentTab === "user-profile") ? "var(--primary)" : "var(--text-dark)",
              fontWeight: (currentTab === "users" || currentTab === "user-profile") ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.875rem",
            }}
          >
            <Users size={18} /> User Management
          </button>

          <button
            onClick={() => { setCurrentTab("verifications"); setSidebarOpen(false) }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "none",
              background: currentTab === "verifications" ? "var(--primary-light)" : "transparent",
              color: currentTab === "verifications" ? "var(--primary)" : "var(--text-dark)",
              fontWeight: currentTab === "verifications" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.875rem",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <FileText size={18} /> Verification
            </span>
            {pendingVerificationsCount > 0 && (
              <span className="badge badge-pending">{pendingVerificationsCount}</span>
            )}
          </button>

          <button
            onClick={() => { setCurrentTab("reports"); setSidebarOpen(false) }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "none",
              background: currentTab === "reports" ? "var(--primary-light)" : "transparent",
              color: currentTab === "reports" ? "var(--primary)" : "var(--text-dark)",
              fontWeight: currentTab === "reports" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.875rem",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <AlertTriangle size={18} /> Abuse Reports
            </span>
            {pendingReportsCount > 0 && (
              <span className="badge badge-rejected">{pendingReportsCount}</span>
            )}
          </button>

          <button
            onClick={() => { setCurrentTab("settings"); setSidebarOpen(false) }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              border: "none",
              background: currentTab === "settings" ? "var(--primary-light)" : "transparent",
              color: currentTab === "settings" ? "var(--primary)" : "var(--text-dark)",
              fontWeight: currentTab === "settings" ? "700" : "500",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.875rem",
            }}
          >
            <SettingsIcon size={18} /> Settings
          </button>
        </nav>

        {/* Admin User Footer Profile Card */}
        <div style={{ padding: "1.25rem", borderTop: "1px solid var(--primary-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#FFE4E8", color: "#842029", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
              {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <p style={{ fontSize: "0.8125rem", fontWeight: "700", color: "var(--text-dark)" }}>
                {adminUser?.name || "Administrator"}
              </p>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                {adminUser?.email || "admin@merijodi.com"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", padding: "0.5rem" }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: "inline-flex", background: "none", border: "none", cursor: "pointer", padding: "0.5rem" }}
            >
              <Menu size={22} />
            </button>
            <h1 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#1F2937" }}>
              {currentTab === "overview" && "Dashboard Overview & Platform KPIs"}
              {currentTab === "users" && "User Directory & Moderation"}
              {currentTab === "user-profile" && (selectedUserDetail?.profile?.name || selectedUserDetail?.user?.name || "User Profile Dossier")}
              {currentTab === "verifications" && "KYC Document Verification Requests"}
              {currentTab === "reports" && "Safety & Abuse Reports"}
              {currentTab === "settings" && "Platform & Administrator Settings"}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={refreshAll}
              title="Refresh Data"
              className="btn btn-outline btn-sm"
              style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
            >
              <RefreshCw size={14} className={loadingData ? "animate-spin" : ""} /> Refresh
            </button>
            <span className="badge badge-approved">System Operational</span>
          </div>
        </header>

        {/* Page Content Container */}
        <div className="admin-content">

          {/* TAB 1: OVERVIEW / DASHBOARD */}
          {currentTab === "overview" && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                    <Users size={26} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Total Registered</span>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1F2937" }}>{totalUsersCount}</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: "var(--success-bg)", color: "#10B981" }}>
                    <UserCheck size={26} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Verified Profiles</span>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1F2937" }}>{verifiedProfilesCount}</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: "var(--warning-bg)", color: "#F59E0B" }}>
                    <FileText size={26} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Pending Verifications</span>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1F2937" }}>{pendingVerificationsCount}</h3>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ background: "var(--danger-bg)", color: "#EF4444" }}>
                    <AlertTriangle size={26} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Active Reports</span>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#1F2937" }}>{pendingReportsCount}</h3>
                  </div>
                </div>
              </div>

              {/* Engagement Stats row */}
              {stats?.counts && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                  <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--primary-border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#FFF0F2", color: "#842029", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Heart size={20} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Match Interests</p>
                      <h4 style={{ fontSize: "1.25rem", fontWeight: "800" }}>{stats.counts.totalInterests || 0}</h4>
                    </div>
                  </div>

                  <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--primary-border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#ECFDF5", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Accepted Matches</p>
                      <h4 style={{ fontSize: "1.25rem", fontWeight: "800" }}>{stats.counts.acceptedInterests || 0}</h4>
                    </div>
                  </div>

                  <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--primary-border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#F5F3FF", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MessageCircle size={20} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Direct Messages</p>
                      <h4 style={{ fontSize: "1.25rem", fontWeight: "800" }}>{stats.counts.totalMessages || 0}</h4>
                    </div>
                  </div>

                  <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--primary-border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#FEF2F2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <UserX size={20} />
                    </div>
                    <div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Banned Accounts</p>
                      <h4 style={{ fontSize: "1.25rem", fontWeight: "800" }}>{stats.counts.bannedUsers || 0}</h4>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Queues Preview */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
                <div className="data-table-container">
                  <div className="table-header-bar">
                    <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--primary)" }}>
                      Pending Verifications ({pendingVerificationsCount})
                    </h3>
                    <button onClick={() => setCurrentTab("verifications")} className="btn btn-outline btn-sm">
                      View All
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Applicant</th>
                          <th>Document</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verifications.slice(0, 5).map((v) => (
                          <tr key={v._id}>
                            <td style={{ fontWeight: "600" }}>{v.profileId?.name || "Member"}</td>
                            <td style={{ textTransform: "uppercase" }}>{v.documentType || "ID Proof"}</td>
                            <td><span className={`badge badge-${v.status}`}>{v.status}</span></td>
                            <td>
                              <button onClick={() => { setSelectedVerification(v); setActionNote(v.reviewNote || "") }} className="btn btn-primary btn-sm">
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                        {verifications.length === 0 && (
                          <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No verification requests pending.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="data-table-container">
                  <div className="table-header-bar">
                    <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--primary)" }}>
                      Safety Reports ({pendingReportsCount})
                    </h3>
                    <button onClick={() => setCurrentTab("reports")} className="btn btn-outline btn-sm">
                      View All
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Reported Member</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.slice(0, 5).map((r) => (
                          <tr key={r._id}>
                            <td style={{ fontWeight: "600" }}>{r.reportedProfileId?.name || "Member"}</td>
                            <td>{r.reason}</td>
                            <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                            <td>
                              <button onClick={() => { setSelectedReport(r); setActionNote(r.actionTaken || "") }} className="btn btn-outline btn-sm">
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                        {reports.length === 0 && (
                          <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No abuse reports filed.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER DIRECTORY & MANAGEMENT */}
          {currentTab === "users" && (
            <div className="data-table-container">
              <div className="table-header-bar" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#F3F4F6", padding: "0.5rem 1rem", borderRadius: "9999px", minWidth: "260px" }}>
                  <Search size={16} color="#9CA3AF" />
                  <input
                    type="text"
                    placeholder="Search name, email, phone, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.8125rem" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.8125rem", outline: "none" }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.8125rem", outline: "none" }}
                  >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select
                    value={userGenderFilter}
                    onChange={(e) => setUserGenderFilter(e.target.value)}
                    style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.8125rem", outline: "none" }}
                  >
                    <option value="all">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>

                  <select
                    value={userVerifiedFilter}
                    onChange={(e) => setUserVerifiedFilter(e.target.value)}
                    style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.8125rem", outline: "none" }}
                  >
                    <option value="all">Verification</option>
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>User Profile</th>
                      <th>Contact Info</th>
                      <th>Role &amp; Status</th>
                      <th>Verification</th>
                      <th>Completeness</th>
                      <th>Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#FFE4E8", color: "#842029", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.9375rem" }}>
                              {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <p style={{ fontWeight: "700", color: "var(--text-dark)" }}>{u.name || "Member"}</p>
                              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                {u.gender ? u.gender.charAt(0).toUpperCase() + u.gender.slice(1) : ""} &bull; {u.location?.city || "India"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p style={{ fontSize: "0.8125rem", fontWeight: "500" }}>{u.email}</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.phone || "No phone"}</p>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                            <span className={`badge ${u.role === "admin" ? "badge-approved" : "badge-pending"}`}>
                              {u.role}
                            </span>
                            <span className={`badge ${u.status === "active" ? "badge-approved" : u.status === "banned" ? "badge-rejected" : "badge-pending"}`}>
                              {u.status}
                            </span>
                          </div>
                        </td>
                        <td>
                          {u.isVerified ? (
                            <span className="badge badge-approved" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              <CheckCircle size={12} /> Verified
                            </span>
                          ) : (
                            <span className="badge badge-pending">Unverified</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "50px", height: "6px", background: "#E5E7EB", borderRadius: "9999px", overflow: "hidden" }}>
                              <div style={{ width: `${u.profileCompletionPct || 0}%`, height: "100%", background: "var(--primary)" }} />
                            </div>
                            <span style={{ fontSize: "0.75rem", fontWeight: "700" }}>{u.profileCompletionPct || 0}%</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                            <button
                              onClick={() => handleViewUserProfile(u._id)}
                              className="btn btn-primary btn-sm"
                              style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                            >
                              <Eye size={13} /> View Profile
                            </button>

                            <button
                              onClick={() => handleToggleVerification(u._id, u.isVerified)}
                              title={u.isVerified ? "Revoke Verification" : "Verify Profile"}
                              className={`btn btn-sm ${u.isVerified ? "btn-outline" : "btn-primary"}`}
                            >
                              {u.isVerified ? <UserX size={13} /> : <UserCheck size={13} />}
                            </button>

                            {u.status === "banned" ? (
                              <button
                                onClick={() => handleUpdateUserStatus(u._id, "active", u.name)}
                                title="Unban User"
                                className="btn btn-success btn-sm"
                              >
                                <CheckCircle size={13} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateUserStatus(u._id, "banned", u.name)}
                                title="Ban User"
                                className="btn btn-danger btn-sm"
                              >
                                <UserX size={13} />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteUser(u._id, u.name)}
                              title="Delete User"
                              className="btn btn-outline btn-sm"
                              style={{ color: "var(--danger)", borderColor: "#FECACA" }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr><td colSpan="6" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No users found matching query.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2.5: USER PROFILE VIEW (EXACT FIGMA DESIGN MATCH) */}
          {currentTab === "user-profile" && (
            <div>
              {/* Back Button */}
              <button
                onClick={() => setCurrentTab("users")}
                className="btn btn-outline btn-sm"
                style={{ marginBottom: "1.25rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              >
                <ChevronLeft size={16} /> Back to User Management
              </button>

              {loadingUserDetail ? (
                <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
                  <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 1rem" }} />
                  <p>Loading complete profile dossier...</p>
                </div>
              ) : selectedUserDetail ? (
                <div>
                  {/* Profile Header Card */}
                  <div className="profile-header-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                      <div className="profile-avatar-wrapper">
                        {selectedUserDetail.profile?.photos?.[0]?.url ? (
                          <img
                            src={selectedUserDetail.profile.photos[0].url}
                            alt="Profile"
                            className="profile-avatar-img"
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "bold", color: "#842029" }}>
                            {selectedUserDetail.profile?.name ? selectedUserDetail.profile.name.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                          <h2 className="font-serif" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1F2937" }}>
                            {selectedUserDetail.profile?.name || selectedUserDetail.user?.name || "Member Profile"}
                          </h2>
                          <span className={`badge ${selectedUserDetail.user?.status === "active" ? "badge-approved" : "badge-rejected"}`}>
                            {selectedUserDetail.user?.status || "active"}
                          </span>
                          <span className={`badge ${selectedUserDetail.profile?.isVerified ? "badge-approved" : "badge-pending"}`}>
                            {selectedUserDetail.profile?.isVerified ? "Verified Member" : "Unverified"}
                          </span>
                        </div>

                        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                            <MapPin size={14} color="#842029" /> {selectedUserDetail.profile?.location?.city || "India"}, {selectedUserDetail.profile?.location?.state || ""}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                            <Mail size={14} color="#842029" /> {selectedUserDetail.user?.email}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                            <Phone size={14} color="#842029" /> {selectedUserDetail.user?.phone || "No phone"}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                            <Calendar size={14} color="#842029" /> Joined {new Date(selectedUserDetail.user?.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button
                        onClick={handleOpenEditModal}
                        className="btn btn-primary btn-sm"
                        style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                      >
                        <Edit3 size={14} /> Edit Profile
                      </button>

                      <button
                        onClick={() => setAssignPlanModalOpen(true)}
                        className="btn btn-outline btn-sm"
                        style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                      >
                        <CreditCard size={14} /> Assign Plan
                      </button>

                      {selectedUserDetail.user?.status === "banned" ? (
                        <button
                          onClick={() => handleUpdateUserStatus(selectedUserDetail.user._id, "active", selectedUserDetail.profile?.name)}
                          className="btn btn-success btn-sm"
                        >
                          <CheckCircle size={14} /> Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateUserStatus(selectedUserDetail.user._id, "banned", selectedUserDetail.profile?.name)}
                          className="btn btn-danger btn-sm"
                        >
                          <UserX size={14} /> Ban User
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2-Column Responsive Profile Dossier Grid */}
                  <div className="profile-grid">
                    {/* Card 1: Profile Info & Bio */}
                    <div className="profile-card">
                      <h3 className="profile-card-title">
                        <User size={16} /> Profile Info &amp; Bio
                      </h3>
                      <div className="field-grid">
                        <div className="field-item" style={{ gridColumn: "span 2" }}>
                          <span className="field-label">About Me</span>
                          <p className="field-value" style={{ fontWeight: "400", fontSize: "0.875rem", lineHeight: "1.5" }}>
                            {selectedUserDetail.profile?.aboutMe || "No bio description written yet."}
                          </p>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Location</span>
                          <span className="field-value">
                            {selectedUserDetail.profile?.location?.city ? `${selectedUserDetail.profile.location.city}, ${selectedUserDetail.profile.location.state || "India"}` : "—"}
                          </span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Occupation</span>
                          <span className="field-value">{selectedUserDetail.profile?.career?.occupation || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Education</span>
                          <span className="field-value">{selectedUserDetail.profile?.education?.highestDegree || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Created By</span>
                          <span className="field-value" style={{ textTransform: "capitalize" }}>{selectedUserDetail.profile?.createdBy || "Self"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Lifestyle Chips */}
                    <div className="profile-card">
                      <h3 className="profile-card-title">
                        <Sparkles size={16} /> Lifestyle &amp; Habits
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                          <span className="field-label" style={{ marginBottom: "0.5rem", display: "block" }}>Diet Preference</span>
                          <div className="lifestyle-chips-container">
                            <span className={`lifestyle-chip ${selectedUserDetail.profile?.lifestyle?.diet ? "active" : ""}`}>
                              🥗 {selectedUserDetail.profile?.lifestyle?.diet || "Vegetarian"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="field-label" style={{ marginBottom: "0.5rem", display: "block" }}>Habits</span>
                          <div className="lifestyle-chips-container">
                            <span className="lifestyle-chip">
                              🚭 Smoking: {selectedUserDetail.profile?.lifestyle?.smoking ? "Yes" : "No"}
                            </span>
                            <span className="lifestyle-chip">
                              🍷 Drinking: {selectedUserDetail.profile?.lifestyle?.drinking ? "Yes" : "No"}
                            </span>
                            {selectedUserDetail.profile?.lifestyle?.fitness && (
                              <span className="lifestyle-chip active">
                                🏃 Fitness: {selectedUserDetail.profile.lifestyle.fitness}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Personal Details */}
                    <div className="profile-card">
                      <h3 className="profile-card-title">
                        <User size={16} /> Personal Details
                      </h3>
                      <div className="field-grid">
                        <div className="field-item">
                          <span className="field-label">Age</span>
                          <span className="field-value">
                            {selectedUserDetail.profile?.dateOfBirth ? `${Math.floor((Date.now() - new Date(selectedUserDetail.profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} Years` : "—"}
                          </span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Height</span>
                          <span className="field-value">{selectedUserDetail.profile?.heightCm ? `${selectedUserDetail.profile.heightCm} cm` : "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Date of Birth</span>
                          <span className="field-value">
                            {selectedUserDetail.profile?.dateOfBirth ? new Date(selectedUserDetail.profile.dateOfBirth).toLocaleDateString("en-IN") : "—"}
                          </span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Place of Birth</span>
                          <span className="field-value">{selectedUserDetail.profile?.placeOfBirth || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Gender</span>
                          <span className="field-value" style={{ textTransform: "capitalize" }}>{selectedUserDetail.profile?.gender || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Marital Status</span>
                          <span className="field-value" style={{ textTransform: "capitalize" }}>
                            {selectedUserDetail.profile?.maritalStatus?.replace(/_/g, " ") || "—"}
                          </span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Email</span>
                          <span className="field-value">{selectedUserDetail.user?.email}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Phone</span>
                          <span className="field-value">{selectedUserDetail.user?.phone || "—"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Family Background */}
                    <div className="profile-card">
                      <h3 className="profile-card-title">
                        <Users size={16} /> Family Background
                      </h3>
                      <div className="field-grid">
                        <div className="field-item">
                          <span className="field-label">Mother Tongue</span>
                          <span className="field-value">{selectedUserDetail.profile?.motherTongue || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Father's Occupation</span>
                          <span className="field-value">{selectedUserDetail.profile?.family?.fatherOccupation || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Mother's Occupation</span>
                          <span className="field-value">{selectedUserDetail.profile?.family?.motherOccupation || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Family Location</span>
                          <span className="field-value">{selectedUserDetail.profile?.family?.familyLocation || selectedUserDetail.profile?.location?.city || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Family Values</span>
                          <span className="field-value" style={{ textTransform: "capitalize" }}>
                            {selectedUserDetail.profile?.family?.familyValues || "Moderate"}
                          </span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Siblings</span>
                          <span className="field-value">
                            {selectedUserDetail.profile?.family?.numBrothers || 0} Brother(s), {selectedUserDetail.profile?.family?.numSisters || 0} Sister(s)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 5: Career & Education */}
                    <div className="profile-card">
                      <h3 className="profile-card-title">
                        <Briefcase size={16} /> Career &amp; Education
                      </h3>
                      <div className="field-grid">
                        <div className="field-item">
                          <span className="field-label">Education</span>
                          <span className="field-value">{selectedUserDetail.profile?.education?.highestDegree || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">College / Institution</span>
                          <span className="field-value">{selectedUserDetail.profile?.education?.institution || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Occupation</span>
                          <span className="field-value">{selectedUserDetail.profile?.career?.occupation || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Company Name</span>
                          <span className="field-value">{selectedUserDetail.profile?.career?.companyName || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Annual Income</span>
                          <span className="field-value">{selectedUserDetail.profile?.career?.annualIncome || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Work Location</span>
                          <span className="field-value">{selectedUserDetail.profile?.career?.workLocation || selectedUserDetail.profile?.location?.city || "—"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 6: Religious & Astrological Details */}
                    <div className="profile-card">
                      <h3 className="profile-card-title">
                        <Award size={16} /> Religious &amp; Astrological Details
                      </h3>
                      <div className="field-grid">
                        <div className="field-item">
                          <span className="field-label">Religion</span>
                          <span className="field-value">{selectedUserDetail.profile?.religion || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Caste</span>
                          <span className="field-value">{selectedUserDetail.profile?.caste || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Sub-Caste</span>
                          <span className="field-value">{selectedUserDetail.profile?.subCaste || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Gotra / Gotham</span>
                          <span className="field-value">{selectedUserDetail.profile?.gotham || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Rashi</span>
                          <span className="field-value">{selectedUserDetail.profile?.rashi || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Nakshatra</span>
                          <span className="field-value">{selectedUserDetail.profile?.nakshtra || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Manglik Status</span>
                          <span className="field-value" style={{ textTransform: "capitalize" }}>{selectedUserDetail.profile?.manglik || "—"}</span>
                        </div>
                        <div className="field-item">
                          <span className="field-label">Birth Time</span>
                          <span className="field-value">{selectedUserDetail.profile?.timeOfBirth || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Billing & Subscriptions Card */}
                  <div className="billing-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#842029", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <CreditCard size={20} /> Billing &amp; Subscriptions
                      </h3>
                      <button
                        onClick={() => setAssignPlanModalOpen(true)}
                        className="btn btn-primary btn-sm"
                        style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                      >
                        <Plus size={14} /> Assign Custom Plan
                      </button>
                    </div>

                    {/* Current Plan Highlight Banner */}
                    <div className="billing-banner">
                      <div>
                        <span style={{ fontSize: "0.6875rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Current Plan Status</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                          <span className={`badge ${selectedUserDetail.activeSubscription ? "badge-approved" : "badge-pending"}`}>
                            {selectedUserDetail.activeSubscription ? "ACTIVE" : "FREE TIER"}
                          </span>
                          <h4 style={{ fontSize: "1.125rem", fontWeight: "800", color: "#1F2937" }}>
                            {selectedUserDetail.activeSubscription?.planName || "Standard Free Membership"}
                          </h4>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                        <div>
                          <span style={{ fontSize: "0.6875rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Billing Cycle</span>
                          <p style={{ fontWeight: "700", fontSize: "0.875rem", textTransform: "capitalize" }}>
                            {selectedUserDetail.activeSubscription?.billingCycle || "Standard"}
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.6875rem", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)" }}>Valid Until</span>
                          <p style={{ fontWeight: "700", fontSize: "0.875rem" }}>
                            {selectedUserDetail.activeSubscription?.expiryDate ? new Date(selectedUserDetail.activeSubscription.expiryDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Permanent"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Subscription History Table */}
                    <div className="data-table-container">
                      <div className="table-header-bar">
                        <h4 style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-dark)" }}>
                          Subscription History
                        </h4>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {selectedUserDetail.subscriptions?.length || 0} Records
                        </span>
                      </div>
                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>Plan Name</th>
                              <th>Amount Paid</th>
                              <th>Subscription Date</th>
                              <th>Next Billing / Expiry</th>
                              <th>Status</th>
                              <th>Payment Method</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedUserDetail.subscriptions?.map((sub) => (
                              <tr key={sub._id}>
                                <td style={{ fontWeight: "700" }}>{sub.planName}</td>
                                <td>₹{sub.amount?.toLocaleString("en-IN") || 0}</td>
                                <td>{new Date(sub.startDate || sub.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</td>
                                <td>{sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                                <td>
                                  <span className={`badge ${sub.status === "active" ? "badge-approved" : "badge-inactive"}`}>
                                    {sub.status}
                                  </span>
                                </td>
                                <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{sub.paymentMethod || "Razorpay"}</td>
                              </tr>
                            ))}
                            {(!selectedUserDetail.subscriptions || selectedUserDetail.subscriptions.length === 0) && (
                              <tr><td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No previous subscription invoices found for this user.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "4rem" }}>
                  <p>User profile not found.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VERIFICATIONS */}
          {currentTab === "verifications" && (
            <div className="data-table-container">
              <div className="table-header-bar">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Filter size={16} color="var(--text-muted)" />
                  <select
                    value={verificationFilter}
                    onChange={(e) => setVerificationFilter(e.target.value)}
                    style={{ padding: "0.5rem 1rem", borderRadius: "9999px", border: "1px solid var(--border-color)", fontSize: "0.8125rem", outline: "none" }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  Showing {verifications.filter((v) => verificationFilter === "all" || v.status === verificationFilter).length} submissions
                </span>
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Profile Name</th>
                      <th>Document Type</th>
                      <th>Submitted Date</th>
                      <th>Status</th>
                      <th>Review Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifications
                      .filter((v) => verificationFilter === "all" || v.status === verificationFilter)
                      .map((v) => (
                        <tr key={v._id}>
                          <td style={{ fontWeight: "700" }}>{v.profileId?.name || "MeriJodi Member"}</td>
                          <td style={{ textTransform: "uppercase", fontWeight: "600", fontSize: "0.8125rem" }}>{v.documentType || "Govt ID"}</td>
                          <td>{new Date(v.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</td>
                          <td><span className={`badge badge-${v.status}`}>{v.status}</span></td>
                          <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{v.reviewNote || "—"}</td>
                          <td>
                            <button
                              onClick={() => { setSelectedVerification(v); setActionNote(v.reviewNote || "") }}
                              className="btn btn-primary btn-sm"
                              style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                            >
                              <Eye size={14} /> Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    {verifications.length === 0 && (
                      <tr><td colSpan="6" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No verification submissions found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ABUSE REPORTS */}
          {currentTab === "reports" && (
            <div className="data-table-container">
              <div className="table-header-bar">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Filter size={16} color="var(--text-muted)" />
                  <select
                    value={reportFilter}
                    onChange={(e) => setReportFilter(e.target.value)}
                    style={{ padding: "0.5rem 1rem", borderRadius: "9999px", border: "1px solid var(--border-color)", fontSize: "0.8125rem", outline: "none" }}
                  >
                    <option value="all">All Reports</option>
                    <option value="pending">Pending Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Reported User</th>
                      <th>Reporter</th>
                      <th>Violation Reason</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports
                      .filter((r) => reportFilter === "all" || r.status === reportFilter)
                      .map((r) => (
                        <tr key={r._id}>
                          <td style={{ fontWeight: "700" }}>{r.reportedProfileId?.name || "Reported Member"}</td>
                          <td>{r.reporterProfileId?.name || "Anonymous Member"}</td>
                          <td><span className="badge badge-rejected">{r.reason}</span></td>
                          <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.description || "No comment provided"}
                          </td>
                          <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                          <td>
                            <button
                              onClick={() => { setSelectedReport(r); setActionNote(r.actionTaken || "") }}
                              className="btn btn-outline btn-sm"
                            >
                              Inspect Report
                            </button>
                          </td>
                        </tr>
                      ))}
                    {reports.length === 0 && (
                      <tr><td colSpan="6" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No reports in this category.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS (EXACT FIGMA DESIGN MATCH) */}
          {currentTab === "settings" && (
            <div className="settings-card">
              <div className="settings-tabs">
                <button
                  onClick={() => setSettingsActiveTab("personal")}
                  className={`settings-tab-btn ${settingsActiveTab === "personal" ? "active" : ""}`}
                >
                  <User size={16} /> Personal Information
                </button>
                <button
                  onClick={() => setSettingsActiveTab("password")}
                  className={`settings-tab-btn ${settingsActiveTab === "password" ? "active" : ""}`}
                >
                  <Key size={16} /> Password &amp; Security
                </button>
                <button
                  onClick={() => setSettingsActiveTab("system")}
                  className={`settings-tab-btn ${settingsActiveTab === "system" ? "active" : ""}`}
                >
                  <Server size={16} /> System Health
                </button>
              </div>

              {/* Personal Information Tab */}
              {settingsActiveTab === "personal" && (
                <form onSubmit={handleSavePersonalSettings}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "#1F2937", marginBottom: "0.25rem" }}>
                    Personal Information
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    Update your operational account name, contact email, and profile avatar.
                  </p>

                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Administrator"
                      value={settingsPersonalForm.name}
                      onChange={(e) => setSettingsPersonalForm({ ...settingsPersonalForm, name: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@merijodi.com"
                      value={settingsPersonalForm.email}
                      onChange={(e) => setSettingsPersonalForm({ ...settingsPersonalForm, email: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={settingsPersonalForm.phone}
                      onChange={(e) => setSettingsPersonalForm({ ...settingsPersonalForm, phone: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Avatar Image URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://images.cloudinary.com/..."
                      value={settingsPersonalForm.avatar}
                      onChange={(e) => setSettingsPersonalForm({ ...settingsPersonalForm, avatar: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
                    <button
                      type="submit"
                      disabled={settingsPersonalSaving}
                      className="btn btn-primary"
                      style={{ padding: "0.75rem 2rem" }}
                    >
                      {settingsPersonalSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

              {/* Password & Security Tab */}
              {settingsActiveTab === "password" && (
                <form onSubmit={handleSavePasswordSettings}>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "#1F2937", marginBottom: "0.25rem" }}>
                    Change Administrator Password
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    Ensure your account is protected with a strong, secure password.
                  </p>

                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showAdminCurrentPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={settingsPasswordForm.currentPassword}
                        onChange={(e) => setSettingsPasswordForm({ ...settingsPasswordForm, currentPassword: e.target.value })}
                        className="form-input"
                        style={{ paddingRight: "2.75rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminCurrentPassword(!showAdminCurrentPassword)}
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#9CA3AF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          padding: 0,
                        }}
                        aria-label={showAdminCurrentPassword ? "Hide current password" : "Show current password"}
                      >
                        {showAdminCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showAdminNewPassword ? "text" : "password"}
                        required
                        placeholder="Minimum 6 characters"
                        value={settingsPasswordForm.newPassword}
                        onChange={(e) => setSettingsPasswordForm({ ...settingsPasswordForm, newPassword: e.target.value })}
                        className="form-input"
                        style={{ paddingRight: "2.75rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#9CA3AF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          padding: 0,
                        }}
                        aria-label={showAdminNewPassword ? "Hide new password" : "Show new password"}
                      >
                        {showAdminNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showAdminConfirmPassword ? "text" : "password"}
                        required
                        placeholder="Re-enter new password"
                        value={settingsPasswordForm.confirmPassword}
                        onChange={(e) => setSettingsPasswordForm({ ...settingsPasswordForm, confirmPassword: e.target.value })}
                        className="form-input"
                        style={{ paddingRight: "2.75rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#9CA3AF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          padding: 0,
                        }}
                        aria-label={showAdminConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showAdminConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
                    <button
                      type="submit"
                      disabled={settingsPasswordSaving}
                      className="btn btn-primary"
                      style={{ padding: "0.75rem 2rem" }}
                    >
                      {settingsPasswordSaving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              )}

              {/* System Health Tab */}
              {settingsActiveTab === "system" && (
                <div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "#1F2937", marginBottom: "0.25rem" }}>
                    System Architecture &amp; Health
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                    Live status check of all connected microservices and databases.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ background: "#F9FAFB", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontWeight: "700", fontSize: "0.875rem" }}>MongoDB Database</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Active Atlas Cluster connection</p>
                      </div>
                      <span className="badge badge-approved">Connected (200 OK)</span>
                    </div>

                    <div style={{ background: "#F9FAFB", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontWeight: "700", fontSize: "0.875rem" }}>Redis Cache &amp; TTL Session Store</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Upstash Redis / In-Memory Fallback</p>
                      </div>
                      <span className="badge badge-approved">Online</span>
                    </div>

                    <div style={{ background: "#F9FAFB", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontWeight: "700", fontSize: "0.875rem" }}>API Server Version</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Node.js Express 4.x (ESM)</p>
                      </div>
                      <span className="badge badge-approved">v1.0.0 Production</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* MODAL 1: EDIT USER PROFILE MODAL */}
      {editProfileModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "24px", maxWidth: "700px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#ffffff", zIndex: 10 }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "var(--primary)" }}>
                Edit Member Profile Dossier
              </h3>
              <button onClick={() => setEditProfileModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveUserProfile} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="form-label">Full Name</label>
                  <input type="text" required value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} className="form-input" />
                </div>
              </div>

              <div>
                <label className="form-label">About Me (Bio)</label>
                <textarea rows={3} value={editFormData.aboutMe} onChange={(e) => setEditFormData({ ...editFormData, aboutMe: e.target.value })} className="form-input" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <div>
                  <label className="form-label">Gender</label>
                  <select value={editFormData.gender} onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })} className="form-input">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Date of Birth</label>
                  <input type="date" value={editFormData.dateOfBirth} onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Marital Status</label>
                  <select value={editFormData.maritalStatus} onChange={(e) => setEditFormData({ ...editFormData, maritalStatus: e.target.value })} className="form-input">
                    <option value="never_married">Never Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="separated">Separated</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="form-label">City</label>
                  <input type="text" value={editFormData.city} onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">State</label>
                  <input type="text" value={editFormData.state} onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })} className="form-input" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <div>
                  <label className="form-label">Highest Degree</label>
                  <input type="text" value={editFormData.highestDegree} onChange={(e) => setEditFormData({ ...editFormData, highestDegree: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Occupation</label>
                  <input type="text" value={editFormData.occupation} onChange={(e) => setEditFormData({ ...editFormData, occupation: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Annual Income</label>
                  <input type="text" value={editFormData.annualIncome} onChange={(e) => setEditFormData({ ...editFormData, annualIncome: e.target.value })} className="form-input" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <div>
                  <label className="form-label">Religion</label>
                  <input type="text" value={editFormData.religion} onChange={(e) => setEditFormData({ ...editFormData, religion: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Caste</label>
                  <input type="text" value={editFormData.caste} onChange={(e) => setEditFormData({ ...editFormData, caste: e.target.value })} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Sub-Caste</label>
                  <input type="text" value={editFormData.subCaste} onChange={(e) => setEditFormData({ ...editFormData, subCaste: e.target.value })} className="form-input" />
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button type="button" onClick={() => setEditProfileModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={editSaving} className="btn btn-primary">
                  {editSaving ? "Saving..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN SUBSCRIPTION PLAN MODAL */}
      {assignPlanModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "24px", maxWidth: "500px", width: "100%", padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "#842029" }}>
                Assign Custom Membership Plan
              </h3>
              <button onClick={() => setAssignPlanModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAssignSubscriptionPlan} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="form-label">Plan Tier</label>
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
                  className="form-input"
                >
                  <option value="Premium Plan">Premium Plan (Recommended)</option>
                  <option value="Gold Plan">Gold Plan</option>
                  <option value="Diamond Plan">Diamond Plan</option>
                  <option value="Free Plan">Free Plan</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="form-label">Amount (INR)</label>
                  <input
                    type="number"
                    value={planFormData.amount}
                    onChange={(e) => setPlanFormData({ ...planFormData, amount: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Duration (Days)</label>
                  <input
                    type="number"
                    value={planFormData.durationDays}
                    onChange={(e) => setPlanFormData({ ...planFormData, durationDays: Number(e.target.value) })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Admin Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Approved promotional extension"
                  value={planFormData.notes}
                  onChange={(e) => setPlanFormData({ ...planFormData, notes: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button type="button" onClick={() => setAssignPlanModalOpen(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={planSaving} className="btn btn-primary">
                  {planSaving ? "Assigning..." : "Assign & Activate Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: KYC VERIFICATION REVIEW */}
      {selectedVerification && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "24px", maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "var(--primary)" }}>
                Review KYC Document Submission
              </h3>
              <button onClick={() => setSelectedVerification(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Applicant Name</p>
                <p style={{ fontWeight: "bold", fontSize: "1rem" }}>{selectedVerification.profileId?.name || "Member"}</p>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                  Submitted Document ({selectedVerification.documentType || "ID Proof"})
                </p>
                <div style={{ border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden", maxHeight: "260px", display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFB" }}>
                  {selectedVerification.documentUrl ? (
                    <img src={selectedVerification.documentUrl} alt="KYC Document" style={{ width: "100%", height: "auto", objectFit: "contain", maxHeight: "260px" }} />
                  ) : (
                    <p style={{ padding: "2rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>No document preview available</p>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Admin Review Note (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Government Aadhaar Verified Successfully"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => handleReviewVerification("rejected")}
                  disabled={actionLoading}
                  className="btn btn-danger"
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                >
                  <XCircle size={16} /> Reject Document
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewVerification("verified")}
                  disabled={actionLoading}
                  className="btn btn-success"
                  style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                >
                  <CheckCircle size={16} /> Approve &amp; Verify Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: REPORT RESOLUTION */}
      {selectedReport && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#ffffff", borderRadius: "24px", maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "var(--danger)" }}>
                Inspect Safety &amp; Abuse Report
              </h3>
              <button onClick={() => setSelectedReport(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Reported User</p>
                  <p style={{ fontWeight: "bold" }}>{selectedReport.reportedProfileId?.name || "Reported Member"}</p>
                </div>
                <div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Violation Reason</p>
                  <span className="badge badge-rejected">{selectedReport.reason}</span>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#FEF2F2", borderRadius: "12px", border: "1px solid #FECACA" }}>
                <p style={{ fontSize: "0.8125rem", color: "#991B1B", fontWeight: "600", marginBottom: "0.25rem" }}>Reporter Description:</p>
                <p style={{ fontSize: "0.875rem", color: "#7F1D1D" }}>{selectedReport.description || "No additional comments provided."}</p>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">Resolution / Action Taken Note</label>
                <input
                  type="text"
                  placeholder="e.g. Warning issued, offensive content removed"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => handleUpdateReport("dismissed")}
                  disabled={actionLoading}
                  className="btn btn-outline"
                >
                  Dismiss Report
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateReport("resolved")}
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              maxWidth: "440px",
              width: "100%",
              padding: "2rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #FFE4E8",
              position: "relative",
              textAlign: "center",
            }}
          >
            <button
              onClick={closeConfirmModal}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9CA3AF",
                padding: "0.25rem",
              }}
            >
              <X size={20} />
            </button>

            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "18px",
                background: confirmModal.type === "danger" ? "#FEF2F2" : confirmModal.type === "warning" ? "#FFFBEB" : "#FFF0F2",
                color: confirmModal.type === "danger" ? "#DC2626" : confirmModal.type === "warning" ? "#D97706" : "#842029",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3
              className="font-serif"
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "#1F2937",
                marginBottom: "0.5rem",
              }}
            >
              {confirmModal.title}
            </h3>

            <p
              style={{
                fontSize: "0.875rem",
                color: "#4B5563",
                lineHeight: "1.5",
                marginBottom: "1.75rem",
              }}
            >
              {confirmModal.message}
            </p>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={closeConfirmModal}
                className="btn btn-outline"
                style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: "14px", fontWeight: "600" }}
              >
                {confirmModal.cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm()
                }}
                className={`btn ${confirmModal.type === "danger" ? "btn-danger" : "btn-primary"}`}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  borderRadius: "14px",
                  fontWeight: "600",
                  backgroundColor: confirmModal.type === "danger" ? "#DC2626" : "#842029",
                }}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toast.message && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 110,
            background: toast.type === "error" ? "#991B1B" : toast.type === "warning" ? "#B45309" : "#065F46",
            color: "#ffffff",
            padding: "0.875rem 1.25rem",
            borderRadius: "16px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            maxWidth: "400px",
            animation: "slideUp 0.25s ease-out",
          }}
        >
          {toast.type === "error" ? <XCircle size={18} /> : <CheckCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}