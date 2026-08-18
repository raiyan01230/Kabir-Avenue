import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Banner } from '../lib/queries';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

interface BannerCarouselProps {
  banners: Banner[];
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch swipe support for mobile phone devices
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const activeBanners = banners.length > 0 ? banners.slice(0, 5) : [];

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeBanners.length, isPaused]);

  if (activeBanners.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  // Touch gestures for mobile phones
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // Minimum px for swipe trigger

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-950 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl group border border-slate-800 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Responsive Height: 230px on small mobile phones, 340px on tablets, 440px+ on desktop */}
      <div className="relative h-[230px] xs:h-[260px] sm:h-[350px] md:h-[420px] lg:h-[480px] xl:h-[520px] w-full">
        {activeBanners.map((banner, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={banner.id || index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Image */}
              <img
                src={banner.imageUrl}
                alt={banner.title || 'Promotional Banner'}
                className={`w-full h-full object-cover object-${(banner as any).imagePosition || (banner as any).image_position || 'center'} transform scale-105 transition-transform duration-7000 ease-out`}
                style={{
                  transform: isActive ? 'scale(1.04)' : 'scale(1.0)',
                  transition: 'transform 6s ease-out',
                }}
                loading={index === 0 ? 'eager' : 'lazy'}
              />

              {/* Responsive Dark Vignette Overlay for High Legibility across all screen sizes */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/20 sm:from-slate-950/90 sm:via-slate-950/50 sm:to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40 sm:from-slate-950/80 sm:to-slate-950/30" />

              {/* Text & Action Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-4 sm:px-10 lg:px-16 max-w-7xl">
                  <div className="max-w-[85%] sm:max-w-xl space-y-1.5 sm:space-y-3 lg:space-y-4">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[9px] sm:text-[11px] font-bold text-slate-200 uppercase tracking-wider sm:tracking-widest">
                      <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
                      <span className="truncate">Featured Highlight</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-lg xs:text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md line-clamp-2">
                      {banner.title}
                    </h1>

                    {/* Subtitle */}
                    {banner.subtitle && (
                      <p className="text-[11px] xs:text-xs sm:text-sm md:text-base text-slate-200/90 font-normal leading-snug sm:leading-relaxed line-clamp-1 sm:line-clamp-2 md:line-clamp-3">
                        {banner.subtitle}
                      </p>
                    )}

                    {/* CTA Button */}
                    <div className="pt-1 sm:pt-2">
                      <Link
                        to={banner.buttonLink || '/shop'}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-7 sm:py-3.5 bg-white hover:bg-slate-100 text-slate-950 text-xs sm:text-sm font-black rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition duration-200 active:scale-95"
                      >
                        <span>{banner.buttonText || 'Shop Now'}</span>
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Left/Right Controls: Responsive sized for mobile phones and touch screens */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all opacity-70 hover:opacity-100 active:scale-90 shadow-md"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all opacity-70 hover:opacity-100 active:scale-90 shadow-md"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Indicator Dots */}
          <div className="absolute bottom-2.5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentIndex === idx
                    ? 'w-5 sm:w-7 h-1.5 sm:h-2 bg-white shadow-sm'
                    : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
