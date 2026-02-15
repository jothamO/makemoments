import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getEventBySlug, getTemplateById } from "@/data/data-service";
import { PublicHeader } from "@/components/public/Header";
import { PaymentModal } from "@/components/PaymentModal";
import { Camera, Type } from "lucide-react";

const TemplateEditor = () => {
  const { eventSlug, templateId } = useParams<{ eventSlug: string; templateId: string }>();
  const event = eventSlug ? getEventBySlug(eventSlug) : undefined;
  const template = templateId ? getTemplateById(templateId) : undefined;
  const [userMedia, setUserMedia] = useState<Record<string, string>>({});
  const [userText, setUserText] = useState<Record<string, string>>({});
  const [paymentOpen, setPaymentOpen] = useState(false);

  if (!event || !template) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Template not found.</p>
        </div>
      </div>
    );
  }

  const t = event.theme;

  const handleMockUpload = (slotId: string) => {
    setUserMedia((prev) => ({ ...prev, [slotId]: "/placeholder.svg" }));
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      <PublicHeader />

      <div className="flex-1 px-4 py-6 md:py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-headline)" }}>
            {template.name}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Controls */}
            <div className="space-y-8">
              {/* Photos */}
              <div>
                <h2 className="flex items-center gap-2 font-semibold mb-4">
                  <Camera className="h-5 w-5" style={{ color: t.primary }} />
                  Add Photos
                </h2>
                <div className="space-y-3">
                  {template.mediaSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 justify-start h-12"
                        onClick={() => handleMockUpload(slot.id)}
                      >
                        {userMedia[slot.id] ? "✅ " : "📷 "}
                        {slot.label}
                        {slot.required && <span className="text-destructive ml-1">*</span>}
                      </Button>
                      {userMedia[slot.id] && (
                        <img src={userMedia[slot.id]} alt="" className="h-12 w-12 rounded object-cover border" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Text */}
              <div>
                <h2 className="flex items-center gap-2 font-semibold mb-4">
                  <Type className="h-5 w-5" style={{ color: t.primary }} />
                  Add Text
                </h2>
                <div className="space-y-4">
                  {template.textSlots.map((slot) => (
                    <div key={slot.id}>
                      <Label className="text-sm mb-1 block">{slot.label}</Label>
                      {slot.maxLength > 60 ? (
                        <Textarea
                          placeholder={slot.placeholder}
                          maxLength={slot.maxLength}
                          value={userText[slot.id] ?? ""}
                          onChange={(e) => setUserText((p) => ({ ...p, [slot.id]: e.target.value }))}
                          className="resize-none"
                        />
                      ) : (
                        <Input
                          placeholder={slot.placeholder}
                          maxLength={slot.maxLength}
                          value={userText[slot.id] ?? ""}
                          onChange={(e) => setUserText((p) => ({ ...p, [slot.id]: e.target.value }))}
                        />
                      )}
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {(userText[slot.id] ?? "").length}/{slot.maxLength}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Preview */}
            <div>
              <div className="sticky top-20">
                <div
                  className="relative w-full aspect-square rounded-xl overflow-hidden shadow-xl"
                  style={{
                    background: `linear-gradient(160deg, ${t.bgGradientStart}, ${t.bgGradientEnd})`,
                  }}
                >
                  {/* Render media slots */}
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
                      {userMedia[slot.id] ? (
                        <img src={userMedia[slot.id]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/20 flex items-center justify-center text-white/50 text-xs">
                          {slot.label}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Render text slots */}
                  {template.textSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="absolute flex items-start"
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
                      <span className="drop-shadow-md">
                        {userText[slot.id] || slot.placeholder}
                      </span>
                    </div>
                  ))}

                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white/20 text-xl font-bold rotate-[-30deg] select-none" style={{ fontFamily: "var(--font-headline)" }}>
                      MakeMoments
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 border-t bg-white/95 backdrop-blur py-3 px-4 z-40">
        <div className="mx-auto max-w-6xl flex justify-end">
          <Button
            size="lg"
            className="rounded-full px-8 border-0"
            style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`, color: t.textLight }}
            onClick={() => setPaymentOpen(true)}
          >
            Create — ₦1,000
          </Button>
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        event={event}
        template={template}
        userMedia={userMedia}
        userText={userText}
      />
    </div>
  );
};

export default TemplateEditor;
