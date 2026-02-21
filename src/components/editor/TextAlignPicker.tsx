import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { TAP_SCALE } from "@/lib/animation";

interface TextAlignPickerProps {
  value: "left" | "center" | "right";
  onChange: (align: "left" | "center" | "right") => void;
}

export function TextAlignPicker({ value, onChange }: TextAlignPickerProps) {
  const toggle = () => {
    if (value === "left") onChange("center");
    else if (value === "center") onChange("right");
    else onChange("left");
  };

  const Icon = value === "left" ? AlignLeft : value === "center" ? AlignCenter : AlignRight;

  return (
    <motion.button
      onClick={toggle}
      whileTap={TAP_SCALE}
      className="w-11 h-11 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-white/80 hover:text-white transition-all"
    >
      <Icon className="h-5 w-5" />
    </motion.button>
  );
}

