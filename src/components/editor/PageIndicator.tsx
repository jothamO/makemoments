import { Plus } from "lucide-react";

interface PageIndicatorProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
}

export function PageIndicator({ total, current, onSelect, onAdd }: PageIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            i === current
              ? "bg-white scale-125 shadow-lg"
              : "bg-white/40 hover:bg-white/60"
          }`}
        />
      ))}
      <button
        onClick={onAdd}
        className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors ml-1"
      >
        <Plus className="h-3.5 w-3.5 text-white" />
      </button>
    </div>
  );
}
