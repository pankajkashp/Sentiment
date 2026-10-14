"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from "lucide-react";

export interface BannerSlide {
  id: string;
  image: string;
  alt: string;
  badge: {
    text: string;
    icon?: "check" | "shield" | "sparkles";
  };
  title: string;
  description: string;
  actionLink?: {
    href: string;
    label: string;
  };
}

/**
 * Default slides referencing official photos in frontend/public.
 * Users can easily add or swap photos (e.g. /1.jpg, /2.jpg, /3.jpg) in the public folder.
 */
export const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    id: "national-policy-repository",
    image: "/1.jpg",
    alt: "National Portal of India — Rashtrapati Bhavan, India Gate, and Pillars of Governance",
    badge: {
      text: "Verified Public Policy Directory",
      icon: "check"
    },
    title: "National Policy Updates & Welfare Schemes Repository",
    description:
      "Verified ministry releases, direct benefit transfers, and official gazette notifications from PIB and the National Portal of India.",
    actionLink: {
      href: "#feed",
      label: "Explore Policies"
    }
  },
  {
    id: "har-ghar-tiranga-mygov",
    image: "/2.jpg",
    alt: "Ministry of Culture & MyGov — Har Ghar Tiranga and Citizen Engagement",
    badge: {
      text: "Government of India Initiatives",
      icon: "shield"
    },
    title: "Participatory Citizen Consultation Portal",
    description:
      "Review active policy consultation drafts, ministry circulars, and provide verified citizen feedback during consultation windows.",
    actionLink: {
      href: "/about",
      label: "About Portal"
    }
  },
  {
    id: "parliament-kartavya-path",
    image: "/3.jpg",
    alt: "Parliament House and Kartavya Path — Democratic Deliberation",
    badge: {
      text: "Democratic Governance Insights",
      icon: "sparkles"
    },
    title: "Transparent Policy Intelligence & Citizen Voice",
    description:
      "Evidence-based analysis synthesizing public comments into structured insights across national governance pillars.",
    actionLink: {
      href: "#feed",
      label: "Browse Consultations"
    }
  }
];

interface GovernmentBannerCarouselProps {
  slides?: BannerSlide[];
  autoPlayInterval?: number; // in milliseconds
  className?: string;
}

export function GovernmentBannerCarousel({
  slides = DEFAULT_BANNER_SLIDES,
  autoPlayInterval = 6000,
  className = ""
}: GovernmentBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  // Manage auto-advance timer
  useEffect(() => {
    if (!isPlaying || isHovered || totalSlides <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isHovered, autoPlayInterval, nextSlide, totalSlides]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      prevSlide();
    } else if (e.key === "ArrowRight") {
      nextSlide();
    }
  };

  const currentSlide = slides[currentIndex];

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Government Policy & Initiatives Banner Slideshow"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full overflow-hidden bg-[#071524] border-b border-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#E87518] ${className}`}
    >
      {/* Tricolour Accent Line at Top of Banner */}
      <div className="relative z-20 h-1 w-full bg-linear-to-r from-[#E87518] via-white to-[#16834A]" />

      {/* Main Banner Container with Increased Height for Full View */}
      <div className="relative w-full h-[360px] sm:h-[420px] md:h-[480px] lg:h-[520px]">
        {/* 1. Full-Width Background Slides with Smooth Crossfade */}
        <div className="absolute inset-0 z-0">
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
                }`}
                aria-hidden={!isActive}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority={idx === 0}
                  sizes="100vw"
                  className="object-cover object-center w-full h-full"
                />
                {/* Scrim Overlay: Gradient from deep navy on left fading out towards right so photo shines */}
                <div
                  className="absolute inset-0 bg-linear-to-r from-[#071524]/90 via-[#071524]/65 to-transparent sm:w-[65%] md:w-[55%]"
                  aria-hidden="true"
                />
                {/* Subtle bottom vignette to ensure indicators remain readable */}
                <div
                  className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-[#071524]/80 to-transparent"
                  aria-hidden="true"
                />
              </div>
            );
          })}
        </div>

        {/* 2. Text Overlay on Left Side (Aligned with max-w-7xl content width) */}
        <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between py-5 sm:py-6">
          {/* Top/Middle Text Content (Smaller, Concise, Non-Cluttered) */}
          <div className="max-w-md sm:max-w-lg md:max-w-xl space-y-2 sm:space-y-2.5">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 border border-white/30 bg-[#143454]/90 px-2.5 py-0.5 text-[11px] font-semibold text-white">
              {currentSlide.badge.icon === "shield" && (
                <ShieldCheck size={13} className="text-[#93c5fd]" />
              )}
              {currentSlide.badge.icon === "sparkles" && (
                <Sparkles size={13} className="text-[#fde047]" />
              )}
              {(!currentSlide.badge.icon || currentSlide.badge.icon === "check") && (
                <CheckCircle2 size={13} className="text-[#86efac]" />
              )}
              <span>{currentSlide.badge.text}</span>
            </div>

            {/* Smaller, punchy headline */}
            <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white leading-snug drop-shadow-sm">
              {currentSlide.title}
            </h2>

            {/* Concise description (limited text) */}
            <p className="text-xs sm:text-[13px] leading-relaxed text-gray-200 drop-shadow-xs line-clamp-2 sm:line-clamp-3">
              {currentSlide.description}
            </p>

            {/* Compact CTA link */}
            {currentSlide.actionLink && (
              <div className="pt-1">
                <Link
                  href={currentSlide.actionLink.href}
                  className="inline-flex items-center gap-1.5 bg-[#E87518] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#d6650c] transition-colors"
                >
                  <span>{currentSlide.actionLink.label}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>

          {/* 3. Bottom Controls Bar: Indicators & Compact Controls */}
          <div className="flex items-center justify-between gap-4 pt-2">
            {/* Slide Indicator Bars */}
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
              {slides.map((slide, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Slide ${idx + 1}`}
                    onClick={() => goToSlide(idx)}
                    className={`h-1 transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "w-8 bg-[#E87518]"
                        : "w-4 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                );
              })}
            </div>

            {/* Compact Navigation Controls */}
            <div className="flex items-center gap-1 bg-[#143454]/90 px-2 py-0.5 border border-white/20 text-white">
              {/* Previous */}
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous slide"
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={() => setIsPlaying((prev) => !prev)}
                aria-label={isPlaying ? "Pause auto-slideshow" : "Resume auto-slideshow"}
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                title={isPlaying ? "Pause slideshow" : "Play slideshow"}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>

              {/* Counter (e.g. 1 / 3) */}
              <span className="text-[10px] font-mono text-white/70 px-1 select-none">
                {currentIndex + 1} / {totalSlides}
              </span>

              {/* Next */}
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next slide"
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
