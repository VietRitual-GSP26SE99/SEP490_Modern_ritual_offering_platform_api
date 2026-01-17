import React, { useState, useEffect } from 'react';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  description: string;
}

const Carousel: React.FC<{ slides: Slide[]; onCtaClick: () => void }> = ({ slides, onCtaClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Auto-play every 5 seconds
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative h-[640px] md:mx-8 md:mt-8 rounded-[2.5rem] overflow-hidden shadow-2xl group">
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" 
            style={{ backgroundImage: `url("${slide.image}")` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/60 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-center px-12 md:px-24 max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-gray-200 backdrop-blur-md px-4 py-2 rounded-full border border-gray-300 mb-8 w-fit animate-in fade-in slide-in-from-bottom-4 duration-500">
              <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></span>
              <span className="text-gray-700 text-[10px] font-black uppercase tracking-widest">{slide.subtitle}</span>
            </div>
            <h1 className="text-white text-5xl md:text-7xl font-display font-black leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {slide.title}
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-light leading-relaxed mb-10 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              {slide.description}
            </p>
            <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={onCtaClick}
                className="bg-primary text-white px-10 py-4 rounded-lg font-bold text-lg transition-all hover:bg-primary/90 hover:shadow-2xl"
              >
                Đặt mâm ngay
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === currentSlide 
                ? 'bg-primary w-8' 
                : 'bg-white/40 w-2 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Previous/Next Buttons */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default Carousel;
