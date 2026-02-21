import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Loader2, Play } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";


interface AssetPickerProps {
    selectedIds: string[];
    onToggle: (id: string) => void;
}

export const CharacterPicker = ({ selectedIds, onToggle }: AssetPickerProps) => {
    const characters = useQuery(api.characters.list);

    if (!characters) return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {characters.map((char) => (
                <Card
                    key={char._id}
                    className={`relative overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 ${selectedIds.includes(char._id) ? 'ring-2 ring-primary' : 'bg-zinc-50/50'}`}
                    onClick={() => onToggle(char._id)}
                >
                    <CardContent className="p-3 flex flex-col items-center gap-2">
                        <div className="aspect-square w-full rounded-lg bg-white p-1 flex items-center justify-center border">
                            <img src={char.url} alt={char.name} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="flex items-center gap-2 w-full">
                            <Checkbox
                                id={`char-${char._id}`}
                                checked={selectedIds.includes(char._id)}
                                onCheckedChange={() => onToggle(char._id)}
                            />
                            <Label htmlFor={`char-${char._id}`} className="text-[10px] font-medium truncate cursor-pointer">
                                {char.name}
                            </Label>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export const MusicPicker = ({ selectedIds, onToggle }: AssetPickerProps) => {
    const tracks = useQuery(api.music.list);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = (e: React.MouseEvent, trackId: string, url?: string) => {
        e.stopPropagation();
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

    if (!tracks) return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>;

    return (
        <div className="space-y-2">
            {tracks.map((track) => (
                <div
                    key={track._id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer hover:bg-zinc-50 ${selectedIds.includes(track._id) ? 'border-primary bg-primary/5' : 'bg-white'}`}
                    onClick={() => onToggle(track._id)}
                >
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                                playingId === track._id ? "bg-rose-50 text-rose-600" : "bg-zinc-100 text-zinc-500"
                            )}
                            onClick={(e) => togglePlay(e, track._id, track.url)}
                        >
                            {playingId === track._id ? (
                                <div className="flex gap-0.5 items-end h-3">
                                    <div className="w-0.5 bg-current animate-[music-bar_0.6s_ease-in-out_infinite]" style={{ height: '40%' }} />
                                    <div className="w-0.5 bg-current animate-[music-bar_0.8s_ease-in-out_infinite]" style={{ height: '100%' }} />
                                    <div className="w-0.5 bg-current animate-[music-bar_0.7s_ease-in-out_infinite]" style={{ height: '60%' }} />
                                </div>
                            ) : (
                                <Music className="h-5 w-5" />
                            )}
                        </Button>
                        <div>
                            <p className="text-sm font-semibold text-zinc-900">{track.name}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{track.artist}</p>
                        </div>
                    </div>
                    <Checkbox
                        checked={selectedIds.includes(track._id)}
                        onCheckedChange={() => onToggle(track._id)}
                    />
                </div>
            ))}
        </div>
    );
};


export const ThemePresetPicker = ({ selectedIds, onToggle }: AssetPickerProps) => {
    const themes = useQuery(api.themes.list);

    if (!themes) return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {themes.map((theme) => (
                <Card
                    key={theme._id}
                    className={`relative overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 ${selectedIds.includes(theme._id) ? 'ring-2 ring-primary' : 'bg-zinc-50/50'}`}
                    onClick={() => onToggle(theme._id)}
                >
                    <CardContent className="p-3 flex flex-col items-center gap-2">
                        <div
                            className="w-full aspect-video rounded-lg border border-black/5"
                            style={{
                                background: `
                                    radial-gradient(circle at 50% 0%, ${theme.glowColor || "#ffffff"}, transparent 70%),
                                    ${theme.baseColor || "#ffffff"}
                                `
                            }}
                        />
                        <div className="flex items-center gap-2 w-full">
                            <Checkbox
                                id={`theme-${theme._id}`}
                                checked={selectedIds.includes(theme._id)}
                                onCheckedChange={() => onToggle(theme._id)}
                            />
                            <Label htmlFor={`theme-${theme._id}`} className="text-[10px] font-medium truncate cursor-pointer uppercase tracking-wide">
                                {theme.name}
                            </Label>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

    );
};

export const FontPicker = ({ selectedIds, onToggle }: AssetPickerProps) => {
    const fonts = useQuery(api.fonts.list);

    if (!fonts) return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>;

    return (
        <div className="space-y-2">
            {fonts.map((font) => (
                <div
                    key={font._id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer hover:bg-zinc-50 ${selectedIds.includes(font._id) ? 'border-primary bg-primary/5' : 'bg-white'}`}
                    onClick={() => onToggle(font._id)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-lg text-zinc-700`} style={{ fontFamily: font.name }}>
                            Ag
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-zinc-900" style={{ fontFamily: font.name }}>{font.name}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{font.storageId ? "Custom" : "Google"}</p>
                        </div>
                    </div>
                    <Checkbox
                        checked={selectedIds.includes(font._id)}
                        onCheckedChange={() => onToggle(font._id)}
                    />
                </div>
            ))}
        </div>
    );
};
export const PatternPicker = ({ selectedIds, onToggle }: AssetPickerProps) => {
    const patterns = useQuery(api.patterns.list);

    if (!patterns) return <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {patterns.map((pattern) => (
                <div
                    key={pattern._id}
                    className={`relative cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 rounded-xl border p-3 flex flex-col items-center gap-2 ${selectedIds.includes(pattern.id) ? 'ring-2 ring-primary bg-primary/5 border-primary' : 'bg-white'}`}
                    onClick={() => onToggle(pattern.id)}
                >
                    <div className="text-3xl">{pattern.emojis?.join(" ")}</div>
                    <div className="flex items-center gap-2 w-full justify-center">
                        <Checkbox
                            id={`pattern-${pattern.id}`}
                            checked={selectedIds.includes(pattern.id)}
                            onCheckedChange={() => onToggle(pattern.id)}
                        />
                        <Label htmlFor={`pattern-${pattern.id}`} className="text-xs font-medium truncate cursor-pointer">
                            {pattern.name}
                        </Label>
                    </div>
                </div>
            ))}
        </div>
    );
};
