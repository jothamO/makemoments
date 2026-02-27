import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "./use-toast";

/**
 * A hook for managing audio playback with standardized error handling and track state.
 */
export function useAudioPlayer() {
    const { toast } = useToast();
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = useCallback(async (trackId: string, url?: string) => {
        if (!url) return;

        try {
            if (playingId === trackId) {
                audioRef.current?.pause();
                setPlayingId(null);
            } else {
                if (!audioRef.current) {
                    audioRef.current = new Audio();
                    audioRef.current.onended = () => setPlayingId(null);
                }

                // If playing something else, pause it first
                if (playingId) {
                    audioRef.current.pause();
                }

                audioRef.current.src = url;
                await audioRef.current.play();
                setPlayingId(trackId);

                audioRef.current.onerror = () => {
                    toast({
                        title: "Playback failed",
                        description: "Could not load the audio file. The link might be broken.",
                        variant: "destructive"
                    });
                    setPlayingId(null);
                };
            }
        } catch (error: any) {
            console.error("Playback error:", error);
            toast({
                title: "Playback blocked",
                description: "The browser blocked playback or the file is missing.",
                variant: "destructive"
            });
            setPlayingId(null);
        }
    }, [playingId, toast]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    return { playingId, setPlayingId, togglePlay };
}
