import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette, Music, Layout, Save, Globe, Sparkles, Smartphone, Monitor, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { CharacterPicker, MusicPicker, ThemePresetPicker, FontPicker, PatternPicker } from "@/components/admin/GlobalAssetPickers";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { replaceUrgencyVariables } from "@/lib/utils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState("general");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");

  // Date states
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [launchDate, setLaunchDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 2592000000));

  const [theme, setTheme] = useState<any>({
    primary: "#E2F0E9", secondary: "#C5E3D5", accent: "#2D3436",
    bgGradientStart: "#E2F0E9", bgGradientEnd: "#C5E3D5",
    textDark: "#18181B", textLight: "#FFFFFF",
    headlineFont: "Playfair Display", bodyFont: "Montserrat",
    headline: "", subheadline: "", ctaText: "Create Now", urgencyText: "",
    characterIds: [], musicIds: [], patternIds: [], allowedThemeIds: []
  });

  useEffect(() => {
    if (event) {
      setName(event.name);
      setSlug(event.slug);
      setStatus(event.status);
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
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded border shrink-0" style={{ backgroundColor: theme.primary }} />
                        <Input value={theme.primary} onChange={e => setTheme({ ...theme, primary: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded border shrink-0" style={{ backgroundColor: theme.secondary }} />
                        <Input value={theme.secondary} onChange={e => setTheme({ ...theme, secondary: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded border shrink-0" style={{ backgroundColor: theme.accent }} />
                        <Input value={theme.accent} onChange={e => setTheme({ ...theme, accent: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Background Gradient Start</Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded border shrink-0" style={{ backgroundColor: theme.bgGradientStart }} />
                        <Input value={theme.bgGradientStart} onChange={e => setTheme({ ...theme, bgGradientStart: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Background Gradient End</Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded border shrink-0" style={{ backgroundColor: theme.bgGradientEnd }} />
                        <Input value={theme.bgGradientEnd} onChange={e => setTheme({ ...theme, bgGradientEnd: e.target.value })} />
                      </div>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Background Pattern</Label>
                      <Select value={theme.backgroundPattern || "sparkles"} onValueChange={(val) => setTheme({ ...theme, backgroundPattern: val })}>
                        <SelectTrigger><SelectValue placeholder="Select a pattern" /></SelectTrigger>
                        <SelectContent>
                          {allPatterns?.map((pattern) => (
                            <SelectItem key={pattern._id} value={pattern.id}>
                              {pattern.name} {pattern.emoji}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Headline Font</Label>
                      <Input value={theme.headlineFont} onChange={e => setTheme({ ...theme, headlineFont: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Body Font</Label>
                      <Input value={theme.bodyFont} onChange={e => setTheme({ ...theme, bodyFont: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Text Dark Color</Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded border shrink-0" style={{ backgroundColor: theme.textDark }} />
                        <Input value={theme.textDark} onChange={e => setTheme({ ...theme, textDark: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Text Light Color</Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded border shrink-0" style={{ backgroundColor: theme.textLight }} />
                        <Input value={theme.textLight} onChange={e => setTheme({ ...theme, textLight: e.target.value })} />
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
                    height: previewMode === "mobile" ? "600px" : "225px",
                  }}
                >
                  <div
                    style={{
                      width: previewMode === "mobile" ? "390px" : "1280px",
                      height: previewMode === "mobile" ? "844px" : "800px",
                      transform: `scale(${previewMode === "mobile" ? 0.705 : 0.281})`,
                      transformOrigin: "top left",
                    }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <div
                      className="flex-1 flex flex-col items-center justify-center p-8 text-center relative"
                      style={{ background: `linear-gradient(135deg, ${theme.bgGradientStart}, ${theme.bgGradientEnd})` }}
                    >
                      {/* Background Pattern */}
                      <BackgroundPattern
                        pattern={theme.backgroundPattern || "sparkles"}
                        // Fetch the pattern details to pass the correct type/emoji
                        type={(allPatterns?.find(p => p.id === theme.backgroundPattern) as any)?.type}
                        customEmojis={(allPatterns?.find(p => p.id === theme.backgroundPattern) as any)?.emoji ? (allPatterns?.find(p => p.id === theme.backgroundPattern) as any)?.emoji.split(",") : undefined}
                      />

                      {/* Decorative circles */}
                      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20 pointer-events-none" style={{ background: theme.accent }} />
                      <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-15 pointer-events-none" style={{ background: theme.secondary }} />

                      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl mx-auto mt-20">
                        <div className="inline-block mb-8">
                          <div
                            className="text-sm px-6 py-2 rounded-full border-0 font-medium whitespace-nowrap shadow-sm backdrop-blur-md"
                            style={{ background: "rgba(255,255,255,0.25)", color: theme.textLight }}
                          >
                            {activeSlide.badge}
                          </div>
                        </div>

                        <h1
                          className={cn("font-bold mb-6 leading-tight px-4 drop-shadow-sm", previewMode === "mobile" ? "text-4xl" : "text-6xl")}
                          style={{ fontFamily: theme.headlineFont, color: theme.textLight }}
                        >
                          {activeSlide.headline}
                        </h1>

                        <p
                          className={cn("opacity-90 mb-10 px-6 leading-relaxed max-w-2xl drop-shadow-sm", previewMode === "mobile" ? "text-base" : "text-xl")}
                          style={{ fontFamily: theme.bodyFont, color: theme.textLight }}
                        >
                          {activeSlide.subheadline}
                        </p>

                        <Button
                          className={cn("rounded-full font-bold shadow-2xl transition-transform active:scale-95 border-0 hover:opacity-90", previewMode === "mobile" ? "px-8 py-6 text-lg" : "px-10 py-8 text-xl")}
                          style={{
                            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                            color: theme.textLight
                          }}
                        >
                          <Sparkles className={cn("mr-3", previewMode === "mobile" ? "h-5 w-5" : "h-6 w-6")} />
                          {theme.ctaText || "Create Now"} ✨
                        </Button>
                      </div>

                      {/* Slide Indicators inside Preview */}
                      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-3 z-20">
                        {previewSlides.map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-full transition-all shadow-sm ${i === currentPreviewSlide ? "bg-white w-8" : "bg-white/40"}`}
                            style={{ height: "8px", width: i === currentPreviewSlide ? "32px" : "8px" }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Arrows (Outside) */}
                <button
                  onClick={prevPreviewSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="p-2 rounded-full bg-white shadow-md border hover:bg-zinc-50"><ChevronLeft className="h-4 w-4" /></div>
                </button>
                <button
                  onClick={nextPreviewSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="p-2 rounded-full bg-white shadow-md border hover:bg-zinc-50"><ChevronRight className="h-4 w-4" /></div>
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 text-center italic">Hover preview to navigate slides</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default EventEditor;
