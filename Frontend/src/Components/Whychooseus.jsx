import bannerimg1 from '../assets/bannerimg1.jpg';
import  img2 from '../assets/img2.jpg';
import  img3 from '../assets/img3.jpg';
import  img4 from '../assets/img4.jpg';
import  img5 from '../assets/img5.jpg';
import  img6 from '../assets/img6.jpg';
import  img7 from '../assets/img7.jpg';
import  centerimg from '../assets/centerimg.jpg';





const Whychooseus = () => {
  return (
    <section id="why-us" className="bg-white py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Content Column */}
        <div className="max-w-xl">
          <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6 tracking-wide">
            Why Choose MeriJodi?
          </h2>
          
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-6">
            At <span className="font-semibold text-gray-800">MeriJodi.com</span>, we combine traditional values with modern security to help people find genuine life partners. Our <span className="font-semibold text-gray-800">verified matchmaking platform</span> understands preferences, lifestyle choices, family values, and relationship goals to suggest highly compatible matches.
          </p>
          
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
            Whether you are searching for a serious relationship, marriage partner, or <span className="font-semibold text-gray-800">family-approved match</span>, MeriJodi makes the process simple, safe, and personalized.
          </p>
        </div>

        {/* Right Collage Column */}
        <div className="relative w-full h-[500px] flex items-center justify-center">
          
          {/* Decorative Pink Background Card */}
          {/* <div className="absolute w-[320px] h-[340px] bg-pink-50/60 rounded-3xl translate-x-12 translate-y-12 -z-10" /> */}

          {/* Decorative Maroon Dot Matrix Grid */}
          <div className="absolute left-[18%] top-[34%] grid grid-cols-4 gap-2 z-10 p-3">
            {[...Array(32)].map((_, i) => (
              <div key={i} className="w-1 h-1 p-[3px] rounded-full bg-[#842029]" />
            ))}
          </div>

          {/* Center Main Image */}
          <div className="absolute w-[240px] h-[280px] rounded-2xl overflow-hidden shadow-xl z-20 transform transition-transform duration-300">
            <img 
              src={centerimg}
              alt="Main Wedding" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Top Floating Image (Hands holding/varmala) */}
          <div className="absolute top-[5%] right-[32%] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-lg z-30 transform hover:scale-105 transition-transform duration-300">
            <img 
              src={img2}
              alt="Wedding ritual" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Top-Left Floating Image (Bride looking down) */}
          <div className="absolute top-[20%] left-[16%] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-lg z-30 transform hover:scale-105 transition-transform duration-300">
            <img 
              src={bannerimg1} 
              alt="Bride profile" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Top-Right Floating Image (Rings) */}
          <div className="absolute top-[20%] right-[10%] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-lg z-30 transform hover:scale-105 transition-transform duration-300">
            <img 
              src={img3}
              alt="Wedding rings" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Middle-Right Floating Image (Family/Group) */}
          <div className="absolute bottom-[35%] right-[6%] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-lg z-30 transform hover:scale-105 transition-transform duration-300">
            <img 
              src={img4} 
              alt="Family meeting" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Bottom-Left Floating Image (Bride Close-up Red Veil) */}
          <div className="absolute bottom-[18%] left-[12%] w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-lg z-30 transform hover:scale-105 transition-transform duration-300">
            <img 
              src={img7}
              alt="Bride portrait" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Bottom-Right Floating Image (Couple from back/hands) */}
          <div className="absolute bottom-[18%] right-[24%] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-lg z-30 transform hover:scale-105 transition-transform duration-300">
            <img 
              src={img5}
              alt="Couple details" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Bottom Floating Image (Mandap/Entrance background) */}
          <div className="absolute bottom-[2%] right-[36%] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-lg z-30 transform hover:scale-105 transition-transform duration-300">
            <img 
              src={img6}
              alt="Wedding mandap" 
              className="w-full h-full object-cover"
            />
          </div>

        </div>

      </div>
    </section>
  );
};

export default Whychooseus;