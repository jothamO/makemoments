import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEventTheme } from "@/contexts/ThemeContext";
import { getTemplatesByEvent } from "@/data/data-service";
import { PublicHeader } from "@/components/public/Header";
import { PublicFooter } from "@/components/public/Footer";
import { Sparkles } from "lucide-react";

const Homepage = () => {
  const { event, theme } = useEventTheme();
  const templates = event ? getTemplatesByEvent(event.id) : [];

  if (!event || !theme) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">No active event found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      <PublicHeader />

      {/* Hero */}
      <section
        className="relative overflow-hidden py-20 md:py-32 px-4"
        style={{
          background: `linear-gradient(135deg, ${theme.bgGradientStart}, ${theme.bgGradientEnd})`,
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20" style={{ background: theme.accent }} />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-15" style={{ background: theme.secondary }} />

        <div className="mx-auto max-w-3xl text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-6 text-xs px-4 py-1.5 rounded-full border-0" style={{ background: "rgba(255,255,255,0.25)", color: theme.textLight }}>
              {theme.urgencyText}
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "var(--font-headline)", color: theme.textLight }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {theme.headline}
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl mb-10 max-w-xl mx-auto opacity-90"
            style={{ color: theme.textLight }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {theme.subheadline}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <Button
              asChild
              size="lg"
              className="text-base px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all border-0"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                color: theme.textLight,
              }}
            >
              <Link to={`/create/${event.slug}`}>
                <Sparkles className="mr-2 h-5 w-5" />
                {theme.ctaText}
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Template preview cards */}
      <section className="py-16 md:py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3" style={{ fontFamily: "var(--font-headline)" }}>
            Choose a Template
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-md mx-auto">
            Pick from our beautiful designs and make it yours in minutes
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl, i) => (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
              >
                <Link to={`/create/${event.slug}/${tpl.id}`}>
                  <Card className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-md">
                    <div
                      className="aspect-square flex items-center justify-center text-4xl"
                      style={{
                        background: `linear-gradient(135deg, ${theme.bgGradientStart}22, ${theme.bgGradientEnd}22)`,
                      }}
                    >
                      <span className="text-6xl">
                        {i === 0 ? "📰" : i === 1 ? "🖼️" : "💌"}
                      </span>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold" style={{ fontFamily: "var(--font-headline)" }}>{tpl.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{tpl.popularity} people used this</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Homepage;
