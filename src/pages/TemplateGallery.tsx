import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getEventBySlug, getTemplatesByEvent } from "@/data/data-service";
import { PublicHeader } from "@/components/public/Header";
import { PublicFooter } from "@/components/public/Footer";

const TemplateGallery = () => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const event = eventSlug ? getEventBySlug(eventSlug) : undefined;
  const templates = event ? getTemplatesByEvent(event.id) : [];

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Event not found.</p>
        </div>
      </div>
    );
  }

  const t = event.theme;

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      <PublicHeader />

      <div
        className="py-12 px-4"
        style={{ background: `linear-gradient(135deg, ${t.bgGradientStart}, ${t.bgGradientEnd})` }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "var(--font-headline)", color: t.textLight }}>
            {event.name}
          </h1>
          <p className="mt-2 opacity-90" style={{ color: t.textLight }}>
            Choose a template to get started
          </p>
        </div>
      </div>

      <section className="flex-1 py-10 px-4">
        <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {templates.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link to={`/create/${eventSlug}/${tpl.id}`}>
                <Card className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer border-0 shadow">
                  <div
                    className="aspect-square flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${t.bgGradientStart}18, ${t.bgGradientEnd}18)` }}
                  >
                    <span className="text-5xl">
                      {i === 0 ? "📰" : i === 1 ? "🖼️" : "💌"}
                    </span>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm" style={{ fontFamily: "var(--font-headline)" }}>{tpl.name}</h3>
                    <Badge variant="secondary" className="mt-1 text-[10px]">{tpl.popularity} uses</Badge>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default TemplateGallery;
