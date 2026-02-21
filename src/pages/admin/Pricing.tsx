import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Type, Music as MusicIcon, Sparkles, User, Image as ImageIcon, Save, Download, Layers, ShieldOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PricingPage() {
    const { toast } = useToast();

    // ── Queries ──
    const themes = useQuery(api.themes.list) || [];
    const fonts = useQuery(api.fonts.list) || [];
    const music = useQuery(api.music.list) || [];
    const patterns = useQuery(api.patterns.list) || [];
    const characters = useQuery(api.characters.list) || [];
    const globalPricing = useQuery(api.pricing.list) || [];

    // ── Mutations ──
    const setGlobalPrice = useMutation(api.pricing.set);
    const updateTheme = useMutation(api.themes.update);
    const updateFont = useMutation(api.fonts.update);
    const updateMusic = useMutation(api.music.update);
    const updatePattern = useMutation(api.patterns.update);
    const updateCharacter = useMutation(api.characters.update);

    // ── Local State ──
    const [prices, setPrices] = useState<Record<string, { ngn: number, usd: number }>>({});
    const [premiumStatus, setPremiumStatus] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initialize local state from queries
    useEffect(() => {
        if (!globalPricing.length && !themes.length && !fonts.length) return;

        setPrices(prev => {
            const next: Record<string, { ngn: number, usd: number }> = { ...prev };
            globalPricing.forEach(gp => {
                if (next[gp.category] === undefined) next[gp.category] = gp.prices;
            });
            return next;
        });

        setPremiumStatus(prev => {
            const next: Record<string, boolean> = { ...prev };
            let changed = false;
            themes.forEach(t => {
                const key = `theme-${t._id}`;
                if (next[key] === undefined) { next[key] = !!t.isPremium; changed = true; }
            });
            fonts.forEach(f => {
                const key = `font-${f._id}`;
                if (next[key] === undefined) { next[key] = !!f.isPremium; changed = true; }
            });
            music.forEach(m => {
                const key = `music-${m._id}`;
                if (next[key] === undefined) { next[key] = !!m.isPremium; changed = true; }
            });
            patterns.forEach(p => {
                const key = `pattern-${p._id}`;
                if (next[key] === undefined) { next[key] = !!p.isPremium; changed = true; }
            });
            characters.forEach(c => {
                const key = `char-${c._id}`;
                if (next[key] === undefined) { next[key] = !!c.isPremium; changed = true; }
            });
            return changed ? next : prev;
        });
    }, [globalPricing, themes, fonts, music, patterns, characters]);

    const safeMutation = async (mutation: any, args: any, successTitle: string) => {
        try {
            await mutation(args);
            if (successTitle) toast({ title: successTitle });
            return true;
        } catch (error: any) {
            console.error(error);
            let msg = error.message || "An unexpected error occurred";

            // Extract core error message from Convex noise
            const serverErrorMatch = msg.match(/Server Error (?:Uncaught Error: )?(.*?)(?: at handler|$)/);
            if (serverErrorMatch) {
                msg = serverErrorMatch[1];
            } else {
                msg = msg.replace("ConvexError: ", "").replace("Uncaught Error: ", "");
            }

            // Cleanup trailing periods and whitespace
            msg = msg.trim().replace(/\.$/, "");

            // Sentence case
            msg = msg.charAt(0).toUpperCase() + msg.slice(1);

            toast({
                title: "Action failed",
                description: msg,
                variant: "destructive"
            });
            return false;
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Save Category Prices
            for (const [cat, matrix] of Object.entries(prices)) {
                await safeMutation(setGlobalPrice, { category: cat, prices: matrix }, "");
            }

            // 2. Save Individual Premium Status
            for (const [key, isPremium] of Object.entries(premiumStatus)) {
                const [type, id] = key.split('-');
                if (type === 'theme') await updateTheme({ id: id as any, isPremium });
                if (type === 'font') await updateFont({ id: id as any, isPremium });
                if (type === 'music') await updateMusic({ id: id as any, isPremium });
                if (type === 'pattern') await updatePattern({ id: id as any, isPremium });
                if (type === 'char') await updateCharacter({ id: id as any, isPremium });
            }

            toast({ title: "Pricing and asset configuration saved" });
        } catch (error) {
            console.error(error);
            toast({ title: "Failed to save pricing", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const categories = [
        { id: 'base', label: 'Base Card', icon: Sparkles },
        { id: 'themes', label: 'Themes', icon: Sparkles },
        { id: 'fonts', label: 'Fonts', icon: Type },
        { id: 'music', label: 'Music', icon: MusicIcon },
        { id: 'patterns', label: 'Patterns', icon: ImageIcon },
        { id: 'characters', label: 'Characters', icon: User },
        { id: 'customLink', label: 'Custom Link', icon: Sparkles },
        { id: 'removeWatermark', label: 'Remove Watermark', icon: ShieldOff },
        { id: 'hdDownload', label: 'HD Download', icon: Download },
        { id: 'extraSlide', label: 'Extra Slide (per slide)', icon: Layers },
    ];

    if (!themes.length && !fonts.length) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 bg-white min-h-screen text-zinc-950">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                        <DollarSign className="h-8 w-8 text-emerald-600" /> Monetization & Pricing
                    </h1>
                    <p className="text-zinc-500 text-sm">Control global asset prices and premium eligibility.</p>
                </div>
                <Button onClick={handleSave} className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Global Prices */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-zinc-200">
                        <CardHeader>
                            <CardTitle className="text-lg">Price Matrix</CardTitle>
                            <CardDescription>Localized pricing for Nigerian and Global users.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {categories.map((cat) => (
                                <div key={cat.id} className="space-y-3">
                                    <Label className="flex items-center gap-2 text-zinc-900 font-semibold border-b pb-1">
                                        <cat.icon className="h-4 w-4" /> {cat.label}
                                    </Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase text-zinc-500">Nigeria (₦)</Label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 text-xs text-muted-foreground mr-1">₦</span>
                                                <Input
                                                    type="number"
                                                    className="pl-6 h-8 text-sm"
                                                    value={prices[cat.id]?.ngn ?? 0}
                                                    onChange={(e) => setPrices(prev => ({
                                                        ...prev,
                                                        [cat.id]: { ...(prev[cat.id] || { usd: 0 }), ngn: parseFloat(e.target.value) || 0 }
                                                    }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase text-zinc-500">Global ($)</Label>
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 text-xs text-muted-foreground mr-1">$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="pl-6 h-8 text-sm"
                                                    value={prices[cat.id]?.usd ?? 0}
                                                    onChange={(e) => setPrices(prev => ({
                                                        ...prev,
                                                        [cat.id]: { ...(prev[cat.id] || { ngn: 0 }), usd: parseFloat(e.target.value) || 0 }
                                                    }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Individual Toggles */}
                <div className="lg:col-span-2">
                    <Card className="border-zinc-200">
                        <Tabs defaultValue="fonts" className="w-full">
                            <CardHeader className="pb-0 overflow-hidden">
                                <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent">
                                    <TabsList className="bg-zinc-100 p-1 flex w-max min-w-full">
                                        {categories.filter(c => ['themes', 'fonts', 'music', 'patterns', 'characters'].includes(c.id)).map(cat => (
                                            <TabsTrigger key={cat.id} value={cat.id} className="gap-2 whitespace-nowrap">
                                                <cat.icon className="h-4 w-4" /> {cat.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <TabsContent value="themes" className="mt-0">
                                    <AssetTable items={themes} type="theme" premiumStatus={premiumStatus} setPremiumStatus={setPremiumStatus} />
                                </TabsContent>
                                <TabsContent value="fonts" className="mt-0">
                                    <AssetTable items={fonts} type="font" premiumStatus={premiumStatus} setPremiumStatus={setPremiumStatus} />
                                </TabsContent>
                                <TabsContent value="music" className="mt-0">
                                    <AssetTable items={music} type="music" premiumStatus={premiumStatus} setPremiumStatus={setPremiumStatus} />
                                </TabsContent>
                                <TabsContent value="patterns" className="mt-0">
                                    <AssetTable items={patterns} type="pattern" premiumStatus={premiumStatus} setPremiumStatus={setPremiumStatus} />
                                </TabsContent>
                                <TabsContent value="characters" className="mt-0">
                                    <AssetTable items={characters} type="char" premiumStatus={premiumStatus} setPremiumStatus={setPremiumStatus} />
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>
                </div>
            </div>
        </div>
    );
}

import { Play, Pause } from "lucide-react";

function AssetTable({ items, type, premiumStatus, setPremiumStatus }: any) {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    const togglePlay = (track: any) => {
        if (playingId === track._id) {
            audio?.pause();
            setPlayingId(null);
        } else {
            audio?.pause();
            const newAudio = new Audio(track.url);
            newAudio.play();
            newAudio.onended = () => setPlayingId(null);
            setAudio(newAudio);
            setPlayingId(track._id);
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => audio?.pause();
    }, [audio]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Asset Name</TableHead>
                    <TableHead className="w-[100px] text-center">Premium?</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item: any) => (
                    <TableRow key={item._id}>
                        <TableCell className="w-[80px]">
                            {type === 'font' && (
                                <span className="text-lg" style={{ fontFamily: item.fontFamily }}>
                                    Aa
                                </span>
                            )}
                            {type === 'theme' && (
                                <div className="flex -space-x-2">
                                    <div
                                        className="h-6 w-6 rounded-full border border-zinc-200"
                                        style={{ backgroundColor: item.baseColor }}
                                        title={`Base: ${item.baseColor}`}
                                    />
                                    <div
                                        className="h-6 w-6 rounded-full border border-zinc-200 shadow-sm"
                                        style={{ backgroundColor: item.glowColor }}
                                        title={`Glow: ${item.glowColor}`}
                                    />
                                </div>
                            )}
                            {type === 'pattern' && (
                                <span className="text-xl">{item.emojis?.[0]}</span>
                            )}
                            {type === 'music' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-zinc-100"
                                    onClick={() => togglePlay(item)}
                                >
                                    {playingId === item._id ? (
                                        <Pause className="h-4 w-4 text-emerald-600" />
                                    ) : (
                                        <Play className="h-4 w-4 text-zinc-400" />
                                    )}
                                </Button>
                            )}
                            {type === 'char' && (
                                <div className="h-10 w-10 rounded-md bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center">
                                    <img src={item.url} alt={item.name} className="h-8 w-8 object-contain" />
                                </div>
                            )}
                        </TableCell>
                        <TableCell className="font-medium text-zinc-700">
                            <span style={type === 'font' ? { fontFamily: item.fontFamily } : {}}>
                                {item.name}
                            </span>
                        </TableCell>
                        <TableCell className="text-center">
                            <Checkbox
                                checked={!!premiumStatus[`${type}-${item._id}`]}
                                onCheckedChange={(checked) => {
                                    setPremiumStatus((prev: any) => ({ ...prev, [`${type}-${item._id}`]: !!checked }));
                                }}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
