import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCelebrationBySlug, getTemplateById, getEventById, incrementViews } from "@/data/data-service";
import { PublicHeader } from "@/components/public/Header";
import { PublicFooter } from "@/components/public/Footer";
import { Copy, Share2, Music, Eye, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CelebrationView = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const celebration = slug ? getCelebrationBySlug(slug) : undefined;
  const template = celebration ? getTemplateById(celebration.templateId) : undefined;
  const event = celebration ? getEventById(celebration.eventId) : undefined;

  useEffect(() => {
    if (slug) incrementViews(slug);
  }, [slug]);

  if (!celebration || !template || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Celebration not found.</p>
        </div>
      </div>
    );
  }

  const t = event.theme;

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Share it with your loved ones 💕" });
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent("Check out this celebration card! 🎉");

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      <PublicHeader />

      <main className="flex-1 px-4 py-8 md:py-14">
        <div className="mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            {/* Card preview */}
            <div
              className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl mb-8"
              style={{ background: `linear-gradient(160deg, ${t.bgGradientStart}, ${t.bgGradientEnd})` }}
            >
              {template.mediaSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="absolute rounded overflow-hidden"
                  style={{
                    left: `${slot.position.x}%`,
                    top: `${slot.position.y}%`,
                    width: `${slot.position.width}%`,
                    height: `${slot.position.height}%`,
                  }}
                >
                  {celebration.userMedia[slot.id] ? (
                    <img src={celebration.userMedia[slot.id]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/20" />
                  )}
                </div>
              ))}

              {template.textSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="absolute"
                  style={{
                    left: `${slot.position.x}%`,
                    top: `${slot.position.y}%`,
                    width: `${slot.position.width}%`,
                    height: `${slot.position.height}%`,
                    fontSize: `${slot.style.fontSize * 0.5}px`,
                    fontFamily: slot.style.fontFamily,
                    color: slot.style.color,
                  }}
                >
                  <span className="drop-shadow-md">{celebration.userText[slot.id] || ""}</span>
                </div>
              ))}

              {!celebration.removeWatermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-white/15 text-2xl font-bold rotate-[-30deg]" style={{ fontFamily: "var(--font-headline)" }}>
                    MakeMoments
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Music player UI */}
          {celebration.hasMusic && (
            <div className="flex items-center gap-3 p-4 rounded-xl border bg-card mb-6">
              <Music className="h-5 w-5" style={{ color: t.primary }} />
              <div className="flex-1">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-1/3 rounded-full" style={{ background: t.primary }} />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">1:24 / 3:45</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mb-6">
            <Badge variant="secondary" className="gap-1">
              <Eye className="h-3 w-3" /> {celebration.views} views
            </Badge>
          </div>

          {/* Share buttons */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Button variant="outline" size="sm" onClick={copyLink} className="gap-2">
              <Copy className="h-4 w-4" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noreferrer">
                <Share2 className="h-4 w-4" /> Twitter
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noreferrer">
                <Share2 className="h-4 w-4" /> WhatsApp
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noreferrer">
                <Share2 className="h-4 w-4" /> Facebook
              </a>
            </Button>
          </div>

          {/* CTA */}
          <Button
            asChild
            size="lg"
            className="w-full rounded-full border-0"
            style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`, color: t.textLight }}
          >
            <Link to={`/create/${event.slug}`}>
              <Sparkles className="mr-2 h-5 w-5" /> Create Your Own
            </Link>
          </Button>
        </div>
      </main>

      {!celebration.removeWatermark && (
        <div className="text-center py-4 text-xs text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
          Made with 💕 by <Link to="/" className="underline">MakeMoments</Link>
        </div>
      )}

      <PublicFooter />
    </div>
  );
};

export default CelebrationView;
