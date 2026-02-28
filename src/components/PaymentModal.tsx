import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import type { CelebrationEvent, StoryPage } from "@/data/types";
import { CreditCard, Loader2, Check, Link2, UserPlus, Copy, ExternalLink, Share2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { usePaystackPayment } from "react-paystack";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  event: CelebrationEvent;
  pages: StoryPage[];
  musicTrackId?: string;
}

// Parse Convex error to user-friendly string
function parseError(e: unknown): string {
  if (!(e instanceof Error)) return "Something went wrong";
  const msg = e.message;
  const m1 = msg.match(/Uncaught Error:\s*(.+?)\s*at handler/);
  if (m1) return m1[1].trim();
  // eslint-disable-next-line security/detect-unsafe-regex
  const m2 = msg.match(/Server Error\s+(?:Uncaught Error:\s*)?(.+)/);
  if (m2) {
    const cleaned = m2[1].replace(/\s*at handler\s*\(.*?\)/, "").replace(/\s*Called by client$/, "").trim();
    if (cleaned) return cleaned;
  }
  return msg;
}

export function PaymentModal({ open, onClose, event, pages, musicTrackId }: PaymentModalProps) {
  const navigate = useNavigate();
  const { currency, symbol, isNigeria } = useCurrency();
  const { token, isAdmin } = useAuth();

  const [email, setEmail] = useState("");
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [customLink, setCustomLink] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const [hdDownload, setHdDownload] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Payment tracking
  const [celebrationId, setCelebrationId] = useState<string | null>(null);
  const [confirmedSlug, setConfirmedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Queries ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const globalPricing = useQuery(api.pricing.list) || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const musicTracks = useQuery(api.music.list) || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fonts = useQuery(api.fonts.list) || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const patterns = useQuery(api.patterns.list) || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const characters = useQuery(api.characters.list) || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const exchangeRates = useQuery(api.exchangeRates.list) || [];
  const gatewayConfig = useQuery(api.gatewayConfig.get);

  // ── Gateway Routing (Admin Driven) ──
  const activeGateway = useMemo(() => {
    if (!gatewayConfig) return "paystack";
    // Duck typing without explicitly casting as any
    const pEnabled = "paystackEnabled" in gatewayConfig ? gatewayConfig.paystackEnabled : true;
    const sEnabled = "stripeEnabled" in gatewayConfig ? gatewayConfig.stripeEnabled : true;

    if (pEnabled) return "paystack";
    if (sEnabled) return "stripe";
    return "paystack"; // Fallback to Paystack
  }, [gatewayConfig]);

  // Real-time payment status polling
  const paymentStatus = useQuery(
    api.payments.getPaymentStatus,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    celebrationId ? { celebrationId: celebrationId as any } : "skip"
  );

  // Detect when server confirms payment
  useEffect(() => {
    if (paymentStatus?.paid && paymentStatus.slug) {
      // Clear the local draft so it doesn't reappear
      if (typeof window !== "undefined") {
        localStorage.removeItem("mm-draft-v1");
      }
      setConfirmedSlug(paymentStatus.slug);
      setProcessing(false);
    }
  }, [paymentStatus]);

  // ── Mutations ──
  const initializePayment = useMutation(api.payments.initializePayment);

  // ── Theme ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glowColor = (event.theme as any)?.glowColor || event.theme.secondary || "#ec4899";

  // ── Exchange rate ──
  const exchangeRate = useMemo(() => {
    if (isNigeria) return 1;
    const rate = exchangeRates.find(
      (r) => r.fromCurrency === "USD" && r.toCurrency === currency
    );
    return rate?.rate ?? 1;
  }, [exchangeRates, currency, isNigeria]);

  // ── Prices ──
  const prices = useMemo(() => {
    const p: Record<string, number> = {
      base: isNigeria ? 1000 : 0.99,
      themes: 0,
      fonts: 0,
      music: 0,
      patterns: 0,
      characters: 0,
      hdDownload: 0,
      extraSlide: 0,
      removeWatermark: 0,
      multiImage: 0,
      customLink: 0,
    };
    globalPricing.forEach((gp) => {
      p[gp.category] = isNigeria ? gp.prices.ngn : gp.prices.usd;
    });
    return p;
  }, [globalPricing, isNigeria]);

  // ── Detect premium addons ──
  const detectedAddons = useMemo(() => {
    const addons: { key: string; label: string; price: number; auto: boolean }[] = [];

    if (musicTrackId) {
      const track = musicTracks.find((m) => m._id === musicTrackId);
      if (track?.isPremium && prices.music > 0) {
        addons.push({ key: "music", label: track.name || "Premium Music", price: prices.music, auto: true });
      }
    }

    const uniqueFonts = Array.from(new Set(pages.map((p) => p.fontFamily)));
    const premiumFonts = fonts.filter((f) => uniqueFonts.includes(f.fontFamily) && f.isPremium);
    if (premiumFonts.length > 0 && prices.fonts > 0) {
      addons.push({ key: "fonts", label: "Elegant font", price: prices.fonts, auto: true });
    }

    const uniquePatterns = Array.from(new Set(pages.map((p) => p.backgroundPattern).filter(Boolean)));
    const premiumPatterns = patterns.filter((p) => uniquePatterns.includes(p.id) && p.isPremium);
    if (premiumPatterns.length > 0 && prices.patterns > 0) {
      addons.push({ key: "patterns", label: "Effects ✨", price: prices.patterns, auto: true });
    }

    const emojisUsed = Array.from(new Set(pages.flatMap((p) => p.stickers.map((s) => s.emoji))));
    const premiumChars = characters.filter((c) => emojisUsed.includes(c.name) && c.isPremium);
    if (premiumChars.length > 0 && prices.characters > 0) {
      addons.push({ key: "characters", label: "Premium Illustrations", price: prices.characters, auto: true });
    }

    const actualMultiImage = pages.some(p => (p.photos?.length || 0) > 1);

    if (actualMultiImage && prices.multiImage > 0) {
      addons.push({ key: "multiImage", label: "3 Character Unlock", price: prices.multiImage, auto: true });
    }

    return addons;
  }, [musicTrackId, musicTracks, pages, fonts, patterns, characters, prices]);

  // ── Prices for upsells ──
  const customLinkPrice = prices.customLink ?? 0;
  const hdPrice = prices.hdDownload ?? 0;
  const extraSlidePrice = prices.extraSlide ?? 0;
  const watermarkPrice = prices.removeWatermark ?? 0;

  // ── Extra slides ──
  const extraSlides = Math.max(0, pages.length - 7);

  // ── Total & Formatting ──
  const getLocalRounded = useCallback((usdAmount: number) => {
    if (isNigeria) return usdAmount;
    const converted = usdAmount * exchangeRate;
    return Math.round(converted * 2) / 2; // Round to nearest 0.50
  }, [isNigeria, exchangeRate]);

  const { total, breakdown } = useMemo(() => {
    const baseLocal = getLocalRounded(prices.base);
    let currentTotal = baseLocal;
    const items: { label: string; price: number }[] = [{ label: "Base Card", price: baseLocal }];

    // Extra slides
    if (extraSlides > 0) {
      const slideCostLocal = getLocalRounded(extraSlidePrice) * extraSlides;
      currentTotal += slideCostLocal;
      items.push({ label: `${extraSlides} extra slide${extraSlides > 1 ? "s" : ""}`, price: slideCostLocal });
    }

    detectedAddons.forEach((addon) => {
      const p = getLocalRounded(addon.price);
      currentTotal += p;
      items.push({ label: addon.label, price: p });
    });

    if (removeWatermark && watermarkPrice > 0) { const p = getLocalRounded(watermarkPrice); currentTotal += p; items.push({ label: "No watermark", price: p }); }
    if (customLink && customLinkPrice > 0) { const p = getLocalRounded(customLinkPrice); currentTotal += p; items.push({ label: "Custom link", price: p }); }
    if (hdDownload && hdPrice > 0) { const p = getLocalRounded(hdPrice); currentTotal += p; items.push({ label: "HD Download", price: p }); }

    return { total: currentTotal, breakdown: items };
  }, [prices, detectedAddons, removeWatermark, customLink, hdDownload, extraSlides, extraSlidePrice, hdPrice, customLinkPrice, watermarkPrice, getLocalRounded]);

  // ── Format price ──
  // Note: amount is now ASSUMED to be pre-converted and correctly rounded!
  const formatPrice = (amount: number) => {
    if (isNigeria) return `₦${amount.toLocaleString()}`;
    return `${symbol}${amount.toFixed(2)}`;
  };

  // ── Slug ──
  const autoSlug = useMemo(() => {
    return `moments-${Date.now().toString(36)}`;
  }, []);

  const displaySlug = customLink && customSlug ? customSlug : autoSlug;

  // ── Validation ──
  const isValidEmail = isAdmin ? true : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isCustomLinkValid = !customLink || customSlug.trim().length > 0;
  const canPay = isValidEmail && isCustomLinkValid && !processing;

  // ── Paystack config ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paystackPublicKey = (gatewayConfig as any)?.paystackPublicKey || "";
  const paystackConfig = {
    reference: `mm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email,
    amount: Math.round(total * 100), // Paystack expects kobo
    publicKey: paystackPublicKey,
    currency: isNigeria ? "NGN" : currency,
  };

  const initPaystack = usePaystackPayment(paystackConfig);

  // ── Pay ──
  const handlePay = async () => {
    if (!canPay) return;
    setProcessing(true);
    setPaymentError(null);

    try {
      const slug = customLink && customSlug
        ? customSlug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "")
        : autoSlug;

      const result = await initializePayment({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventId: event._id as any,
        slug,
        email: isAdmin ? "admin@makemoments.xyz" : email,
        pages,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        musicTrackId: musicTrackId as any || undefined,
        removeWatermark,
        hasMusic: !!musicTrackId,
        customLink,
        customSlug: customLink ? slug : undefined,
        hdDownload,
        totalPaid: total, // Client-side estimate for reference; recalculated server-side
        currency,
        gateway: activeGateway,
        paymentReference: paystackConfig.reference,
        createAccount,
        username,
        password,
        token: token || undefined,
      });

      setCelebrationId(result.celebrationId);

      // If admin, the backend mutation instantly marks it as "paid". 
      // The useEffect polling block above will catch it, clear drafts, and set confirmedSlug automatically.
      if (isAdmin) {
        return;
      }

      if (activeGateway === "paystack" && paystackPublicKey) {
        initPaystack({
          onSuccess: () => { }, // Server-side verification via webhook
          onClose: () => {
            setProcessing(false);
            setPaymentError("Payment was cancelled. You can try again.");
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      } else {
        // Stripe or no gateway configured — placeholder
        toast({ title: "Gateway not configured", description: "Please configure payment keys in admin." });
        setProcessing(false);
      }
    } catch (error) {
      console.error(error);
      setProcessing(false);
      setPaymentError(parseError(error));
    }
  };

  // ── Copy link ──
  const handleCopy = async () => {
    const url = `https://makemoments.xyz/${confirmedSlug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Addon cards ──
  const allAddonCards = [
    ...detectedAddons.map((a) => ({ ...a, checked: true, toggleable: false })),
    ...(watermarkPrice > 0 ? [{ key: "watermark", label: "No watermark", price: watermarkPrice, auto: false, checked: removeWatermark, toggleable: true }] : []),
    ...(hdPrice > 0 ? [{ key: "hd", label: "HD Download", price: hdPrice, auto: false, checked: hdDownload, toggleable: true }] : []),
  ];

  const toggleAddon = (key: string) => {
    switch (key) {
      case "watermark": setRemoveWatermark((v) => !v); break;
      case "hd": setHdDownload((v) => !v); break;
    }
  };

  // ── Reset on close ──
  const handleClose = () => {
    if (processing) return; // Prevent closing while Paystack is active
    if (confirmedSlug) {
      // Reset everything if closing after success
      setCelebrationId(null);
      setConfirmedSlug(null);
      setPaymentError(null);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !processing && !v && handleClose()}
      modal={!processing}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-[50%] top-[50%] z-50 w-[calc(100%-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-3xl border border-white/10 bg-zinc-900/95 backdrop-blur-2xl p-6 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200 max-h-[90vh] overflow-y-auto"
        >
          <DialogPrimitive.Title className="sr-only">Complete your Moment</DialogPrimitive.Title>

          {/* Close button */}
          <button
            onClick={handleClose}
            disabled={processing}
            className="absolute right-4 top-4 text-white/40 hover:text-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none z-10"
          >
            ✕
          </button>

          <AnimatePresence mode="wait">
            {confirmedSlug ? (
              /* ═══ SUCCESS SCREEN ═══ */
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-4"
              >
                {/* Checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${glowColor}20` }}
                >
                  <Check className="w-8 h-8" style={{ color: glowColor }} />
                </motion.div>

                {/* Headline */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-1"
                >
                  Your moment is live! 🎉
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-white/40 mb-6"
                >
                  Share this link with someone special
                </motion.p>

                {/* Link card + Copy */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="w-full rounded-2xl p-4 mb-4"
                  style={{ backgroundColor: `${glowColor}10`, border: `1px solid ${glowColor}30` }}
                >
                  <p className="text-xs text-white/40 mb-2">Your link</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-white font-medium truncate">
                      makemoments.xyz/<span style={{ color: glowColor }}>{confirmedSlug}</span>
                    </span>
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${copied
                        ? "bg-green-500 text-white"
                        : "text-white"
                        }`}
                      style={!copied ? { backgroundColor: glowColor } : undefined}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </motion.div>

                {/* View button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => {
                    handleClose();
                    navigate(`/${confirmedSlug}`);
                  }}
                  className="w-full h-12 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all mb-4"
                  style={{ background: `linear-gradient(135deg, ${glowColor}, ${glowColor}cc)` }}
                >
                  <ExternalLink className="w-4 h-4" /> View your Moment →
                </motion.button>

                {/* Share row */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center gap-3"
                >
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`I made this for you ❤️ https://makemoments.xyz/${confirmedSlug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600/20 text-green-400 text-xs font-medium hover:bg-green-600/30 transition-colors"
                  >
                    <Share2 className="w-3 h-3" /> WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("I made this for you ❤️")}&url=${encodeURIComponent(`https://makemoments.xyz/${confirmedSlug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors"
                  >
                    <Share2 className="w-3 h-3" /> X / Twitter
                  </a>
                </motion.div>

                {/* Create another */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  onClick={() => {
                    handleClose();
                    navigate(`/${event.slug || ""}/create`);
                  }}
                  className="mt-4 text-xs underline decoration-dotted text-white/30 hover:text-white/60 transition-colors"
                >
                  Create another →
                </motion.button>
              </motion.div>
            ) : (
              /* ═══ PAYMENT FORM ═══ */
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Title */}
                <h2 className="text-center text-xl font-semibold" style={{ color: glowColor }}>
                  Complete your Moment
                </h2>

                {/* Total */}
                <p className="text-center text-3xl font-bold text-white mt-2">
                  {formatPrice(total)}
                </p>

                {/* Link preview */}
                <p className="text-center text-xs text-white/40 mt-1">
                  Your link: makemoments.xyz/<span className="text-white/60 underline decoration-dotted">{displaySlug}</span>
                </p>

                {/* Addon grid */}
                <div className="grid grid-cols-2 gap-2 mt-5">
                  {allAddonCards.map((addon) => (
                    <button
                      key={addon.key}
                      onClick={() => addon.toggleable && toggleAddon(addon.key)}
                      className={`relative rounded-xl px-3 py-3 text-left transition-all border ${addon.checked
                        ? "border-white/20"
                        : "border-white/5 hover:border-white/10"
                        }`}
                      style={{
                        backgroundColor: addon.checked ? `${glowColor}15` : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div
                        className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${addon.checked ? "text-white" : "border border-white/20"
                          }`}
                        style={{ backgroundColor: addon.checked ? glowColor : "transparent" }}
                      >
                        {addon.checked && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-sm text-white/90 font-medium block pr-6">{addon.label}</span>
                      <span className="text-xs text-white/40 mt-0.5 block">+ {formatPrice(getLocalRounded(addon.price))}</span>
                    </button>
                  ))}
                </div>

                {/* Extra slides notice */}
                {extraSlides > 0 && (
                  <div className="mt-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-white/50">
                      <span className="text-white/70 font-medium">{extraSlides} extra slide{extraSlides > 1 ? "s" : ""}</span> — {formatPrice(getLocalRounded(extraSlidePrice) * extraSlides)} added
                    </p>
                  </div>
                )}

                {/* Email */}
                {!isAdmin && (
                  <div className="mt-5">
                    <label className="text-xs text-white/40 font-medium mb-1.5 block">Your email</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl h-11 focus-visible:ring-1"
                      style={{ borderColor: isValidEmail && email ? `${glowColor}40` : undefined }}
                    />
                  </div>
                )}

                {/* Create account */}
                {!isAdmin && (
                  <button
                    onClick={() => setCreateAccount((v) => !v)}
                    className={`mt-3 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left ${createAccount
                      ? "border-white/20"
                      : "border-white/5 hover:border-white/10"
                      }`}
                    style={{ backgroundColor: createAccount ? `${glowColor}10` : "rgba(255,255,255,0.02)" }}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${createAccount ? "text-white" : "border border-white/20"
                        }`}
                      style={{ backgroundColor: createAccount ? glowColor : "transparent" }}
                    >
                      {createAccount ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3 text-white/30" />}
                    </div>
                    <span className="text-sm text-white/70">Create an account</span>
                  </button>
                )}

                {!isAdmin && createAccount && (
                  <div className="mt-2 space-y-2">
                    <Input
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl h-11 focus-visible:ring-1"
                    />
                    <Input
                      type="password"
                      placeholder="Choose a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl h-11 focus-visible:ring-1"
                    />
                  </div>
                )}

                {/* Custom link */}
                <button
                  onClick={() => setCustomLink((v) => !v)}
                  className={`mt-3 w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${customLink
                    ? "border-white/20"
                    : "border-white/5 hover:border-white/10"
                    }`}
                  style={{ backgroundColor: customLink ? `${glowColor}10` : "rgba(255,255,255,0.02)" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${customLink ? "text-white" : "border border-white/20"
                        }`}
                      style={{ backgroundColor: customLink ? glowColor : "transparent" }}
                    >
                      {customLink ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3 text-white/30" />}
                    </div>
                    <span className="text-sm text-white/70">Custom link</span>
                  </div>
                  <span className="text-xs text-white/40">{customLinkPrice > 0 ? `+ ${formatPrice(getLocalRounded(customLinkPrice))}` : "Free"}</span>
                </button>

                {customLink && (
                  <div className="mt-2">
                    <label className="text-xs text-white/40 font-medium mb-1.5 block">Choose your custom link</label>
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl h-11 px-3 focus-within:ring-1"
                      style={{ borderColor: customSlug ? `${glowColor}40` : undefined }}
                    >
                      <span className="text-xs text-white/30 mr-1 flex-shrink-0">makemoments.xyz/</span>
                      <input
                        type="text"
                        placeholder="mymoment"
                        value={customSlug}
                        onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        className="bg-transparent border-none outline-none text-white text-sm flex-1 placeholder:text-white/25"
                      />
                    </div>
                  </div>
                )}

                {/* Payment error notification (red pill) */}
                {paymentError && (
                  <p className="mt-4 text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2 border border-red-500/20 text-center">
                    {paymentError}
                  </p>
                )}

                {/* Pay button */}
                <button
                  disabled={!canPay}
                  onClick={handlePay}
                  className="mt-5 w-full h-12 rounded-2xl text-white font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{
                    background: canPay
                      ? `linear-gradient(135deg, ${glowColor}, ${glowColor}cc)`
                      : undefined,
                    backgroundColor: canPay ? undefined : "rgba(255,255,255,0.05)",
                  }}
                >
                  {processing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CreditCard className="h-5 w-5" />
                  )}
                  {processing
                    ? "Processing..."
                    : `Pay ${formatPrice(total)}`}
                </button>

                <p className="text-[10px] text-center text-white/25 mt-2">
                  Secure payment powered by {activeGateway === "paystack" ? "Paystack" : "Stripe"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
