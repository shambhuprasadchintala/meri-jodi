import { Link } from 'react-router-dom'
import logo2 from '../assets/logo2.png'

const Footer = () => {
  return (
    <div>
        {/* Footer Section */}
      <footer className="bg-pink-50/40 w-full pt-16 pb-8 border-t border-pink-100/30">
        <div className="max-w-7xl mx-auto px-4 text-center">
          
          {/* Brand Logo Header */}
          <div className="logo">
            <Link to="/">
              <img src={logo2} alt="MeriJodi Logo" className="mx-auto w-40 h-12 mb-4" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs sm:text-sm font-normal mb-6">
            <a href="/#home" className="text-[#842029] hover:underline">Home</a>
            <a href="/#about" className="text-gray-600 hover:text-[#842029] transition-colors">About us</a>
            <Link to="/browse-matches" className="text-gray-600 hover:text-[#842029] transition-colors">Browse Matches</Link>
            <a href="/#stories" className="text-gray-600 hover:text-[#842029] transition-colors">Success Stories</a>
            <a href="/#faqs" className="text-gray-600 hover:text-[#842029] transition-colors">FAQs</a>
          </nav>

          {/* Support Helpline */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-gray-600 mb-8">
            <div className="flex items-center gap-1.5 bg-white/80 px-4 py-2 rounded-full border border-pink-200/60 shadow-2xs">
              <span className="text-gray-500">Customer Support:</span>
              <a href="tel:+918446360709" className="font-bold text-[#842029] hover:underline">
                +91 84463 60709
              </a>
            </div>
            <div className="flex items-center gap-1.5 bg-white/80 px-4 py-2 rounded-full border border-pink-200/60 shadow-2xs">
              <span className="text-gray-500">Email:</span>
              <a href="mailto:support@merijodi.com" className="font-semibold text-gray-800 hover:underline">
                support@merijodi.com
              </a>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center items-center gap-5 mb-10">
            {/* Facebook */}
            <a href="#" className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center hover:opacity-80 transition-opacity">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center hover:opacity-80 transition-opacity">
              <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="#" className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center hover:opacity-80 transition-opacity">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>

          {/* Thin separator line matching the image layout */}
          <div className="border-t border-[#842029]/20 w-full max-w-5xl mx-auto mb-6"></div>

          {/* Copyright Note */}
          <p className="text-gray-400 text-xs tracking-wide">
            &copy; 2026 MeriJodi. All rights reserved.
          </p>

        </div>
      </footer>
    </div>
  )
}

export default Footer