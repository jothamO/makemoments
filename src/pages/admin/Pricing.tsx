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
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { Loader2, DollarSign, Type, Music as MusicIcon, Sparkles, User, Image as ImageIcon, Save, Download, Layers, ShieldOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { GlobalLoader } from "@/components/ui/GlobalLoader";

export default function PricingPage() {
    const { toast } = useToast();
    const { token } = useAuth();
    const { safeMutation } = useSafeMutation();

    // ── Queries ──
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const themes = useQuery(api.themes.list, { token: token || undefined }) || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fonts = useQuery(api.fonts.list, { token: token || undefined }) || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const music = useQuery(api.music.list, { token: token || undefined }) || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const patterns = useQuery(api.patterns.list, { token: token || undefined }) || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const characters = useQuery(api.characters.list, { token: token || undefined }) || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const globalPricing = useQuery(api.pricing.list, { token: token || undefined }) || [];

    // ── Mutations ──
    const bulkUpdatePricing = useMutation(api.pricing.bulkUpdate);

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
                // eslint-disable-next-line security/detect-object-injection
                if (next[key] === undefined) { next[key] = !!t.isPremium; changed = true; }
            });
            fonts.forEach(f => {
                const key = `font-${f._id}`;
                // eslint-disable-next-line security/detect-object-injection
                if (next[key] === undefined) { next[key] = !!f.isPremium; changed = true; }
            });
            music.forEach(m => {
                const key = `music-${m._id}`;
                // eslint-disable-next-line security/detect-object-injection
                if (next[key] === undefined) { next[key] = !!m.isPremium; changed = true; }
            });
            patterns.forEach(p => {
                const key = `pattern-${p._id}`;
                // eslint-disable-next-line security/detect-object-injection
                if (next[key] === undefined) { next[key] = !!p.isPremium; changed = true; }
            });
            characters.forEach(c => {
                const key = `char-${c._id}`;
                // eslint-disable-next-line security/detect-object-injection
                if (next[key] === undefined) { next[key] = !!c.isPremium; changed = true; }
            });
            return changed ? next : prev;
        });
    }, [globalPricing, themes, fonts, music, patterns, characters]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const categoryPrices = Object.entries(prices).map(([category, prices]) => ({
                category,
                prices
            }));

            const assetPremiumStatus = Object.entries(premiumStatus).map(([key, isPremium]) => {
                const [typePrefix, id] = key.split('-');
                let type: "theme" | "font" | "music" | "pattern" | "character" = "theme";
                if (typePrefix === 'font') type = "font";
                if (typePrefix === 'music') type = "music";
                if (typePrefix === 'pattern') type = "pattern";
                if (typePrefix === 'char') type = "character";
                return { type, id, isPremium };
            });

            await safeMutation(bulkUpdatePricing, {
                token: token || undefined,
                categoryPrices,
                assetPremiumStatus
            }, "");

            toast({ title: "Config Saved" });
        } catch (error) {
            console.error(error);
            toast({ title: "Save Failed", variant: "destructive" });
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
        { id: 'multiImage', label: '3 Character Unlock', icon: ImageIcon },
        { id: 'removeWatermark', label: 'Remove Watermark', icon: ShieldOff },
        { id: 'hdDownload', label: 'HD Download', icon: Download },
        { id: 'extraSlide', label: 'Extra Slide (per slide)', icon: Layers },
    ];

    // Check if any of the main data sources are still loading (undefined)
    const isLoading = themes === undefined || fonts === undefined || music === undefined || patterns === undefined || characters === undefined || globalPricing === undefined;

    if (isLoading) {
        return <GlobalLoader transparent />;
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
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AssetTable({ items, type, premiumStatus, setPremiumStatus }: any) {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden sm:block">
                <Table>
                    <TableHeader>
                        <TableRow className="border-zinc-200">
                            <TableHead className="text-zinc-500">Preview</TableHead>
                            <TableHead className="text-zinc-500">Asset Name</TableHead>
                            <TableHead className="w-[100px] text-center text-zinc-500">Premium?</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {items.map((item: any) => (
                            <TableRow key={item._id} className="border-zinc-100 hover:bg-zinc-50 transition-colors">
                                <TableCell className="w-[80px]">
                                    {type === 'font' && (
                                        <span className="text-lg" style={{ fontFamily: item.fontFamily }}>
                                            Aa
                                        </span>
                                    )}
                                    {type === 'theme' && (
                                        <div className="flex -space-x-2">
                                            <div
                                                className="h-6 w-6 rounded-full border border-zinc-200 shadow-sm"
                                                style={{ backgroundColor: item.baseColor }}
                                                title={`Base: ${item.baseColor}`}
                                            />
                                            <div
                                                className="h-6 w-6 rounded-full border border-zinc-200 shadow-sm ring-1 ring-white"
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
                                            className="h-8 w-8 hover:bg-rose-50 text-zinc-400 hover:text-rose-600"
                                            onClick={() => togglePlay(item)}
                                        >
                                            {playingId === item._id ? (
                                                <Pause className="h-4 w-4 fill-current" />
                                            ) : (
                                                <Play className="h-4 w-4 fill-current" />
                                            )}
                                        </Button>
                                    )}
                                    {type === 'char' && (
                                        <div className="h-10 w-10 rounded-md bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center">
                                            <img src={item.url} alt={item.name} className="h-8 w-8 object-contain" />
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium text-zinc-900">
                                    <div className="flex items-center gap-2">
                                        <span style={type === 'font' ? { fontFamily: item.fontFamily } : {}}>
                                            {item.name}
                                        </span>
                                        {!!premiumStatus[`${type}-${item._id}`] && (
                                            <DollarSign className="h-3 w-3 text-emerald-600" />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Checkbox
                                        checked={!!premiumStatus[`${type}-${item._id}`]}
                                        onCheckedChange={(checked) => {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            setPremiumStatus((prev: any) => ({ ...prev, [`${type}-${item._id}`]: !!checked }));
                                        }}
                                        className="data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900 accent-zinc-900"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-zinc-100 -mx-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {items.map((item: any) => (
                    <div key={item._id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                                {type === 'font' && (
                                    <span className="text-sm font-bold" style={{ fontFamily: item.fontFamily }}>Aa</span>
                                )}
                                {type === 'theme' && (
                                    <div className="flex -space-x-1.5">
                                        <div className="h-4 w-4 rounded-full border border-zinc-200" style={{ backgroundColor: item.baseColor }} />
                                        <div className="h-4 w-4 rounded-full border border-zinc-200 ring-1 ring-white" style={{ backgroundColor: item.glowColor }} />
                                    </div>
                                )}
                                {type === 'pattern' && (
                                    <span className="text-xl">{item.emojis?.[0]}</span>
                                )}
                                {type === 'music' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-8 w-8 rounded-full",
                                            playingId === item._id ? "text-rose-600 bg-rose-50" : "text-zinc-400"
                                        )}
                                        onClick={() => togglePlay(item)}
                                    >
                                        {playingId === item._id ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                                    </Button>
                                )}
                                {type === 'char' && (
                                    <img src={item.url} alt={item.name} className="h-8 w-8 object-contain" />
                                )}
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-zinc-900 leading-tight flex items-center gap-1.5" style={type === 'font' ? { fontFamily: item.fontFamily } : {}}>
                                    {item.name}
                                    {!!premiumStatus[`${type}-${item._id}`] && (
                                        <DollarSign className="h-3 w-3 text-emerald-600" />
                                    )}
                                </p>
                                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{type}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100">
                            <Label htmlFor={`mobile-premium-${item._id}`} className="text-[10px] font-bold text-zinc-500 uppercase">Premium</Label>
                            <Checkbox
                                id={`mobile-premium-${item._id}`}
                                checked={!!premiumStatus[`${type}-${item._id}`]}
                                onCheckedChange={(checked) => {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    setPremiumStatus((prev: any) => ({ ...prev, [`${type}-${item._id}`]: !!checked }));
                                }}
                                className="data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900 h-4 w-4 accent-zinc-900"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
