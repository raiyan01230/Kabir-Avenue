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

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-950 rounded-2xl sm:rounded-3xl shadow-xl group border border-slate-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[420px] sm:h-[480px] lg:h-[520px] w-full">
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
                  transform: isActive ? 'scale(1.05)' : 'scale(1.0)',
                  transition: 'transform 6s ease-out',
                }}
              />

              {/* Dark Vignette Overlay for High Legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent sm:from-slate-950/95 sm:via-slate-950/50" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />

              {/* Text & Action Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-6 sm:px-12 lg:px-16 max-w-7xl">
                  <div className="max-w-xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-bold text-slate-200 uppercase tracking-widest">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Featured Highlight</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                      {banner.title}
                    </h1>

                    {banner.subtitle && (
                      <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed line-clamp-3">
                        {banner.subtitle}
                      </p>
                    )}

                    <div className="pt-2">
                      <Link
                        to={banner.buttonLink || '/shop'}
                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-100 text-slate-950 text-sm font-black rounded-xl shadow-lg hover:shadow-2xl transition duration-200 active:scale-95"
                      >
                        <span>{banner.buttonText || 'Explore Now'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Left/Right Controls */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all opacity-80 hover:opacity-100 shadow-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicator Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentIndex === idx
                    ? 'w-7 h-2 bg-white'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
