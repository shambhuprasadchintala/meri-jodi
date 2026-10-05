import  { useState } from "react";
import { useNavigate } from "react-router-dom";
import registerPageImage from "../assets/login-image.png";
import logo from "../assets/logo2.png";

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState("manual");

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* image div */}
      <div className="h-screen w-5/12 hidden lg:block">
        <img
          src={registerPageImage}
          alt="banner image"
          className="h-full w-full object-cover"
        />
      </div>

      {/* form div */}
      <div className="px-8 sm:px-16 lg:px-20 py-8 w-full lg:flex-1 flex flex-col justify-center">
        <div className="mb-12">
          <img src={logo} alt="logo" className="h-10" />
        </div>

        <div className="max-w-2xl">
          <div className="mb-10">
            <button
              onClick={() => navigate("/register")}
              className="text-sm text-[#ED5463] hover:text-[#D63E52] font-medium mb-6 flex items-center gap-1 transition-colors cursor-pointer"
            >
              ← Go Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-[#6B7280] text-sm">
              Please enter your personal, family, education, and lifestyle details to complete your profile setup.
            </p>
          </div>

          <div className="space-y-4">
            {/* [COMMENTED OUT: AI BIODATA UPLOAD OPTION - MANUAL ENTRY ONLY]
            <label className="flex items-start gap-4 p-6 border-2 border-[#E5E7EB] rounded-2xl cursor-pointer hover:border-[#ED5463] transition-colors"
              style={{borderColor: selectedOption === "upload" ? "#ED5463" : "#E5E7EB"}}
            >
              <input
                type="radio"
                name="profileOption"
                value="upload"
                checked={selectedOption === "upload"}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="w-6 h-6 mt-1 cursor-pointer accent-[#ED5463]"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Upload Biodata
                </h3>
                <p className="text-sm text-[#6B7280]">
                  Already have a biodata PDF? Upload it and our AI will automatically extract and fill your profile details for a faster setup.
                </p>
              </div>
            </label>
            */}

            {/* Add Details Manually Option */}
            <label className="flex items-start gap-4 p-6 border-2 border-[#ED5463] bg-rose-50/20 rounded-2xl cursor-pointer transition-colors shadow-xs">
              <input
                type="radio"
                name="profileOption"
                value="manual"
                checked={true}
                readOnly
                className="w-6 h-6 mt-1 cursor-pointer accent-[#ED5463]"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1 text-base">
                  Fill Profile Details Manually
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Enter your information step-by-step including personal background, education, profession, family background, and partner preferences.
                </p>
              </div>
            </label>
          </div>

          {/* Next & Skip Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => navigate("/home")}
              className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors order-2 sm:order-1 cursor-pointer"
            >
              Skip for now &rarr; Go to Dashboard
            </button>
            <button 
              onClick={() => navigate("/add-details")}
              className="w-full sm:w-auto bg-[#842029] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#6b1b27] transition-all order-1 sm:order-2 cursor-pointer shadow-md"
            >
              Continue to Details Form &rarr;
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-12 flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
            <span>Need Help? Call Support:</span>
            <a href="tel:+918446360709" className="font-bold text-[#842029] hover:underline">
              +91 84463 60709
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;