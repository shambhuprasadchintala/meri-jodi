import adminService from "../services/admin.service.js"
import ApiResponse from "../utils/ApiResponse.js"

class AdminController {
    /**
     * GET /api/v1/admin/stats
     */
    async getStats(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.getDashboardStats()
            return apiResponse.success(data, "Admin statistics retrieved successfully")
        } catch (error) {
            console.error("Admin getStats error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * GET /api/v1/admin/users
     */
    async getUsers(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.getUsers(req.query)
            return apiResponse.success(data, "Users retrieved successfully")
        } catch (error) {
            console.error("Admin getUsers error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * GET /api/v1/admin/users/:id
     */
    async getUserById(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.getUserById(req.params.id)
            return apiResponse.success(data, "User details retrieved successfully")
        } catch (error) {
            console.error("Admin getUserById error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * PUT /api/v1/admin/users/:id/status
     */
    async updateUserStatus(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const { status } = req.body
            if (!status) {
                return apiResponse.error("Status is required", 400)
            }
            const data = await adminService.updateUserStatus(req.params.id, status)
            return apiResponse.success(data, `User status updated to ${status}`)
        } catch (error) {
            console.error("Admin updateUserStatus error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * PUT /api/v1/admin/users/:id/role
     */
    async updateUserRole(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const { role } = req.body
            if (!role) {
                return apiResponse.error("Role is required", 400)
            }
            const data = await adminService.updateUserRole(req.params.id, role)
            return apiResponse.success(data, `User role updated to ${role}`)
        } catch (error) {
            console.error("Admin updateUserRole error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * PUT /api/v1/admin/users/:id/verify
     */
    async toggleVerification(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const { isVerified } = req.body
            const data = await adminService.toggleUserVerification(req.params.id, isVerified)
            return apiResponse.success(data, `User verification updated to ${Boolean(isVerified)}`)
        } catch (error) {
            console.error("Admin toggleVerification error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * DELETE /api/v1/admin/users/:id
     */
    async deleteUser(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.deleteUser(req.params.id)
            return apiResponse.success(data, "User deleted successfully")
        } catch (error) {
            console.error("Admin deleteUser error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * PUT /api/v1/admin/users/:id/profile
     */
    async updateUserProfile(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.updateUserProfile(req.params.id, req.body)
            return apiResponse.success(data, "User profile updated successfully")
        } catch (error) {
            console.error("Admin updateUserProfile error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * GET /api/v1/admin/users/:id/subscriptions
     */
    async getUserSubscriptions(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.getUserSubscriptions(req.params.id)
            return apiResponse.success(data, "User subscriptions retrieved successfully")
        } catch (error) {
            console.error("Admin getUserSubscriptions error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * POST /api/v1/admin/users/:id/subscriptions
     */
    async addUserSubscription(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.addUserSubscription(req.params.id, req.body)
            return apiResponse.success(data, "Subscription assigned successfully", 201)
        } catch (error) {
            console.error("Admin addUserSubscription error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * PUT /api/v1/admin/subscriptions/:subId/status
     */
    async updateSubscriptionStatus(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const { status } = req.body
            if (!status) return apiResponse.error("Status is required", 400)
            const data = await adminService.updateSubscriptionStatus(req.params.subId, status)
            return apiResponse.success(data, `Subscription status updated to ${status}`)
        } catch (error) {
            console.error("Admin updateSubscriptionStatus error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * GET /api/v1/admin/settings/profile
     */
    async getAdminProfile(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.getAdminProfile(req.userId)
            return apiResponse.success(data, "Admin profile retrieved successfully")
        } catch (error) {
            console.error("Admin getAdminProfile error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * PUT /api/v1/admin/settings/profile
     */
    async updateAdminProfile(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.updateAdminProfile(req.userId, req.body)
            return apiResponse.success(data, "Admin personal information updated successfully")
        } catch (error) {
            console.error("Admin updateAdminProfile error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * PUT /api/v1/admin/settings/password
     */
    async updateAdminPassword(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.updateAdminPassword(req.userId, req.body)
            return apiResponse.success(data, "Admin password updated successfully")
        } catch (error) {
            console.error("Admin updateAdminPassword error:", error)
            return apiResponse.error(error.message, error.statusCode || 400)
        }
    }

    /**
     * GET /api/v1/admin/health
     */
    async getHealth(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.getHealth()
            return apiResponse.success(data, "System health status retrieved successfully")
        } catch (error) {
            console.error("Admin getHealth error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * GET /api/v1/admin/activity-logs
     */
    async getActivityLogs(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.getActivityLogs(req.query)
            return apiResponse.success(data, "Activity logs retrieved successfully")
        } catch (error) {
            console.error("Admin getActivityLogs error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * GET /api/v1/admin/settings
     */
    async getSettings(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.getSettings()
            return apiResponse.success(data, "Platform settings retrieved successfully")
        } catch (error) {
            console.error("Admin getSettings error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }

    /**
     * PUT /api/v1/admin/settings
     */
    async updateSettings(req, res) {
        const apiResponse = new ApiResponse(res)
        try {
            const data = await adminService.updateSettings(req.body)
            return apiResponse.success(data, "Platform settings updated successfully")
        } catch (error) {
            console.error("Admin updateSettings error:", error)
            return apiResponse.error(error.message, error.statusCode || 500)
        }
    }
}

export default new AdminController()
