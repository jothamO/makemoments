import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette, Music, Layout, Save, Globe, Sparkles, Smartphone, Monitor, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { CharacterPicker, MusicPicker, ThemePresetPicker, FontPicker, PatternPicker } from "@/components/admin/GlobalAssetPickers";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import { EventHero } from "@/components/public/EventHero";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { replaceUrgencyVariables, hexToRgba, getContrastColor, cn } from "@/lib/utils";
import { format } from "date-fns";
import { CONTENT_TRANSITION, TAP_SCALE } from "@/lib/animation";


const HEADLINE_FONTS = [
  "Playfair Display", "Inter", "Dancing Script", "Lora",
  "Quicksand", "Comic Neue", "Pacifico", "Satisfy",
  "Sacramento", "Great Vibes"
];

const BODY_FONTS = [
  "Montserrat", "Inter", "Lora", "System-ui", "Serif", "Sans-serif"
];


const EventEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Convex hooks
  const event = useQuery(api.events.getById, id ? { id: id as any } : "skip");
  const updateEvent = useMutation(api.events.update);
  const createEvent = useMutation(api.events.create);
  const allPatterns = useQuery(api.patterns.list);

  // State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [tier, setTier] = useState<number>(4);
  const [kind, setKind] = useState("one-time");
  const [activeTab, setActiveTab] = useState("general");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");

  // Date states
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [launchDate, setLaunchDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 2592000000));

  const [theme, setTheme] = useState<any>({
    baseColor: "#E2F0E9",
    glowColor: "#22c55e",
    type: "light",
    headlineFont: "Playfair Display", bodyFont: "Montserrat",
    headline: "", subheadline: "", ctaText: "Create Now", urgencyText: "",
    characterIds: [], musicTrackIds: [], patternIds: [], allowedThemeIds: [], allowedFontIds: [],
    textMode: "auto"
  });

  // Derived colors for preview
  const textColor = theme.type === "dark" ? "#FFFFFF" : "#18181B";
  const buttonTextColor = theme.type === "dark" ? "#000000" : "#FFFFFF"; // Contrast for buttons
  const isDark = theme.type === "dark";

  useEffect(() => {
    if (event) {
      setName(event.name);
      setSlug(event.slug);
      setStatus(event.status);
      setTier(event.tier || 4);
      setKind(event.kind || "one-time");
      setTheme(event.theme);
      if (event.date) setEventDate(new Date(event.date));
      if (event.launchDate) setLaunchDate(new Date(event.launchDate));
      if (event.endDate) setEndDate(new Date(event.endDate));
    }
  }, [event]);

  const handleSave = async (isPublish = false) => {
    const finalStatus = isPublish ? "active" : status;
    try {
      const payload = {
        name,
        slug,
        status: finalStatus as any,
        tier: tier as any,
        kind: kind as any,
        theme,
        date: eventDate.getTime(),
        launchDate: launchDate.getTime(),
        endDate: endDate.getTime(),
      };

      if (id) {
        await updateEvent({ id: id as any, ...payload });
      } else {
        await createEvent(payload);
      }
      toast({ title: isPublish ? "Event Published!" : "Event Saved" });
      if (!id || isPublish) navigate("/admin/events");
    } catch (error) {
      toast({ title: "Error saving event", variant: "destructive" });
    }
  };

  const [currentPreviewSlide, setCurrentPreviewSlide] = useState(0);

  // Helper: generate slides for preview
  const rawPreviewSlides = [
    {
      badge: theme.urgencyText ? `✨ ${replaceUrgencyVariables(theme.urgencyText, name, eventDate?.getTime() || 0, endDate?.getTime() || 0)}` : `✨ ${name || "Event"} is ${format(eventDate, "MMMM d")}`,
      headline: theme.headline || `Celebrate ${name || "Moment"}`,
      subheadline: theme.subheadline || "Create a beautiful personalized card for the incredible people in your life",
    },
    {
      badge: theme.urgencyText ? `✨ ${replaceUrgencyVariables(theme.urgencyText, name, eventDate?.getTime() || 0, endDate?.getTime() || 0)}` : `✨ ${name || "Event"} is ${format(eventDate, "MMMM d")}`,
      headline: theme.headline_2,
      subheadline: theme.subheadline_2,
    },
    {
      badge: theme.urgencyText ? `✨ ${replaceUrgencyVariables(theme.urgencyText, name, eventDate?.getTime() || 0, endDate?.getTime() || 0)}` : `✨ ${name || "Event"} is ${format(eventDate, "MMMM d")}`,
      headline: theme.headline_3,
      subheadline: theme.subheadline_3,
    },
  ];

  // Filter out empty slides
  const previewSlides = rawPreviewSlides.filter(s => !!s.headline || !!s.subheadline);
  if (previewSlides.length === 0) {
    // Fallback if everything is empty
    previewSlides.push(rawPreviewSlides[0]);
  }

  if (id && !event) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-zinc-400" /></div>;

  const nextPreviewSlide = () => setCurrentPreviewSlide((prev) => (prev + 1) % previewSlides.length);
  const prevPreviewSlide = () => setCurrentPreviewSlide((prev) => (prev - 1 + previewSlides.length) % previewSlides.length);

  const activeSlide = previewSlides[currentPreviewSlide];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/events")}>
            <Globe className="h-5 w-5" />
          </Button>
          <div className="h-6 w-px bg-zinc-200" />
          <h1 className="font-bold text-zinc-900">{id ? "Edit Event" : "Create New Event"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={!name || !slug}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={!name || !slug} className="bg-pink-600 hover:bg-pink-700">
            <Sparkles className="mr-2 h-4 w-4" /> Publish Now
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-[1fr,400px]">
        <main className="p-8 h-[calc(100vh-64px)] overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-3xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="general" className="gap-2"><Layout className="h-4 w-4" /> General</TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2"><Palette className="h-4 w-4" /> Appearance</TabsTrigger>
              <TabsTrigger value="assets" className="gap-2"><Music className="h-4 w-4" /> Assets</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-0">
              <Card>
                <CardHeader><CardTitle className="text-sm">Core Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Name</Label>
                      <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mother's Day 2024" />
                    </div>
                    <div className="space-y-2">
                      <Label>URL Slug</Label>
                      <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. mothers-day" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tier</Label>
                      <Select value={tier.toString()} onValueChange={v => setTier(parseInt(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Tier 1 (Spotlight Peak)</SelectItem>
                          <SelectItem value="2">Tier 2 (Major)</SelectItem>
                          <SelectItem value="3">Tier 3 (Contextual)</SelectItem>
                          <SelectItem value="4">Tier 4 (Minor)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kind</Label>
                      <Select value={kind} onValueChange={setKind}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recurring">Recurring (Annual)</SelectItem>
                          <SelectItem value="one-time">One-Time</SelectItem>
                          <SelectItem value="evergreen">Evergreen (Always Active)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming (Hidden)</SelectItem>
                          <SelectItem value="active">Active (Visible)</SelectItem>
                          <SelectItem value="ended">Ended (Archived)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Event Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !eventDate && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={eventDate} onSelect={(date) => date && setEventDate(date)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Launch Date (Show on site)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !launchDate && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {launchDate ? format(launchDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={launchDate} onSelect={(date) => date && setLaunchDate(date)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {kind !== "evergreen" && (
                      <div className="space-y-2">
                        <Label>End Date (Archive)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={endDate} onSelect={(date) => date && setEndDate(date)} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Platform Branding</CardTitle>
                  <CardDescription>Customize the landing page appearance (Hero section, buttons, fonts).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Branding Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Base Color (Background)</Label>
                      <div className="flex gap-2">
                        <Input type="color" className="p-1 h-9 w-12" value={theme.baseColor} onChange={e => setTheme({ ...theme, baseColor: e.target.value })} />
                        <Input value={theme.baseColor} onChange={e => setTheme({ ...theme, baseColor: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Glow Color (Radial Halo)</Label>
                      <div className="flex gap-2">
                        <Input type="color" className="p-1 h-9 w-12" value={theme.glowColor} onChange={e => setTheme({ ...theme, glowColor: e.target.value })} />
                        <Input value={theme.glowColor} onChange={e => setTheme({ ...theme, glowColor: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Theme Type</Label>
                      <Select value={theme.type || "light"} onValueChange={(val) => setTheme({ ...theme, type: val })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light (Dark Text)</SelectItem>
                          <SelectItem value="dark">Dark (Light Text)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      {/* Spacer */}
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Background Pattern</Label>
                      <Select value={theme.backgroundPattern || "sparkles"} onValueChange={(val) => setTheme({ ...theme, backgroundPattern: val })}>
                        <SelectTrigger><SelectValue placeholder="Select a pattern" /></SelectTrigger>
                        <SelectContent>
                          {allPatterns?.map((pattern) => (
                            <SelectItem key={pattern._id} value={pattern.id}>
                              {pattern.name} {pattern.emojis?.[0]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Headline Font</Label>
                      <Select value={theme.headlineFont || HEADLINE_FONTS[0]} onValueChange={(val) => setTheme({ ...theme, headlineFont: val })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {HEADLINE_FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Body Font</Label>
                      <Select value={theme.bodyFont || BODY_FONTS[0]} onValueChange={(val) => setTheme({ ...theme, bodyFont: val })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BODY_FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Text Color Mode</Label>
                      <Select value={theme.textMode || "auto"} onValueChange={(val) => setTheme({ ...theme, textMode: val })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto (from Theme Type)</SelectItem>
                          <SelectItem value="light">Always Light</SelectItem>
                          <SelectItem value="dark">Always Dark</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 items-center mt-2">
                        <div className="w-8 h-8 rounded border shrink-0" style={{ backgroundColor: textColor }} />
                        <span className="text-[10px] text-zinc-500">Current Preview</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Hero Slides Content</CardTitle>
                  <CardDescription>Customize the text for each of the 3 rotating slides.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Global Settings */}
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                    <div className="space-y-2">
                      <Label>CTA Button Text</Label>
                      <Input value={theme.ctaText} onChange={e => setTheme({ ...theme, ctaText: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Urgency Badge Text</Label>
                      <Input value={theme.urgencyText} onChange={e => setTheme({ ...theme, urgencyText: e.target.value })} placeholder="e.g. {countdown} left!" />
                      <p className="text-[10px] text-zinc-500">Variables: {"{name}"}, {"{date}"}, {"{countdown}"}</p>
                    </div>
                  </div>

                  {/* Slide 1 */}
                  <div className="space-y-4">
                    <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Slide 1 (Main)</Label>
                    <div className="space-y-2">
                      <Label>Headline</Label>
                      <Input value={theme.headline} onChange={e => setTheme({ ...theme, headline: e.target.value })} placeholder="Default: Celebrate [Event]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Subheadline</Label>
                      <Textarea value={theme.subheadline} onChange={e => setTheme({ ...theme, subheadline: e.target.value })} placeholder="Default: Create a beautiful personalized card..." />
                    </div>
                  </div>

                  {/* Slide 2 */}
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Slide 2</Label>
                    <div className="space-y-2">
                      <Label>Headline</Label>
                      <Input value={theme.headline_2 || ""} onChange={e => setTheme({ ...theme, headline_2: e.target.value })} placeholder="Default: Your Photos. Your Words..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Subheadline</Label>
                      <Textarea value={theme.subheadline_2 || ""} onChange={e => setTheme({ ...theme, subheadline_2: e.target.value })} placeholder="Default: Add your memories and heartfelt message..." />
                    </div>
                  </div>

                  {/* Slide 3 */}
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Slide 3</Label>
                    <div className="space-y-2">
                      <Label>Headline</Label>
                      <Input value={theme.headline_3 || ""} onChange={e => setTheme({ ...theme, headline_3: e.target.value })} placeholder="Default: Share a Link They'll Never Forget" />
                    </div>
                    <div className="space-y-2">
                      <Label>Subheadline</Label>
                      <Textarea value={theme.subheadline_3 || ""} onChange={e => setTheme({ ...theme, subheadline_3: e.target.value })} placeholder="Default: Beautiful moments, shared instantly..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="space-y-6 mt-0">
              <div className="space-y-8">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Themes</h3>
                  <ThemePresetPicker
                    selectedIds={theme.allowedThemeIds || []}
                    onToggle={(id) => {
                      const current = theme.allowedThemeIds || [];
                      const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
                      setTheme({ ...theme, allowedThemeIds: next });
                    }}
                  />
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Fonts</h3>
                  <FontPicker
                    selectedIds={theme.allowedFontIds || []}
                    onToggle={(id) => {
                      const current = theme.allowedFontIds || [];
                      const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
                      setTheme({ ...theme, allowedFontIds: next });
                    }}
                  />
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Characters</h3>
                  <CharacterPicker
                    selectedIds={theme.characterIds || []}
                    onToggle={(id) => {
                      const current = theme.characterIds || [];
                      const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
                      setTheme({ ...theme, characterIds: next });
                    }}
                  />
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Music Tracks</h3>
                  <MusicPicker
                    selectedIds={theme.musicTrackIds || []}
                    onToggle={(id) => {
                      const current = theme.musicTrackIds || [];
                      const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
                      setTheme({ ...theme, musicTrackIds: next });
                    }}
                  />
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Background Patterns</h3>
                  <PatternPicker
                    selectedIds={theme.patternIds || []}
                    onToggle={(id) => {
                      const current = theme.patternIds || [];
                      const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
                      setTheme({ ...theme, patternIds: next });
                    }}
                  />
                </section>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {activeTab !== "assets" && (
          <aside>
            <div className="sticky top-6 space-y-4 pr-6">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Live Preview</Label>
                <div className="flex bg-zinc-100 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewMode("mobile")}
                    className={`p-1.5 rounded-md transition-all ${previewMode === "mobile" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode("desktop")}
                    className={`p-1.5 rounded-md transition-all ${previewMode === "desktop" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400 hover:text-zinc-600"}`}
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-center relative group">
                <div
                  className="relative overflow-hidden shadow-2xl border-black/5 ring-1 ring-black/5 bg-white transition-all duration-300 rounded-xl"
                  style={{
                    width: previewMode === "mobile" ? "275px" : "360px",
                    height: previewMode === "mobile" ? "600px" : "300px",
                  }}
                >
                  <div
                    style={{
                      width: previewMode === "mobile" ? "390px" : "1280px",
                      height: previewMode === "mobile" ? "844px" : "1066px",
                      transform: `scale(${previewMode === "mobile" ? 0.705 : 0.281})`,
                      transformOrigin: "top left",
                    }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <EventHero
                      theme={theme}
                      isScaled={true}
                    >
                      {/* Exact mirror of Homepage hero content */}
                      <div className="w-full relative h-full flex items-center justify-center">
                        <AnimatePresence initial={false} mode="wait">
                          <motion.div
                            key={currentPreviewSlide}
                            initial={{ opacity: 0, scale: 0.97, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.03, y: -12 }}
                            transition={CONTENT_TRANSITION}
                            className="absolute inset-0 flex flex-col items-center justify-center px-6"
                            style={{ zIndex: 30 }}
                          >
                            <div className={`w-full max-w-6xl mx-auto text-center flex flex-col items-center ${previewMode === "mobile" ? "space-y-6" : "space-y-10"}`}>
                              {activeSlide?.badge && (
                                <motion.div
                                  className="inline-block"
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ ...CONTENT_TRANSITION, delay: 0.0 }}
                                >
                                  <Badge
                                    className="text-xs px-5 py-2 rounded-full border-0 whitespace-nowrap shadow-sm"
                                    style={{
                                      background: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)",
                                      color: "inherit",
                                      fontFamily: theme.bodyFont
                                    }}
                                  >
                                    {activeSlide.badge}
                                  </Badge>
                                </motion.div>
                              )}

                              <div className={`flex flex-col items-center ${previewMode === "mobile" ? "space-y-4" : "space-y-6"}`}>
                                <motion.h1
                                  className={`font-bold leading-[1.1] tracking-tight text-center ${previewMode === "mobile" ? "text-3xl" : "text-8xl"}`}
                                  style={{ fontFamily: theme.headlineFont }}
                                  initial={{ opacity: 0, y: 16 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ ...CONTENT_TRANSITION, delay: 0.1 }}
                                >
                                  {activeSlide?.headline}
                                </motion.h1>

                                <motion.p
                                  className={`opacity-90 max-w-2xl mx-auto leading-relaxed text-center ${previewMode === "mobile" ? "text-base" : "text-2xl"}`}
                                  style={{ fontFamily: theme.bodyFont }}
                                  initial={{ opacity: 0, y: 16 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ ...CONTENT_TRANSITION, delay: 0.15 }}
                                >
                                  {activeSlide?.subheadline}
                                </motion.p>
                              </div>

                              <motion.div
                                className={`flex justify-center ${previewMode === "mobile" ? "pt-4" : "pt-8"}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...CONTENT_TRANSITION, delay: 0.2 }}
                              >
                                <Button
                                  size="lg"
                                  className="text-lg px-12 py-8 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-0 pulse-hover h-auto"
                                  style={{
                                    backgroundColor: theme.primary || theme.glowColor || "#000",
                                    color: theme.textMode === "light" ? "#FFFFFF" :
                                      theme.textMode === "dark" ? "#000000" :
                                        getContrastColor(theme.primary || theme.glowColor || "#000")
                                  }}
                                >
                                  <Sparkles className="mr-2 h-6 w-6" />
                                  {theme.ctaText || "Create Now"} ✨
                                </Button>
                              </motion.div>
                            </div>
                          </motion.div>
                        </AnimatePresence>

                        {/* Navigation Arrows (inside preview, glassmorphism) */}
                        {previewSlides.length > 1 && (
                          <>
                            <motion.button
                              onClick={prevPreviewSlide}
                              whileTap={TAP_SCALE}
                              className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
                              aria-label="Previous slide"
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </motion.button>
                            <motion.button
                              onClick={nextPreviewSlide}
                              whileTap={TAP_SCALE}
                              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
                              aria-label="Next slide"
                            >
                              <ChevronRight className="w-6 h-6" />
                            </motion.button>
                          </>
                        )}

                        {/* Slide Indicators with layoutId */}
                        {previewSlides.length > 1 && (
                          <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2">
                            {previewSlides.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentPreviewSlide(i)}
                                className="relative w-2 h-2 rounded-full transition-all bg-white/40 hover:bg-white/60"
                                style={{ width: i === currentPreviewSlide ? 24 : 8 }}
                                aria-label={`Go to slide ${i + 1}`}
                              >
                                {i === currentPreviewSlide && (
                                  <motion.div
                                    layoutId="admin-slide-indicator"
                                    className="absolute inset-0 rounded-full bg-white"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </EventHero>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 text-center italic">Click arrows or indicators to navigate slides</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default EventEditor;
