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
import { Plus, Trash2, Edit, Music as MusicIcon, Sparkles, Type, Upload, Loader2, User, X, Image as ImageIcon, DollarSign, Play, Star } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn, hexToRgba, getBrandRadialGradient, getAudioDuration, uploadToConvexStorage } from "@/lib/utils";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";



const slugify = (text: string) => text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function FilesPage() {
    const { toast } = useToast();
    const { safeMutation } = useSafeMutation();
    const { playingId, togglePlay } = useAudioPlayer();

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
    const createFontMutation = useMutation(api.fonts.create);
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
    const setDefaultAsset = useMutation(api.assets.setDefaultAsset);

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
                    storageId = await uploadToConvexStorage(generateFontUploadUrl, fontFileRef.current.files[0]);
                } catch {
                    toast({ title: "Upload failed", variant: "destructive" });
                    setIsUploading(false);
                    return;
                }
            }
            const success = await safeMutation(createFontMutation, { ...newFont, storageId }, "Font added");
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
                    storageId = await uploadToConvexStorage(generateUploadUrl, file);
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
                const storageId = await uploadToConvexStorage(generateCharacterUploadUrl, file);
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
        <div className="space-y-8 p-4 sm:p-6 bg-white min-h-screen text-zinc-950 max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Global Assets</h1>
                <p className="text-zinc-500 text-sm">Manage themes, fonts, characters and effects for the editor.</p>
            </div>

            <Tabs defaultValue="themes" className="space-y-6">
                <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <TabsList className="flex w-max sm:w-full min-w-full bg-zinc-50 p-1 rounded-xl border border-zinc-200">
                        <TabsTrigger value="themes" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-lg px-6 transition-all gap-2 h-9"><Sparkles className="h-4 w-4" /> Themes</TabsTrigger>
                        <TabsTrigger value="fonts" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-lg px-6 transition-all gap-2 h-9"><Type className="h-4 w-4" /> Fonts</TabsTrigger>
                        <TabsTrigger value="characters" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-lg px-6 transition-all gap-2 h-9"><User className="h-4 w-4" /> Characters</TabsTrigger>
                        <TabsTrigger value="music" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-lg px-6 transition-all gap-2 h-9"><MusicIcon className="h-4 w-4" /> Music</TabsTrigger>
                        <TabsTrigger value="patterns" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-lg px-6 transition-all gap-2 h-9"><ImageIcon className="h-4 w-4" /> Effects</TabsTrigger>
                    </TabsList>
                </div>

                {/* ── Themes ── */}
                <TabsContent value="themes" className="mt-0">
                    <Card className="bg-white border-zinc-200 shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 py-4">
                            <div>
                                <CardTitle className="text-lg font-semibold text-zinc-900">Editor Themes</CardTitle>
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
                                    <Button size="sm" className="h-9 w-9 sm:w-auto sm:h-8 p-0 sm:px-3">
                                        <Plus className="h-4 w-4" />
                                        <span className="hidden sm:inline ml-1">Add Theme</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>{editingThemeId ? "Edit Global Theme" : "Add Global Theme"}</DialogTitle>
                                        <DialogDescription>
                                            Configure the colors and name for your global theme.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 py-4">
                                        {/* Left Column: Branding */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Theme Name</Label>
                                                <Input value={newTheme.name} onChange={e => setNewTheme(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Lavender" />
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Base Color (Background)</Label>
                                                    <div className="flex gap-2">
                                                        <Input type="color" className="p-1 h-9 w-12 shrink-0" value={newTheme.baseColor || "#ffffff"} onChange={e => setNewTheme(p => ({ ...p, baseColor: e.target.value }))} />
                                                        <Input value={newTheme.baseColor} onChange={e => setNewTheme(p => ({ ...p, baseColor: e.target.value }))} className="flex-1 font-mono uppercase text-xs" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Glow Color (Radial Halo)</Label>
                                                    <div className="flex gap-2">
                                                        <Input type="color" className="p-1 h-9 w-12 shrink-0" value={newTheme.glowColor || "#ffffff"} onChange={e => setNewTheme(p => ({ ...p, glowColor: e.target.value }))} />
                                                        <Input value={newTheme.glowColor} onChange={e => setNewTheme(p => ({ ...p, glowColor: e.target.value }))} className="flex-1 font-mono uppercase text-xs" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Type</Label>
                                                    <Select value={newTheme.type} onValueChange={(val: any) => setNewTheme(p => ({ ...p, type: val }))}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="light">Light</SelectItem>
                                                            <SelectItem value="dark">Dark</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="flex items-center gap-2 pt-8">
                                                    <input type="checkbox" id="theme-premium" checked={newTheme.isPremium} onChange={e => setNewTheme(p => ({ ...p, isPremium: e.target.checked }))} className="rounded bg-white/5 border-white/10" />
                                                    <Label htmlFor="theme-premium" className="text-xs">Premium</Label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Preview */}
                                        <div className="space-y-4">
                                            <Label className="text-[10px] uppercase font-bold text-zinc-400">Preview</Label>
                                            <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-zinc-100 justify-center h-40 sm:h-48 relative overflow-hidden">
                                                <div className="absolute inset-0 z-0"
                                                    style={{
                                                        backgroundColor: newTheme.baseColor,
                                                        backgroundImage: getBrandRadialGradient(newTheme.baseColor, newTheme.glowColor, newTheme.type === 'dark')

                                                    }}
                                                />
                                                <div className="relative z-10 text-center">
                                                    <span className="font-bold text-lg drop-shadow-sm" style={{ color: newTheme.type === 'light' ? '#000' : '#fff' }}>{newTheme.name || "Theme Name"}</span>
                                                    <p className="text-xs opacity-80" style={{ color: newTheme.type === 'light' ? '#000' : '#fff' }}>Sample Presentation</p>
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
                        <CardContent className="p-4 sm:p-6">
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {themes.map((theme) => (
                                    <Dialog key={theme._id} open={editingThemeId === theme._id} onOpenChange={(open) => {
                                        if (open) {
                                            setEditingThemeId(theme._id);
                                            setNewTheme({
                                                name: theme.name || "",
                                                baseColor: theme.baseColor || "#ffffff",
                                                glowColor: theme.glowColor || "#ffffff",
                                                type: theme.type || "light",
                                                isPremium: theme.isPremium || false,
                                                price: theme.price || 0
                                            });
                                        } else {
                                            setEditingThemeId(null);
                                            setNewTheme({ name: "", baseColor: "#ffffff", glowColor: "#ffffff", type: "light", isPremium: false, price: 0 });
                                        }
                                    }}>
                                        <DialogTrigger asChild>
                                            <div className="flex flex-col gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-all group relative overflow-hidden shadow-sm cursor-pointer active:scale-[0.98]">
                                                <div
                                                    className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 pointer-events-none"
                                                    style={{ backgroundColor: theme.glowColor }}
                                                />

                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className="w-10 h-10 rounded-full border border-zinc-200 shadow-md"
                                                        style={{
                                                            backgroundColor: theme.baseColor,
                                                            backgroundImage: getBrandRadialGradient(theme.baseColor, theme.glowColor, theme.type === 'dark')

                                                        }}
                                                    />
                                                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn("h-8 w-8 rounded-full border transition-colors", theme.isDefault ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : "bg-white hover:bg-zinc-100 border-zinc-200")}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                safeMutation(setDefaultAsset, { id: theme._id, table: "globalThemes" }, "Default updated");
                                                            }}
                                                        >
                                                            <Star className={cn("h-4 w-4", theme.isDefault ? "text-amber-500 fill-amber-500" : "text-zinc-400")} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 border border-red-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                safeMutation(removeTheme, { id: theme._id }, "Theme removed");
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <p className="font-semibold text-zinc-900 text-sm">{theme.name}</p>
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        <div className="px-2 py-0.5 rounded-md bg-zinc-100 text-[9px] font-mono text-zinc-500 uppercase border border-zinc-200">{theme.baseColor}</div>
                                                        {theme.glowColor && (
                                                            <div className="px-2 py-0.5 rounded-md bg-zinc-50 text-[9px] font-mono text-zinc-400 uppercase border border-zinc-100">{theme.glowColor}</div>
                                                        )}
                                                        <div className="px-2 py-0.5 rounded-md bg-zinc-100 text-[9px] font-mono text-zinc-500 uppercase border border-zinc-200">{theme.type}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogTrigger>


                                        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl p-6">

                                            <div className="space-y-6">
                                                <DialogHeader className="text-left">
                                                    <DialogTitle>Edit Theme</DialogTitle>
                                                    <DialogDescription>Update naming and branding colors.</DialogDescription>
                                                </DialogHeader>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Theme Name</Label>
                                                        <Input
                                                            defaultValue={theme.name}
                                                            onChange={e => {
                                                                setEditingThemeId(theme._id);
                                                                setNewTheme(p => ({ ...p, name: e.target.value }));
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Base Color</Label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="color"
                                                                    className="p-1 h-10 w-12 shrink-0 border-zinc-200"
                                                                    value={newTheme.baseColor}
                                                                    onChange={e => {
                                                                        setEditingThemeId(theme._id);
                                                                        setNewTheme(p => ({ ...p, baseColor: e.target.value }));
                                                                    }}
                                                                />
                                                                <Input
                                                                    value={newTheme.baseColor}
                                                                    className="font-mono text-xs uppercase"
                                                                    onChange={e => {
                                                                        setEditingThemeId(theme._id);
                                                                        setNewTheme(p => ({ ...p, baseColor: e.target.value }));
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Glow Color</Label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="color"
                                                                    className="p-1 h-10 w-12 shrink-0 border-zinc-200"
                                                                    value={newTheme.glowColor}
                                                                    onChange={e => {
                                                                        setEditingThemeId(theme._id);
                                                                        setNewTheme(p => ({ ...p, glowColor: e.target.value }));
                                                                    }}
                                                                />
                                                                <Input
                                                                    value={newTheme.glowColor}
                                                                    className="font-mono text-xs uppercase"
                                                                    onChange={e => {
                                                                        setEditingThemeId(theme._id);
                                                                        setNewTheme(p => ({ ...p, glowColor: e.target.value }));
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Theme Type</Label>
                                                        <Select
                                                            defaultValue={theme.type}
                                                            onValueChange={(val: any) => {
                                                                setEditingThemeId(theme._id);
                                                                setNewTheme(p => ({ ...p, type: val }));
                                                            }}
                                                        >
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="light">Light</SelectItem>
                                                                <SelectItem value="dark">Dark</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="flex items-center gap-2 py-4">
                                                        <input
                                                            type="checkbox"
                                                            id={`premium-${theme._id}`}
                                                            defaultChecked={theme.isPremium}
                                                            onChange={e => {
                                                                setEditingThemeId(theme._id);
                                                                setNewTheme(p => ({ ...p, isPremium: e.target.checked }));
                                                            }}
                                                            className="rounded bg-white/5 border-zinc-200"
                                                        />
                                                        <Label htmlFor={`premium-${theme._id}`}>Premium Asset</Label>
                                                    </div>

                                                    <div className="pt-4 border-t border-zinc-100">
                                                        <Label className="text-[10px] uppercase font-bold text-zinc-400 mb-2 block">Live Preview</Label>
                                                        <div
                                                            className="flex flex-col items-center justify-center h-32 rounded-xl relative overflow-hidden transition-all duration-300 border border-zinc-100 shadow-inner"
                                                            style={{
                                                                backgroundColor: newTheme.baseColor || theme.baseColor,
                                                                backgroundImage: getBrandRadialGradient(newTheme.baseColor || theme.baseColor, newTheme.glowColor || theme.glowColor, (newTheme.type || theme.type) === 'dark')

                                                            }}
                                                        >
                                                            <span
                                                                className="font-bold text-lg"
                                                                style={{ color: (newTheme.type || theme.type) === 'dark' ? '#fff' : '#000' }}
                                                            >
                                                                {newTheme.name || theme.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-6">
                                                    <DialogClose asChild>
                                                        <Button variant="outline" className="flex-1">Cancel</Button>
                                                    </DialogClose>
                                                    <Button
                                                        className="flex-1"
                                                        onClick={async () => {
                                                            // If editingThemeId is not set, it means no changes were made
                                                            const success = await safeMutation(updateTheme, {
                                                                id: theme._id,
                                                                name: newTheme.name || theme.name,
                                                                baseColor: newTheme.baseColor || theme.baseColor,
                                                                glowColor: newTheme.glowColor || theme.glowColor,
                                                                type: (newTheme.type || theme.type) as any,
                                                                isPremium: newTheme.isPremium !== undefined ? newTheme.isPremium : (theme.isPremium || false),
                                                                price: newTheme.price !== undefined ? newTheme.price : (theme.price || 0)
                                                            }, "Theme updated");
                                                            if (success) {
                                                                setEditingThemeId(null);
                                                                setNewTheme({ name: "", baseColor: "#ffffff", glowColor: "#ffffff", type: "light", isPremium: false, price: 0 });
                                                            }
                                                        }}
                                                    >
                                                        Save Changes
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>

                                    </Dialog>
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
                                    <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 text-white h-9 w-9 sm:w-auto sm:h-8 p-0 sm:px-3">
                                        <Plus className="h-4 w-4" />
                                        <span className="hidden sm:inline ml-1">Add Font</span>
                                    </Button>
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
                            {/* Desktop Table */}
                            <div className="hidden sm:block">
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
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn("h-8 w-8 border transition-colors", font.isDefault ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : "bg-white hover:bg-zinc-100 border-zinc-200")}
                                                        onClick={() => {
                                                            safeMutation(setDefaultAsset, { id: font._id, table: "globalFonts" }, "Default updated");
                                                        }}
                                                    >
                                                        <Star className={cn("h-4 w-4", font.isDefault ? "text-amber-500 fill-amber-500" : "text-zinc-400")} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => safeMutation(removeFont, { id: font._id }, "Font removed")}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="sm:hidden divide-y divide-zinc-100">
                                {fonts.map((font) => (
                                    <Drawer key={font._id}>
                                        <DrawerTrigger asChild>
                                            <div className="p-4 space-y-3 cursor-pointer active:bg-zinc-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-zinc-900">{font.name}</p>
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                                                            font.storageId ? "bg-purple-100 text-purple-700" : "bg-zinc-100 text-zinc-600"
                                                        )}>
                                                            {font.storageId ? "Custom" : "Google"}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn("h-8 w-8 border transition-colors", font.isDefault ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : "bg-white hover:bg-zinc-100 border-zinc-200")}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                safeMutation(setDefaultAsset, { id: font._id, table: "globalFonts" }, "Default updated");
                                                            }}
                                                        >
                                                            <Star className={cn("h-4 w-4", font.isDefault ? "text-amber-500 fill-amber-500" : "text-zinc-400")} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                safeMutation(removeFont, { id: font._id }, "Font removed");
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-white rounded-lg border border-zinc-100 shadow-sm">
                                                    <p style={{ fontFamily: font.name }} className="text-lg text-zinc-900 leading-tight">Handheld Preview Text</p>
                                                </div>
                                            </div>
                                        </DrawerTrigger>


                                        <DrawerContent className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[20px] p-6 outline-none z-50 max-h-[92vh] overflow-y-auto">

                                            <div className="space-y-6">
                                                <DrawerHeader className="text-left">
                                                    <DrawerTitle>Edit Font</DrawerTitle>
                                                    <DrawerDescription>Update font naming and family.</DrawerDescription>
                                                </DrawerHeader>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Font Name (Display)</Label>
                                                        <Input
                                                            defaultValue={font.name}
                                                            onChange={e => {
                                                                setEditingFontId(font._id);
                                                                setNewFont(p => ({ ...p, name: e.target.value }));
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Font Family (CSS Name)</Label>
                                                        <Input
                                                            defaultValue={font.fontFamily}
                                                            onChange={e => {
                                                                setEditingFontId(font._id);
                                                                setNewFont(p => ({ ...p, fontFamily: e.target.value }));
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2 py-4">
                                                        <input
                                                            type="checkbox"
                                                            id={`font-premium-${font._id}`}
                                                            defaultChecked={font.isPremium}
                                                            onChange={e => {
                                                                setEditingFontId(font._id);
                                                                setNewFont(p => ({ ...p, isPremium: e.target.checked }));
                                                            }}
                                                            className="rounded bg-white/5 border-zinc-200"
                                                        />
                                                        <Label htmlFor={`font-premium-${font._id}`}>Premium Asset</Label>
                                                    </div>

                                                    <div className="pt-4 border-t border-zinc-100">
                                                        <Label className="text-[10px] uppercase font-bold text-zinc-400 mb-4 block">Live Preview</Label>
                                                        <div className="p-8 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-center text-center">
                                                            <p
                                                                style={{ fontFamily: newFont.fontFamily || font.fontFamily }}
                                                                className="text-3xl text-zinc-900"
                                                            >
                                                                The quick brown fox
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-6">
                                                    <DrawerClose asChild>
                                                        <Button variant="outline" className="flex-1">Cancel</Button>
                                                    </DrawerClose>
                                                    <Button
                                                        className="flex-1 bg-zinc-900 text-white"
                                                        onClick={async () => {
                                                            const success = await safeMutation(updateFont, {
                                                                id: font._id,
                                                                name: newFont.name || font.name,
                                                                fontFamily: newFont.fontFamily || font.fontFamily,
                                                                isPremium: newFont.isPremium !== undefined ? newFont.isPremium : (font.isPremium || false),
                                                                price: newFont.price !== undefined ? newFont.price : (font.price || 0)
                                                            }, "Font updated");
                                                            if (success) {
                                                                setEditingFontId(null);
                                                                setNewFont({ name: "", fontFamily: "", isCustom: false, isPremium: false, price: 0 });
                                                            }
                                                        }}
                                                    >
                                                        Save Changes
                                                    </Button>
                                                </div>
                                            </div>
                                        </DrawerContent>

                                    </Drawer>
                                ))}
                            </div>
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
                                <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 text-white h-9 w-9 sm:w-auto sm:h-8 p-0 sm:px-3" onClick={() => charFilesRef.current?.click()} disabled={isUploading}>
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    <span className="hidden sm:inline ml-1">Upload Characters</span>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {characters.length === 0 ? (
                                <p className="text-center text-sm text-zinc-500 py-12">No characters uploaded yet.</p>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                                    {characters.map((char) => (
                                        <Dialog key={char._id}>
                                            <DialogTrigger asChild>
                                                <div className="relative group rounded-xl border border-zinc-100 bg-zinc-50 p-2 flex flex-col items-center gap-2 hover:border-zinc-300 transition-all shadow-sm cursor-pointer active:scale-95">
                                                    <div className="aspect-square w-full flex items-center justify-center">
                                                        <img src={char.url} alt={char.name} className="max-w-full max-h-full object-contain drop-shadow-md" />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-zinc-600 truncate w-full text-center px-1 sm:hidden">{char.name}</p>

                                                    {/* Desktop only edit actions */}
                                                    <div className="hidden sm:flex items-center gap-1 w-full px-1">
                                                        <p className="text-[10px] font-bold text-zinc-600 truncate flex-1">{char.name}</p>
                                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={cn("h-5 w-5 border transition-colors", char.isDefault ? "bg-amber-50 border-amber-200" : "bg-transparent border-transparent")}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    safeMutation(setDefaultAsset, { id: char._id, table: "globalCharacters" }, "Default updated");
                                                                }}
                                                            >
                                                                <Star className={cn("h-3 w-3", char.isDefault ? "text-amber-500 fill-amber-500" : "text-zinc-400")} />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-5 w-5"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingCharacterId(char._id);
                                                                    setEditingName(char.name);
                                                                }}
                                                            >
                                                                <Edit className="h-3 w-3 text-zinc-400" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-5 w-5 text-red-400 hover:text-red-500"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    safeMutation(removeCharacter, { id: char._id }, "Character removed");
                                                                }}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogTrigger>


                                            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md p-6">
                                                <DialogHeader className="text-left">
                                                    <DialogTitle>Edit Character</DialogTitle>
                                                    <DialogDescription>Update the name and preview the character image.</DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-8 pt-4">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-32 h-32 flex items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-100 p-4">
                                                            <img src={char.url} alt={char.name} className="max-w-full max-h-full object-contain drop-shadow-lg" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="flex gap-2 items-end">
                                                            <div className="flex-1 space-y-2">
                                                                <Label>Character Name</Label>
                                                                <Input
                                                                    defaultValue={char.name}
                                                                    className="h-10"
                                                                    onChange={(e) => {
                                                                        setEditingCharacterId(char._id);
                                                                        setEditingName(e.target.value);
                                                                    }}
                                                                />
                                                            </div>
                                                            <Button
                                                                className="h-10 bg-zinc-900 text-white px-6"
                                                                onClick={async () => {
                                                                    const success = await safeMutation(updateCharacter, {
                                                                        id: char._id,
                                                                        name: editingName || char.name
                                                                    }, "Character renamed");
                                                                    if (success) {
                                                                        setEditingCharacterId(null);
                                                                        setEditingName("");
                                                                    }
                                                                }}
                                                            >
                                                                Save
                                                            </Button>
                                                        </div>

                                                        <div className="pt-6 border-t border-zinc-100">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 gap-2">
                                                                        <Trash2 className="h-4 w-4" /> Delete Character
                                                                    </Button>
                                                                </DialogTrigger>


                                                                <DialogContent className="sm:max-w-sm p-6">

                                                                    <div className="space-y-6 text-center">
                                                                        <DialogHeader>
                                                                            <DialogTitle>Delete Character?</DialogTitle>
                                                                            <DialogDescription>This action cannot be undone. This character will be removed from all events.</DialogDescription>
                                                                        </DialogHeader>
                                                                        <div className="flex flex-col gap-2">
                                                                            <Button
                                                                                variant="destructive"
                                                                                className="w-full h-12 text-lg font-bold"
                                                                                onClick={async () => {
                                                                                    await safeMutation(removeCharacter, { id: char._id }, "Character removed");
                                                                                }}
                                                                            >
                                                                                Delete Permenantly
                                                                            </Button>
                                                                            <DialogClose asChild>
                                                                                <Button variant="ghost" className="w-full h-12">Cancel</Button>
                                                                            </DialogClose>
                                                                        </div>
                                                                    </div>
                                                                </DialogContent>

                                                            </Dialog>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogContent>

                                        </Dialog>
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
                                    <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 text-white h-9 w-9 sm:w-auto sm:h-8 p-0 sm:px-3">
                                        <Plus className="h-4 w-4" />
                                        <span className="hidden sm:inline ml-1">Add Music</span>
                                    </Button>
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
                            {/* Desktop Table */}
                            <div className="hidden sm:block">
                                <Table>
                                    <TableHeader className="bg-zinc-50">
                                        <TableRow className="border-zinc-200 hover:bg-transparent">
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead className="text-zinc-500">Track Name</TableHead>
                                            <TableHead className="text-zinc-500">Source</TableHead>
                                            <TableHead className="text-zinc-500">Artist</TableHead>
                                            <TableHead className="text-zinc-500">Duration</TableHead>
                                            <TableHead className="text-zinc-500 px-6 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {music.map((track) => (
                                            <TableRow key={track._id} className="border-zinc-200 hover:bg-zinc-50 transition-colors">
                                                <TableCell className="w-12 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            "h-8 w-8 rounded-full transition-all mx-auto",
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
                                                <TableCell>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                                                        track.storageId ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                                                    )}>
                                                        {track.storageId ? "Convex" : "Static"}
                                                    </span>
                                                </TableCell>
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
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn("h-8 w-8 border transition-colors", track.isDefault ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : "bg-transparent hover:bg-zinc-100 border-transparent")}
                                                        onClick={() => {
                                                            safeMutation(setDefaultAsset, { id: track._id, table: "musicTracks" }, "Default updated");
                                                        }}
                                                    >
                                                        <Star className={cn("h-4 w-4", track.isDefault ? "text-amber-500 fill-amber-500" : "text-zinc-400")} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => safeMutation(removeMusic, { id: track._id }, "Music removed")}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="sm:hidden divide-y divide-zinc-100">
                                {music.map((track) => (
                                    <Drawer key={track._id}>
                                        <DrawerTrigger asChild>
                                            <div className="p-4 flex items-center justify-between cursor-pointer active:bg-zinc-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            "h-10 w-10 rounded-full shrink-0",
                                                            playingId === track._id ? "bg-rose-100 text-rose-600" : "bg-zinc-100 text-zinc-400"
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            togglePlay(track._id, track.url);
                                                        }}
                                                    >
                                                        {playingId === track._id ? (
                                                            <div className="flex gap-0.5 items-end h-3">
                                                                <div className="w-0.5 bg-current animate-[music-bar_0.6s_ease-in-out_infinite]" style={{ height: '40%' }} />
                                                                <div className="w-0.5 bg-current animate-[music-bar_0.8s_ease-in-out_infinite]" style={{ height: '100%' }} />
                                                                <div className="w-0.5 bg-current animate-[music-bar_0.7s_ease-in-out_infinite]" style={{ height: '60%' }} />
                                                            </div>
                                                        ) : (
                                                            <Play className="h-5 w-5 fill-current" />
                                                        )}
                                                    </Button>
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold text-zinc-900 leading-none">{track.name}</p>
                                                        <p className="text-[11px] text-zinc-500">{track.artist} • {track.duration}s</p>
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight",
                                                            track.storageId ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-400"
                                                        )}>
                                                            {track.storageId ? "Convex" : "Static"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn("h-8 w-8 border transition-colors", track.isDefault ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : "bg-transparent hover:bg-zinc-100 border-transparent")}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            safeMutation(setDefaultAsset, { id: track._id, table: "musicTracks" }, "Default updated");
                                                        }}
                                                    >
                                                        <Star className={cn("h-4 w-4", track.isDefault ? "text-amber-500 fill-amber-500" : "text-zinc-400")} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            safeMutation(removeMusic, { id: track._id }, "Music removed");
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </DrawerTrigger>


                                        <DrawerContent className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[20px] p-6 outline-none z-50 max-h-[92vh] overflow-y-auto">

                                            <div className="space-y-6">
                                                <DrawerHeader className="text-left">
                                                    <DrawerTitle>Edit music</DrawerTitle>
                                                    <DrawerDescription>Update naming and artist info.</DrawerDescription>
                                                </DrawerHeader>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Track Name</Label>
                                                        <Input
                                                            defaultValue={track.name}
                                                            onChange={e => {
                                                                setEditingMusicId(track._id);
                                                                setNewMusic(p => ({ ...p, name: e.target.value }));
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Artist</Label>
                                                        <Input
                                                            defaultValue={track.artist}
                                                            onChange={e => {
                                                                setEditingMusicId(track._id);
                                                                setNewMusic(p => ({ ...p, artist: e.target.value }));
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Duration (s)</Label>
                                                        <Input
                                                            type="number"
                                                            defaultValue={track.duration}
                                                            onChange={e => {
                                                                setEditingMusicId(track._id);
                                                                setNewMusic(p => ({ ...p, duration: parseInt(e.target.value) }));
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2 py-4">
                                                        <input
                                                            type="checkbox"
                                                            id={`music-premium-${track._id}`}
                                                            defaultChecked={track.isPremium}
                                                            onChange={e => {
                                                                setEditingMusicId(track._id);
                                                                setNewMusic(p => ({ ...p, isPremium: e.target.checked }));
                                                            }}
                                                            className="rounded bg-white/5 border-zinc-200"
                                                        />
                                                        <Label htmlFor={`music-premium-${track._id}`}>Premium Asset</Label>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-6">
                                                    <DrawerClose asChild>
                                                        <Button variant="outline" className="flex-1">Cancel</Button>
                                                    </DrawerClose>
                                                    <Button
                                                        className="flex-1 bg-zinc-900 text-white"
                                                        onClick={async () => {
                                                            const success = await safeMutation(updateMusic, {
                                                                id: track._id,
                                                                name: newMusic.name || track.name,
                                                                artist: newMusic.artist || track.artist,
                                                                duration: newMusic.duration !== undefined ? newMusic.duration : track.duration,
                                                                isPremium: newMusic.isPremium !== undefined ? newMusic.isPremium : (track.isPremium || false),
                                                                price: newMusic.price !== undefined ? newMusic.price : (track.price || 0)
                                                            }, "Music updated");
                                                            if (success) {
                                                                setEditingName("");
                                                                setEditingMusicId(null);
                                                            }
                                                        }}
                                                    >
                                                        Save Changes
                                                    </Button>
                                                </div>
                                            </div>
                                        </DrawerContent>

                                    </Drawer>
                                ))}
                            </div>
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
                                    <Button size="sm" className="bg-zinc-900 hover:bg-zinc-800 text-white h-9 w-9 sm:w-auto sm:h-8 p-0 sm:px-3">
                                        <Plus className="h-4 w-4" />
                                        <span className="hidden sm:inline ml-1">Add Pattern</span>
                                    </Button>
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
                            {/* Desktop Table */}
                            <div className="hidden sm:block">
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
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn("h-8 w-8 border transition-colors", pattern.isDefault ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : "bg-transparent hover:bg-zinc-100 border-transparent")}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            safeMutation(setDefaultAsset, { id: pattern._id, table: "globalPatterns" }, "Default updated");
                                                        }}
                                                    >
                                                        <Star className={cn("h-4 w-4", pattern.isDefault ? "text-amber-500 fill-amber-500" : "text-zinc-400")} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => safeMutation(removePattern, { id: pattern._id }, "Pattern removed")}><Trash2 className="h-4 w-4" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="sm:hidden divide-y divide-zinc-100">
                                {patterns.map((pattern: any) => (
                                    <Drawer key={pattern._id}>
                                        <DrawerTrigger asChild>
                                            <div className="p-4 space-y-2 cursor-pointer active:bg-zinc-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-bold text-zinc-900">{pattern.name}</p>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn("h-8 w-8 border transition-colors", pattern.isDefault ? "bg-amber-50 border-amber-200 hover:bg-amber-100" : "bg-transparent hover:bg-zinc-100 border-transparent")}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                safeMutation(setDefaultAsset, { id: pattern._id, table: "globalPatterns" }, "Default updated");
                                                            }}
                                                        >
                                                            <Star className={cn("h-4 w-4", pattern.isDefault ? "text-amber-500 fill-amber-500" : "text-zinc-400")} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                safeMutation(removePattern, { id: pattern._id }, "Pattern removed");
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between bg-zinc-50 p-2 rounded-lg border border-zinc-100/50">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-zinc-500 uppercase font-black">{pattern.type || "fall"}</span>
                                                    </div>
                                                    <div className="text-2xl">{pattern.emojis?.join(" ")}</div>
                                                </div>
                                            </div>
                                        </DrawerTrigger>


                                        <DrawerContent className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[20px] p-6 outline-none z-50 max-h-[92vh] overflow-y-auto">

                                            <div className="space-y-6">
                                                <DrawerHeader className="text-left">
                                                    <DrawerTitle>Edit Effect</DrawerTitle>
                                                    <DrawerDescription>Configure pattern behavior and emojis.</DrawerDescription>
                                                </DrawerHeader>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Display Name</Label>
                                                        <Input
                                                            defaultValue={pattern.name}
                                                            onChange={e => {
                                                                setEditingPatternId(pattern._id);
                                                                setNewPattern(p => ({ ...p, name: e.target.value }));
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Emojis (comma separated)</Label>
                                                            <Input
                                                                defaultValue={pattern.emojis?.join(", ")}
                                                                onChange={e => {
                                                                    setEditingPatternId(pattern._id);
                                                                    setNewPattern(p => ({ ...p, emojis: e.target.value }));
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Behavior</Label>
                                                            <Select
                                                                defaultValue={pattern.type}
                                                                onValueChange={val => {
                                                                    setEditingPatternId(pattern._id);
                                                                    setNewPattern(p => ({ ...p, type: val as any }));
                                                                }}
                                                            >
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="falling">Falling</SelectItem>
                                                                    <SelectItem value="rising">Rising</SelectItem>
                                                                    <SelectItem value="drift">Drift</SelectItem>
                                                                    <SelectItem value="burst">Burst</SelectItem>
                                                                    <SelectItem value="static">Static</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 py-4">
                                                        <input
                                                            type="checkbox"
                                                            id={`pattern-premium-${pattern._id}`}
                                                            defaultChecked={pattern.isPremium}
                                                            onChange={e => {
                                                                setEditingPatternId(pattern._id);
                                                                setNewPattern(p => ({ ...p, isPremium: e.target.checked }));
                                                            }}
                                                            className="rounded bg-white/5 border-zinc-200"
                                                        />
                                                        <Label htmlFor={`pattern-premium-${pattern._id}`}>Premium Asset</Label>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-6">
                                                    <DrawerClose asChild>
                                                        <Button variant="outline" className="flex-1">Cancel</Button>
                                                    </DrawerClose>
                                                    <Button
                                                        className="flex-1 bg-zinc-900 text-white"
                                                        onClick={async () => {
                                                            const success = await safeMutation(updatePattern, {
                                                                id: pattern._id,
                                                                name: newPattern.name || pattern.name,
                                                                emojis: newPattern.emojis || pattern.emojis?.join(", "),
                                                                type: (newPattern.type || pattern.type) as any,
                                                                isPremium: newPattern.isPremium !== undefined ? newPattern.isPremium : (pattern.isPremium || false),
                                                                price: newPattern.price !== undefined ? newPattern.price : (pattern.price || 0)
                                                            }, "Pattern updated");
                                                            if (success) {
                                                                setEditingPatternId(null);
                                                            }
                                                        }}
                                                    >
                                                        Save Changes
                                                    </Button>
                                                </div>
                                            </div>
                                        </DrawerContent>

                                    </Drawer>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}
