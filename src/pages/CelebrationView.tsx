import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getCelebrationBySlug, getEventById, incrementViews } from "@/data/data-service";
import { StoryViewer } from "@/components/story/StoryViewer";
import { Copy, Share2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CelebrationView = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const celebration = slug ? getCelebrationBySlug(slug) : undefined;
  const event = celebration ? getEventById(celebration.eventId) : undefined;
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (slug) incrementViews(slug);
  }, [slug]);

  if (!celebration || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white/60">Celebration not found.</p>
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

  // Intro screen
  if (!started) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center cursor-pointer"
        style={{ background: `linear-gradient(160deg, ${t.bgGradientStart}, ${t.bgGradientEnd})` }}
        onClick={() => setStarted(true)}
      >
        <p className="text-white/60 text-sm mb-4 animate-pulse">Tap to begin</p>
        <h1
          className="text-3xl md:text-5xl font-bold text-white text-center px-8 leading-tight"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          A love story awaits…
        </h1>
        <p className="text-white/40 text-xs mt-8">Made with MakeMoments</p>
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
      <div className="text-center">
        <Button
          asChild
          size="sm"
          className="rounded-full border-0"
          style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`, color: t.textLight }}
        >
          <Link to={`/create/${event.slug}`}>
            <Sparkles className="mr-2 h-4 w-4" /> Create Your Own
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <StoryViewer
      pages={celebration.pages}
      showWatermark={!celebration.removeWatermark}
      autoPlay
      showShareOnLast
      shareContent={shareButtons}
    />
  );
};

export default CelebrationView;
