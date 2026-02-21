export interface FontDefinition {
    name: string;
    family: string;
    category: "sans-serif" | "serif" | "display" | "handwriting";
    weights: string[];
}

export const FONTS: Record<string, FontDefinition> = {
    Default: { name: "Default", family: "Inter", category: "sans-serif", weights: ["400", "700"] },
    Elegant: { name: "Elegant", family: "Gellix", category: "serif", weights: ["400", "700"] }, // Fallback to Gellix/Georgia if needed
    Handwritten: { name: "Handwritten", family: "Caveat", category: "handwriting", weights: ["400", "700"] },
    Playful: { name: "Playful", family: "Comic Neue", category: "display", weights: ["400", "700"] },
    Modern: { name: "Modern", family: "Inter", category: "sans-serif", weights: ["400", "700"] },
    Romantic: { name: "Romantic", family: "Playfair Display", category: "serif", weights: ["400", "700"] },
    Dancing: { name: "Dancing", family: "Dancing Script", category: "handwriting", weights: ["400", "700"] },
    Dreamy: { name: "Dreamy", family: "Pacifico", category: "handwriting", weights: ["400"] },
    Graceful: { name: "Graceful", family: "Great Vibes", category: "handwriting", weights: ["400"] },
    Casual: { name: "Casual", family: "Satisfy", category: "handwriting", weights: ["400"] },
    Calligraphy: { name: "Calligraphy", family: "Tangerine", category: "handwriting", weights: ["400", "700"] },
    Rounded: { name: "Rounded", family: "Quicksand", category: "sans-serif", weights: ["400", "700"] },
    Classic: { name: "Classic", family: "Lora", category: "serif", weights: ["400", "700"] },
    Signature: { name: "Signature", family: "Sacramento", category: "handwriting", weights: ["400"] },
};

export const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Comic+Neue:wght@400;700&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Inter:wght@400;700&family=Lora:wght@400;700&family=Pacifico&family=Playfair+Display:wght@400;700&family=Quicksand:wght@400;700&family=Sacramento&family=Satisfy&family=Tangerine:wght@400;700&display=swap";
