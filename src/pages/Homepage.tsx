import * as React from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

export default function Homepage() {
  const { event, theme } = useEventTheme();
  const upcomingEvents = getUpcomingEvents();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = event ? generateOnboardingSlides(event) : [];

  // Auto-advance slides
  useEffect(() => {
    if (!slides.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!event || !theme) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">No active event found.</p>
      </div>
    );
  }

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => nextSlide(),
    onSwipedRight: () => prevSlide(),
    trackMouse: false,
    trackTouch: true,
  });

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
        <BackgroundPattern pattern={theme.backgroundPattern} theme={theme} />

        {/* Decorative circles from original design */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20" style={{ background: theme.accent }} />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-15" style={{ background: theme.secondary }} />

        {/* Slides */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 max-w-4xl mx-auto px-6 text-center"
          >
            <div className="space-y-6 md:space-y-8">
              {/* Slide Icon/Badge */}
              {slides[currentSlide].badge && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block"
                >
                  <Badge
                    className="text-xs px-4 py-1.5 rounded-full border-0"
                    style={{ background: "rgba(255,255,255,0.25)", color: theme.textLight }}
                  >
                    {slides[currentSlide].badge}
                  </Badge>
                </motion.div>
              )}

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-7xl font-bold leading-tight"
                style={{
                  fontFamily: "var(--font-headline)",
                  color: theme.textLight,
                }}
              >
                {slides[currentSlide].headline}
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-2xl opacity-90 max-w-2xl mx-auto"
                style={{
                  color: theme.textLight,
                }}
              >
                {slides[currentSlide].subheadline}
              </motion.p>

              {/* CTA Button (only on last slide) */}
              {currentSlide === slides.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    asChild
                    size="lg"
                    className="text-lg px-10 py-7 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-0 pulse-hover"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                      color: theme.textLight,
                    }}
                  >
                    <Link to={`/create/${event.slug}`}>
                      <Sparkles className="mr-2 h-6 w-6" />
                      {theme.ctaText} ✨
                    </Link>
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows (desktop) */}
        <div className="hidden md:block">
          <button
            onClick={prevSlide}
            className="absolute left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all z-20"
            style={{ color: theme.textLight }}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all z-20"
            style={{ color: theme.textLight }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className="transition-all duration-500"
              style={{
                width: currentSlide === index ? "40px" : "10px",
                height: "10px",
                borderRadius: "5px",
                backgroundColor: currentSlide === index ? theme.primary : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>

        {/* Swipe Hint (mobile) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm opacity-60 md:hidden flex items-center gap-2"
          style={{ color: theme.textLight }}
        >
          <span>Swipe to navigate</span>
          <ChevronRight className="w-4 h-4 animate-pulse" />
        </motion.div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section className="py-24 bg-white">
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
      </section>

      {/* SECTION 3: UPCOMING EVENTS */}
      {upcomingEvents && upcomingEvents.length > 0 && (
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
      )}

      <PublicFooter />
    </div>
  );
}

// Helper function to generate onboarding slides
function generateOnboardingSlides(event: CelebrationEvent) {
  const { theme, name, date } = event;
  const dateStr = new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return [
    {
      badge: `✨ ${name} is ${dateStr}`,
      headline: theme.headline || `Celebrate ${name}`,
      subheadline: "Create a beautiful personalized card for the incredible people in your life",
    },
    {
      headline: "Your Photos. Your Words. Your Moment.",
      subheadline: "Add your memories and heartfelt message in just a few taps",
    },
    {
      headline: "Share a Link They'll Never Forget",
      subheadline: theme.subheadline || "Beautiful moments, shared instantly. Just ₦1,000.",
    },
  ];
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

// BackgroundPattern Component
function BackgroundPattern({ pattern, theme }: { pattern: string; theme: EventTheme }) {
  const emojis = pattern === "floral" ? ["🌸", "🌺", "✨"] : ["❤️", "💖", "✨"];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl md:text-5xl opacity-20"
          initial={{
            x: Math.random() * 100 + "%",
            y: -20 + "%",
          }}
          animate={{
            y: "110%",
            rotate: 360,
          }}
          transition={{
            duration: 20 + Math.random() * 20,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear",
          }}
        >
          {emojis[i % emojis.length]}
        </motion.div>
      ))}
    </div>
  );
}
