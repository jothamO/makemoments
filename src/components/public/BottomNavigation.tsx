import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, Shield, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ProfileDrawer } from "./ProfileDrawer";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
    const location = useLocation();
    const { isLoggedIn, isAdmin, user } = useAuth();
    const activeEvent = useQuery(api.events.getActive);
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(true);
    const lastScrollY = React.useRef(0);

    // Scroll-to-hide logic
    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show dock if at the very top or scrolling up
            if (currentScrollY < 10) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY.current) {
                // Scrolling down - hide
                setIsVisible(false);
            } else {
                // Scrolling up - show
                setIsVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Only show dock on primary application pages
    const isRootPage = ["/", "/my-moments", "/login", "/settings"].includes(location.pathname);
    if (!isRootPage) return null;

    const theme = activeEvent?.theme;
    const primaryColor = theme?.primary || "hsl(var(--primary))";

    // Show/Hide logic based on BOTH drawer state and scroll visibility
    const isHidden = drawerOpen || !isVisible;

    // Auth state icon logic
    const AccountIcon = isAdmin ? Shield : User;
    const isAccountActive = drawerOpen;
    const isHomeActive = location.pathname === "/";

    return (
        <>
            {/* iOS Floating Dock for Mobile */}
            <div
                className={cn(
                    "md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 ease-in-out",
                    isHidden ? "opacity-0 translate-y-32 scale-90 pointer-events-none" : "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                )}
                {...(isHidden ? { inert: "" } : {})}
            >
                <div className="relative flex items-center gap-6 px-8 py-4 rounded-full backdrop-blur-3xl bg-white/80 border border-black/5 shadow-2xl">

                    {/* Home Link */}
                    <Link
                        to="/"
                        className={cn(
                            "flex flex-col items-center gap-1 transition-all duration-300",
                            isHomeActive ? "opacity-100 scale-110" : "opacity-60 hover:opacity-100"
                        )}
                        style={{ color: isHomeActive ? primaryColor : "var(--zinc-500)" }}
                    >
                        <Home className="h-6 w-6" strokeWidth={isHomeActive ? 2.5 : 2} />
                    </Link>

                    {/* Elevated FAB (Center Action) */}
                    <Link to={activeEvent ? `/${activeEvent.slug}/create` : "/"}>
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            className="relative -mt-8 flex flex-col items-center"
                        >
                            <div
                                className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white border-4 border-white transform transition-transform duration-300 hover:scale-105"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <Plus className="h-6 w-6" strokeWidth={3} />
                            </div>
                        </motion.div>
                    </Link>

                    {/* Account/Drawer Link */}
                    <button
                        onClick={() => setDrawerOpen((prev) => !prev)}
                        className={cn(
                            "flex flex-col items-center gap-1 transition-all duration-300",
                            isAccountActive ? "opacity-100 scale-110" : "opacity-60 hover:opacity-100"
                        )}
                        style={{
                            color: isAccountActive ? primaryColor : "var(--zinc-500)"
                        }}
                    >
                        <AccountIcon className="h-6 w-6" strokeWidth={isAccountActive ? 2.5 : 2} />
                    </button>
                </div>
            </div>

            <ProfileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
        </>
    );
}
