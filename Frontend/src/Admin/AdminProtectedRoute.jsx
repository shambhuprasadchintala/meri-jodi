import { Navigate, useLocation } from "react-router-dom"

/**
 * AdminProtectedRoute Guard
 * Ensures only users with an active admin_token and role="admin" can access Admin routes.
 * Redirects unauthenticated or non-admin users to /admin/login.
 */
export default function AdminProtectedRoute({ children }) {
  const location = useLocation()
  const adminToken = localStorage.getItem("admin_token")
  
  let adminUser = null
  try {
    adminUser = JSON.parse(localStorage.getItem("admin_user") || "null")
  } catch {
    adminUser = null
  }

  // Verify token existence and admin role
  const isAuthenticatedAdmin = Boolean(adminToken && adminUser && adminUser.role === "admin")

  if (!isAuthenticatedAdmin) {
    // If not authenticated as admin, clear any stale admin data and redirect to /admin/login
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_user")
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
