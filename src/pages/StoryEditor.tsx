import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEventBySlug, getTemplateById } from "@/data/data-service";
import type { StoryPage } from "@/data/types";
import { StoryCanvas } from "@/components/editor/StoryCanvas";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { PageIndicator } from "@/components/editor/PageIndicator";
import { StoryViewer } from "@/components/story/StoryViewer";
import { PaymentModal } from "@/components/PaymentModal";

const createBlankPage = (event?: { theme: { bgGradientStart: string; bgGradientEnd: string } }): StoryPage => ({
  id: `page-${Math.random().toString(36).slice(2, 8)}`,
  text: "",
  fontFamily: "Playfair Display",
  fontSize: "medium",
  textAlign: "center",
  textColor: "#FFFFFF",
  bgGradientStart: event?.theme.bgGradientStart ?? "#FF4081",
  bgGradientEnd: event?.theme.bgGradientEnd ?? "#FF8C7A",
  transition: "fade",
  stickers: [],
});

const StoryEditor = () => {
  const { eventSlug, templateId } = useParams<{ eventSlug: string; templateId: string }>();
  const navigate = useNavigate();
  const event = eventSlug ? getEventBySlug(eventSlug) : undefined;
  const template = templateId ? getTemplateById(templateId) : undefined;

  const initialPages = template?.defaultPages?.length
    ? template.defaultPages.map((p) => ({ ...p, id: `page-${Math.random().toString(36).slice(2, 8)}` }))
    : [createBlankPage(event)];

  const [pages, setPages] = useState<StoryPage[]>(initialPages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [musicTrackId, setMusicTrackId] = useState<string | undefined>();
  const [previewing, setPreviewing] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const currentPage = pages[currentIndex];

  const updatePage = useCallback((updates: Partial<StoryPage>) => {
    setPages((prev) =>
      prev.map((p, i) => (i === currentIndex ? { ...p, ...updates } : p))
    );
  }, [currentIndex]);

  const addPage = () => {
    const newPage = createBlankPage(event);
    setPages((prev) => {
      const next = [...prev];
      next.splice(currentIndex + 1, 0, newPage);
      return next;
    });
    setCurrentIndex((i) => i + 1);
  };

  const deletePage = () => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== currentIndex));
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const addSticker = (emoji: string) => {
    const x = 20 + Math.random() * 60;
    const y = 20 + Math.random() * 60;
    updatePage({ stickers: [...(currentPage?.stickers ?? []), { emoji, x, y }] });
  };

  const handlePhotoUpload = () => {
    // Mock: set placeholder
    updatePage({ photoUrl: "/placeholder.svg" });
  };

  if (!event || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Template not found.</p>
      </div>
    );
  }

  if (previewing) {
    return (
      <StoryViewer
        pages={pages}
        showWatermark
        autoPlay
        onClose={() => setPreviewing(false)}
      />
    );
  }

  const t = event.theme;

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        background: `linear-gradient(160deg, ${currentPage?.bgGradientStart ?? t.bgGradientStart}, ${currentPage?.bgGradientEnd ?? t.bgGradientEnd})`,
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/30 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-white/80 text-sm font-medium">
          {currentIndex + 1} / {pages.length}
        </span>
        <button
          onClick={deletePage}
          disabled={pages.length <= 1}
          className="w-9 h-9 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/30 transition-colors disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Card canvas */}
      <div className="flex-1 px-4 pb-2 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {currentPage && (
              <StoryCanvas
                page={currentPage}
                editable
                showWatermark
                onPhotoClick={handlePhotoUpload}
                onTextChange={(text) => updatePage({ text })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page indicator */}
      <PageIndicator
        total={pages.length}
        current={currentIndex}
        onSelect={setCurrentIndex}
        onAdd={addPage}
      />

      {/* Toolbar */}
      {currentPage && (
        <EditorToolbar
          page={currentPage}
          musicTrackId={musicTrackId}
          onPageUpdate={updatePage}
          onMusicChange={setMusicTrackId}
          onStickerAdd={addSticker}
        />
      )}

      {/* Action bar */}
      <div className="flex gap-3 px-4 py-3 pb-safe">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          onClick={() => setPreviewing(true)}
        >
          <Eye className="mr-2 h-4 w-4" /> Preview
        </Button>
        <Button
          size="lg"
          className="flex-1 rounded-full border-0"
          style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`, color: t.textLight }}
          onClick={() => setPaymentOpen(true)}
        >
          Publish — ₦1,000
        </Button>
      </div>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        event={event}
        template={template}
        pages={pages}
        musicTrackId={musicTrackId}
      />
    </div>
  );
};

export default StoryEditor;
