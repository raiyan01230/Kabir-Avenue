import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Banner } from '../lib/queries';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

interface BannerCarouselProps {
  banners: Banner[];
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Touch swipe support for all mobile phone devices
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  // Touch gestures for mobile phones with vertical scroll protection
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distanceX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (distanceX > minSwipeDistance) {
      handleNext();
    } else if (distanceX < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-950 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-lg group border border-slate-800 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 
        Fully responsive aspect ratio:
        - aspect-[2.4/1] matches standard 1200x500 banner proportions perfectly on mobile phones, tablets, and desktops.
        - min-height ensures no collapsing.
      */}
      <div className="relative w-full aspect-[2.4/1] min-h-[150px] xs:min-h-[170px] sm:min-h-[220px] md:min-h-[280px] lg:min-h-[360px] xl:min-h-[420px] max-h-[520px]">
        {activeBanners.map((banner, index) => {
          const isActive = index === currentIndex;
          const hasTitle = Boolean(banner.title && banner.title.trim().length > 0);
          const hasSubtitle = Boolean(banner.subtitle && banner.subtitle.trim().length > 0);
          const hasTextContent = hasTitle || hasSubtitle;
          const targetLink = banner.buttonLink || (banner as any).button_link || '/shop';

          return (
            <div
              key={banner.id || index}
              onClick={() => navigate(targetLink)}
              className={`absolute inset-0 cursor-pointer transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Image: scales proportionally across every screen size without distortion */}
              <img
                src={banner.imageUrl || (banner as any).image_url}
                alt={banner.title || 'Store Banner'}
                className="w-full h-full object-cover object-center transform transition-transform duration-7000 ease-out"
                style={{
                  transform: isActive ? 'scale(1.03)' : 'scale(1.0)',
                  transition: 'transform 6s ease-out',
                }}
                loading={index === 0 ? 'eager' : 'lazy'}
              />

              {/* Only render dark overlay and text when there is actual title/subtitle content */}
              {hasTextContent && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent sm:from-slate-950/80 sm:via-slate-950/30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

                  {/* Overlaid Content */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="container mx-auto px-3 sm:px-8 lg:px-14 max-w-7xl">
                      <div className="max-w-[78%] sm:max-w-lg md:max-w-xl space-y-1 sm:space-y-2.5 lg:space-y-3.5">
                        {hasTitle && (
                          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[8px] sm:text-[10px] font-bold text-slate-200 uppercase tracking-wider">
                            <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
                            <span>Featured</span>
                          </div>
                        )}

                        {hasTitle && (
                          <h2 className="text-sm xs:text-base sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md line-clamp-2">
                            {banner.title}
                          </h2>
                        )}

                        {hasSubtitle && (
                          <p className="text-[10px] xs:text-xs sm:text-sm md:text-base text-slate-200/95 font-normal leading-tight sm:leading-relaxed line-clamp-1 sm:line-clamp-2 drop-shadow-sm">
                            {banner.subtitle}
                          </p>
                        )}

                        <div className="pt-0.5 sm:pt-1">
                          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-5 sm:py-2.5 bg-white text-slate-950 text-[10px] sm:text-xs md:text-sm font-black rounded-md sm:rounded-xl shadow-md hover:bg-slate-100 transition">
                            <span>{banner.buttonText || (banner as any).button_text || 'Shop Now'}</span>
                            <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Controls: Scaled and touch-friendly for all phones */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-1.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all opacity-60 hover:opacity-100 active:scale-90 shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-1.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-all opacity-60 hover:opacity-100 active:scale-90 shadow-sm"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </button>

          {/* Indicator Dots */}
          <div className="absolute bottom-1.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentIndex === idx
                    ? 'w-4 sm:w-6 h-1 sm:h-1.5 bg-white shadow-sm'
                    : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
