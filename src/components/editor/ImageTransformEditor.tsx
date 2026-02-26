import React, { useEffect, useCallback } from "react";
import { motion, useMotionValue, animate, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageTransform {
    x: number;
    y: number;
    width: number;
    rotation: number;
}

interface ImageTransformEditorProps {
    url: string;
    transform: ImageTransform;
    onUpdate: (transform: ImageTransform) => void;
    onRemove: () => void;
    onSelect: () => void;
    containerRef: React.RefObject<HTMLDivElement>;
    isSelected?: boolean;
}

export function ImageTransformEditor({
    url,
    transform,
    onUpdate,
    onRemove,
    onSelect,
    containerRef,
    isSelected = true,
}: ImageTransformEditorProps) {
    // Layer 1: Live Motion Values (GPU-driven)
    const imgX = useMotionValue(transform.x);
    const imgY = useMotionValue(transform.y);

    // Sync motion values on transform prop change (e.g., slide switch)
    useEffect(() => {
        imgX.set(transform.x);
        imgY.set(transform.y);
    }, [transform.x, transform.y, imgX, imgY]);

    const handleDragEnd = () => {
        let x = Math.round(imgX.get());
        let y = Math.round(imgY.get());

        // Magnetic center assist (±20px)
        if (Math.abs(x) < 20) {
            x = 0;
            animate(imgX, 0, { type: "spring", stiffness: 500, damping: 30 });
        }
        if (Math.abs(y) < 20) {
            y = 0;
            animate(imgY, 0, { type: "spring", stiffness: 500, damping: 30 });
        }

        onUpdate({ ...transform, x, y });
    };

    const handleResizeStart = (e: React.PointerEvent, corner: string) => {
        if (!isSelected) return;
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const startW = transform.width;

        const xDir = corner.includes("w") ? -1 : 1;
        const yDir = corner.includes("n") ? -1 : 1;

        const onMove = (moveEvent: PointerEvent) => {
            const deltaX = (moveEvent.clientX - startX) * xDir;
            const deltaY = (moveEvent.clientY - startY) * yDir;

            // Average X and Y delta for uniform square resize
            // We do NOT divide by 2 because the image is scaled from its center point.
            // Increasing width by 2x ensures the visual corner perfectly tracks 1:1 with the pointer.
            const delta = deltaX + deltaY;
            const newWidth = Math.max(48, Math.min(400, startW + delta));

            onUpdate({
                ...transform,
                width: newWidth,
            });
        };

        const onUp = () => {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
        };

        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
    };

    const handleRotateStart = (e: React.PointerEvent) => {
        if (!isSelected) return;
        e.stopPropagation();
        e.preventDefault();

        const imageEl = (e.currentTarget as HTMLElement).parentElement?.parentElement;
        if (!imageEl) return;

        const rect = imageEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const startAngle = transform.rotation;
        const startPointer = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);

        const onMove = (moveEvent: PointerEvent) => {
            const currentPointer = Math.atan2(moveEvent.clientY - cy, moveEvent.clientX - cx) * (180 / Math.PI);
            let rotation = startAngle + (currentPointer - startPointer);

            // Snap to cardinal angles within 5°
            for (const snap of [0, 90, 180, 270, -90, -180, -270]) {
                if (Math.abs(rotation - snap) < 5) {
                    rotation = snap;
                    break;
                }
            }

            onUpdate({
                ...transform,
                rotation,
            });
        };

        const onUp = () => {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
        };

        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
    };

    const resizeCorners = [
        { class: "-top-2.5 -left-2.5 cursor-nw-resize", id: "nw" },
        { class: "-top-2.5 -right-2.5 cursor-ne-resize", id: "ne" },
        { class: "-bottom-2.5 -left-2.5 cursor-sw-resize", id: "sw" },
        { class: "-bottom-2.5 -right-2.5 cursor-se-resize", id: "se" },
    ];

    return (
        <motion.div
            drag={isSelected}
            dragConstraints={containerRef}
            dragElastic={0.05}
            dragMomentum={false}
            style={{
                x: imgX,
                y: imgY,
                rotate: transform.rotation,
                width: transform.width,
                height: transform.width,
                cursor: isSelected ? "move" : "pointer",
            }}
            onDragEnd={handleDragEnd}
            onPointerDown={(e) => {
                // Stop propagation so background click doesn't deselect
                e.stopPropagation();
            }}
            onTap={(e) => {
                e.stopPropagation();
                if (!isSelected) {
                    onSelect();
                }
            }}
            className="absolute flex items-center justify-center touch-none pointer-events-auto"
        >
            {/* Dashed Border Decoration - Only when selected */}
            {isSelected && (
                <div className="absolute -inset-2 border-2 border-white/50 border-dashed rounded-2xl pointer-events-none" />
            )}

            {/* Actual Image - Flat, no shadow or rounding as requested */}
            <img
                src={url}
                alt=""
                className="w-full h-full object-cover pointer-events-none"
            />

            {/* Resize Handles */}
            <AnimatePresence>
                {isSelected && resizeCorners.map((corner) => (
                    <motion.div
                        key={corner.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        onPointerDown={(e) => handleResizeStart(e, corner.id)}
                        className={cn(
                            "absolute w-5 h-5 bg-white rounded-full shadow-md z-10 border border-black/10 transition-transform hover:scale-125 active:scale-90",
                            corner.class
                        )}
                    />
                ))}
            </AnimatePresence>

            {/* Rotation Handle */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
                    >
                        <div
                            onPointerDown={handleRotateStart}
                            className="w-6 h-6 bg-white rounded-full shadow-md z-10 border border-black/10 flex items-center justify-center cursor-alias hover:scale-125 active:scale-90 transition-transform"
                        >
                            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                        </div>
                        <div className="w-px h-4 bg-white/50" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Button */}
            <AnimatePresence>
                {isSelected && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md z-20 transition-colors active:scale-90"
                    >
                        <X className="w-3 h-3" />
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
