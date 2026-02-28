import { toast as sonnerToast } from "sonner";
import * as React from "react";

/**
 * A bridge between the existing shadcn toast API and sonner.
 * This allows us to keep the same toast({ title, description, variant }) calls
 * while using the new Apple-style sonner implementation.
 */

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

function toast({ title, description, variant, duration }: ToastProps) {
  return sonnerToast(title as string, {
    description,
    duration: duration || 4000,
    // Add specific styling for destructive variant if needed, 
    // but the global apple-pill-toast handles the core look.
    className: variant === "destructive" ? "border-red-500/50" : "",
  });
}

function useToast() {
  return {
    toast,
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  };
}

export { useToast, toast };
