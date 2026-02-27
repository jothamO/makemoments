import * as React from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { ChevronLeft, ChevronRight, Sparkles, Bell, Palette, PenLine, Link as LinkIcon } from "lucide-react";
import { useEventTheme } from "@/contexts/ThemeContext";
import { NotifyMeDialog } from "@/components/public/NotifyMeDialog";
import { PublicHeader } from "@/components/public/Header";
import { PublicFooter } from "@/components/public/Footer";
import { EventHero } from "@/components/public/EventHero";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CelebrationEvent, EventTheme } from "@/data/types";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import { hexToRgba, getContrastColor, getBrandRadialGradient, formatPlatformDate } from "@/lib/utils";
import { EXPRESSIVE_EASE, CONTENT_TRANSITION, TAP_SCALE } from "@/lib/animation";

export default function Homepage() {
  const allPatterns = useQuery(api.patterns.list);
  const activeEvent = useQuery(api.events.getActive);
  const libraryData = useQuery(api.events.getLibrary);
  const { event: legacyEvent, theme: legacyTheme } = useEventTheme();

  const [selectedNotifyEvent, setSelectedNotifyEvent] = useState<any>(null);
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);

  const handleNotifyRequest = (event: any) => {
    setSelectedNotifyEvent(event);
    setIsNotifyDialogOpen(true);
  };

  const event = activeEvent || legacyEvent;
  const theme = activeEvent?.theme || legacyTheme;

  const [currentSlide, setCurrentSlide] = useState(0);

  const normalizedEvent = event && !('id' in event) && '_id' in event ? { ...event, id: (event as any)._id } as CelebrationEvent : event as CelebrationEvent | null;
  const slides = normalizedEvent ? generateOnboardingSlides(normalizedEvent) : [];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % Math.max(slides.length, 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1));

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => slides.length > 1 && nextSlide(),
    onSwipedRight: () => slides.length > 1 && prevSlide(),
    trackMouse: false,
    trackTouch: true,
  });

  // Auto-advance slides - resets timer on any slide change (manual or auto)
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, currentSlide]);

  const selectedPatternId = theme?.backgroundPattern || (activeEvent?.theme?.patternIds && activeEvent.theme.patternIds[0]);
  const patternConfig = allPatterns?.find(p => (p.id === selectedPatternId || p._id === selectedPatternId));

  const patternEmojis = React.useMemo(() => {
    return patternConfig?.emojis;
  }, [patternConfig?.emojis]);

  // Debug pattern rendering
  useEffect(() => {
    if (theme?.backgroundPattern) {
      console.log("Homepage Pattern Debug:", {
        id: theme?.backgroundPattern,
        config: patternConfig,
        resolvedType: patternConfig?.type,
        resolvedEmoji: patternConfig?.emoji
      });
    }
  }, [theme?.backgroundPattern, patternConfig]);

  if (!event || !theme) {
    return <GlobalLoader />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      <PublicHeader />

      <EventHero
        theme={theme as any}
        className="w-full relative"
      >
        <div {...swipeHandlers} className="w-full relative h-full flex items-center justify-center">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 0 }}
              transition={{ ...CONTENT_TRANSITION, duration: 0.8 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6"
              style={{ zIndex: 30 }}
            >
              <div className="space-y-8 md:space-y-12 w-full max-w-7xl mx-auto text-center flex flex-col items-center">
                {slides[currentSlide]?.badge && (
                  <motion.div
                    className="inline-block"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...CONTENT_TRANSITION, delay: 0.3 }}
                  >
                    <Badge
                      className="text-xs md:text-sm px-6 py-2 rounded-full border-0 whitespace-nowrap shadow-sm backdrop-blur-md"
                      style={{
                        background: theme.type === 'dark' ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)",
                        color: "inherit",
                        fontFamily: (theme as any).bodyFont
                      }}
                    >
                      {slides[currentSlide].badge}
                    </Badge>
                  </motion.div>
                )}

                <div className="flex flex-col items-center gap-6 md:gap-10">
                  <motion.h1
                    className="text-4xl sm:text-6xl md:text-[8vw] font-black leading-[0.9] tracking-tighter text-center max-w-[95vw] md:max-w-none drop-shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                    style={{ fontFamily: (theme as any).headlineFont }}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...CONTENT_TRANSITION, delay: 0.4 }}
                  >
                    {slides[currentSlide]?.headline}
                  </motion.h1>

                  <motion.p
                    className="text-base sm:text-xl md:text-3xl font-medium opacity-80 max-w-[85vw] md:max-w-3xl mx-auto leading-tight text-center drop-shadow-sm"
                    style={{ fontFamily: (theme as any).bodyFont }}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...CONTENT_TRANSITION, delay: 0.5 }}
                  >
                    {slides[currentSlide]?.subheadline}
                  </motion.p>
                </div>

                <motion.div
                  className="pt-12 md:pt-20 flex justify-center"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...CONTENT_TRANSITION, delay: 0.6 }}
                >
                  <Button
                    asChild
                    size="lg"
                    className="text-lg md:text-xl px-8 py-5 md:px-16 md:py-10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.4)] transform hover:scale-105 transition-all duration-500 border-0 h-auto"
                    style={{
                      backgroundColor: (theme as any).primary || (theme as any).glowColor || "#000",
                      color: (theme as any).textMode === "light" ? "#FFFFFF" :
                        (theme as any).textMode === "dark" ? "#000000" :
                          getContrastColor((theme as any).primary || (theme as any).glowColor),
                    }}
                  >
                    <Link to={`/${event.slug}/create`}>
                      <Sparkles className="mr-3 h-6 w-6 md:h-7 md:w-7" />
                      {(theme as any).ctaText || "Create Now"}
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows (desktop) */}
          {
            slides.length > 1 && (
              <>
                <motion.button
                  onClick={prevSlide}
                  whileTap={TAP_SCALE}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>
                <motion.button
                  onClick={nextSlide}
                  whileTap={TAP_SCALE}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              </>
            )
          }

          {/* Slide Indicators */}
          {
            slides.length > 1 && (
              <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center gap-3">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className="relative h-1.5 md:h-2 rounded-full transition-all bg-white/20 hover:bg-white/40"
                    style={{ width: index === currentSlide ? 32 : 8 }}
                    aria-label={`Go to slide ${index + 1}`}
                  >
                    {index === currentSlide && (
                      <motion.div
                        layoutId="hero-slide-indicator"
                        className="absolute inset-0 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )
          }


        </div>
      </EventHero>

      {/* SECTION 2: HOW IT WORKS (Minimal Feature Bar) */}
      <section className="py-8 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-3 items-center justify-items-center gap-2 md:gap-16 lg:gap-24">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 group text-center md:text-left">
              <div className="p-1.5 md:p-2 rounded-lg bg-zinc-50 border border-black/5 group-hover:scale-110 transition-transform duration-500" style={{ color: theme.primary }}>
                <Palette className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="font-bold tracking-tight text-zinc-800 text-[10px] md:text-sm uppercase md:normal-case" style={{ fontFamily: "var(--font-headline)" }}>Pick Theme</span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 group text-center md:text-left">
              <div className="p-1.5 md:p-2 rounded-lg bg-zinc-50 border border-black/5 group-hover:scale-110 transition-transform duration-500" style={{ color: theme.secondary }}>
                <PenLine className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="font-bold tracking-tight text-zinc-800 text-[10px] md:text-sm uppercase md:normal-case" style={{ fontFamily: "var(--font-headline)" }}>Personalize</span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 group text-center md:text-left">
              <div className="p-1.5 md:p-2 rounded-lg bg-zinc-50 border border-black/5 group-hover:scale-110 transition-transform duration-500" style={{ color: theme.accent }}>
                <LinkIcon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="font-bold tracking-tight text-zinc-800 text-[10px] md:text-sm uppercase md:normal-case" style={{ fontFamily: "var(--font-headline)" }}>Share Magic</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: CELEBRATION LIBRARY */}
      <section className="pt-12 md:pt-16 pb-32 md:pb-40 bg-white border-t border-zinc-200">
        <div className="max-w-6xl mx-auto px-6">


          <div className="space-y-16 md:space-y-24">
            {/* 1. Popular Now */}
            {libraryData?.popularNow && libraryData.popularNow.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-headline)" }}>Popular Now</h3>
                <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-8 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide snap-x snap-mandatory">
                  {libraryData.popularNow.slice(0, 3).map((libEvent: any) => (
                    <div key={libEvent._id} className="min-w-[85vw] sm:min-w-[360px] md:min-w-0 snap-center">
                      <LibraryEventCard event={libEvent} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Evergreen */}
            {libraryData?.evergreen && libraryData.evergreen.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-headline)" }}>Evergreen Favorites</h3>
                <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-8 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide snap-x snap-mandatory">
                  {libraryData.evergreen.slice(0, 3).map((libEvent: any) => (
                    <div key={libEvent._id} className="min-w-[85vw] sm:min-w-[360px] md:min-w-0 snap-center">
                      <LibraryEventCard event={libEvent} isEvergreen onNotify={() => handleNotifyRequest(libEvent)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Coming Soon */}
            {libraryData?.comingSoon && libraryData.comingSoon.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-400" style={{ fontFamily: "var(--font-headline)" }}>Coming Soon</h3>
                <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-8 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide snap-x snap-mandatory opacity-90 md:opacity-80">
                  {libraryData.comingSoon.slice(0, 3).map((libEvent: any) => (
                    <div key={libEvent._id} className="min-w-[85vw] sm:min-w-[360px] md:min-w-0 snap-center">
                      <LibraryEventCard event={libEvent} isUpcoming onNotify={() => handleNotifyRequest(libEvent)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />

      {
        selectedNotifyEvent && (
          <NotifyMeDialog
            event={selectedNotifyEvent}
            open={isNotifyDialogOpen}
            onOpenChange={setIsNotifyDialogOpen}
          />
        )
      }
    </div>
  );
}

import { replaceUrgencyVariables } from "@/lib/utils";

// ... (existing imports)

function generateOnboardingSlides(event: CelebrationEvent) {
  const { theme, name, date, endDate } = event;

  // Dynamic Badge Text
  const defaultBadge = `✨ ${name} is ${formatPlatformDate(date, { month: "long", day: "numeric" })}`;
  const badgeText = theme.urgencyText
    ? `✨ ${replaceUrgencyVariables(theme.urgencyText, name, date, endDate)}`
    : defaultBadge;

  const rawSlides = [
    {
      badge: badgeText,
      headline: theme.headline,
      subheadline: theme.subheadline,
      isMain: true, // Always keep main slide if possible, or fallback
    },
    {
      badge: badgeText,
      headline: theme.headline_2,
      subheadline: theme.subheadline_2,
    },
    {
      badge: badgeText,
      headline: theme.headline_3,
      subheadline: theme.subheadline_3,
    },
  ];

  // Filter out empty slides (keep if it's the main slide OR has content)
  const validSlides = rawSlides.filter((s, i) => {
    // If it's the first slide, we might want to keep it even if empty to show *something*, 
    // but the user said "hide specific slides if headline & subheadline are empty".
    // "Default Fallback: If Slide 1 is also empty, use the generic... fallback"

    // Check if empty
    const isEmpty = !s.headline && !s.subheadline;
    return !isEmpty;
  });

  // If NO slides are valid (all empty), return default fallback
  if (validSlides.length === 0) {
    return [{
      badge: badgeText,
      headline: `Celebrate ${name}`,
      subheadline: "Create a beautiful personalized card for the incredible people in your life",
    }];
  }

  // Map back to expected format (filling in defaults for Main slide if it was kept but partial?)
  // Actually, if I filtered them, the ones remaining represent the user's intent.
  // But for the Main slide (index 0 originally), if the user explicitly cleared it, it shouldn't show?
  // The user said: "if the slide headline and subheadline are empty, then it means the slide has no content and should be hidden"
  // And "fallback if slide 1 is empty".

  return validSlides.map(s => ({
    badge: s.badge,
    headline: s.headline || (s.isMain ? `Celebrate ${name}` : ""), // Fallback only if we kept it but it's empty? No, we filtered empty.
    // Wait, if validSlides.length > 0, we just return them. 
    // But we need to ensure they have *some* text if they passed the filter? 
    // The filter checked `!isEmpty`. So they have at least one.
    subheadline: s.subheadline || "",
  }));
}


// StepCard Component
function StepCard({ number, icon, title, description, accentColor }: {
  number: string;
  icon: string;
  title: string;
  description: string;
  accentColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={CONTENT_TRANSITION}
      className="text-center group"
    >
      <div
        className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center text-5xl shadow-inner transition-transform group-hover:scale-110 duration-300"
        style={{ backgroundColor: `${accentColor}15` }}
      >
        {icon}
      </div>

      <div className="text-sm font-bold mb-3 tracking-widest uppercase" style={{ color: accentColor }}>
        Step {number}
      </div>

      <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "var(--font-headline)" }}>
        {title}
      </h3>

      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}


// LibraryEventCard Component
function LibraryEventCard({ event, isUpcoming = false, isEvergreen = false, onNotify }: { event: any; isUpcoming?: boolean; isEvergreen?: boolean; onNotify?: () => void }) {
  const dateStr = formatPlatformDate(event.date);
  const theme = event.theme || {};

  return (
    <div className="relative bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col aspect-[4/5] group border border-zinc-100/50 cursor-pointer transform hover:-translate-y-1">
      {/* Background Fill */}
      <div className="absolute inset-0 z-0 transition-colors duration-500" style={{ backgroundColor: theme.baseColor || '#f4f4f5' }} />

      {/* Soft Radial Glow */}
      <div className="absolute inset-0 z-0 opacity-60 transition-opacity duration-500 group-hover:opacity-80" style={{ background: getBrandRadialGradient(theme.baseColor, theme.glowColor, theme.type === 'dark') }} />

      {/* Darkening Gradient overlay on hover for text contrast */}
      <div className="absolute inset-0 z-[5] bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Core Center Content */}
      <div className="relative z-10 flex-grow flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 group-hover:-translate-y-12">
        {isUpcoming && (
          <Badge className="mb-4 text-white border-0 shadow-sm backdrop-blur-md" style={{ backgroundColor: theme.glowColor || '#000' }}>
            Coming Soon
          </Badge>
        )}
        <h3 className="text-3xl sm:text-4xl md:text-2xl lg:text-4xl xl:text-4xl font-bold tracking-tight drop-shadow-sm leading-tight max-w-[90%]" style={{ fontFamily: theme.headlineFont || "var(--font-headline)", color: theme.textColor || (theme.type === 'dark' ? '#fff' : '#18181b') }}>
          {event.name}
        </h3>
      </div>

      {/* Hover Revealed Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-8 md:p-5 lg:p-8 flex flex-col text-center items-center opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
        {!isEvergreen && (
          <h4 className="text-xl md:text-lg lg:text-xl font-bold mb-2 text-white line-clamp-1 drop-shadow-sm" style={{ fontFamily: "var(--font-headline)" }}>
            {dateStr}
          </h4>
        )}
        <p className="text-white/80 text-sm md:text-xs lg:text-sm mb-6 line-clamp-2 max-w-[90%] drop-shadow-sm font-medium">
          {theme.subheadline || "Create a beautiful personalized card for this special moment."}
        </p>

        {isUpcoming ? (
          <Button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNotify?.(); }} className="w-full rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 transition-all font-semibold pointer-events-auto active:scale-95 px-4 h-10 md:h-9 lg:h-12 text-sm lg:text-base">
            <Bell className="w-4 h-4 mr-2" /> Notify Me
          </Button>
        ) : (
          <Button asChild className="w-full rounded-full shadow-xl hover:shadow-2xl transform active:scale-95 transition-all duration-300 border-0 pointer-events-auto bg-white text-black hover:bg-zinc-100 font-semibold h-12 md:h-10 lg:h-12 text-sm lg:text-base" style={{ backgroundColor: theme.glowColor || "#ffffff", color: getContrastColor(theme.glowColor || "#ffffff") }}>
            <Link to={`/${event.slug}/create`} onClick={(e) => e.stopPropagation()}>
              <Sparkles className="w-4 h-4 mr-2" /> Create Now
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
