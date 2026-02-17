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
import { Plus, Trash2, Edit, Music as MusicIcon, Sparkles, Type, Upload, Loader2, User, X, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function FilesPage() {
    const { toast } = useToast();

    // ── Queries ──
    const themes = useQuery(api.themes.list) || [];
    const fonts = useQuery(api.fonts.list) || [];
    const music = useQuery(api.music.list) || [];
    const patterns = useQuery(api.patterns.list) || [];
    const characters = useQuery(api.characters.list) || [];

    // ── Mutations ──
    const createTheme = useMutation(api.themes.create);
    const removeTheme = useMutation(api.themes.remove);
    const createFont = useMutation(api.fonts.create);
    const removeFont = useMutation(api.fonts.remove);
    const generateFontUploadUrl = useMutation(api.fonts.generateUploadUrl);
    const createMusic = useMutation(api.music.create);
    const removeMusic = useMutation(api.music.remove);
    const renameMusic = useMutation(api.music.rename);
    const generateUploadUrl = useMutation(api.music.generateUploadUrl);
    const createPattern = useMutation(api.patterns.create);
    const updatePattern = useMutation(api.patterns.update);
    const removePattern = useMutation(api.patterns.remove);
    const createCharacter = useMutation(api.characters.create);
    const removeCharacter = useMutation(api.characters.remove);
    const generateCharacterUploadUrl = useMutation(api.characters.generateUploadUrl);

    // ── Refs ──
    const musicFileRef = useRef<HTMLInputElement>(null);
    const fontFileRef = useRef<HTMLInputElement>(null);
    const charFilesRef = useRef<HTMLInputElement>(null);

    // ── State ──
    const [isUploading, setIsUploading] = useState(false);
    const [editingMusicId, setEditingMusicId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const [isThemeOpen, setIsThemeOpen] = useState(false);
    const [isFontOpen, setIsFontOpen] = useState(false);
    const [isMusicOpen, setIsMusicOpen] = useState(false);
    const [isPatternOpen, setIsPatternOpen] = useState(false);

    const [newTheme, setNewTheme] = useState({
        name: "", primary: "#f4f4f5", secondary: "#e4e4e7", accent: "#3f3f46",
        bgGradientStart: "#f4f4f5", bgGradientEnd: "#e4e4e7",
        textDark: "#18181b", textLight: "#ffffff",
    });
    const [newFont, setNewFont] = useState({ name: "", isCustom: false });
    const [newPattern, setNewPattern] = useState({ id: "", name: "", emoji: "", type: "falling" });
    const [editingPatternId, setEditingPatternId] = useState<string | null>(null);
    const [newMusic, setNewMusic] = useState({ name: "", artist: "", duration: 180, url: "" });

    // ── Handlers ──

    const handleAddTheme = async () => {
        if (!newTheme.name) return toast({ title: "Name required", variant: "destructive" });
        await createTheme({ ...newTheme });
        setIsThemeOpen(false);
        setNewTheme({
            name: "", primary: "#f4f4f5", secondary: "#e4e4e7", accent: "#3f3f46",
            bgGradientStart: "#f4f4f5", bgGradientEnd: "#e4e4e7", textDark: "#18181b", textLight: "#ffffff",
        });
        toast({ title: "Theme added" });
    };

    const handleAddFont = async () => {
        if (!newFont.name) return toast({ title: "Name required", variant: "destructive" });
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
        await createFont({ ...newFont, storageId });
        setIsFontOpen(false);
        setIsUploading(false);
        setNewFont({ name: "", isCustom: false });
        toast({ title: "Font added" });
    };

    const handleAddPattern = async () => {
        if (!newPattern.id || !newPattern.name) return toast({ title: "ID and Name required", variant: "destructive" });

        if (editingPatternId) {
            await updatePattern({
                id: editingPatternId as any,
                name: newPattern.name,
                emoji: newPattern.emoji,
                type: newPattern.type as any
            });
            toast({ title: "Pattern updated" });
        } else {
            await createPattern(newPattern as any);
            toast({ title: "Pattern added" });
        }

        setIsPatternOpen(false);
        setNewPattern({ id: "", name: "", emoji: "", type: "falling" });
        setEditingPatternId(null);
    };

    const handleAddMusic = async () => {
        if (!newMusic.name || !newMusic.artist) return toast({ title: "Name and Artist required", variant: "destructive" });
        let storageId = undefined;
        if (musicFileRef.current?.files?.[0]) {
            setIsUploading(true);
            try {
                const postUrl = await generateUploadUrl();
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": musicFileRef.current.files[0].type },
                    body: musicFileRef.current.files[0],
                });
                const { storageId: sId } = await result.json();
                storageId = sId;
            } catch {
                toast({ title: "Upload failed", variant: "destructive" });
                setIsUploading(false);
                return;
            }
        }
        await createMusic({ ...newMusic, storageId });
        setIsMusicOpen(false);
        setIsUploading(false);
        setNewMusic({ name: "", artist: "", duration: 180, url: "" });
        toast({ title: "Music track added" });
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
        } catch {
            toast({ title: "Upload failed", variant: "destructive" });
        }
        setIsUploading(false);
    };

    // ── Render ──

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Global Assets</h1>
            </div>

            <Tabs defaultValue="themes" className="space-y-4">
                <TabsList className="bg-zinc-100 p-1">
                    <TabsTrigger value="themes" className="gap-2"><Sparkles className="h-4 w-4" /> Themes</TabsTrigger>
                    <TabsTrigger value="fonts" className="gap-2"><Type className="h-4 w-4" /> Fonts</TabsTrigger>
                    <TabsTrigger value="characters" className="gap-2"><User className="h-4 w-4" /> Characters</TabsTrigger>
                    <TabsTrigger value="music" className="gap-2"><MusicIcon className="h-4 w-4" /> Music</TabsTrigger>
                    <TabsTrigger value="patterns" className="gap-2"><ImageIcon className="h-4 w-4" /> Slide Effects</TabsTrigger>
                </TabsList>

                {/* ── Themes ── */}
                <TabsContent value="themes">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Editor Themes</CardTitle>
                            <Dialog open={isThemeOpen} onOpenChange={setIsThemeOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Theme</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader><DialogTitle>Add Global Theme</DialogTitle></DialogHeader>
                                    <div className="grid grid-cols-2 gap-6 py-4">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Theme Name</Label>
                                                <Input value={newTheme.name} onChange={e => setNewTheme(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Lavender" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Primary Color</Label>
                                                    <div className="flex gap-2">
                                                        <Input type="color" className="p-1 h-9 w-12" value={newTheme.primary} onChange={e => setNewTheme(p => ({ ...p, primary: e.target.value }))} />
                                                        <Input value={newTheme.primary} onChange={e => setNewTheme(p => ({ ...p, primary: e.target.value }))} className="flex-1 font-mono uppercase text-xs" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Secondary Color</Label>
                                                    <div className="flex gap-2">
                                                        <Input type="color" className="p-1 h-9 w-12" value={newTheme.secondary} onChange={e => setNewTheme(p => ({ ...p, secondary: e.target.value }))} />
                                                        <Input value={newTheme.secondary} onChange={e => setNewTheme(p => ({ ...p, secondary: e.target.value }))} className="flex-1 font-mono uppercase text-xs" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Accent Color</Label>
                                                <div className="flex gap-2">
                                                    <Input type="color" className="p-1 h-9 w-12" value={newTheme.accent} onChange={e => setNewTheme(p => ({ ...p, accent: e.target.value }))} />
                                                    <Input value={newTheme.accent} onChange={e => setNewTheme(p => ({ ...p, accent: e.target.value }))} className="flex-1 font-mono uppercase text-xs" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>BG Gradient Start</Label>
                                                    <Input type="color" className="p-1 h-9 w-full" value={newTheme.bgGradientStart} onChange={e => setNewTheme(p => ({ ...p, bgGradientStart: e.target.value }))} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>BG Gradient End</Label>
                                                    <Input type="color" className="p-1 h-9 w-full" value={newTheme.bgGradientEnd} onChange={e => setNewTheme(p => ({ ...p, bgGradientEnd: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Text Dark</Label>
                                                    <Input type="color" className="p-1 h-9 w-full" value={newTheme.textDark} onChange={e => setNewTheme(p => ({ ...p, textDark: e.target.value }))} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Text Light</Label>
                                                    <Input type="color" className="p-1 h-9 w-full" value={newTheme.textLight} onChange={e => setNewTheme(p => ({ ...p, textLight: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 justify-center h-full min-h-[120px]">
                                                <div
                                                    className="w-12 h-12 rounded-lg border border-white/10"
                                                    style={{ background: `linear-gradient(135deg, ${newTheme.primary}, ${newTheme.secondary})` }}
                                                />
                                                <span className="text-white font-medium text-xs">{newTheme.name || "Preview"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddTheme} className="w-full">Create Theme</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                {themes.map((theme) => (
                                    <div key={theme._id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border group relative">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-8 h-8 rounded-lg border border-black/5 shrink-0"
                                                style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
                                            />
                                            <div>
                                                <p className="font-semibold text-zinc-900 text-sm">{theme.name}</p>
                                                <p className="text-[10px] font-mono text-zinc-500 uppercase">{theme.primary} / {theme.secondary}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={() => removeTheme({ id: theme._id })}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Fonts ── */}
                <TabsContent value="fonts">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Available Fonts</CardTitle>
                            <Dialog open={isFontOpen} onOpenChange={setIsFontOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Font</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Register Font</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Font Family Name</Label>
                                            <Input value={newFont.name} onChange={e => setNewFont(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Playfair Display" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Upload Font File (Optional)</Label>
                                            <Input type="file" ref={fontFileRef} accept=".ttf,.otf,.woff,.woff2" onChange={() => setNewFont(p => ({ ...p, isCustom: true }))} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddFont} className="w-full" disabled={isUploading}>
                                            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Register Font"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Preview</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fonts.map((font) => (
                                        <TableRow key={font._id} style={{ fontFamily: font.name }}>
                                            <TableCell className="font-medium">{font.name}</TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                    font.storageId ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                                                )}>
                                                    {font.storageId ? "Custom" : "Google"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-lg">The quick brown fox</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => removeFont({ id: font._id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Characters ── */}
                <TabsContent value="characters">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Character Library</CardTitle>
                            <div>
                                <input type="file" ref={charFilesRef} multiple className="hidden" onChange={handleAddCharacters} accept="image/*" />
                                <Button size="sm" onClick={() => charFilesRef.current?.click()} disabled={isUploading}>
                                    {isUploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                                    Upload Characters
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {characters.length === 0 ? (
                                <p className="text-center text-sm text-zinc-400 py-8">No characters uploaded yet. Click "Upload Characters" to add some.</p>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-4">
                                    {characters.map((char) => (
                                        <div key={char._id} className="relative group rounded-2xl border bg-zinc-50 p-2 flex flex-col items-center gap-2">
                                            <div className="aspect-square w-full flex items-center justify-center">
                                                <img src={char.url} alt={char.name} className="max-w-full max-h-full object-contain" />
                                            </div>
                                            <p className="text-[10px] font-medium text-zinc-600 truncate w-full text-center">{char.name}</p>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeCharacter({ id: char._id })}
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
                <TabsContent value="music">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Music Library</CardTitle>
                            <Dialog open={isMusicOpen} onOpenChange={setIsMusicOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Music</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Register Music Track</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Track Name</Label>
                                            <Input value={newMusic.name} onChange={e => setNewMusic(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Sunset Vibes" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Artist</Label>
                                            <Input value={newMusic.artist} onChange={e => setNewMusic(p => ({ ...p, artist: e.target.value }))} placeholder="e.g. LoFi Girl" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Duration (seconds)</Label>
                                                <Input type="number" value={newMusic.duration} onChange={e => setNewMusic(p => ({ ...p, duration: parseInt(e.target.value) || 0 }))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Static URL (optional)</Label>
                                                <Input value={newMusic.url} onChange={e => setNewMusic(p => ({ ...p, url: e.target.value }))} placeholder="/music/track.mp3" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Upload MP3 (Optional)</Label>
                                            <Input type="file" ref={musicFileRef} accept="audio/mpeg" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddMusic} className="w-full" disabled={isUploading}>
                                            {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Register Track"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Track Name</TableHead>
                                        <TableHead>Artist</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {music.map((track) => (
                                        <TableRow key={track._id}>
                                            <TableCell className="font-medium">
                                                {editingMusicId === track._id ? (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            className="h-8 py-0"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    renameMusic({ id: track._id as any, name: editingName });
                                                                    setEditingMusicId(null);
                                                                    toast({ title: "Track renamed" });
                                                                }
                                                            }}
                                                        />
                                                        <Button size="sm" className="h-8 px-2" onClick={async () => {
                                                            await renameMusic({ id: track._id as any, name: editingName });
                                                            setEditingMusicId(null);
                                                            toast({ title: "Track renamed" });
                                                        }}>Save</Button>
                                                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setEditingMusicId(null)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {track.name}
                                                        <Button variant="ghost" size="icon" className="h-4 w-4 opacity-20 hover:opacity-100" onClick={() => {
                                                            setEditingMusicId(track._id);
                                                            setEditingName(track.name);
                                                        }}>
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{track.artist}</TableCell>
                                            <TableCell>{track.duration}s</TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                    track.storageId ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                                                )}>
                                                    {track.storageId ? "Convex" : "Local"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeMusic({ id: track._id })}>
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
                <TabsContent value="patterns">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Slide Patterns (Effects)</CardTitle>
                            <Dialog open={isPatternOpen} onOpenChange={(open) => {
                                setIsPatternOpen(open);
                                if (!open) {
                                    setNewPattern({ id: "", name: "", emoji: "", type: "falling" });
                                    setEditingPatternId(null);
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Pattern</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>{editingPatternId ? "Edit Pattern" : "Add Pattern Style"}</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Unique ID</Label>
                                            <Input
                                                value={newPattern.id}
                                                onChange={e => setNewPattern(p => ({ ...p, id: e.target.value }))}
                                                placeholder="e.g. hearts-fast"
                                                disabled={!!editingPatternId}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Display Name</Label>
                                            <Input value={newPattern.name} onChange={e => setNewPattern(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Rapid Hearts" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Emoji(s)</Label>
                                                <Input value={newPattern.emoji} onChange={e => setNewPattern(p => ({ ...p, emoji: e.target.value }))} placeholder="e.g. 💖,✨" />
                                                <p className="text-[10px] text-zinc-500">Comma separate for multiple</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Behavior</Label>
                                                <Select value={newPattern.type} onValueChange={(val) => setNewPattern(p => ({ ...p, type: val }))}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="falling">Falling (Rain)</SelectItem>
                                                        <SelectItem value="rising">Rising (Balloons)</SelectItem>
                                                        <SelectItem value="floating">Floating (Ghosts)</SelectItem>
                                                        <SelectItem value="static">Static (Stars)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter><Button onClick={handleAddPattern} className="w-full">{editingPatternId ? "Save Changes" : "Create Pattern"}</Button></DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Emoji</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {patterns.map((pattern) => (
                                        <TableRow key={pattern._id}>
                                            <TableCell className="font-mono text-xs font-bold">{pattern.id}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{pattern.name}</span>
                                                    <span className="text-[10px] text-zinc-400 capitalize">{pattern.type || "falling"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-2xl">{pattern.emoji}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        setNewPattern({
                                                            id: pattern.id,
                                                            name: pattern.name,
                                                            emoji: pattern.emoji,
                                                            type: pattern.type || "falling"
                                                        });
                                                        setEditingPatternId(pattern._id);
                                                        setIsPatternOpen(true);
                                                    }}>
                                                        <Edit className="h-4 w-4 text-zinc-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => removePattern({ id: pattern._id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
