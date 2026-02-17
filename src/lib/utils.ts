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
