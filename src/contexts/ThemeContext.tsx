import React, { createContext, useContext, useEffect, useState } from "react";
import { getActiveEvent } from "@/data/data-service";
import type { CelebrationEvent, EventTheme } from "@/data/types";

interface ThemeContextValue {
  event: CelebrationEvent | null;
  theme: EventTheme | null;
}

const ThemeContext = createContext<ThemeContextValue>({ event: null, theme: null });

export const useEventTheme = () => useContext(ThemeContext);

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function loadFont(fontName: string) {
  const id = `font-${fontName.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [event, setEvent] = useState<CelebrationEvent | null>(null);

  useEffect(() => {
    const active = getActiveEvent();
    if (active) setEvent(active);
  }, []);

  useEffect(() => {
    if (!event) return;
    const t = event.theme;
    const root = document.documentElement;

    root.style.setProperty("--color-primary", hexToHsl(t.primary));
    root.style.setProperty("--color-secondary", hexToHsl(t.secondary));
    root.style.setProperty("--color-accent", hexToHsl(t.accent));
    root.style.setProperty("--color-bg-gradient-start", t.bgGradientStart);
    root.style.setProperty("--color-bg-gradient-end", t.bgGradientEnd);
    root.style.setProperty("--color-text-dark", t.textDark);
    root.style.setProperty("--color-text-light", t.textLight);
    root.style.setProperty("--font-headline", `"${t.headlineFont}", serif`);
    root.style.setProperty("--font-body", `"${t.bodyFont}", sans-serif`);

    loadFont(t.headlineFont);
    loadFont(t.bodyFont);
  }, [event]);

  return (
    <ThemeContext.Provider value={{ event, theme: event?.theme ?? null }}>
      {children}
    </ThemeContext.Provider>
  );
}
