import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function replaceUrgencyVariables(template: string, name: string, eventDate: number, endDate: number): string {
  if (!template) return "";

  let result = template;

  // {name}
  result = result.replace(/{name}/g, name || "Event");

  // {date}
  if (eventDate) {
    const formattedDate = new Date(eventDate).toLocaleDateString("en-US", { month: "long", day: "numeric" });
    result = result.replace(/{date}/g, formattedDate);
  }

  // {countdown}
  if (endDate) {
    const now = new Date().getTime();
    const diff = endDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const countdownText = days > 0 ? `${days} days` : "0 days";
    result = result.replace(/{countdown}/g, countdownText);
  }

  return result;
}

export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getContrastColor(hexColor: string | undefined): string {
  if (!hexColor || hexColor === "transparent") return "#000000";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

/**
 * Enforces the premium brand look across all background surfaces.
 * Centralizes brand constants: Light (35% glow) vs Dark (40% glow).
 * @param baseColor - The primary background color.
 * @param glowColor - Optional explicit glow color (defaults to baseColor).
 * @param isDark - Whether to use the Dark theme opacity (40%) or Light theme (35%).
 */
export function getBrandRadialGradient(baseColor: string | undefined, glowColor?: string, isDark: boolean = false): string {
  const rawColor = glowColor || baseColor || "#ffffff";
  const opacity = isDark ? 0.4 : 0.35;
  const rgba = hexToRgba(rawColor, opacity);
  return `radial-gradient(circle at 50% 0%, ${rgba}, transparent 70%)`;
}

/**
 * Fetches the duration of an audio file in seconds.
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(Math.round(audio.duration));
    };
    audio.onerror = () => resolve(0);
  });
};

/**
 * Standardizes date formatting across the platform.
 */
export function formatPlatformDate(date: Date | string | number, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", options);
  } catch {
    return "N/A";
  }
}

/**
 * Standardizes the upload handshake protocol for Convex storage.
 */
export async function uploadToConvexStorage(generateUploadUrlFn: () => Promise<string>, file: File): Promise<string> {
  const postUrl = await generateUploadUrlFn();
  const result = await fetch(postUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!result.ok) throw new Error(`Upload failed: ${result.statusText}`);
  const { storageId } = await result.json();
  return storageId;
}
