import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createCelebration } from "@/data/data-service";
import type { CelebrationEvent, Template } from "@/data/types";
import { CreditCard } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  event: CelebrationEvent;
  template: Template;
  userMedia: Record<string, string>;
  userText: Record<string, string>;
}

const BASE_PRICE = 1000;
const UPSELL_PRICE = 500;

export function PaymentModal({ open, onClose, event, template, userMedia, userText }: PaymentModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [hasMusic, setHasMusic] = useState(false);
  const [customLink, setCustomLink] = useState(false);
  const [hdDownload, setHdDownload] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paystack">("stripe");

  const upsellCount = [removeWatermark, hasMusic, customLink, hdDownload].filter(Boolean).length;
  const total = BASE_PRICE + upsellCount * UPSELL_PRICE;

  const handlePay = () => {
    if (!email) return;
    setProcessing(true);
    setTimeout(() => {
      const slug = `${(userText[template.textSlots[0]?.id] || "card").toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;
      createCelebration({
        templateId: template.id,
        eventId: event.id,
        slug,
        email,
        userMedia,
        userText,
        removeWatermark,
        hasMusic,
        customLink,
        hdDownload,
        totalPaid: total,
        paymentStatus: "paid",
      });
      setProcessing(false);
      onClose();
      navigate(`/${slug}`);
    }, 1500);
  };

  const t = event.theme;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-headline)" }}>Complete Your Card</DialogTitle>
          <DialogDescription>Add extras and pay to share your creation</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Preview */}
          <div
            className="aspect-video rounded-lg flex items-center justify-center text-white text-sm"
            style={{ background: `linear-gradient(135deg, ${t.bgGradientStart}, ${t.bgGradientEnd})` }}
          >
            Preview: {template.name}
          </div>

          {/* Upsells */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Extras</p>
            {[
              { label: "Remove watermark", checked: removeWatermark, set: setRemoveWatermark },
              { label: "Add music track", checked: hasMusic, set: setHasMusic },
              { label: "Custom link", checked: customLink, set: setCustomLink },
              { label: "HD Download", checked: hdDownload, set: setHdDownload },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox checked={item.checked} onCheckedChange={(v) => item.set(!!v)} />
                  <Label className="text-sm cursor-pointer">{item.label}</Label>
                </div>
                <span className="text-sm text-muted-foreground">+₦{UPSELL_PRICE.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Email */}
          <div>
            <Label className="text-sm mb-1 block">Email address</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Payment method toggle */}
          <div className="flex gap-2">
            {(["stripe", "paystack"] as const).map((m) => (
              <Button
                key={m}
                variant={paymentMethod === m ? "default" : "outline"}
                size="sm"
                className="flex-1 capitalize"
                onClick={() => setPaymentMethod(m)}
              >
                {m}
              </Button>
            ))}
          </div>

          {/* Total & Pay */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-bold text-lg">₦{total.toLocaleString()}</span>
            <Button
              disabled={!email || processing}
              className="rounded-full px-6 border-0"
              style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`, color: t.textLight }}
              onClick={handlePay}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {processing ? "Processing..." : "Pay with Card"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
