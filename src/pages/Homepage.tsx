import * as React from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { ChevronLeft, ChevronRight, Sparkles, Bell } from "lucide-react";
import { useEventTheme } from "@/contexts/ThemeContext";
import { getUpcomingEvents } from "@/data/data-service";
import { PublicHeader } from "@/components/public/Header";
import { PublicFooter } from "@/components/public/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CelebrationEvent, EventTheme } from "@/data/types";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BackgroundPattern } from "@/components/BackgroundPattern";

export default function Homepage() {
  const allPatterns = useQuery(api.patterns.list);

  const activeEvent = useQuery(api.events.getActive);
  const { event: legacyEvent, theme: legacyTheme } = useEventTheme();

  const event = activeEvent || legacyEvent;
  const theme = activeEvent?.theme || legacyTheme;

  const upcomingEvents = getUpcomingEvents();
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

  const patternConfig = allPatterns?.find(p => p.id === theme?.backgroundPattern);
  const patternEmojis = React.useMemo(() => {
    const emojiString = patternConfig?.emoji;
    return emojiString ? emojiString.split(",") : undefined;
  }, [patternConfig?.emoji]);

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

      {/* SECTION 1: ONBOARDING SLIDES - Full Viewport Height */}
      <section
        {...swipeHandlers}
        className="relative h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden gradient-hero"
        style={{
          background: `linear-gradient(135deg, ${theme.bgGradientStart} 0%, ${theme.bgGradientEnd} 100%)`,
        }}
      >
        {/* Background Pattern */}
        <BackgroundPattern
          pattern={theme.backgroundPattern}
          type={patternConfig?.type}
          customEmojis={patternEmojis}
        />

        {/* Decorative circles from original design */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20" style={{ background: theme.accent }} />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-15" style={{ background: theme.secondary }} />

        {/* Slides - CSS crossfade, no AnimatePresence */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 transition-opacity duration-500 ease-in-out"
              style={{ opacity: index === currentSlide ? 1 : 0, pointerEvents: index === currentSlide ? "auto" : "none" }}
            >
              <div className="space-y-6 md:space-y-10 w-full max-w-6xl mx-auto text-center">
                {slide.badge && (
                  <div className="inline-block">
                    <Badge
                      className="text-xs px-5 py-2 rounded-full border-0 whitespace-nowrap shadow-sm"
                      style={{ background: "rgba(255,255,255,0.25)", color: theme.textLight }}
                    >
                      {slide.badge}
                    </Badge>
                  </div>
                )}

                <div className="space-y-4 md:space-y-6">
                  <h1
                    className="text-5xl md:text-8xl font-bold leading-[1.1] tracking-tight"
                    style={{ fontFamily: "var(--font-headline)", color: theme.textLight }}
                  >
                    {slide.headline}
                  </h1>

                  <p
                    className="text-lg md:text-2xl opacity-90 max-w-2xl mx-auto leading-relaxed"
                    style={{ color: theme.textLight }}
                  >
                    {slide.subheadline}
                  </p>
                </div>

                <div className="pt-4 md:pt-8">
                  <Button
                    asChild
                    size="lg"
                    className="text-lg px-12 py-8 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-0 pulse-hover h-auto"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                      color: theme.textLight,
                    }}
                  >
                    <Link to={`/${event.slug}/create`}>
                      <Sparkles className="mr-2 h-6 w-6" />
                      {theme.ctaText} ✨
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows (desktop) */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
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
      </section >

      {/* SECTION 2: HOW IT WORKS */}
      < section className="py-24 bg-white" >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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
              title="Choose Template"
              description="Pick from our beautiful curated designs"
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
      </section >

      {/* SECTION 3: UPCOMING EVENTS */}
      {
        upcomingEvents && upcomingEvents.length > 0 && (
          <section className="py-24 bg-gray-50">
            <div className="max-w-6xl mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-headline)" }}>
                  More Celebrations Coming
                </h2>
                <p className="text-gray-600">Get notified when new events launch</p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-8">
                {upcomingEvents.slice(0, 3).map((upcoming) => (
                  <UpcomingEventCard key={upcoming.id} event={upcoming} />
                ))}
              </div>
            </div>
          </section>
        )
      }

      <PublicFooter />
    </div >
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

// UpcomingEventCard Component
function UpcomingEventCard({ event }: { event: CelebrationEvent }) {
  const dateStr = new Date(event.date).toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100"
    >
      {/* Event Preview */}
      <div
        className="h-40 flex items-center justify-center p-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${event.theme.bgGradientStart}, ${event.theme.bgGradientEnd})`,
        }}
      >
        {/* Background Decorative Emojis */}
        <div className="absolute inset-0 opacity-10 flex flex-wrap gap-4 p-4 text-2xl select-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i}>{i % 2 === 0 ? "🌸" : "✨"}</span>
          ))}
        </div>

        <h3
          className="text-2xl font-bold text-center relative z-10"
          style={{
            fontFamily: event.theme.headlineFont,
            color: event.theme.textLight,
          }}
        >
          {event.name}
        </h3>
      </div>

      {/* Event Info */}
      <div className="p-8 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="rounded-full font-medium" style={{ color: event.theme.primary, borderColor: event.theme.primary }}>
            {dateStr}
          </Badge>
        </div>

        <h4 className="text-xl font-bold mb-3" style={{ fontFamily: "var(--font-headline)" }}>
          {event.theme.headline}
        </h4>

        <p className="text-gray-500 text-sm mb-6 flex-grow">{event.theme.subheadline}</p>

        <Button
          className="w-full py-6 rounded-full font-semibold transition-all border-2 flex items-center justify-center gap-2 border-input bg-background hover:bg-accent hover:text-accent-foreground"
          style={{
            borderColor: event.theme.primary,
            color: event.theme.primary,
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.backgroundColor = event.theme.primary;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = event.theme.primary;
          }}
        >
          <Bell className="w-4 h-4" />
          Notify Me
        </Button>
      </div>
    </motion.div>
  );
}
