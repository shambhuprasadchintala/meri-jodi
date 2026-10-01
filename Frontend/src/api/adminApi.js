import axiosInstance from "./axiosInstance"

export const getAdminStats = async () => {
    const res = await axiosInstance.get("/admin/stats")
    return res.data?.data || res.data
}

export const getAdminUsers = async (params = {}) => {
    const res = await axiosInstance.get("/admin/users", { params })
    return res.data?.data || res.data
}

export const getAdminUserById = async (id) => {
    const res = await axiosInstance.get(`/admin/users/${id}`)
    return res.data?.data || res.data
}

export const updateAdminUserStatus = async (id, status) => {
    const res = await axiosInstance.put(`/admin/users/${id}/status`, { status })
    return res.data?.data || res.data
}

export const updateAdminUserRole = async (id, role) => {
    const res = await axiosInstance.put(`/admin/users/${id}/role`, { role })
    return res.data?.data || res.data
}

export const toggleAdminUserVerification = async (id, isVerified) => {
    const res = await axiosInstance.put(`/admin/users/${id}/verify`, { isVerified })
    return res.data?.data || res.data
}

export const deleteAdminUser = async (id) => {
    const res = await axiosInstance.delete(`/admin/users/${id}`)
    return res.data?.data || res.data
}

export const getAdminVerifications = async (params = {}) => {
    const res = await axiosInstance.get("/admin/verifications", { params })
    return res.data?.data || res.data
}

export const reviewAdminVerification = async (id, status, reviewNote = "") => {
    const res = await axiosInstance.put(`/admin/verifications/${id}/review`, { status, reviewNote })
    return res.data?.data || res.data
}

export const getAdminReports = async (params = {}) => {
    const res = await axiosInstance.get("/admin/reports", { params })
    return res.data?.data || res.data
}

export const updateAdminReportStatus = async (id, status, resolutionNotes = "") => {
    const res = await axiosInstance.put(`/admin/reports/${id}/status`, {
        status,
        resolutionNotes,
        actionTaken: resolutionNotes,
    })
    return res.data?.data || res.data
}

export const updateAdminUserProfile = async (id, data) => {
    const res = await axiosInstance.put(`/admin/users/${id}/profile`, data)
    return res.data?.data || res.data
}

export const getAdminUserSubscriptions = async (id) => {
    const res = await axiosInstance.get(`/admin/users/${id}/subscriptions`)
    return res.data?.data || res.data
}

export const addAdminUserSubscription = async (id, data) => {
    const res = await axiosInstance.post(`/admin/users/${id}/subscriptions`, data)
    return res.data?.data || res.data
}

export const updateAdminSubscriptionStatus = async (subId, status) => {
    const res = await axiosInstance.put(`/admin/subscriptions/${subId}/status`, { status })
    return res.data?.data || res.data
}

export const getAdminProfileSettings = async () => {
    const res = await axiosInstance.get("/admin/settings/profile")
    return res.data?.data || res.data
}

export const updateAdminProfileSettings = async (data) => {
    const res = await axiosInstance.put("/admin/settings/profile", data)
    return res.data?.data || res.data
}

export const updateAdminPasswordSettings = async (data) => {
    const res = await axiosInstance.put("/admin/settings/password", data)
    return res.data?.data || res.data
}


