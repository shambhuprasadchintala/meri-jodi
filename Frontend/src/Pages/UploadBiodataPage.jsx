import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import registerPageImage from "../assets/login-image.png";
import logo from "../assets/logo2.png";

// [COMMENTED OUT: FRONTEND AI BIODATA & DOCUMENT EXTRACTION LOGIC]
// Document extraction has been disabled across the platform.
// Users must manually fill in all personal, education, career, and family details.
/*
const UploadBiodataExtractionModule = () => {
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setError("Please upload PDF, JPG, or PNG files only.");
      return;
    }

    if (file.size > maxSize) {
      setError("File size must be less than 10MB.");
      return;
    }

    setError("");
    setUploadedFile(file);
  };

  const handleGenerate = async () => {
    if (!uploadedFile) {
      setError("Please upload a biodata file first.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const response = await axiosInstance.post("/extraction/extract-biodata", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const result = response.data;
      if (!result.success) {
        const message = result.error || "Failed to extract biodata. Please try again.";
        setError(message);
        return;
      }

      const extracted = result.data?.data || result.data;
      navigate("/add-details", { state: { initialData: extracted, fromUpload: true } });
    } catch (err) {
      console.error(err);
      setError("An error occurred while uploading. Please try again.");
    } finally {
      setLoading(false);
    }
  };
};
*/

const UploadBiodataPage = () => {
  const navigate = useNavigate();

  // Automatically forward users to manual details entry
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/add-details", { replace: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

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
          <div className="mb-8">
            <button
              onClick={() => navigate("/complete-profile")}
              className="text-sm text-[#ED5463] hover:text-[#D63E52] font-medium mb-6 flex items-center gap-1 transition-colors cursor-pointer"
            >
              ← Go Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manual Profile Entry
            </h1>
            <p className="text-[#6B7280] text-sm leading-relaxed">
              Automated document extraction has been disabled to ensure the highest accuracy of matrimonial details. Please enter your profile details manually.
            </p>
          </div>

          <div className="p-8 border-2 border-rose-200 bg-rose-50/30 rounded-2xl text-center mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2 font-serif">
              Step-by-Step Profile Creation
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Fill in your personal background, education, profession, family values, and partner preferences in just a few minutes.
            </p>

            <button
              onClick={() => navigate("/add-details")}
              className="bg-[#842029] hover:bg-[#6b1b27] text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Fill Profile Details Manually &rarr;
            </button>
          </div>

          {/* Support Section */}
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
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

export default UploadBiodataPage;