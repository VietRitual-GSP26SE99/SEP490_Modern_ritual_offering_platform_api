import React, { useState, useEffect } from 'react';

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  description: string;
  rawBanner?: any;
}

const Carousel: React.FC<{ 
  slides: Slide[]; 
  onCtaClick: (slide: Slide) => void 
}> = ({ slides, onCtaClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Auto-play every 5 seconds
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative h-[350px] md:h-[640px] md:mx-8 md:mt-8 rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] group">
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] ease-out group-hover:scale-110" 
            style={{ backgroundImage: `url("${slide.image}")` }}
          />
          {/* Enhanced Multi-layer Overlay */}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-24 max-w-5xl">
            {/* Subtitle Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl border border-white/20 mb-4 md:mb-8 w-fit animate-in fade-in slide-in-from-left-8 duration-700">
              <span className="w-2.5 h-2.5 bg-gold rounded-full animate-pulse shadow-[0_0_10px_#FFD700]"></span>
              <span className="text-white text-[11px] font-black uppercase tracking-[0.2em]">{slide.subtitle}</span>
            </div>

            {/* Title with Text Shadow */}
            <h1 
              className="text-white text-3xl md:text-8xl font-display font-black leading-[1.1] mb-4 md:mb-8 animate-in fade-in slide-in-from-left-12 duration-1000 delay-100 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
              style={{ whiteSpace: 'pre-line' }}
            >
              {slide.title}
            </h1>

            {/* Description */}
            <p className="text-white/80 text-xs md:text-2xl font-medium leading-relaxed mb-6 md:mb-12 max-w-2xl animate-in fade-in slide-in-from-left-16 duration-1000 delay-200 line-clamp-2 md:line-clamp-none">
              {slide.description}
            </p>

            {/* CTA Button */}
            <div className="flex flex-wrap gap-5 animate-in fade-in slide-in-from-left-20 duration-1000 delay-300">
              <button 
                onClick={() => onCtaClick(slide)}
                className="group/btn relative overflow-hidden bg-white text-primary px-8 py-3 md:px-12 md:py-5 rounded-xl md:rounded-[1.25rem] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_10px_30px_-5px_rgba(255,255,255,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                <span className="relative z-10">
                  {slide.rawBanner 
                    ? (slide.rawBanner.linkType === 'Ritual' ? 'Xem dịch vụ ngay' : 'Khách phá ưu đãi') 
                    : 'Đặt mâm cúng ngay'}
                </span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2.5 bg-black/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              idx === currentSlide 
                ? 'bg-gold w-8 shadow-[0_0_8px_#FFD700]' 
                : 'bg-white/40 w-1.5 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Previous/Next Buttons */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-8 top-1/2 transform -translate-y-1/2 z-20 bg-white/5 hover:bg-white/10 text-white w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-md border border-white/10 hover:scale-110 active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 z-20 bg-white/5 hover:bg-white/10 text-white w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-md border border-white/10 hover:scale-110 active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Carousel;
