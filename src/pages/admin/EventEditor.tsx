import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getEventById } from "@/data/data-service";
import { useToast } from "@/hooks/use-toast";
import type { EventTheme } from "@/data/types";

const FONT_OPTIONS = ["Playfair Display", "Montserrat", "Inter", "Roboto", "Bebas Neue"];

const PRESETS: Record<string, Partial<EventTheme>> = {
  "womens-day": { primary: "#FF4081", secondary: "#FF8C7A", accent: "#FFD54F", bgGradientStart: "#FF4081", bgGradientEnd: "#FF8C7A", headline: "Celebrate Her Strength", subheadline: "Create a beautiful personalized card", ctaText: "Create Your Card", urgencyText: "🌸 Women's Day is coming!" },
  "mothers-day": { primary: "#E91E63", secondary: "#F8BBD0", accent: "#FCE4EC", bgGradientStart: "#E91E63", bgGradientEnd: "#F48FB1", headline: "For the Best Mom", subheadline: "Show her how much she means", ctaText: "Make Her Card", urgencyText: "💐 Mother's Day is coming!" },
  "fathers-day": { primary: "#1565C0", secondary: "#42A5F5", accent: "#BBDEFB", bgGradientStart: "#1565C0", bgGradientEnd: "#37474F", headline: "Honor Your Hero", subheadline: "Create a special card for Dad", ctaText: "Create for Dad", urgencyText: "👔 Father's Day is coming!" },
  "easter": { primary: "#AB47BC", secondary: "#CE93D8", accent: "#FFF9C4", bgGradientStart: "#AB47BC", bgGradientEnd: "#7E57C2", headline: "Happy Easter", subheadline: "Share joy this Easter season", ctaText: "Create Card", urgencyText: "🐣 Easter is coming!" },
  "christmas": { primary: "#C62828", secondary: "#2E7D32", accent: "#FFD700", bgGradientStart: "#C62828", bgGradientEnd: "#2E7D32", headline: "Merry Christmas", subheadline: "Send holiday cheer", ctaText: "Create Card", urgencyText: "🎄 Christmas is coming!" },
};

const AdminEventEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const existing = id ? getEventById(id) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [slug, setSlug] = useState(existing?.slug ?? "");
  const [status, setStatus] = useState(existing?.status ?? "upcoming");
  const [theme, setTheme] = useState<EventTheme>(
    existing?.theme ?? {
      primary: "#FF4081", secondary: "#FF8C7A", accent: "#FFD54F",
      bgGradientStart: "#FF4081", bgGradientEnd: "#FF8C7A",
      textDark: "#2D1B30", textLight: "#FFFFFF",
      headlineFont: "Playfair Display", bodyFont: "Montserrat",
      backgroundPattern: "floral",
      headline: "", subheadline: "", ctaText: "", urgencyText: "",
    }
  );
  const [previewMobile, setPreviewMobile] = useState(false);

  const updateTheme = (key: keyof EventTheme, value: string) => setTheme((p) => ({ ...p, [key]: value }));

  const applyPreset = (key: string) => {
    const preset = PRESETS[key];
    if (preset) setTheme((p) => ({ ...p, ...preset }));
  };

  const handleSave = () => {
    toast({ title: "Event saved!", description: `"${name}" has been saved successfully.` });
    navigate("/admin/events");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{id ? "Edit Event" : "New Event"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/events")}>Cancel</Button>
          <Button variant="outline" onClick={handleSave}>Save Draft</Button>
          <Button onClick={handleSave}>Publish</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Event Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="International Women's Day" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="womens-day" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Theme Configuration</CardTitle>
                <Select onValueChange={applyPreset}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Preset..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="womens-day">Women's Day</SelectItem>
                    <SelectItem value="mothers-day">Mother's Day</SelectItem>
                    <SelectItem value="fathers-day">Father's Day</SelectItem>
                    <SelectItem value="easter">Easter</SelectItem>
                    <SelectItem value="christmas">Christmas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {(["primary", "secondary", "accent"] as const).map((key) => (
                  <div key={key}>
                    <Label className="capitalize text-xs">{key}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={theme[key]} onChange={(e) => updateTheme(key, e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                      <Input value={theme[key]} onChange={(e) => updateTheme(key, e.target.value)} className="text-xs h-8" />
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Gradient Start</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={theme.bgGradientStart} onChange={(e) => updateTheme("bgGradientStart", e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                    <Input value={theme.bgGradientStart} onChange={(e) => updateTheme("bgGradientStart", e.target.value)} className="text-xs h-8" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Gradient End</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={theme.bgGradientEnd} onChange={(e) => updateTheme("bgGradientEnd", e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                    <Input value={theme.bgGradientEnd} onChange={(e) => updateTheme("bgGradientEnd", e.target.value)} className="text-xs h-8" />
                  </div>
                </div>
              </div>

              {/* Gradient preview */}
              <div className="h-6 rounded-full" style={{ background: `linear-gradient(90deg, ${theme.bgGradientStart}, ${theme.bgGradientEnd})` }} />

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Headline Font</Label>
                  <Select value={theme.headlineFont} onValueChange={(v) => updateTheme("headlineFont", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Body Font</Label>
                  <Select value={theme.bodyFont} onValueChange={(v) => updateTheme("bodyFont", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Headline</Label>
                  <Input value={theme.headline} onChange={(e) => updateTheme("headline", e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Subheadline</Label>
                  <Textarea value={theme.subheadline} onChange={(e) => updateTheme("subheadline", e.target.value)} className="text-xs min-h-[60px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">CTA Text</Label>
                    <Input value={theme.ctaText} onChange={(e) => updateTheme("ctaText", e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Urgency Text</Label>
                    <Input value={theme.urgencyText} onChange={(e) => updateTheme("urgencyText", e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div>
          <div className="sticky top-20">
            <div className="flex gap-2 mb-3">
              <Button variant={!previewMobile ? "default" : "outline"} size="sm" onClick={() => setPreviewMobile(false)}>Desktop</Button>
              <Button variant={previewMobile ? "default" : "outline"} size="sm" onClick={() => setPreviewMobile(true)}>Mobile</Button>
            </div>
            <div
              className="rounded-xl overflow-hidden shadow-xl border"
              style={{ maxWidth: previewMobile ? 375 : "100%" }}
            >
              <div
                className="p-8 text-center"
                style={{ background: `linear-gradient(135deg, ${theme.bgGradientStart}, ${theme.bgGradientEnd})` }}
              >
                <p className="text-xs mb-4 opacity-80" style={{ color: theme.textLight }}>{theme.urgencyText || "Urgency text..."}</p>
                <h2
                  className="text-2xl md:text-3xl font-bold mb-3"
                  style={{ fontFamily: `"${theme.headlineFont}", serif`, color: theme.textLight }}
                >
                  {theme.headline || "Your Headline"}
                </h2>
                <p className="text-sm mb-6 opacity-90" style={{ fontFamily: `"${theme.bodyFont}", sans-serif`, color: theme.textLight }}>
                  {theme.subheadline || "Your subheadline goes here..."}
                </p>
                <button
                  className="px-6 py-2.5 rounded-full text-sm font-medium shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, color: theme.textLight }}
                >
                  {theme.ctaText || "CTA Button"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEventEditor;
