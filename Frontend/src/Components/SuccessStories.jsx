import SuccessStories1 from '../assets/SuccessStories1.jpg';
import SuccessStories2 from '../assets/SuccessStories2.jpg';
import img4 from '../assets/img4.jpg';

const SuccessStories = () => {
  const stories = [
    {
      id: 1,
      img: SuccessStories1,
      quote: "“MeriJodi helped us find each other within a few weeks. The AI recommendations were surprisingly accurate, and today we are happily married.”",
      names: "Mr. & Mrs. Bedi",
      location: "Mumbai"
    },
    {
      id: 2,
      img: SuccessStories2,
      quote: "“The platform was easy to use, and the verified profiles gave us confidence. We found a perfect match and are grateful for the experience.”",
      names: "Sneha & Akash",
      location: "Jaipur"
    },
    {
      id: 3,
      img: img4,
      quote: "“We connected through MeriJodi and instantly shared similar values and goals. It made our search simple and meaningful.”",
      names: "Pooja & Nikhil",
      location: "Thane"
    },
    {
      id: 4,
      img: SuccessStories1,
      quote: "“Highly recommend MeriJodi to anyone looking for a serious life partner. The personalized approach makes all the difference.”",
      names: "Anjali & Rohit",
      location: "Delhi"
    },
    {
      id: 5,
      img: SuccessStories2,
      quote: "“Finding someone who checks all your boxes isn't easy, but the compatibility analysis nailed it perfectly. Thank you!”",
      names: "Meera & Vikram",
      location: "Bengaluru"
    },
    {
      id: 6,
      img: img4,
      quote: "“We loved the privacy control features. It felt completely secure, allowing us to build a foundation at our own pace.”",
      names: "Kriti & Sameer",
      location: "Pune"
    },
    {
      id: 7,
      img: SuccessStories1,
      quote: "“The interface is clean and straightforward. We hit it off from our very first conversation. Best matchmaking site hands down.”",
      names: "Riya & Varun",
      location: "Ahmedabad"
    },
    {
      id: 8,
      img: SuccessStories2,
      quote: "“Family-approved matches were a huge priority for us. MeriJodi respected our traditions while giving us modern tools.”",
      names: "Neha & Manish",
      location: "Lucknow"
    },
    {
      id: 9,
      img: img4,
      quote: "“From chatting on the app to walking down the aisle, our journey was seamless. AI features saved us so much time.”",
      names: "Priya & Amit",
      location: "Hyderabad"
    },
    {
      id: 10,
      img: SuccessStories1,
      quote: "“What we appreciated most was the genuine profile pool. No fake accounts, just real individuals looking for real love.”",
      names: "Sonam & Rahul",
      location: "Kolkata"
    }
  ];

  // Combine arrays to ensure a flawless, unbroken infinite scrolling loop
  const doubleStories = [...stories, ...stories];

  return (
    <section id="stories" className="bg-[#842029] py-20 overflow-hidden w-full font-sans">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 px-4">
        <h2 className="text-3xl sm:text-4xl font-serif text-white mb-4 tracking-wide">
          Success Stories from Happy Couples
        </h2>
        <p className="text-pink-100/70 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Discover How MeriJodi Helped Thousands Of Individuals Find Meaningful Relationships And Lifelong Partners.
        </p>
      </div>

      {/* Marquee Wrapper Container */}
      <div className="flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
        <div className="flex gap-2 animate-marquee whitespace-nowrap py-4 dynamic-pause">
          {doubleStories.map((story, index) => (
            <div 
              key={`${story.id}-${index}`}
              className="inline-block w-[350px] sm:w-[350px] flex-shrink-0  bg-green-100/20 overflow-hidden rounded-2xl mx-2 backdrop-blur-sm"
            >
              {/* Image Container with precise aspect ratio */}
              <div className="w-full h-[240px] rounded-2xl overflow-hidden bg-black/20">
                <img 
                  src={story.img} 
                  alt={`${story.names} Wedding`} 
                  className="w-full h-full object-cover whitespace-normal"
                />
              </div>

              {/* Text Card Content */}
              <div className="py-4 px-4 whitespace-normal ">
                <p className="text-white text-sm  text-[14px] leading-relaxed font-normal mb-4 min-h-[60px]">
                  {story.quote}
                </p>
                <div className="flex items-center text-xs sm:text-sm">
                  <span className="text-white font-medium mr-1.5">{story.names}</span>
                  <span className="text-white/70 font-light">From {story.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      
    </section>
  );
};

export default SuccessStories;