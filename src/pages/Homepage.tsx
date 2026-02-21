import * as React from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { ChevronLeft, ChevronRight, Sparkles, Bell } from "lucide-react";
import { useEventTheme } from "@/contexts/ThemeContext";
import { PublicHeader } from "@/components/public/Header";
import { PublicFooter } from "@/components/public/Footer";
import { EventHero } from "@/components/public/EventHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CelebrationEvent, EventTheme } from "@/data/types";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import { hexToRgba, getContrastColor } from "@/lib/utils";
import { EXPRESSIVE_EASE, CONTENT_TRANSITION, TAP_SCALE } from "@/lib/animation";

export default function Homepage() {
  const allPatterns = useQuery(api.patterns.list);

  const activeEvent = useQuery(api.events.getActive);
  const libraryData = useQuery(api.events.getLibrary);
  const { event: legacyEvent, theme: legacyTheme } = useEventTheme();

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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading active event...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      <PublicHeader />

      <EventHero
        theme={theme as any}
        className="h-[calc(100vh-64px)]"
      >
        <div {...swipeHandlers} className="w-full relative h-full flex items-center justify-center">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.03, y: -12 }}
              transition={CONTENT_TRANSITION}
              className="absolute inset-0 flex flex-col items-center justify-center px-6"
              style={{ zIndex: 30 }}
            >
              <div className="space-y-6 md:space-y-10 w-full max-w-6xl mx-auto text-center flex flex-col items-center">
                {slides[currentSlide]?.badge && (
                  <motion.div
                    className="inline-block"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...CONTENT_TRANSITION, delay: 0.0 }}
                  >
                    <Badge
                      className="text-xs px-5 py-2 rounded-full border-0 whitespace-nowrap shadow-sm"
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

                <div className="space-y-4 md:space-y-6 flex flex-col items-center">
                  <motion.h1
                    className="text-3xl sm:text-5xl md:text-8xl font-bold leading-[1.1] tracking-tight text-center"
                    style={{ fontFamily: (theme as any).headlineFont }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...CONTENT_TRANSITION, delay: 0.1 }}
                  >
                    {slides[currentSlide]?.headline}
                  </motion.h1>

                  <motion.p
                    className="text-base sm:text-lg md:text-2xl opacity-90 max-w-2xl mx-auto leading-relaxed text-center"
                    style={{ fontFamily: (theme as any).bodyFont }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...CONTENT_TRANSITION, delay: 0.15 }}
                  >
                    {slides[currentSlide]?.subheadline}
                  </motion.p>
                </div>

                <motion.div
                  className="pt-4 md:pt-8 flex justify-center"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...CONTENT_TRANSITION, delay: 0.2 }}
                >
                  <Button
                    asChild
                    size="lg"
                    className="text-lg px-12 py-8 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-0 pulse-hover h-auto"
                    style={{
                      backgroundColor: (theme as any).primary || (theme as any).glowColor || "#000",
                      color: (theme as any).textMode === "light" ? "#FFFFFF" :
                        (theme as any).textMode === "dark" ? "#000000" :
                          getContrastColor((theme as any).primary || (theme as any).glowColor),
                    }}
                  >
                    <Link to={`/${event.slug}/create`}>
                      <Sparkles className="mr-2 h-6 w-6" />
                      {(theme as any).ctaText || "Create Now"} ✨
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows (desktop) */}
          {slides.length > 1 && (
            <>
              <motion.button
                onClick={prevSlide}
                whileTap={TAP_SCALE}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
              <motion.button
                onClick={nextSlide}
                whileTap={TAP_SCALE}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </>
          )}

          {/* Slide Indicators */}
          {slides.length > 1 && (
            <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className="relative w-2 h-2 rounded-full transition-all bg-white/40 hover:bg-white/60"
                  style={{ width: index === currentSlide ? 24 : 8 }}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  {index === currentSlide && (
                    <motion.div
                      layoutId="hero-slide-indicator"
                      className="absolute inset-0 rounded-full bg-white"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Swipe Hint (mobile) */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm opacity-60 md:hidden flex items-center gap-2"
            style={{ color: theme.textLight }}
          >
            <span>Swipe to navigate</span>
            <ChevronRight className="w-4 h-4 animate-pulse" />
          </div>
        </div>
      </EventHero>

      {/* SECTION 2: HOW IT WORKS */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={CONTENT_TRANSITION}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-headline)", color: theme.primary }}>
              Create in 3 Simple Steps
            </h2>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Beautiful cards in minutes, no design skills needed
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              number="1"
              icon="🎨"
              title="Pick your Theme"
              description="Choose from our beautiful curated event themes"
              accentColor={theme.primary}
            />
            <StepCard
              number="2"
              icon="✍️"
              title="Personalize"
              description="Add your photos and heartfelt message"
              accentColor={theme.secondary}
            />
            <StepCard
              number="3"
              icon="🔗"
              title="Share"
              description="Get a link to share with anyone, anywhere"
              accentColor={theme.accent}
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: CELEBRATION LIBRARY */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={CONTENT_TRANSITION}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-headline)" }}>
              Celebration Library
            </h2>
            <p className="text-gray-600">Explore our curated collection of memories and magic</p>
          </motion.div>

          <div className="space-y-20">
            {/* 1. Popular Now */}
            {libraryData?.popularNow && libraryData.popularNow.length > 0 && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-zinc-200 flex-1" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Popular Now</h3>
                  <div className="h-px bg-zinc-200 flex-1" />
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {libraryData.popularNow.map((libEvent: any) => (
                    <LibraryEventCard key={libEvent._id} event={libEvent} />
                  ))}
                </div>
              </div>
            )}

            {/* 2. Evergreen */}
            {libraryData?.evergreen && libraryData.evergreen.length > 0 && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-zinc-200 flex-1" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Evergreen Favorites</h3>
                  <div className="h-px bg-zinc-200 flex-1" />
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {libraryData.evergreen.map((libEvent: any) => (
                    <LibraryEventCard key={libEvent._id} event={libEvent} />
                  ))}
                </div>
              </div>
            )}

            {/* 3. Coming Soon */}
            {libraryData?.comingSoon && libraryData.comingSoon.length > 0 && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-zinc-200 flex-1" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Coming Soon</h3>
                  <div className="h-px bg-zinc-200 flex-1" />
                </div>
                <div className="grid md:grid-cols-3 gap-8 opacity-70 grayscale-[0.5]">
                  {libraryData.comingSoon.map((libEvent: any) => (
                    <LibraryEventCard key={libEvent._id} event={libEvent} isUpcoming />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

import { replaceUrgencyVariables } from "@/lib/utils";

// ... (existing imports)

function generateOnboardingSlides(event: CelebrationEvent) {
  const { theme, name, date, endDate } = event;

  // Dynamic Badge Text
  const defaultBadge = `✨ ${name} is ${new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
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
function LibraryEventCard({ event, isUpcoming = false }: { event: any; isUpcoming?: boolean }) {
  const dateStr = new Date(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const theme = event.theme;

  return (
    <div
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100 group"
    >
      {/* Event Preview Area */}
      <div
        className="h-44 flex items-center justify-center p-6 relative overflow-hidden"
        style={{ backgroundColor: theme.baseColor }}
      >
        {/* Soft Gradient Glow */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(circle at center, ${theme.glowColor} 0%, transparent 70%)`
          }}
        />

        <div className="relative z-10 text-center">
          <h3
            className="text-2xl font-bold px-4 drop-shadow-sm"
            style={{
              fontFamily: theme.headlineFont,
              color: theme.textColor || (theme.type === 'dark' ? '#fff' : '#18181b')
            }}
          >
            {event.name}
          </h3>
          {isUpcoming && <Badge className="mt-2 bg-zinc-900 text-white border-0">Coming Soon</Badge>}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow text-center">
        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">{dateStr}</p>
        <h4 className="text-lg font-bold mb-3 leading-tight" style={{ fontFamily: "var(--font-headline)" }}>
          {theme.headline || `Celebrate ${event.name}`}
        </h4>
        <p className="text-zinc-500 text-xs mb-6 line-clamp-2 flex-grow">
          {theme.subheadline || "Create a beautiful personalized card for this special moment."}
        </p>

        {isUpcoming ? (
          <Button variant="outline" className="w-full rounded-full border-zinc-200 text-zinc-500 hover:bg-zinc-50 pointer-events-none">
            <Bell className="w-3 h-3 mr-2" /> Notify Me
          </Button>
        ) : (
          <Button
            asChild
            className="w-full rounded-full shadow-lg hover:shadow-xl transform active:scale-95 transition-all duration-300 border-0"
            style={{
              backgroundColor: theme.glowColor || "#000",
              color: getContrastColor(theme.glowColor || "#000")
            }}
          >
            <Link to={`/${event.slug}/create`}>
              <Sparkles className="w-3 h-3 mr-2" /> Create Now
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
