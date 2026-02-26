import React from "react";
import { motion } from "framer-motion";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import { hexToRgba, cn } from "@/lib/utils";
import type { EventTheme } from "@/data/types";
import { EXPRESSIVE_EASE } from "@/lib/animation";

interface EventHeroProps {
    theme: Partial<EventTheme>;
    children: React.ReactNode;
    className?: string;
    isScaled?: boolean;
}

/**
 * A shared visual stage for the Event landing page.
 * Used in both the public Homepage and the Admin Preview.
 */
export const EventHero = ({ theme, children, className, isScaled = false }: EventHeroProps) => {
    const isDark = theme.type === "dark";
    const textMode = theme.textMode || "auto";
    const textColor = textMode === "light" ? "#FFFFFF" :
        textMode === "dark" ? "#18181B" :
            (isDark ? "#FFFFFF" : "#18181B");

    // Opacity constants for visual consistency
    const glowOpacity = isDark ? 0.4 : 0.35;
    const glowColor = theme.glowColor || "#ffffff";
    const baseColor = theme.baseColor || "#E2F0E9";

    return (
        <div
            className={cn(
                "w-full h-full min-h-full flex flex-col items-center justify-center text-center relative overflow-hidden",
                className
            )}
            style={{
                backgroundColor: baseColor,
                backgroundImage: `radial-gradient(circle at 50% 0%, ${hexToRgba(glowColor, glowOpacity)}, transparent 70%)`,
                color: textColor
            }}
        >
            {/* Background Pattern */}
            <BackgroundPattern
                patternId={theme.backgroundPattern || "sparkles"}
            />

            {/* Animated decorative circles */}
            <motion.div
                className={cn(
                    "absolute -top-20 -right-20 rounded-full opacity-20 pointer-events-none",
                    isScaled ? "w-96 h-96" : "w-72 h-72"
                )}
                style={{ background: theme.accent || "transparent" }}
                animate={{ y: [0, -12, 0], x: [0, 6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className={cn(
                    "absolute -bottom-16 -left-16 rounded-full opacity-15 pointer-events-none",
                    isScaled ? "w-72 h-72" : "w-56 h-56"
                )}
                style={{ background: theme.secondary || "transparent" }}
                animate={{ y: [0, 10, 0], x: [0, -8, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Slide Content wrapper */}
            <div className="relative z-20 w-full h-full flex flex-col items-center justify-center py-12">
                {children}
            </div>
        </div>
    );
};
