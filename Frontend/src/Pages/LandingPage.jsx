import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../Components/Navbar";
import Banner from "../Components/Banner";
// [COMMENTED OUT: AI MATCHMAKING COMPONENT]
// import AIMatchmaking from "../Components/AIMatchmaking";
import WhyChooseUs from "../Components/Whychooseus";
import SuccessStories from "../Components/SuccessStories";
import FQA from "../Components/FQA";
import Footer from "../Components/Footer";

const LandingPage = () => {
  const { isAuth, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#E5E7EB] border-t-[#ED5463] animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B7280]">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuth) {
    return <Navigate to="/home" replace />;
  }

  return (
    <>
      <div className="LandingPage">
        <Navbar />
        <Banner />
        {/* [COMMENTED OUT: AI MATCHMAKING SECTION] */}
        {/* <AIMatchmaking /> */}
        <WhyChooseUs />
        <SuccessStories />
        <FQA />
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
