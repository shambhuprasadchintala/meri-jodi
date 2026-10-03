import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react"
import "./Admin.css"

const RAW_API = (typeof import.meta !== "undefined" && (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_BASE)) || "http://localhost:5001/api/v1"
const API_BASE = RAW_API.replace(/\/v1\/?$/, "").replace(/\/+$/, "")

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // If already authenticated as admin, redirect directly to /admin
  useEffect(() => {
    const existingToken = localStorage.getItem("admin_token")
    try {
      const existingUser = JSON.parse(localStorage.getItem("admin_user") || "null")
      if (existingToken && existingUser && existingUser.role === "admin") {
        navigate("/admin", { replace: true })
      }
    } catch {
      // ignore
    }
  }, [navigate])

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setError("")
    setSuccessMsg("")
    setLoading(true)

    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password

    if (!cleanEmail || !cleanPassword) {
      setError("Please enter both administrator email and password.")
      setLoading(false)
      return
    }

    try {
      let res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      })
      let data = await res.json()

      // Handle non-admin or failed attempt
      if (!res.ok) {
        throw new Error(data.message || "Administrator authentication failed.")
      }

      const user = data.data?.user || data.user
      const token = data.data?.accessToken || data.data?.token || data.token

      if (!user || user.role !== "admin") {
        throw new Error("Access Denied: You do not have administrator permissions.")
      }

      if (!token) {
        throw new Error("Authentication failed: No access token returned.")
      }

      // Persist admin session
      localStorage.setItem("admin_token", token)
      localStorage.setItem("admin_user", JSON.stringify(user))

      setSuccessMsg(`Welcome, ${user.name || "Administrator"}! Redirecting to dashboard...`)

      // Redirect to target or /admin
      const destination = location.state?.from?.pathname || "/admin"
      setTimeout(() => {
        navigate(destination, { replace: true })
      }, 600)
    } catch (err) {
      setError(err.message || "An unexpected error occurred during admin authentication.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8F5", padding: "1.5rem" }}>
      <div style={{ background: "#ffffff", maxWidth: "440px", width: "100%", borderRadius: "24px", padding: "2.5rem", border: "1px solid #FFE4E8", boxShadow: "0 10px 30px -5px rgba(132, 32, 41, 0.08)" }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#FFF0F2", color: "#842029", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", border: "1px solid #FFE4E8" }}>
            <ShieldCheck size={32} />
          </div>
          <h1 className="font-serif" style={{ fontSize: "1.85rem", fontWeight: "bold", color: "#640515", margin: 0 }}>
            MeriJodi Admin
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.35rem", fontWeight: "500" }}>
            Trust &amp; Safety Operational Console
          </p>
          <div style={{ display: "inline-block", marginTop: "0.5rem", padding: "0.25rem 0.75rem", background: "#FFF0F2", color: "#842029", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Authorized Personnel Only
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div style={{ padding: "0.85rem 1rem", background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", borderRadius: "12px", fontSize: "0.8125rem", marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", gap: "0.5rem", lineHeight: 1.4 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: "0.85rem 1rem", background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", borderRadius: "12px", fontSize: "0.8125rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleAdminLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Mail size={14} /> Admin Email
            </label>
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="admin@merijodi.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              style={{ fontSize: "0.9375rem" }}
            />
          </div>

          <div>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Lock size={14} /> Secure Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingRight: "2.75rem", fontSize: "0.9375rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: "0.875rem", fontSize: "0.9375rem", marginTop: "0.5rem", width: "100%", fontWeight: "700" }}
          >
            {loading ? "Verifying Credentials..." : "Sign In to Admin Console"}
          </button>
        </form>

        {/* Return to Consumer App link */}
        <div style={{ marginTop: "1.75rem", textAlign: "center", paddingTop: "1.25rem", borderTop: "1px solid #F3F4F6" }}>
          <Link
            to="/home"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#6B7280", fontSize: "0.8125rem", textDecoration: "none", fontWeight: "600" }}
          >
            <ArrowLeft size={14} /> Return to Main Website
          </Link>
        </div>
      </div>
    </div>
  )
}
