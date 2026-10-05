import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.svg";
import { ArrowRight } from "lucide-react";

const Matchyoulike = () => {
  const navigate = useNavigate();
  const matches = [
    {
      image: defaultAvatar,
      profession: "LAWYER",
      name: "Ishani D",
    },
    {
      image: defaultAvatar,
      profession: "MANAGER",
      name: "Pratiksha Bedi",
    },
    {
      image: defaultAvatar,
      profession: "BANKER",
      name: "Ishani Shah",
    },
    {
      image: defaultAvatar,
      profession: "ACTRESS",
      name: "Isha Patel",
    },
  ];

  return (
    <div className="py-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2f2f2f]">
          Matches You Would Like to View
        </h2>

        <button 
          onClick={() => navigate("/browse-matches")}
          className="flex items-center gap-2 text-[#b3243a] font-semibold hover:gap-3 transition-all cursor-pointer"
        >
          View All
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {matches.map((match, index) => (
          <div
            key={index}
            onClick={() => navigate("/browse-matches")}
            className="relative overflow-hidden rounded-2xl h-[430px] group cursor-pointer"
          >
            <img
              src={match.image}
              alt={match.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />

            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
              <p className="text-[11px] tracking-[2px] uppercase font-medium">
                {match.profession}
              </p>

              <h3 className="text-xl font-medium mt-1">
                {match.name}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Matchyoulike;