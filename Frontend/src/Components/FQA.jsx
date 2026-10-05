import  { useState } from 'react';
const FQA = () => {
  // State to track which FAQ accordion is open (null means all closed)
  const [openIndex, setOpenIndex] = useState(0); // Default first one open to match image

  const faqs = [
    {
      question: "How does MeriJodi work?",
      answer: "MeriJodi connects verified compatible profiles based on direct partner preferences, family values, education, and relationship goals."
    },
    {
      question: "Is registration free?",
      answer: "Yes, registration is completely free. You can create your profile, add photos, and start browsing potential matches right away."
    },
    {
      question: "How do I create my profile?",
      answer: "Simply sign up with your email and mobile number, enter your profile details step-by-step, set your ideal partner preferences, and submit for verification."
    },
    {
      question: "How are matches recommended?",
      answer: "Our matchmaking engine evaluates partner criteria—including age range, community, education, occupation, location, and lifestyle preferences—to introduce you to highly compatible matches."
    },
    {
      question: "Can I chat with matches?",
      answer: "Yes! Once you accept a match recommendation or connect mutually, you can safely use our built-in secure chat interface to start a conversation."
    },
    {
      question: "Is my personal information safe?",
      answer: "Absolutely. We prioritize your privacy with advanced data protection algorithms, profile verification checks, and customizable privacy controls to restrict who sees your details."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div id="faqs" className="bg-white min-h-screen font-sans flex flex-col justify-between">
      
      {/* FAQ Accordion Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Typo intentionally matches the image heading 'FQAs' */}
        <h2 className="text-3xl sm:text-4xl font-serif text-center text-gray-900 mb-12 tracking-wide">
          FQAs
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="border border-gray-100 rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300"
              >
                {/* Accordion Trigger Header */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gray-50/50"
                >
                  <span className="text-base sm:text-lg font-medium text-[#842029]">
                    {faq.question}
                  </span>
                  
                  {/* Styled Plus/Minus Toggle Icon */}
                  <span className="ml-4 flex-shrink-0 text-xl text-gray-500 relative w-6 h-6 flex items-center justify-center">
                    <span className="absolute bg-[#842029] h-0.5 w-4 rounded-full"></span>
                    <span className={`absolute bg-[#842029] h-4 w-0.5 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-90 opacity-0' : ''}`}></span>
                  </span>
                </button>

                {/* Smooth Expandable Content Body */}
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-40 border-t border-gray-50' : 'max-h-0'
                  }`}
                >
                  <p className="p-5 text-sm sm:text-base text-gray-500 leading-relaxed bg-white">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};

export default FQA;