import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEventTheme } from "@/contexts/ThemeContext";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/hooks/useAuth";

export function PublicHeader() {
  const { theme } = useEventTheme();
  const { isLoggedIn, logout } = useAuth();

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
          <UserMenu />
        </nav>

        {/* Mobile Logout (Top Right) */}
        <div className="md:hidden flex items-center">
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              className="text-muted-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
