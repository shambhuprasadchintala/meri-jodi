import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import PendingApprovalScreen from "./PendingApprovalScreen"

const ProtectedRoute = ({ children, adminOnly = false, requireApproved = true }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#E5E7EB] border-t-[#ED5463] animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B7280]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/home" replace />
  }

  if (requireApproved && !user.isApproved && user.role !== "admin") {
    return <PendingApprovalScreen />
  }

  return children
}

export default ProtectedRoute
