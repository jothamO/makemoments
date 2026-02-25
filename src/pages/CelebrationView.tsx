import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { StoryViewer } from "@/components/story/StoryViewer";
import { Copy, Share2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const CelebrationView = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const celebration = useQuery(api.celebrations.getBySlug, slug ? { slug } : "skip");
  const event = useQuery(api.events.getById, celebration?.eventId ? { id: celebration.eventId } : "skip");
  const fonts = useQuery(api.fonts.list);
  const incrementViews = useMutation(api.celebrations.incrementViews);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (slug) {
      incrementViews({ slug }).catch(() => { });
    }
  }, [slug]);

  if (celebration === undefined || event === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!celebration || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white/60">Celebration not found.</p>
      </div>
    );
  }

  const t = event.theme as any;
  const glowColor = t?.glowColor || t?.secondary || "#ec4899";

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!", description: "Share it with your loved ones 💕" });
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent("Check out this celebration card! 🎉");

  const firstPage = celebration.pages?.[0] as any;
  const introBgColor = firstPage?.bgGradientStart || t?.primary || "#000";
  const introBgImage = firstPage?.bgImage ? `url(${firstPage.bgImage})` : undefined;
  const introTextColor = firstPage?.textColor || t?.textLight || "#fff";
  const defaultFont = fonts?.find((f: any) => f.isDefault)?.fontFamily || "Inter";

  // Intro screen
  if (!started) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer z-[100]"
        style={{ backgroundColor: introBgColor, backgroundImage: introBgImage, color: introTextColor, backgroundSize: 'cover', backgroundPosition: 'center' }}
        onClick={() => setStarted(true)}
      >
        <p className="opacity-60 text-sm mb-4 animate-pulse">Tap to begin</p>
        <h1
          className="text-3xl md:text-5xl font-bold text-center px-8 leading-tight"
          style={{ fontFamily: defaultFont }}
        >
          A love story awaits…
        </h1>
        <p className="opacity-40 text-xs mt-8">Made with MakeMoments</p>
      </div>
    );
  }

  const shareButtons = (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={copyLink} className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
          <Copy className="h-4 w-4" /> Copy Link
        </Button>
        <Button variant="outline" size="sm" asChild className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
          <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noreferrer">
            <Share2 className="h-4 w-4" /> Twitter
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
          <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noreferrer">
            <Share2 className="h-4 w-4" /> WhatsApp
          </a>
        </Button>
      </div>
      {/* Secondary CTA intentionally removed per requirements */}
    </div>
  );

  // Inject the Ourheart-style synthetic CTA watermark slide
  const pages = [...(celebration.pages as any)];
  if (!celebration.removeWatermark) {
    pages.push({
      _id: "synthetic-watermark-slide",
      type: "dark",
      text: "Create your own\nunforgettable story.",
      fontFamily: defaultFont,
      textColor: introTextColor,
      textAlign: "center",
      bgImage: firstPage?.bgImage || "",
      bgGradientStart: introBgColor,
      bgGradientEnd: introBgColor, // explicitly discarding multi-color gradients
      stickers: [],
      transition: "fade",
      duration: 5,
    });
  }

  return (
    <StoryViewer
      pages={pages}
      showWatermark={!celebration.removeWatermark}
      glowColor={glowColor}
      autoPlay
      showShareOnLast
      shareContent={shareButtons}
      eventSlug={event.slug}
    />
  );
};

export default CelebrationView;
