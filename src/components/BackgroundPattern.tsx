import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

interface BackgroundPatternProps {
    pattern: string; // This is the ID
    customEmojis?: string[]; // Legacy: array of strings. New: array with one comma-sep string maybe?
    type?: "falling" | "rising" | "floating" | "static"; // New prop
}

export function BackgroundPattern({ pattern, customEmojis, type = "falling" }: BackgroundPatternProps) {
    const [elements, setElements] = useState<{ id: number; x: number; y: number; delay: number; duration: number; emoji: string; scale: number; drift: number; rotationDuration: number; rotationDir: number }[]>([]);

    // 1. Determine the emoji set
    const emojis = useMemo(() => {
        // If customEmojis passed (dynamic from DB), use them
        // The DB might return ["👻,🎃"] or ["👻", "🎃"] depending on how we parse it upstream
        // Let's handle both array of strings and comma-separated strings
        if (customEmojis && customEmojis.length > 0) {
            // Flatten and split any comma-separated strings
            return customEmojis.flatMap(e => e.split(',').map(s => s.trim()));
        }

        // Fallback hardcoded (legacy support)
        if (pattern === "floral" || pattern === "falling-flowers") return ["🌸", "🌺", "🌹", "🌷"];
        if (pattern === "hearts") return ["💖", "💗", "💓", "💝"];
        if (pattern === "stars") return ["⭐", "🌟", "✨"];
        if (pattern === "celebration") return ["🎉", "🎊", "🎈"];
        if (pattern === "geometric") return ["💠", "🔶", "🔷"];
        if (pattern === "fire") return ["🔥", "🧡", "💥"];
        if (pattern === "crowns") return ["👑", "💎", "👸"];
        if (pattern === "balloons") return ["🎈", "🪁", "🔮"];
        if (pattern === "halloween") return ["👻", "🎃", "🕸️"];

        return ["✨"];
    }, [pattern, customEmojis]);

    // 2. Determine Animation Variants
    // We generate random elements, but their animation depends on 'type'
    useEffect(() => {
        const count = 20; // Increased count for better density
        const newElements = Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100, // Horizontal position
            y: Math.random() * 100, // Vertical position (for floating/static)
            delay: Math.random() * 20,
            duration: 10 + Math.random() * 20, // Slower, more varied duration
            scale: 0.5 + Math.random() * 1.0, // More varied scale
            emoji: emojis[i % emojis.length],
            drift: (Math.random() - 0.5) * 50, // Random Horizontal Drift (-25px to 25px equivalent)
            rotationDuration: 15 + Math.random() * 30, // Slow, varying rotation
            rotationDir: Math.random() > 0.5 ? 1 : -1,
        }));
        setElements(newElements);
    }, [emojis]); // Re-run if emojis change

    // Render based on type
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {elements.map((el) => {
                // Falling: Top -> Bottom with Sway
                if (type === "falling") {
                    return (
                        <motion.div
                            key={el.id}
                            className="absolute text-3xl opacity-20 sm:opacity-30"
                            initial={{ top: "-10%", left: `${el.x}%`, x: 0, rotate: 0 }}
                            animate={{
                                top: "110%",
                                x: [0, el.drift, 0], // Gentle sway
                                rotate: 360 * el.rotationDir
                            }}
                            transition={{
                                top: { duration: el.duration, repeat: Infinity, delay: el.delay, ease: "linear" },
                                x: { duration: el.duration / 2, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" },
                                rotate: { duration: el.rotationDuration, repeat: Infinity, ease: "linear" }
                            }}
                        >
                            <div style={{ transform: `scale(${el.scale})` }}>{el.emoji}</div>
                        </motion.div>
                    );
                }

                // Rising: Bottom -> Top with Sway
                if (type === "rising") {
                    return (
                        <motion.div
                            key={el.id}
                            className="absolute text-3xl opacity-20 sm:opacity-30"
                            initial={{ top: "110%", left: `${el.x}%`, x: 0, rotate: 0 }}
                            animate={{
                                top: "-10%",
                                x: [0, el.drift, 0],
                                rotate: 360 * el.rotationDir
                            }}
                            transition={{
                                top: { duration: el.duration, repeat: Infinity, delay: el.delay, ease: "linear" },
                                x: { duration: el.duration / 2, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" },
                                rotate: { duration: el.rotationDuration, repeat: Infinity, ease: "linear" }
                            }}
                        >
                            <div style={{ transform: `scale(${el.scale})` }}>{el.emoji}</div>
                        </motion.div>
                    );
                }

                // Floating: Random drift + pulse
                if (type === "floating") {
                    return (
                        <motion.div
                            key={el.id}
                            className="absolute text-3xl opacity-20 sm:opacity-30"
                            style={{ left: `${el.x}%`, top: `${el.y}%` }}
                            animate={{
                                y: [0, -30, 0],
                                x: [0, 20, -20, 0],
                                scale: [el.scale, el.scale * 1.2, el.scale],
                                opacity: [0.2, 0.4, 0.2]
                            }}
                            transition={{
                                duration: 8 + Math.random() * 5,
                                repeat: Infinity,
                                delay: el.delay,
                                ease: "easeInOut"
                            }}
                        >
                            {el.emoji}
                        </motion.div>
                    );
                }

                // Static: Just placed (maybe slow rotation)
                if (type === "static") {
                    return (
                        <motion.div
                            key={el.id}
                            className="absolute text-3xl opacity-10 sm:opacity-20"
                            style={{ left: `${el.x}%`, top: `${el.y}%` }}
                            animate={{
                                rotate: [0, 10 * el.rotationDir, 0, -10 * el.rotationDir, 0],
                                scale: [el.scale, el.scale * 1.1, el.scale]
                            }}
                            transition={{
                                duration: 10 + Math.random() * 10,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            {el.emoji}
                        </motion.div>
                    );
                }

                return null;
            })}
        </div>
    );
}
