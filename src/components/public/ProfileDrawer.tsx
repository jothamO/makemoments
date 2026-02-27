import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Heart, Settings, LayoutDashboard, HelpCircle, ShieldAlert, FileText, Lock, User, X } from "lucide-react";
import { SettingsModal } from "../auth/SettingsModal";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface ProfileDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProfileDrawer({ open, onOpenChange }: ProfileDrawerProps) {
    const { user, isLoggedIn, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = React.useState(false);

    const handleLinkClick = () => {
        onOpenChange(false);
    };

    return (
        <>
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="px-6 pb-8 bg-white/90 backdrop-blur-xl border-t border-black/5 rounded-t-[32px] shadow-2xl">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300/50 my-4" />

                    <DrawerHeader className="text-left px-0 pb-4">
                        <DrawerTitle className="text-xl font-bold flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center border border-black/5 shadow-sm">
                                {isAdmin ? <ShieldAlert className="w-5 h-5 text-zinc-700" strokeWidth={2} /> : <User className="w-5 h-5 text-zinc-700" strokeWidth={2} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black tracking-tight" style={{ fontFamily: "var(--font-headline)" }}>
                                    {user?.name || "Guest Account"}
                                </span>
                                {user?.email && <span className="text-sm text-zinc-500 font-medium">{user.email}</span>}
                            </div>
                        </DrawerTitle>
                        <VisuallyHidden.Root>
                            <DrawerDescription>Account and navigation menu</DrawerDescription>
                        </VisuallyHidden.Root>
                    </DrawerHeader>

                    <div className="space-y-6 py-2">
                        {/* Primary Actions Group */}
                        <div className="flex flex-col gap-2 bg-white rounded-[24px] p-2 shadow-sm border border-black/5">
                            {isLoggedIn ? (
                                <>
                                    {isAdmin ? (
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start h-14 text-base px-4 rounded-[16px] font-semibold text-zinc-700 hover:bg-zinc-50"
                                            asChild
                                            onClick={handleLinkClick}
                                        >
                                            <Link to="/admin">
                                                <LayoutDashboard className="mr-3 h-5 w-5 text-zinc-400" strokeWidth={2.5} />
                                                Admin Dashboard
                                            </Link>
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start h-14 text-base px-4 rounded-[16px] font-semibold text-zinc-700 hover:bg-zinc-50"
                                                asChild
                                                onClick={handleLinkClick}
                                            >
                                                <Link to="/my-moments">
                                                    <Heart className="mr-3 h-5 w-5 text-zinc-400" strokeWidth={2.5} />
                                                    My Moments
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start h-14 text-base px-4 rounded-[16px] font-semibold text-zinc-700 hover:bg-zinc-50"
                                                onClick={() => {
                                                    setSettingsOpen(true);
                                                    onOpenChange(false);
                                                }}
                                            >
                                                <Settings className="mr-3 h-5 w-5 text-zinc-400" strokeWidth={2.5} />
                                                Settings
                                            </Button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Button
                                    className="w-full h-14 text-base rounded-[16px] font-bold bg-black text-white hover:bg-zinc-800"
                                    onClick={() => {
                                        navigate("/login");
                                        onOpenChange(false);
                                    }}
                                >
                                    <User className="mr-2 h-5 w-5" strokeWidth={2.5} />
                                    Sign In
                                </Button>
                            )}
                        </div>

                        {/* Secondary Actions Group */}
                        <div className="flex flex-col gap-1 bg-white rounded-[24px] p-2 shadow-sm border border-black/5">
                            <Button variant="ghost" className="w-full justify-start h-12 text-[15px] px-4 rounded-[12px] font-medium text-zinc-600 hover:bg-zinc-50" asChild onClick={handleLinkClick}>
                                <Link to="/help">
                                    <HelpCircle className="mr-3 h-5 w-5 text-zinc-400" strokeWidth={2} />
                                    Help Center
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start h-12 text-[15px] px-4 rounded-[12px] font-medium text-zinc-600 hover:bg-zinc-50" asChild onClick={handleLinkClick}>
                                <Link to="/terms">
                                    <FileText className="mr-3 h-5 w-5 text-zinc-400" strokeWidth={2} />
                                    Terms of Service
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start h-12 text-[15px] px-4 rounded-[12px] font-medium text-zinc-600 hover:bg-zinc-50" asChild onClick={handleLinkClick}>
                                <Link to="/privacy">
                                    <Lock className="mr-3 h-5 w-5 text-zinc-400" strokeWidth={2} />
                                    Privacy Policy
                                </Link>
                            </Button>
                            {isLoggedIn && (
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start h-12 text-[15px] px-4 rounded-[12px] font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 mt-2"
                                    onClick={() => {
                                        logout();
                                        onOpenChange(false);
                                    }}
                                >
                                    Sign Out
                                </Button>
                            )}
                        </div>
                    </div>

                    <DrawerFooter className="px-0 pt-2">
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full h-12 rounded-full font-bold">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {user && (
                <SettingsModal
                    open={settingsOpen}
                    onOpenChange={setSettingsOpen}
                    user={user}
                />
            )}
        </>
    );
}
