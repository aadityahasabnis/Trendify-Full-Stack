import React, { useState, useEffect } from "react";

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sample slides data - in a real app, this would come from your backend
  const slides = [
    {
      id: 1,
      title: "Latest Arrivals!",
      subtitle: "OUR BESTSELLERS",
      image: "https://images.unsplash.com/photo-1534215754734-18e55d13e346?q=80&w=1904&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      cta: "SHOP NOW"
    },
    {
      id: 2,
      title: "Summer Collection",
      subtitle: "NEW SEASON",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      cta: "EXPLORE"
    },
    {
      id: 3,
      title: "Special Offers",
      subtitle: "LIMITED TIME",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      cta: "SHOP DEALS"
    }
  ];

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Slideshow */}
      <div className="relative h-[400px] sm:h-[500px] md:h-[600px]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
          >
            <div className="flex flex-col sm:flex-row h-full">
              {/* Hero Left side */}
              <div className="flex items-center justify-center w-full py-10 sm:w-1/2 sm:py-0 bg-gray-50">
                <div className="text-[#414141] px-6 sm:px-10">
                  <div className="flex items-center gap-2">
                    <p className="w-8 md:w-11 h-[2px] bg-[#414141]"></p>
                    <p className="text-sm font-medium md:text-base">{slide.subtitle}</p>
                  </div>
                  <h1 className="text-3xl leading-relaxed prata-regular sm:py-3 lg:text-5xl">
                    {slide.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-4">
                    <p className="text-sm font-semibold md:text-base">{slide.cta}</p>
                    <p className="w-8 md:w-11 h-[2px] bg-[#414141]"></p>
                  </div>
                </div>
              </div>
              {/* Hero Right side */}
              <div className="w-full sm:w-1/2 h-1/2 sm:h-full">
                <img
                  className="w-full h-full object-cover"
                  src={slide.image}
                  alt={slide.title}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full ${index === currentSlide ? "bg-white" : "bg-white/50"
              }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero;
