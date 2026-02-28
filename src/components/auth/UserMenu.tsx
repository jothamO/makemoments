import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, LayoutDashboard, Heart, Shield, Settings } from "lucide-react";

export function UserMenu() {
    const { user, isLoggedIn, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    if (!isLoggedIn) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
                className="flex items-center gap-2"
            >
                <User className="h-4 w-4" />
                <span>Login</span>
            </Button>
        );
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        {isAdmin ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        <span className="max-w-[100px] truncate">{user?.name || "Account"}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user?.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user?.email || (isAdmin ? "Administrator" : "")}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {isAdmin ? (
                        <DropdownMenuItem asChild>
                            <Link to="/admin" className="flex items-center cursor-pointer">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Admin Dashboard</span>
                            </Link>
                        </DropdownMenuItem>
                    ) : (
                        <>
                            <DropdownMenuItem asChild>
                                <Link to="/my-moments" className="flex items-center cursor-pointer">
                                    <Heart className="mr-2 h-4 w-4" />
                                    <span>My Moments</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to="/settings" className="flex items-center cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                        </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => logout()}
                        className="text-red-600 focus:text-red-500 cursor-pointer"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
