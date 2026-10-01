import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { verifyOtp, sendOtp } from "../api/authApi"
import registerPageImage from "../assets/login-image.png"
import logo from "../assets/logo2.png"
import secure from "../assets/secure.png"
import OtpBoxInput from "../Components/OtpBoxInput"

const RegisterPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const { phone, name } = location.state || {}
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!phone) navigate("/register")
  }, [phone, navigate])

  useEffect(() => {
    let timer
    if (resendTimer > 0 && !canResend) {
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) { setCanResend(true); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [resendTimer, canResend])

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    setError("")
    const otpCode = String(otp || "").trim()
    if (otpCode.length !== 6) {
      setError("Enter the full 6-digit code.")
      return
    }
    setLoading(true)
    try {
      const data = await verifyOtp(phone, otpCode, name)
      signIn(data.token, data.user)
      navigate("/complete-profile")
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError("")
    setResendTimer(60)
    setCanResend(false)
    if (!phone) { setError("Phone number is missing."); return }
    setLoading(true)
    try {
      await sendOtp(phone)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.")
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = String(otp || "").trim().length === 6

  return (
    <div className="min-h-screen w-full flex bg-white">
      <div className="h-screen w-5/12 hidden lg:block">
        <img src={registerPageImage} alt="banner" className="h-full w-full object-cover" />
      </div>
      <div className="px-8 sm:px-16 lg:px-20 py-8 w-full lg:flex-1 flex flex-col justify-center">
        <div className="mb-12">
          <img src={logo} alt="logo" className="h-10" />
        </div>
        <div className="max-w-md">
          <div className="mb-10">
            <button
              onClick={() => window.history.back()}
              className="text-sm text-[#6B7280] hover:text-[#374151] font-medium mb-6 flex items-center gap-1 transition-colors"
            >
              ← Go Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Enter OTP</h1>
            <p className="text-[#6B7280] text-sm">
              Set up your profile and get started in minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8 border border-[#E5E7EB] p-10 rounded-2xl">
            <div className="flex flex-col items-center gap-4">
              <img src={secure} alt="secure" className="h-12 w-12" />
              <p className="text-[#842029] text-sm font-medium text-center leading-relaxed">
                Please enter the 6-digit code sent to {phone || "+91 XXXXXXX"}
              </p>
              {name && (
                <p className="text-[#6B7280] text-xs">
                  Signing in as <span className="font-semibold">{name}</span>
                </p>
              )}
            </div>

            <OtpBoxInput
              value={otp}
              onChange={setOtp}
              error={Boolean(error)}
              idPrefix="register-otp"
            />

            <div className="text-sm text-[#6B7280]">
              Resend OTP{" "}
              {canResend ? (
                <button type="button" onClick={handleResend} className="text-[#ED5463] font-semibold hover:underline">
                  Resend
                </button>
              ) : (
                <span className="font-semibold">{resendTimer} sec</span>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full rounded-full py-3 font-semibold text-white transition-all ${
                isFormValid && !loading
                  ? "bg-[#ED5463] hover:bg-[#D63E52] cursor-pointer"
                  : "bg-[#ED5463] opacity-60 cursor-not-allowed"
              }`}
            >
              {loading ? "Verifying..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
