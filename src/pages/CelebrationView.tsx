import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { StoryViewer } from "@/components/story/StoryViewer";
import { Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion } from "framer-motion";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const CelebrationView = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const celebration = useQuery(api.celebrations.getBySlug, slug ? { slug } : "skip");
  const event = useQuery(api.events.getById, celebration?.eventId ? { id: celebration.eventId } : "skip");
  const musicTrack = useQuery(api.music.getById, celebration?.musicTrackId ? { id: celebration.musicTrackId } : "skip");
  const fonts = useQuery(api.fonts.list);
  const incrementViews = useMutation(api.celebrations.incrementViews);
  const [started, setStarted] = useState(false);

  // Privacy-safe meta tags — never expose user content
  useDocumentMeta({
    title: "Someone made a Moment for you ❤️ — MakeMoments",
    description: "Open to see your special Moment",
    ogTitle: "Someone made a Moment for you ❤️ — MakeMoments",
    ogDescription: "Open to see your special Moment",
    noindex: true,
  });

  useEffect(() => {
    if (slug) {
      incrementViews({ slug }).catch(() => { });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (celebration === undefined || event === undefined) {
    return <GlobalLoader />;
  }

  if (!celebration || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white/60">Celebration not found.</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = event.theme as any;
  const glowColor = t?.glowColor || t?.secondary || "#ec4899";

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied", description: "Shared!" });
  };

  const shareUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent("Check out this celebration card! 🎉");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstPage = celebration.pages?.[0] as any;
  const introBgColor = firstPage?.baseColor || t?.primary || "#000";
  const introBgImage = firstPage?.bgImage ? `url(${firstPage.bgImage})` : undefined;
  const introTextColor = firstPage?.textColor || t?.textLight || "#fff";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultFont = fonts?.find((f: any) => f.isDefault)?.fontFamily || "Inter";

  // Intro screen
  if (!started) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer z-[100]"
        style={{ backgroundColor: introBgColor, backgroundImage: introBgImage, color: introTextColor, backgroundSize: 'cover', backgroundPosition: 'center' }}
        onClick={() => setStarted(true)}
      >
        <motion.p
          className="opacity-60 text-sm mb-4 animate-pulse"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Tap to begin
        </motion.p>
        <motion.h1
          className="text-3xl md:text-5xl font-bold text-center px-8 leading-tight"
          style={{ fontFamily: defaultFont }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          Your Moment awaits…
        </motion.h1>
        <motion.p
          className="opacity-40 text-xs mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Made with MakeMoments
        </motion.p>
      </div>
    );
  }

  // Dynamic share button styling based on the first slide's type
  const shareIsDark = firstPage?.type === 'dark' || !firstPage?.type;
  const shareBtnClass = shareIsDark
    ? "gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
    : "gap-2 bg-black/10 border-black/20 text-black hover:bg-black/20";

  const shareButtons = (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={copyLink} className={shareBtnClass}>
          <Copy className="h-4 w-4" /> Copy Link
        </Button>
        <Button variant="outline" size="sm" asChild className={shareBtnClass}>
          <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noreferrer">
            <Share2 className="h-4 w-4" /> Twitter
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild className={shareBtnClass}>
          <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noreferrer">
            <Share2 className="h-4 w-4" /> WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );

  // Inject the Ourheart-style synthetic CTA watermark slide
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pages = [...(celebration.pages as any)];
  if (!celebration.removeWatermark) {
    pages.push({
      _id: "synthetic-watermark-slide",
      type: firstPage?.type || "dark",
      text: "Create your own\nunforgettable story.",
      fontFamily: defaultFont,
      textColor: introTextColor,
      textAlign: "center",
      bgImage: firstPage?.bgImage || "",
      baseColor: introBgColor,
      glowColor: introBgColor,
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
      showShareOnLast={!celebration.removeWatermark}
      shareContent={shareButtons}
      eventSlug={event.slug}
      musicTrack={musicTrack ?? undefined}
    />
  );
};

export default CelebrationView;
