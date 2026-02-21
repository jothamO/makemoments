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
