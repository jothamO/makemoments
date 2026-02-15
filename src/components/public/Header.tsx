import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEventTheme } from "@/contexts/ThemeContext";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { theme } = useEventTheme();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-border/50">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
        <Link to="/" className="text-xl font-bold" style={{ fontFamily: "var(--font-headline)" }}>
          <span style={{ color: theme?.primary ?? "hsl(var(--primary))" }}>Make</span>
          <span>Moments</span>
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm" style={{ fontFamily: "var(--font-body)" }}>
          <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
          <Link to="/create/womens-day" className="hover:opacity-70 transition-opacity">Create</Link>
          <Link to="/admin" className="hover:opacity-70 transition-opacity text-muted-foreground">Admin</Link>
        </nav>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <nav className="md:hidden border-t bg-white px-4 py-3 space-y-2" style={{ fontFamily: "var(--font-body)" }}>
          <Link to="/" className="block py-2" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/create/womens-day" className="block py-2" onClick={() => setOpen(false)}>Create</Link>
          <Link to="/admin" className="block py-2 text-muted-foreground" onClick={() => setOpen(false)}>Admin</Link>
        </nav>
      )}
    </header>
  );
}
