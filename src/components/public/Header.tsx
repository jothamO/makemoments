import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEventTheme } from "@/contexts/ThemeContext";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/hooks/useAuth";

export function PublicHeader() {
  const { event, theme } = useEventTheme();
  const { isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Use the homepage scroll hook only if we are actually on the homepage
  const isHomepage = location.pathname === '/';

  useEffect(() => {
    if (!isHomepage) {
      setScrolled(true); // Always frosted on non-homepage routes
      return;
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomepage]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
        ? "bg-white/70 backdrop-blur-2xl shadow-sm border-b border-black/5 py-3"
        : "bg-transparent border-transparent py-5"
        }`}
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6">
        <Link to="/" className="flex items-center group">
          <img
            src="/assets/logo.webp"
            alt="MakeMoments"
            className="h-7 w-auto transition-transform duration-300 origin-left scale-[2.5] md:scale-[3] group-hover:scale-[2.7] md:group-hover:scale-[3.2]"
          />
        </Link>

        {/* Desktop Apple-Style Nav */}
        <nav className="hidden md:flex items-center gap-2" style={{ fontFamily: "var(--font-body)" }}>
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${scrolled ? "text-zinc-600 hover:text-black hover:bg-black/5" : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
          >
            <Home className="w-4 h-4" strokeWidth={2} />
            <span className="text-sm">Home</span>
          </Link>

          <Link
            to={`/${event?.slug || 'womens-day'}/create`}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${scrolled ? "text-zinc-600 hover:text-black hover:bg-black/5" : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
          >
            <Sparkles className="w-4 h-4" strokeWidth={2} />
            <span className="text-sm">Create</span>
          </Link>

          <div className="ml-2 pl-2 border-l border-zinc-200/30">
            <UserMenu />
          </div>
        </nav>

        {/* Mobile Spacer (Allows logo to stay left, auth icon to stay right before we detach mobile nav) */}
        <div className="md:hidden flex items-center justify-end flex-grow">
          {/* We will leave this intentionally blank for now, as Mobile Navigation will be detached to the bottom Dock component */}
        </div>
      </div>
    </header>
  );
}
