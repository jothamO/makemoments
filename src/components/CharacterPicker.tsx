import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";

interface CharacterPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    selectedUrl?: string;
    characters: string[];
    theme: {
        primary: string;
        secondary: string;
    };
    photoCount?: number;
    multiImagePrice?: number;
}

export function CharacterPicker({
    isOpen,
    onClose,
    onSelect,
    selectedUrl,
    characters,
    theme,
    photoCount = 0,
    multiImagePrice = 0,
}: CharacterPickerProps) {
    const { symbol } = useCurrency();

    if (!isOpen) return null;

    const handleUpload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    onSelect(reader.result as string);
                    onClose();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="font-bold text-xl">Add a photo</h3>
                        <p className="text-sm text-zinc-500">Choose a cute character</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {photoCount >= 1 && (
                    <div className="px-6 py-2.5 bg-zinc-950 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                            <p className="text-[11px] font-bold text-white uppercase tracking-wider">
                                Multi-Image Upgrade
                            </p>
                        </div>
                        <span className="text-xs font-medium text-white/60">
                            Add up to 3 for {symbol}{multiImagePrice.toLocaleString()}
                        </span>
                    </div>
                )}

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-4 gap-4">
                        {characters.map((url, idx) => (
                            <motion.button
                                key={idx}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    if (selectedUrl === url) {
                                        onSelect(""); // Toggle off
                                    } else {
                                        onSelect(url); // Select instantly
                                    }
                                }}
                                className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${selectedUrl === url
                                    ? "border-pink-500 ring-2 ring-pink-500/20"
                                    : "border-zinc-100 hover:border-zinc-200"
                                    }`}
                            >
                                <img
                                    src={url}
                                    alt={`Character ${idx}`}
                                    className="w-full h-full object-cover"
                                />
                                {selectedUrl === url && (
                                    <div className="absolute inset-0 bg-pink-500/10 flex items-center justify-center">
                                        <div className="bg-pink-500 text-white rounded-full p-1 shadow-lg">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t bg-zinc-50/50">
                    <Button
                        variant="ghost"
                        onClick={handleUpload}
                        className="w-full h-14 rounded-full text-lg font-bold text-zinc-600 border-2 border-zinc-200"
                    >
                        <Upload className="mr-2 w-5 h-5" />
                        Upload from gallery
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
