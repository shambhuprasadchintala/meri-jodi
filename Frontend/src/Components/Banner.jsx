import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { sendOtp } from "../api/authApi"
import bannerimg1 from "../assets/bannerimg1.jpg"
import star from "../assets/star.svg"

const Banner = () => {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  // const [phone, setPhone] = useState("") // Twilio phone registration state - commented for reference
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = () => {
    navigate("/signup", {
      state: { name: name.trim(), email: email.trim() },
    })
  }

  return (
    <div>
      <section id="home" className="relative w-full min-h-[620px] bg-cover bg-center"
        style={{ backgroundImage: `url(${bannerimg1})` }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 lg:px-20 py-10 sm:py-16 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          <div className="w-full lg:max-w-[550px] text-white text-center lg:text-left">
            <span className="inline-flex items-center px-4 py-1.5 sm:py-2 rounded-full bg-[#842029] outline-[#D8465C] outline-2 text-xs sm:text-sm">
              <img src={star} alt="Star" className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              100% Verified Matchmaking
            </span>
            <h1 className="mt-4 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif leading-tight">
              Find Your <br className="hidden sm:inline" /> Perfect Match
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-100">
              Discover Genuine Matches With Verified Compatibility & Trust.
            </p>
            <div className="hidden lg:flex gap-2 mt-10">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span className="w-2 h-2 rounded-full bg-white/50"></span>
              <span className="w-2 h-2 rounded-full bg-white/50"></span>
              <span className="w-2 h-2 rounded-full bg-white/50"></span>
            </div>
          </div>

          <div className="w-full max-w-[420px] bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-[#842029] text-white text-center py-4 font-semibold text-lg">
              Create your MeriJodi Profile Now
            </div>
            <div className="p-6 space-y-4">
              <input
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#ED5463]"
              />

              {/* Nodemailer Email Registration Input */}
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#ED5463]"
              />

              {/* 
              ==============================================================================
              TWILIO MOBILE NUMBER REGISTRATION - COMMENTED FOR REFERENCE AS REQUESTED
              ==============================================================================
              <div className="flex gap-3">
                <input type="text" value="+91" disabled className="w-16 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 outline-none" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter mobile number"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 outline-none"
                />
              </div>
              <p className="text-xs text-gray-500">OTP will be sent to this number</p>
              ==============================================================================
              */}

              <p className="text-xs text-gray-500">Fast, direct registration with verified security</p>
              <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-[#ED5463] hover:bg-[#EE7985] text-white font-semibold py-4 rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Register Now for free"}
              </button>
              <div className="text-center text-xs text-gray-500 leading-relaxed">
                By clicking register now for free, I agree to the
                <div>
                  <span className="underline px-1">T&C</span>
                  and
                  <span className="underline px-1">Privacy Policy.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Banner
