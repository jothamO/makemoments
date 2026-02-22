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
                <DrawerContent className="px-4 pb-8">
                    <DrawerHeader className="text-left px-0">
                        <DrawerTitle className="text-xl font-bold flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {isAdmin ? <ShieldAlert className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg">{user?.name || "Guest Account"}</span>
                                {user?.email && <span className="text-xs text-muted-foreground font-normal">{user.email}</span>}
                            </div>
                        </DrawerTitle>
                        <VisuallyHidden.Root>
                            <DrawerDescription>Account and navigation menu</DrawerDescription>
                        </VisuallyHidden.Root>
                    </DrawerHeader>

                    <div className="space-y-6 py-4">
                        <div className="grid gap-1">
                            {isLoggedIn ? (
                                <>
                                    {isAdmin ? (
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start h-12 text-base px-3"
                                            asChild
                                            onClick={handleLinkClick}
                                        >
                                            <Link to="/admin">
                                                <LayoutDashboard className="mr-3 h-5 w-5" />
                                                Admin Dashboard
                                            </Link>
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start h-12 text-base px-3"
                                                asChild
                                                onClick={handleLinkClick}
                                            >
                                                <Link to="/my-moments">
                                                    <Heart className="mr-3 h-5 w-5" />
                                                    My Moments
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start h-12 text-base px-3"
                                                onClick={() => {
                                                    setSettingsOpen(true);
                                                    onOpenChange(false);
                                                }}
                                            >
                                                <Settings className="mr-3 h-5 w-5" />
                                                Settings
                                            </Button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Button
                                    variant="primary"
                                    className="w-full h-12 text-base rounded-full"
                                    onClick={() => {
                                        navigate("/login");
                                        onOpenChange(false);
                                    }}
                                >
                                    <User className="mr-2 h-5 w-5" />
                                    Sign In
                                </Button>
                            )}
                        </div>

                        <div className="h-px bg-border/50" />

                        <div className="grid gap-1">
                            <Button variant="ghost" className="w-full justify-start h-12 text-base px-3" asChild onClick={handleLinkClick}>
                                <Link to="/help">
                                    <HelpCircle className="mr-3 h-5 w-5 text-muted-foreground" />
                                    Help Center
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start h-12 text-base px-3" asChild onClick={handleLinkClick}>
                                <Link to="/terms">
                                    <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
                                    Terms of Service
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full justify-start h-12 text-base px-3" asChild onClick={handleLinkClick}>
                                <Link to="/privacy">
                                    <Lock className="mr-3 h-5 w-5 text-muted-foreground" />
                                    Privacy Policy
                                </Link>
                            </Button>
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
