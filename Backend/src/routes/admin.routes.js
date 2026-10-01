import express from "express"
import adminController from "../controllers/admin.controller.js"
import verificationController from "../controllers/verification.controller.js"
import reportController from "../controllers/report.controller.js"
import { authenticate, attachUser, requireAdmin } from "../middlewares/auth.js"
import { validateObjectId } from "../validators/shared.validator.js"
import { validate } from "../middlewares/validate.js"
import { reviewVerification } from "../validators/verification.validator.js"
import { updateReportStatus } from "../validators/report.validator.js"

const router = express.Router()

// All admin routes enforce authentication and requireAdmin
router.use(authenticate, attachUser, requireAdmin)

// Statistics & KPIs
router.get("/stats", adminController.getStats.bind(adminController))
router.get("/health", adminController.getHealth.bind(adminController))
router.get("/activity-logs", adminController.getActivityLogs.bind(adminController))

// Platform Settings & Admin Profile
router.get("/settings", adminController.getSettings.bind(adminController))
router.put("/settings", adminController.updateSettings.bind(adminController))
router.get("/settings/profile", adminController.getAdminProfile.bind(adminController))
router.put("/settings/profile", adminController.updateAdminProfile.bind(adminController))
router.put("/settings/password", adminController.updateAdminPassword.bind(adminController))

// Users Management
router.get("/users", adminController.getUsers.bind(adminController))
router.get("/users/:id", validateObjectId("id"), validate, adminController.getUserById.bind(adminController))
router.put("/users/:id/profile", validateObjectId("id"), validate, adminController.updateUserProfile.bind(adminController))
router.put("/users/:id/status", validateObjectId("id"), validate, adminController.updateUserStatus.bind(adminController))
router.put("/users/:id/role", validateObjectId("id"), validate, adminController.updateUserRole.bind(adminController))
router.put("/users/:id/verify", validateObjectId("id"), validate, adminController.toggleVerification.bind(adminController))
router.delete("/users/:id", validateObjectId("id"), validate, adminController.deleteUser.bind(adminController))

// User Subscriptions & Billing
router.get("/users/:id/subscriptions", validateObjectId("id"), validate, adminController.getUserSubscriptions.bind(adminController))
router.get("/users/:id/subscription", validateObjectId("id"), validate, adminController.getUserSubscriptions.bind(adminController))
router.post("/users/:id/subscriptions", validateObjectId("id"), validate, adminController.addUserSubscription.bind(adminController))
router.post("/users/:id/subscription", validateObjectId("id"), validate, adminController.addUserSubscription.bind(adminController))
router.put("/subscriptions/:subId/status", validateObjectId("subId"), validate, adminController.updateSubscriptionStatus.bind(adminController))

// Verifications Management (Aggregated for convenience)
router.get("/verifications", verificationController.getVerifications.bind(verificationController))
router.put("/verifications/:id/review", validateObjectId("id"), ...reviewVerification, validate, verificationController.reviewVerification.bind(verificationController))

// Abuse Reports Management (Aggregated for convenience)
router.get("/reports", reportController.getReports.bind(reportController))
router.put("/reports/:id/status", validateObjectId("id"), ...updateReportStatus, validate, reportController.updateReportStatus.bind(reportController))

export default router


