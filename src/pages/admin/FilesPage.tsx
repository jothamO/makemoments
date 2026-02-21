import { useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, Music as MusicIcon, Sparkles, Type, Upload, Loader2, User, X, Image as ImageIcon, DollarSign, Play } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function hexToRgba(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const slugify = (text: string) => text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function FilesPage() {
    const { toast } = useToast();

    // ── Queries ──
    const themes = useQuery(api.themes.list) || [];
    const fonts = useQuery(api.fonts.list) || [];
    const music = useQuery(api.music.list) || [];
    const patterns = useQuery(api.patterns.list) || [];
    const characters = useQuery(api.characters.list) || [];
    const globalPricing = useQuery(api.pricing.list) || [];

    // ── Mutations ──
    const createTheme = useMutation(api.themes.create);
    const updateTheme = useMutation(api.themes.update);
    const removeTheme = useMutation(api.themes.remove);
    const updateFont = useMutation(api.fonts.update);
    const removeFont = useMutation(api.fonts.remove);
    const generateFontUploadUrl = useMutation(api.fonts.generateUploadUrl);
    const createMusic = useMutation(api.music.create);
    const updateMusic = useMutation(api.music.update);
    const removeMusic = useMutation(api.music.remove);
    const renameMusic = useMutation(api.music.rename);
    const generateUploadUrl = useMutation(api.music.generateUploadUrl);
    const createPattern = useMutation(api.patterns.create);
    const updatePattern = useMutation(api.patterns.update);
    const removePattern = useMutation(api.patterns.remove);
    const createCharacter = useMutation(api.characters.create);
    const updateCharacter = useMutation(api.characters.update);
    const removeCharacter = useMutation(api.characters.remove);
    const generateCharacterUploadUrl = useMutation(api.characters.generateUploadUrl);
    const setGlobalPrice = useMutation(api.pricing.set);

    // ── Refs ──
    const musicFileRef = useRef<HTMLInputElement>(null);
    const fontFileRef = useRef<HTMLInputElement>(null);
    const charFilesRef = useRef<HTMLInputElement>(null);

    // ── State ──
    const [isUploading, setIsUploading] = useState(false);
    const [editingMusicId, setEditingMusicId] = useState<string | null>(null);
    const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
    const [editingFontId, setEditingFontId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
    const [isFontOpen, setIsFontOpen] = useState(false);
    const [isMusicOpen, setIsMusicOpen] = useState(false);
    const [isCharacterOpen, setIsCharacterOpen] = useState(false);
    const [isPatternOpen, setIsPatternOpen] = useState(false);

    const [newTheme, setNewTheme] = useState({
        name: "", baseColor: "#ffffff", glowColor: "#ffffff", type: "light",
        isPremium: false, price: 0
    });
    const [newFont, setNewFont] = useState({ name: "", fontFamily: "", isCustom: false, isPremium: false, price: 0 });
    const [newPattern, setNewPattern] = useState({ id: "", name: "", emojis: "", type: "fall" as any, isPremium: false, price: 0 });
    const [editingPatternId, setEditingPatternId] = useState<string | null>(null);
    const [newMusic, setNewMusic] = useState({ name: "", artist: "", duration: 0, url: "", isPremium: false, price: 0 });
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = (trackId: string, url?: string) => {
        if (!url) return;
        if (playingId === trackId) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play();
                setPlayingId(trackId);
            } else {
                const audio = new Audio(url);
                audio.play();
                audio.onended = () => setPlayingId(null);
                audioRef.current = audio;
                setPlayingId(trackId);
            }
        }
    };


    const getAudioDuration = (file: File): Promise<number> => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = URL.createObjectURL(file);
            audio.onloadedmetadata = () => {
                URL.revokeObjectURL(audio.src);
                resolve(Math.round(audio.duration));
            };
            audio.onerror = () => resolve(0);
        });
    };

    // ── Handlers ──

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

    const handleAddTheme = async () => {
        if (!newTheme.name) return toast({ title: "Name required", variant: "destructive" });

        const payload = {
            name: newTheme.name,
            baseColor: newTheme.baseColor,
            glowColor: newTheme.glowColor,
            type: newTheme.type as any,
            isPremium: newTheme.isPremium,
            price: newTheme.price
        };

        const success = editingThemeId
            ? await safeMutation(updateTheme, { id: editingThemeId as any, ...payload }, "Theme updated")
            : await safeMutation(createTheme, payload, "Theme added");

        if (success) {
            setIsThemeOpen(false);
            setEditingThemeId(null);
            setNewTheme({
                name: "", baseColor: "#ffffff", glowColor: "#ffffff", type: "light",
                isPremium: false, price: 0
            });
        }
    };

    const handleAddFont = async () => {
        if (!newFont.name) return toast({ title: "Name required", variant: "destructive" });

        if (editingFontId) {
            const success = await safeMutation(updateFont, {
                id: editingFontId as any,
                name: newFont.name,
                fontFamily: newFont.fontFamily,
                isPremium: newFont.isPremium,
                price: newFont.price
            }, "Font updated");
            if (success) {
                setIsFontOpen(false);
                setEditingFontId(null);
                setNewFont({ name: "", fontFamily: "", isCustom: false, isPremium: false, price: 0 });
            }
        } else {
            let storageId = undefined;
            if (fontFileRef.current?.files?.[0]) {
                setIsUploading(true);
                try {
                    const postUrl = await generateFontUploadUrl();
                    const result = await fetch(postUrl, {
                        method: "POST",
                        headers: { "Content-Type": fontFileRef.current.files[0].type },
                        body: fontFileRef.current.files[0],
                    });
                    const { storageId: sId } = await result.json();
                    storageId = sId;
                } catch {
                    toast({ title: "Upload failed", variant: "destructive" });
                    setIsUploading(false);
                    return;
                }
            }
            const success = await safeMutation(createFont, { ...newFont, storageId }, "Font added");
            if (success) {
                setIsFontOpen(false);
                setIsUploading(false);
                setNewFont({ name: "", fontFamily: "", isCustom: false, isPremium: false, price: 0 });
            }
        }
    };

    const handleAddPattern = async () => {
        const patternId = newPattern.id?.trim();
        const patternName = newPattern.name?.trim();

        if (!patternId || !patternName) {
            return toast({
                title: "Validation Error",
                description: `Pattern ID and Display Name are both required.`,
                variant: "destructive"
            });
        }

        const emojiArray = newPattern.emojis.split(",").map(e => e.trim()).filter(e => e !== "");

        const payload = {
            id: editingPatternId ? editingPatternId as any : undefined,
            patternId: newPattern.id,
            name: newPattern.name,
            emojis: emojiArray,
            type: newPattern.type as any,
            isPremium: newPattern.isPremium,
            price: newPattern.price
        };

        const success = editingPatternId
            ? await safeMutation(updatePattern, payload, "Pattern updated")
            : await safeMutation(createPattern, { ...payload, id: newPattern.id } as any, "Pattern added");

        if (success) {
            setIsPatternOpen(false);
            setNewPattern({ id: "", name: "", emojis: "", type: "fall", isPremium: false, price: 0 });
            setEditingPatternId(null);
        }
    };

    const handleAddMusic = async () => {
        if (!newMusic.name || !newMusic.artist) return toast({ title: "Name and Artist required", variant: "destructive" });

        if (editingMusicId) {
            const success = await safeMutation(updateMusic, {
                id: editingMusicId as any,
                name: newMusic.name,
                artist: newMusic.artist,
                duration: newMusic.duration,
                isPremium: newMusic.isPremium,
                price: newMusic.price
            }, "Music track updated");
            if (success) {
                setIsMusicOpen(false);
                setEditingMusicId(null);
                setNewMusic({ name: "", artist: "", duration: 0, url: "", isPremium: false, price: 0 });
            }
        } else {
            let storageId = undefined;
            let duration = newMusic.duration;

            if (musicFileRef.current?.files?.[0]) {
                setIsUploading(true);
                const file = musicFileRef.current.files[0];

                if (duration === 0) {
                    duration = await getAudioDuration(file);
                }

                try {
                    const postUrl = await generateUploadUrl();
                    const result = await fetch(postUrl, {
                        method: "POST",
                        headers: { "Content-Type": file.type },
                        body: file,
                    });
                    const { storageId: sId } = await result.json();
                    storageId = sId;
                } catch {
                    toast({ title: "Upload failed", variant: "destructive" });
                    setIsUploading(false);
                    return;
                }
            }

            const success = await safeMutation(createMusic, {
                name: newMusic.name,
                artist: newMusic.artist,
                duration: duration || 180,
                storageId,
                isPremium: newMusic.isPremium,
                price: newMusic.price
            }, "Music track added");

            if (success) {
                setIsMusicOpen(false);
                setIsUploading(false);
                setNewMusic({ name: "", artist: "", duration: 0, url: "", isPremium: false, price: 0 });
            }
        }
    };

    const handleAddCharacters = async () => {
        if (!charFilesRef.current?.files?.length) return;
        setIsUploading(true);
        try {
            for (const file of Array.from(charFilesRef.current.files)) {
                const postUrl = await generateCharacterUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });
                const { storageId } = await result.json();
                await createCharacter({ name: file.name.split(".")[0], storageId });
            }
            toast({ title: "Characters uploaded" });
        } catch (error: any) {
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        }
        setIsUploading(false);
    };

    const handleUpdateCharacter = async () => {
        if (!editingCharacterId || !editingName) return;
        const success = await safeMutation(updateCharacter, { id: editingCharacterId as any, name: editingName }, "Character renamed");
        if (success) {
            setEditingCharacterId(null);
            setEditingName("");
        }
    };

    // ── Render ──

    return (
        <div className="space-y-8 p-6 bg-white min-h-screen text-zinc-950">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Global Assets</h1>
                <p className="text-zinc-500 text-sm">Manage themes, fonts, characters and effects for the editor.</p>
            </div>

            <Tabs defaultValue="themes" className="space-y-6">
                <div className="flex items-center justify-between bg-zinc-50 p-1 rounded-xl border border-zinc-200">
                    <TabsList className="bg-transparent border-none p-0 h-10">
                        <TabsTrigger value="themes" className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-lg px-6 transition-all gap-2"><Sparkles className="h-4 w-4" /> Themes</TabsTrigger>
                        <TabsTrigger value="fonts" className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-lg px-6 transition-all gap-2"><Type className="h-4 w-4" /> Fonts</TabsTrigger>
                        <TabsTrigger value="characters" className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-lg px-6 transition-all gap-2"><User className="h-4 w-4" /> Characters</TabsTrigger>
                        <TabsTrigger value="music" className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-lg px-6 transition-all gap-2"><MusicIcon className="h-4 w-4" /> Music</TabsTrigger>
                        <TabsTrigger value="patterns" className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-lg px-6 transition-all gap-2"><ImageIcon className="h-4 w-4" /> Slide Effects</TabsTrigger>
                    </TabsList>
                </div>

                {/* ── Themes ── */}
                <TabsContent value="themes" className="mt-0">
                    <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 py-4">
                            <div>
                                <CardTitle className="text-lg font-semibold text-white">Editor Themes</CardTitle>
                                <p className="text-xs text-zinc-500 mt-1">Configure the visual identity for slides</p>
                            </div>
                            <Dialog open={isThemeOpen} onOpenChange={(open) => {
                                setIsThemeOpen(open);
                                if (!open) {
                                    setEditingThemeId(null);
                                    setNewTheme({
                                        name: "", baseColor: "#ffffff", glowColor: "#ffffff", type: "light"
                                    });
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Theme</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>{editingThemeId ? "Edit Global Theme" : "Add Global Theme"}</DialogTitle>
                                        <DialogDescription>
                                            Configure the colors and name for your global theme.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-8 py-4">
                                        {/* Left Column: Branding */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Theme Name</Label>
                                                <Input value={newTheme.name} onChange={e => setNewTheme(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Lavender" />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Base Color (Background)</Label>
                                                <div className="flex gap-2">
                                                    <Input type="color" className="p-1 h-9 w-12" value={newTheme.baseColor || "#ffffff"} onChange={e => setNewTheme(p => ({ ...p, baseColor: e.target.value }))} />
                                                    <Input value={newTheme.baseColor} onChange={e => setNewTheme(p => ({ ...p, baseColor: e.target.value }))} className="flex-1 font-mono uppercase text-xs" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Glow Color (Radial Halo)</Label>
                                                <div className="flex gap-2">
                                                    <Input type="color" className="p-1 h-9 w-12" value={newTheme.glowColor || "#ffffff"} onChange={e => setNewTheme(p => ({ ...p, glowColor: e.target.value }))} />
                                                    <Input value={newTheme.glowColor} onChange={e => setNewTheme(p => ({ ...p, glowColor: e.target.value }))} className="flex-1 font-mono uppercase text-xs" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Type</Label>
                                                <Select value={newTheme.type} onValueChange={(val: any) => setNewTheme(p => ({ ...p, type: val }))}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="light">Light (Dark Text)</SelectItem>
                                                        <SelectItem value="dark">Dark (Light Text)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="theme-premium" checked={newTheme.isPremium} onChange={e => setNewTheme(p => ({ ...p, isPremium: e.target.checked }))} className="rounded bg-white/5 border-white/10" />
                                                <Label htmlFor="theme-premium">Premium?</Label>
                                            </div>
                                        </div>

                                        {/* Right Column: Preview */}
                                        <div className="space-y-4">
                                            {/* Live Preview Box */}
                                            <div className="mt-6 flex flex-col items-center gap-3 p-6 rounded-xl border border-border/50 justify-center h-48 relative overflow-hidden">
                                                <div className="absolute inset-0 z-0"
                                                    style={{
                                                        backgroundColor: newTheme.baseColor,
                                                        backgroundImage: `radial-gradient(circle at 50% 0%, ${hexToRgba(newTheme.glowColor || "#ffffff", 0.08)}, transparent 70%)`
                                                    }}
                                                />
                                                <div className="relative z-10 text-center">
                                                    <span className="font-bold text-lg drop-shadow-sm" style={{ color: newTheme.type === 'light' ? '#000' : '#fff' }}>{newTheme.name || "Preview"}</span>
                                                    <p className="text-xs opacity-80" style={{ color: newTheme.type === 'light' ? '#000' : '#fff' }}>Sample Text</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddTheme} className="w-full">{editingThemeId ? "Save Changes" : "Create Theme"}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {themes.map((theme) => (
                                    <div key={theme._id} className="flex flex-col gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-all group relative overflow-hidden shadow-sm">
                                        <div
                                            className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 pointer-events-none"
                                            style={{ backgroundColor: theme.glowColor }}
                                        />

                                        <div className="flex items-center justify-between">
                                            <div
                                                className="w-10 h-10 rounded-full border border-zinc-200 shadow-md"
                                                style={{
                                                    backgroundColor: theme.baseColor,
                                                    backgroundImage: `radial-gradient(circle at 50% 0%, ${hexToRgba(theme.glowColor || "#ffffff", 0.08)}, transparent 70%)`
                                                }}
                                            />
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white hover:bg-zinc-100 shadow-sm border border-zinc-200" onClick={() => {
                                                    setEditingThemeId(theme._id);
                                                    setNewTheme({
                                                        name: theme.name,
                                                        baseColor: theme.baseColor,
                                                        glowColor: theme.glowColor,
                                                        type: theme.type,
                                                        isPremium: theme.isPremium || false,
                                                        price: theme.price || 0
                                                    });
                                                    setIsThemeOpen(true);
                                                }}>
                                                    <Edit className="h-4 w-4 text-zinc-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 border border-red-100" onClick={() => safeMutation(removeTheme, { id: theme._id }, "Theme removed")}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="font-semibold text-zinc-900 text-sm">{theme.name}</p>
                                            <div className="flex gap-1.5">
                                                <div className="px-2 py-0.5 rounded-md bg-zinc-100 text-[9px] font-mono text-zinc-500 uppercase border border-zinc-200">{theme.baseColor}</div>
                                                <div className="px-2 py-0.5 rounded-md bg-zinc-100 text-[9px] font-mono text-zinc-500 uppercase border border-zinc-200">{theme.type}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Fonts ── */}
                <TabsContent value="fonts" className="mt-0">
                    <Card className="bg-white border-zinc-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 pb-4">
                            <CardTitle className="text-lg font-semibold text-zinc-900">Available Fonts</CardTitle>
                            <Dialog open={isFontOpen} onOpenChange={(open) => {
                                setIsFontOpen(open);
                                if (!open) {
                                    setEditingFontId(null);
                                    setNewFont({ name: "", fontFamily: "", isCustom: false, isPremium: false, price: 0 });
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 text-white"><Plus className="h-4 w-4 mr-1" /> Add Font</Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white border-zinc-200 text-zinc-950">
                                    <DialogHeader>
                                        <DialogTitle>{editingFontId ? "Edit Global Font" : "Register Font"}</DialogTitle>
                                        <DialogDescription className="text-zinc-500">
                                            {editingFontId ? "Update font metadata." : "Add a new font to the library."}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label className="text-zinc-600">Font Name (Display)</Label>
                                            <Input
                                                className="border-zinc-200"
                                                value={newFont.name}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setNewFont(p => ({
                                                        ...p,
                                                        name: val,
                                                        fontFamily: editingFontId ? p.fontFamily : val // Auto-sync on create
                                                    }));
                                                }}
                                                placeholder="e.g. Playfair Display"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-600">Font Family (CSS Name)</Label>
                                            <Input
                                                className="border-zinc-200"
                                                value={newFont.fontFamily}
                                                onChange={e => setNewFont(p => ({ ...p, fontFamily: e.target.value }))}
                                                placeholder="e.g. 'Inter', sans-serif"
                                            />
                                        </div>
                                        {!editingFontId && (
                                            <div className="space-y-2">
                                                <Label className="text-zinc-600">Upload Font File (Optional)</Label>
                                                <Input type="file" className="border-zinc-200" ref={fontFileRef} accept=".ttf,.otf,.woff,.woff2" onChange={() => setNewFont(p => ({ ...p, isCustom: true }))} />
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddFont} className="w-full bg-zinc-900 text-white hover:bg-zinc-800" disabled={isUploading}>
                                            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : (editingFontId ? "Save Changes" : "Register Font")}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-zinc-50">
                                    <TableRow className="border-zinc-200 hover:bg-transparent">
                                        <TableHead className="text-zinc-500">Name</TableHead>
                                        <TableHead className="text-zinc-500">Type</TableHead>
                                        <TableHead className="text-zinc-500">Preview</TableHead>
                                        <TableHead className="text-right text-zinc-500 px-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fonts.map((font) => (
                                        <TableRow key={font._id} className="border-zinc-200 hover:bg-zinc-50 transition-colors" style={{ fontFamily: font.name }}>
                                            <TableCell className="font-medium text-zinc-900">{font.name}</TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                                                    font.storageId ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                                                )}>
                                                    {font.storageId ? "Custom" : "Google"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-lg text-zinc-900">The quick brown fox</TableCell>
                                            <TableCell className="text-right px-6 space-x-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" onClick={() => {
                                                    setEditingFontId(font._id);
                                                    setNewFont({
                                                        name: font.name,
                                                        fontFamily: font.fontFamily,
                                                        isCustom: font.isCustom,
                                                        isPremium: font.isPremium || false,
                                                        price: font.price || 0
                                                    });
                                                    setIsFontOpen(true);
                                                }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => safeMutation(removeFont, { id: font._id }, "Font removed")}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Characters ── */}
                <TabsContent value="characters" className="mt-0">
                    <Card className="bg-white border-zinc-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 pb-4">
                            <CardTitle className="text-lg font-semibold text-zinc-900">Character Library</CardTitle>
                            <div>
                                <input type="file" ref={charFilesRef} multiple className="hidden" onChange={handleAddCharacters} accept="image/*" />
                                <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 text-white" onClick={() => charFilesRef.current?.click()} disabled={isUploading}>
                                    {isUploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                                    Upload Characters
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {characters.length === 0 ? (
                                <p className="text-center text-sm text-zinc-500 py-12">No characters uploaded yet.</p>
                            ) : (
                                <div className="grid grid-cols-4 gap-4">
                                    {characters.map((char) => (
                                        <div key={char._id} className="relative group rounded-xl border border-zinc-100 bg-zinc-50 p-2 flex flex-col items-center gap-2 hover:border-zinc-300 transition-all shadow-sm">
                                            <div className="aspect-square w-full flex items-center justify-center">
                                                <img src={char.url} alt={char.name} className="max-w-full max-h-full object-contain drop-shadow-md" />
                                            </div>
                                            {editingCharacterId === char._id ? (
                                                <div className="flex flex-col gap-1 w-full">
                                                    <Input
                                                        value={editingName}
                                                        onChange={e => setEditingName(e.target.value)}
                                                        className="h-6 text-[10px] bg-white border-zinc-200"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-1">
                                                        <Button size="sm" className="h-5 text-[8px] flex-1" onClick={handleUpdateCharacter}>Save</Button>
                                                        <Button size="sm" variant="ghost" className="h-5 text-[8px] flex-1" onClick={() => setEditingCharacterId(null)}>Cancel</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 w-full px-1">
                                                    <p className="text-[10px] font-medium text-zinc-500 truncate flex-1">{char.name}</p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => {
                                                            setEditingCharacterId(char._id);
                                                            setEditingName(char.name);
                                                        }}
                                                    >
                                                        <Edit className="h-3 w-3 text-zinc-400" />
                                                    </Button>
                                                </div>
                                            )}
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-1 -right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                onClick={() => safeMutation(removeCharacter, { id: char._id }, "Character removed")}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Music ── */}
                <TabsContent value="music" className="mt-0">
                    <Card className="bg-white border-zinc-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 pb-4">
                            <CardTitle className="text-lg font-semibold text-zinc-900">Music Library</CardTitle>
                            <Dialog open={isMusicOpen} onOpenChange={(open) => {
                                setIsMusicOpen(open);
                                if (!open) {
                                    setEditingMusicId(null);
                                    setNewMusic({ name: "", artist: "", duration: 0, url: "", isPremium: false, price: 0 });
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 text-white"><Plus className="h-4 w-4 mr-1" /> Add Music</Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white border-zinc-200 text-zinc-950">
                                    <DialogHeader>
                                        <DialogTitle>{editingMusicId ? "Edit Music Track" : "Register Music Track"}</DialogTitle>
                                        <DialogDescription className="text-zinc-500">
                                            {editingMusicId ? "Update music track details." : "Add a new MP3 track to the global library."}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label className="text-zinc-600">Track Name</Label>
                                            <Input className="border-zinc-200" value={newMusic.name} onChange={e => setNewMusic(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Sunset Vibes" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-zinc-600">Artist</Label>
                                            <Input className="border-zinc-200" value={newMusic.artist} onChange={e => setNewMusic(p => ({ ...p, artist: e.target.value }))} placeholder="e.g. LoFi Girl" />
                                        </div>
                                        {!editingMusicId && (
                                            <div className="space-y-2">
                                                <Label className="text-zinc-600">Upload MP3</Label>
                                                <Input type="file" className="border-zinc-200" ref={musicFileRef} accept="audio/mpeg" />
                                            </div>
                                        )}
                                        {editingMusicId && (
                                            <div className="space-y-2">
                                                <Label className="text-zinc-600">Duration (seconds)</Label>
                                                <Input type="number" className="border-zinc-200" value={newMusic.duration} onChange={e => setNewMusic(p => ({ ...p, duration: parseInt(e.target.value) }))} />
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddMusic} className="w-full bg-zinc-900 text-white hover:bg-zinc-800" disabled={isUploading}>
                                            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : (editingMusicId ? "Save Changes" : "Register Track")}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-zinc-50">
                                    <TableRow className="border-zinc-200 hover:bg-transparent">
                                        <TableHead className="w-12"></TableHead>
                                        <TableHead className="text-zinc-500">Track Name</TableHead>
                                        <TableHead className="text-zinc-500">Artist</TableHead>
                                        <TableHead className="text-zinc-500">Duration</TableHead>
                                        <TableHead className="text-zinc-500 px-6 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {music.map((track) => (
                                        <TableRow key={track._id} className="border-zinc-200 hover:bg-zinc-50 transition-colors">
                                            <TableCell className="w-12">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "h-8 w-8 rounded-full transition-all",
                                                        playingId === track._id ? "bg-rose-50 text-rose-600" : "text-zinc-400 hover:text-zinc-900"
                                                    )}
                                                    onClick={() => togglePlay(track._id, track.url)}
                                                >
                                                    {playingId === track._id ? (
                                                        <div className="flex gap-0.5 items-end h-3">
                                                            <div className="w-0.5 bg-current animate-[music-bar_0.6s_ease-in-out_infinite]" style={{ height: '40%' }} />
                                                            <div className="w-0.5 bg-current animate-[music-bar_0.8s_ease-in-out_infinite]" style={{ height: '100%' }} />
                                                            <div className="w-0.5 bg-current animate-[music-bar_0.7s_ease-in-out_infinite]" style={{ height: '60%' }} />
                                                        </div>
                                                    ) : (
                                                        <Play className="h-4 w-4 fill-current" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="font-medium text-zinc-900">{track.name}</TableCell>
                                            <TableCell className="text-zinc-500">{track.artist}</TableCell>
                                            <TableCell className="text-zinc-500">{track.duration}s</TableCell>
                                            <TableCell className="text-right px-6 space-x-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" onClick={() => {
                                                    setEditingMusicId(track._id);
                                                    setNewMusic({
                                                        name: track.name,
                                                        artist: track.artist,
                                                        duration: track.duration,
                                                        url: track.url || "",
                                                        isPremium: track.isPremium || false,
                                                        price: track.price || 0
                                                    });
                                                    setIsMusicOpen(true);
                                                }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => safeMutation(removeMusic, { id: track._id }, "Music removed")}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Patterns ── */}
                <TabsContent value="patterns" className="mt-0">
                    <Card className="bg-white border-zinc-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 pb-4">
                            <CardTitle className="text-lg font-semibold text-zinc-900">Slide Patterns (Effects)</CardTitle>
                            <Dialog open={isPatternOpen} onOpenChange={(open) => {
                                setIsPatternOpen(open);
                                if (!open) {
                                    setEditingPatternId(null);
                                    setNewPattern({ id: "", name: "", emojis: "", type: "fall", isPremium: false, price: 0 });
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 text-white"><Plus className="h-4 w-4 mr-1" /> Add Pattern</Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white border-zinc-200 text-zinc-950">
                                    <DialogHeader>
                                        <DialogTitle>Configure Pattern</DialogTitle>
                                        <DialogDescription className="text-zinc-500">
                                            Set up the emoji behavior and appearance for this slide effect.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-zinc-600">Display Name</Label>
                                                <Input
                                                    className="border-zinc-200"
                                                    value={newPattern.name}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setNewPattern(p => ({
                                                            ...p,
                                                            name: val,
                                                            id: editingPatternId ? p.id : slugify(val) // Auto-slug on create
                                                        }));
                                                    }}
                                                    placeholder="e.g. Rapid Hearts"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-zinc-600">Pattern ID (Technical)</Label>
                                                <Input
                                                    className="border-zinc-200"
                                                    value={newPattern.id}
                                                    onChange={e => setNewPattern(p => ({ ...p, id: slugify(e.target.value) }))}
                                                    placeholder="e.g. hearts"
                                                    disabled={editingPatternId !== null}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-zinc-600">Emoji(s)</Label>
                                                <Input className="border-zinc-200" value={newPattern.emojis} onChange={e => setNewPattern(p => ({ ...p, emojis: e.target.value }))} placeholder="e.g. 💖,✨" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-zinc-600">Behavior</Label>
                                                <Select value={newPattern.type} onValueChange={(val) => setNewPattern(p => ({ ...p, type: val }))}>
                                                    <SelectTrigger className="border-zinc-200"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-white border-zinc-200 text-zinc-950">
                                                        <SelectItem value="falling">Falling (Rain/Snow)</SelectItem>
                                                        <SelectItem value="rising">Rising (Hearts/Balloons)</SelectItem>
                                                        <SelectItem value="drift">Drift (Clouds/Waves)</SelectItem>
                                                        <SelectItem value="burst">Burst (Stars)</SelectItem>
                                                        <SelectItem value="static">Static (Grid)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter><Button onClick={handleAddPattern} className="w-full bg-zinc-900 text-white hover:bg-zinc-800">Save Changes</Button></DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-zinc-50">
                                    <TableRow className="border-zinc-200 hover:bg-transparent">
                                        <TableHead className="text-zinc-500">Name</TableHead>
                                        <TableHead className="text-zinc-500">Behavior</TableHead>
                                        <TableHead className="text-zinc-500">Emoji</TableHead>
                                        <TableHead className="text-right text-zinc-500 px-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {patterns.map((pattern: any) => (
                                        <TableRow key={pattern._id} className="border-zinc-200 hover:bg-zinc-50 transition-colors">
                                            <TableCell className="font-semibold text-zinc-900">{pattern.name}</TableCell>
                                            <TableCell className="text-zinc-500 capitalize">{pattern.type || "fall"}</TableCell>
                                            <TableCell className="text-2xl">{pattern.emojis?.join(" ")}</TableCell>
                                            <TableCell className="text-right px-6 gap-1">
                                                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-900" onClick={() => {
                                                    setNewPattern({
                                                        id: pattern.id || "",
                                                        name: pattern.name || "",
                                                        emojis: pattern.emojis?.join(", ") || "",
                                                        type: (pattern.type as any) || "fall",
                                                        isPremium: pattern.isPremium || false,
                                                        price: pattern.price || 0
                                                    });
                                                    setEditingPatternId(pattern._id);
                                                    setIsPatternOpen(true);
                                                }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => safeMutation(removePattern, { id: pattern._id }, "Pattern removed")}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}
